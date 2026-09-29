// src/services/crashlytics.ts
// Firebase Crashlytics Service
// Safe dynamic require — no crash in Expo Go if native module is missing.

import { NativeModules } from 'react-native';
import { reportPreviewInitError, reportPreviewStatus } from './previewDiagnostics';

// The real native module class is RNFBCrashlyticsModule (see
// node_modules/@react-native-firebase/crashlytics/ios/.../RNFBCrashlyticsModule.m
// and the nativeModuleName constant in crashlytics/lib/index.js) — the
// previous check here looked for "RNFBCrashlyticsNativeModule" (an extra,
// nonexistent "Native"), which never matches on any platform, making this
// whole service a permanent no-op.
//
// First attempt at flipping this on (2026-09-29, EAS preview build 15, iOS
// 27.0) crashed on launch every time — a native NSException/SIGABRT on
// "expo.controller.errorRecoveryQueue" (device .ips log), not JS-catchable.
// Root cause found afterwards: [FIRApp configure] was never running on iOS
// at all (see src/services/firebaseApp.ts) — Analytics hit the same "No
// Firebase App '[DEFAULT]'" condition, just as a catchable promise
// rejection/hang instead of a hard native abort. That's now fixed and
// confirmed (Analytics data flows end-to-end on iOS). Retrying Crashlytics
// with the Firebase App fix in place — see [[project_firebase_ios_analytics_fix]].
const isCrashlyticsAvailable = !!NativeModules.RNFBCrashlyticsModule;

let crashlyticsInstance: any = null;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      v => { clearTimeout(timer); resolve(v); },
      e => { clearTimeout(timer); reject(e); }
    );
  });
}

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
  const hasNativeModule = !!NativeModules.RNFBCrashlyticsModule;
  let collectionResult = 'not attempted';
  try {
    const crashlytics = getInstance();
    if (!crashlytics) {
      if (__DEV__) console.log('[Crashlytics] Skipping init — native module not available.');
      reportPreviewStatus('Crashlytics initCrashlytics()', [`NativeModules.RNFBCrashlyticsModule present: ${hasNativeModule}`, 'getInstance(): null']);
      return;
    }
    try {
      await withTimeout(crashlytics.setCrashlyticsCollectionEnabled(true), 5000, 'setCrashlyticsCollectionEnabled');
      collectionResult = 'resolved';
    } catch (e) {
      collectionResult = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
    if (__DEV__) console.log('[Crashlytics] Initialized successfully.');
    reportPreviewStatus('Crashlytics initCrashlytics()', [
      `NativeModules.RNFBCrashlyticsModule present: ${hasNativeModule}`,
      `instance: ${!!crashlytics}`,
      `setCrashlyticsCollectionEnabled(true): ${collectionResult}`,
    ]);
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
