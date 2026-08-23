import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppNavigator from './src/navigation/AppNavigator';
import { Analytics } from './src/services/analytics';
import { RemoteConfig } from './src/services/remoteConfig';
import { initAds } from './src/services/ads';
import { initCrashlytics } from './src/services/crashlytics';
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

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  useEffect(() => {
    // Initialize analytics, remote config, and ads on app launch
    const initServices = async () => {
      await initCrashlytics();   // First — so it captures crashes from other inits
      await Analytics.init();
      await RemoteConfig.init();
      await initAds();
    };
    initServices();
  }, []);

  useEffect(() => {
    // expo-updates' default policy downloads a new OTA update on this launch
    // but only applies it on the NEXT cold start — so a single close/reopen
    // right after publishing still runs the old bundle. Check-fetch-reload
    // here so a freshly published update is live within this same session
    // instead of needing two restarts.
    if (__DEV__ || !Updates.isEnabled) return;
    const applyLatestUpdate = async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Offline or update service unreachable — keep running the current bundle.
      }
    };
    applyLatestUpdate();
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
