// src/services/crashlytics.ts
// Firebase Crashlytics Service
// Safe dynamic require — no crash in Expo Go if native module is missing.

import { NativeModules } from 'react-native';

const isCrashlyticsAvailable = !!NativeModules.RNFBCrashlyticsNativeModule;

let crashlyticsInstance: any = null;

const getInstance = () => {
  if (!isCrashlyticsAvailable) return null;
  if (!crashlyticsInstance) {
    try {
      const mod = require('@react-native-firebase/crashlytics');
      crashlyticsInstance = (mod.default || mod)();
    } catch (e) {
      if (__DEV__) console.log('[Crashlytics] Native module unavailable (expected in Expo Go).');
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
