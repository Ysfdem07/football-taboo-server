// src/services/crashlytics.ts
// Firebase Crashlytics Service
// Safe dynamic require — no crash in Expo Go if native module is missing.

import { NativeModules } from 'react-native';
import { reportPreviewInitError } from './previewDiagnostics';

// The real native module class is RNFBCrashlyticsModule (see
// node_modules/@react-native-firebase/crashlytics/ios/.../RNFBCrashlyticsModule.m
// and the nativeModuleName constant in crashlytics/lib/index.js) — the
// previous check here looked for "RNFBCrashlyticsNativeModule" (an extra,
// nonexistent "Native"), which never matches on any platform, making this
// whole service a permanent no-op.
//
// Tried flipping this on 2026-09-29 (EAS preview build 15, iOS 27.0): the
// app crashed on launch every time, before any on-screen JS error could
// show. Device crash log (.ips) confirms a native NSException/SIGABRT —
// not a JS error our try/catch below can catch — surfacing on
// "expo.controller.errorRecoveryQueue". The live production build (1.0.1)
// reinstalls and runs fine on the same device/iOS version and has shipped
// several OTA updates on iOS 27 without incident, so this isn't the known
// expo-updates activation bug — it's specifically the native Crashlytics
// module actually initializing for the first time ever (it was always a
// silent no-op before, so this code path has never actually run on a real
// device). Root cause not yet diagnosed (needs Xcode device console access
// to symbolicate). Keeping this permanently disabled until that happens —
// see [[att-ota-crash-incident]] for why "ship it and see" isn't worth the
// risk here.
const isCrashlyticsAvailable = false && !!NativeModules.RNFBCrashlyticsModule;

let crashlyticsInstance: any = null;

const getInstance = () => {
  if (!isCrashlyticsAvailable) return null;
  if (!crashlyticsInstance) {
    try {
      const mod = require('@react-native-firebase/crashlytics');
      crashlyticsInstance = (mod.default || mod)();
    } catch (e) {
      if (__DEV__) console.log('[Crashlytics] Native module unavailable (expected in Expo Go).');
      reportPreviewInitError('Crashlytics getInstance()', e);
    }
  }
  return crashlyticsInstance;
};

/**
 * Initialize Crashlytics — call once at app startup.
 */
export const initCrashlytics = async (): Promise<void> => {
  try {
    const crashlytics = getInstance();
    if (!crashlytics) {
      if (__DEV__) console.log('[Crashlytics] Skipping init — native module not available.');
      return;
    }
    await crashlytics.setCrashlyticsCollectionEnabled(true);
    if (__DEV__) console.log('[Crashlytics] Initialized successfully.');
  } catch (err) {
    console.warn('[Crashlytics] Failed to initialize:', err);
    reportPreviewInitError('Crashlytics initCrashlytics()', err);
  }
};

/**
 * Record a non-fatal error (shows up in Firebase Crashlytics dashboard).
 */
export const recordError = (error: Error, context?: string): void => {
  try {
    const crashlytics = getInstance();
    if (!crashlytics) return;
    if (context) crashlytics.setAttribute('error_context', context);
    crashlytics.recordError(error);
    if (__DEV__) console.log('[Crashlytics] Error recorded:', error.message, context);
  } catch (err) {
    console.warn('[Crashlytics] Failed to record error:', err);
  }
};

/**
 * Set the user ID so crashes are associated with that player.
 */
export const setCrashlyticsUserId = (userId: string): void => {
  try {
    const crashlytics = getInstance();
    if (!crashlytics) return;
    crashlytics.setUserId(userId);
    if (__DEV__) console.log('[Crashlytics] User ID set:', userId);
  } catch (err) {
    console.warn('[Crashlytics] Failed to set user ID:', err);
  }
};

/**
 * Set a custom key-value attribute for crash context.
 */
export const setAttribute = (key: string, value: string): void => {
  try {
    const crashlytics = getInstance();
    if (!crashlytics) return;
    crashlytics.setAttribute(key, value);
  } catch (err) {
    console.warn('[Crashlytics] Failed to set attribute:', err);
  }
};

/**
 * Log a breadcrumb message visible in crash reports.
 */
export const log = (message: string): void => {
  try {
    const crashlytics = getInstance();
    if (!crashlytics) return;
    crashlytics.log(message);
  } catch (err) {
    // silent
  }
};
