import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator, { navigationRef } from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { Analytics } from './src/services/analytics';
import { RemoteConfig } from './src/services/remoteConfig';
import { initAds } from './src/services/ads';
import { initCrashlytics } from './src/services/crashlytics';
import { ensureFirebaseAppInitialized } from './src/services/firebaseApp';
import { reportPreviewStatus, reportPreviewInitError } from './src/services/previewDiagnostics';
import { getSocket } from './src/services/socket';
import * as Updates from 'expo-updates';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';

import { LanguageProvider } from './src/context/LanguageContext';

import { CustomAlert } from './src/components/CustomAlert';

// Safe dynamic require, not a static import: this native module may not be
// compiled into whichever binary the current OTA-delivered JS bundle lands
// on (e.g. a build shipped before this module was added as a dependency).
// A static `import` would crash the app on launch in that case — this
// degrades to a no-op instead, and starts working automatically once a
// build that actually links the module ships.
let requestTrackingPermissionsAsync: (() => Promise<any>) | null = null;
if (Platform.OS === 'ios') {
  try {
    requestTrackingPermissionsAsync = require('expo-tracking-transparency').requestTrackingPermissionsAsync;
  } catch (e) {
    // Module not linked into this binary yet — ATT prompt just gets skipped.
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  useEffect(() => {
    // Independent of everything below: proves the on-screen diagnostic
    // channel itself works at all, decoupled from Firebase/Analytics timing.
    // Every prior diagnostic attempt (including ones bounded by a timeout,
    // guaranteed to fire) produced zero visible alerts on a real preview
    // build — this rules that mechanism in or out first.
    reportPreviewStatus('App.tsx mounted', [`Updates.channel: ${String(Updates.channel)}`, `time: ${new Date().toISOString()}`]);

    // Initialize analytics, remote config, and ads on app launch
    const initServices = async () => {
      await ensureFirebaseAppInitialized(); // iOS only — see firebaseApp.ts for why this is needed
      await initCrashlytics();   // First — so it captures crashes from other inits
      await Analytics.init();
      await RemoteConfig.init();
      if (requestTrackingPermissionsAsync) {
        // Required before any tracking-capable SDK activity — the Facebook
        // SDK (advertiserIDCollectionEnabled/autoLogAppEventsEnabled) reads
        // IDFA for ad measurement, and app.json already declares
        // NSUserTrackingUsageDescription, but nothing was ever calling this
        // to actually show the prompt. AdMob itself requests non-personalized
        // ads only, so it doesn't need this, but Apple's review checks for
        // the prompt existing at all whenever that Info.plist key is present.
        try {
          await requestTrackingPermissionsAsync();
        } catch (e) {
          // Ignore — ads still work in non-personalized mode either way.
        }
      }
      await initAds();
    };
    initServices().catch(err => {
      // A bare unhandled rejection here is silent in a release bundle —
      // nothing prior in this chain has ever been confirmed to actually run.
      reportPreviewInitError('initServices() chain', err);
    });
  }, []);

  useEffect(() => {
    // expo-updates' default policy downloads a new OTA update on this launch
    // but only applies it on the NEXT cold start. We pre-fetch here so that
    // next restart is instant instead of downloading on the spot, but
    // deliberately do NOT call reloadAsync() to force it into the current
    // session — that call is one of three known triggers for an upstream
    // expo-updates bug (NSException on expo.controller.errorRecoveryQueue
    // during bundle activation, see github.com/expo/expo/issues/45772,
    // unfixed as of expo-updates 29.0.20). Applying only on the next natural
    // cold start avoids this specific trigger.
    if (__DEV__ || !Updates.isEnabled) return;
    const prefetchLatestUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
        }
      } catch (e) {
        // Offline or update service unreachable — keep running the current bundle.
      }
    };
    prefetchLatestUpdate();
  }, []);

  useEffect(() => {
    // Re-authenticate the socket connection with the backend on every connect
    // (initial connect AND every reconnect after a network drop), not just
    // whenever the Profile screen happens to be mounted. The server binds
    // coin/joker/purchase operations to whichever account last logged in on
    // this socket connection, so if this doesn't re-fire after a reconnect,
    // those operations would start failing with "session not found" even
    // though the user is still logged in from their perspective.
    const socket = getSocket();
    const resyncSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('@logged_in_profile');
        if (!stored) return;
        const profile = JSON.parse(stored);
        if (profile?.id && profile.id !== 'guest' && profile.username && profile.password) {
          socket.emit('login_profile', { username: profile.username, password: profile.password });
        }
      } catch (e) {
        // Best-effort — screens that need a fresher session will still prompt login.
      }
    };
    socket.on('connect', resyncSession);
    if (socket.connected) resyncSession();
    return () => {
      socket.off('connect', resyncSession);
    };
  }, []);

  useEffect(() => {
    // Push notifications (e.g. the weekly tournament reminder) are sent
    // with a data.route hint, but nothing was ever reading it — tapping
    // one just opened the app to its default screen regardless. Handles
    // both a tap while the app is already running/backgrounded, and the
    // cold-start case where the app was fully closed and launched by
    // tapping the notification.
    const goToRoute = (data: any) => {
      const route = data?.route;
      if (!route) return;
      const tryNavigate = () => {
        if (navigationRef.isReady()) {
          // route/params come from an untyped push-notification payload, so
          // this can't line up with RootStackParamList's per-screen overloads.
          (navigationRef.navigate as (name: string, params?: object) => void)(route, data?.params ?? {});
        } else {
          setTimeout(tryNavigate, 200);
        }
      };
      tryNavigate();
    };

    Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) {
        goToRoute(response.notification.request.content.data);
        // Sticky across launches otherwise — without this, reopening the
        // app completely normally after having tapped a notification once
        // would keep re-triggering that same navigation every time.
        Notifications.clearLastNotificationResponseAsync();
      }
    });

    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      goToRoute(response.notification.request.content.data);
    });
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <AppNavigator />
        <CustomAlert />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
