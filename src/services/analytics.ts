// src/services/analytics.ts

export interface AnalyticsEventParams {
  [key: string]: any;
}

export interface AnalyticsProvider {
  name: string;
  init(): Promise<void>;
  trackEvent(eventName: string, params?: AnalyticsEventParams): void;
  setUserProperties(userId: string, properties?: Record<string, any>): void;
}

/**
 * Firebase Analytics & Crashlytics Provider
 * Safely handles environments where Firebase native modules are missing (like Expo Go) without crashing.
 * Checks for the presence of the native RNFBAppModule before executing any requires.
 */
class FirebaseAnalyticsProvider implements AnalyticsProvider {
  name = 'Firebase';
  private analytics: any = null;
  private crashlytics: any = null;

  async init(): Promise<void> {
    try {
      // Access NativeModules dynamically to avoid static dependency failures
      const { NativeModules } = require('react-native');
      const isFirebaseAvailable = !!NativeModules.RNFBAppModule;

      if (!isFirebaseAvailable) {
        if (__DEV__) {
          console.log('[Analytics] Firebase native module (RNFBAppModule) is not available. Skipping Firebase initialization (expected in Expo Go).');
        }
        return;
      }

      // Dynamic require ensures Expo Go does not execute this block and fail
      const firebaseAnalytics = require('@react-native-firebase/analytics').default;
      const firebaseCrashlytics = require('@react-native-firebase/crashlytics').default;
      
      this.analytics = firebaseAnalytics();
      this.crashlytics = firebaseCrashlytics();
      if (__DEV__) {
        console.log('[Analytics] Firebase Analytics & Crashlytics initialized.');
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[Analytics] Failed to initialize Firebase Analytics:', err);
      }
    }
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (this.analytics) {
      try {
        this.analytics.logEvent(eventName, params);
      } catch (err) {
        console.error('[Analytics] Firebase failed to log event:', err);
      }
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (this.analytics) {
      try {
        this.analytics.setUserId(userId);
        if (properties) {
          for (const [key, value] of Object.entries(properties)) {
            this.analytics.setUserProperty(key, value?.toString() || '');
          }
        }
      } catch (err) {
        console.error('[Analytics] Firebase failed to set user properties:', err);
      }
    }

    if (this.crashlytics) {
      try {
        this.crashlytics.setUserId(userId);
        if (properties) {
          this.crashlytics.setAttributes(properties);
        }
      } catch (err) {
        console.error('[Analytics] Firebase Crashlytics failed to set properties:', err);
      }
    }
  }
}

/**
 * Console Analytics Provider - Logs events to console during development.
 */
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'Console';

  async init(): Promise<void> {
    if (__DEV__) {
      console.log('[Analytics] Console Provider initialized.');
    }
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (__DEV__) {
      console.log(`[Analytics] Event tracked: "${eventName}"`, params ? JSON.stringify(params) : '');
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (__DEV__) {
      console.log(`[Analytics] User Properties set for: "${userId}"`, properties ? JSON.stringify(properties) : '');
    }
  }
}

/**
 * Meta (Facebook) Analytics Provider
 * Uses react-native-fbsdk-next to send AppEvents for ROAS and App Install tracking.
 * Safely handles environments where native modules are missing (like Expo Go) without crashing.
 */
class MetaAnalyticsProvider implements AnalyticsProvider {
  name = 'Meta';
  private appEventsLogger: any = null;

  async init(): Promise<void> {
    try {
      // Dynamic require ensures Expo Go does not crash if native module is missing
      const fbsdk = require('react-native-fbsdk-next');
      this.appEventsLogger = fbsdk.AppEventsLogger;
      if (__DEV__) {
        console.log('[Analytics] Meta Provider initialized (events logged to console in dev but not sent).');
      }
    } catch (err) {
      if (__DEV__) {
        console.log('[Analytics] Meta SDK native module is not available. Skipping Meta initialization (expected in Expo Go).');
      }
    }
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (this.appEventsLogger && !__DEV__) {
      try {
        this.appEventsLogger.logEvent(eventName, params ? params.valueToSum || undefined : undefined, params);
      } catch (err) {
        console.warn('[Analytics] Meta failed to log event:', err);
      }
    } else if (__DEV__) {
      console.log(`[Analytics] [Meta Stub] Would track event: "${eventName}"`, params);
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (this.appEventsLogger && !__DEV__) {
      try {
        this.appEventsLogger.setUserID(userId);
        if (properties) {
          this.appEventsLogger.setUserData(properties);
        }
      } catch (err) {
        console.warn('[Analytics] Meta failed to set user data:', err);
      }
    } else if (__DEV__) {
      console.log(`[Analytics] [Meta Stub] Would set user property: "${userId}"`, properties);
    }
  }
}

class AnalyticsService {
  private providers: AnalyticsProvider[] = [];

  constructor() {
    this.providers = [
      new ConsoleAnalyticsProvider(),
      new FirebaseAnalyticsProvider(),
      new MetaAnalyticsProvider(),
    ];
  }

  async init(): Promise<void> {
    for (const provider of this.providers) {
      try {
        await provider.init();
      } catch (err) {
        console.error(`[Analytics] Failed to initialize provider "${provider.name}":`, err);
      }
    }
  }

  /**
   * Log a general event to all active providers
   */
  logEvent(eventName: string, params?: AnalyticsEventParams): void {
    for (const provider of this.providers) {
      try {
        provider.trackEvent(eventName, params);
      } catch (err) {
        console.error(`[Analytics] Failed to track event in "${provider.name}":`, err);
      }
    }
  }

  /**
   * Identify user and set properties across providers
   */
  identify(userId: string, properties?: Record<string, any>): void {
    for (const provider of this.providers) {
      try {
        provider.setUserProperties(userId, properties);
      } catch (err) {
        console.error(`[Analytics] Failed to set user properties in "${provider.name}":`, err);
      }
    }
  }

  // Helper methods for semantic game events

  logScreenView(screenName: string): void {
    this.logEvent('screen_view', { screen_name: screenName });
  }

  logUserRegister(playerId: string, username: string): void {
    this.identify(playerId, { username });
    this.logEvent('fb_mobile_complete_registration', { fb_registration_method: 'in_app' }); // Meta standard
    this.logEvent('sign_up', { method: 'in_app' }); // Google standard
    this.logEvent('user_register', { player_id: playerId, username });
  }

  logUserLogin(playerId: string, username: string): void {
    this.identify(playerId, { username });
    this.logEvent('login', { method: 'in_app' }); // Meta and Google standard
    this.logEvent('user_login', { player_id: playerId, username });
  }

  logGameStart(roomId: string, mode: 'ranked' | 'friendly', role: 'giver' | 'guesser'): void {
    this.logEvent('game_start', { room_id: roomId, mode, role });
  }

  logRoundEnd(roomId: string, points: number, correctGuesses: number, taboos: number): void {
    this.logEvent('round_end', { room_id: roomId, points, correct_guesses: correctGuesses, taboos });
  }

  logHintRevealed(clueType: string): void {
    this.logEvent('hint_revealed', { clue_type: clueType });
  }
}

export const Analytics = new AnalyticsService();
export default Analytics;
