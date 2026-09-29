// src/services/firebaseApp.ts
//
// Firebase's native auto-init ([FIRApp configure], driven by
// GoogleService-Info.plist through the @react-native-firebase/app config
// plugin) isn't happening on iOS in this build — confirmed via a live
// device: Analytics/Crashlytics calls fail with "No Firebase App
// '[DEFAULT]' has been created - call firebase.initializeApp()" even
// though the native module itself (NativeModules.RNFBAnalyticsModule) is
// present and GoogleService-Info.plist is bundled correctly. Android is
// unaffected (already sending Analytics data), so this only runs on iOS.
//
// Call this once, before initCrashlytics()/Analytics.init()/RemoteConfig
// .init() — they all resolve firebase.app() internally and throw the same
// error until a default app exists.
import { Platform } from 'react-native';
import { reportPreviewInitError, reportPreviewStatus } from './previewDiagnostics';

// Mirrors GoogleService-Info.plist (ios/GoogleService-Info.plist, project
// wordrushtr-928c2) — keep in sync if that file is ever regenerated.
const IOS_FIREBASE_OPTIONS = {
  apiKey: 'AIzaSyAC_N2b-t_P9Sl5PBNdRHY3eIKk23RSeAk',
  appId: '1:645350484367:ios:2b590e345732d5b2d243fa',
  projectId: 'wordrushtr-928c2',
  storageBucket: 'wordrushtr-928c2.firebasestorage.app',
  messagingSenderId: '645350484367',
  databaseURL: '', // no Realtime Database in use, but the compat validation requires a string
};

export async function ensureFirebaseAppInitialized(): Promise<void> {
  if (Platform.OS !== 'ios') return; // Android already auto-initializes correctly
  try {
    const mod = require('@react-native-firebase/app');
    const existingApps = typeof mod.getApps === 'function' ? mod.getApps() : (mod.default?.apps || []);
    if (existingApps.length > 0) {
      reportPreviewStatus('ensureFirebaseAppInitialized', [`already initialized (${existingApps.length} app(s)), skipped`]);
      return;
    }
    await mod.initializeApp(IOS_FIREBASE_OPTIONS);
    reportPreviewStatus('ensureFirebaseAppInitialized', ['manually called initializeApp() — succeeded']);
  } catch (err) {
    reportPreviewInitError('ensureFirebaseAppInitialized', err);
  }
}
