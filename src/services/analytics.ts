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
 * Firebase Analytics Provider
 * Uses dynamic require so it fails gracefully in Expo Go (no native module).
 */
class FirebaseAnalyticsProvider implements AnalyticsProvider {
  name = 'Firebase';
  private analytics: any = null;

  async init(): Promise<void> {
    try {
      const mod = require('@react-native-firebase/analytics');
      this.analytics = (mod.default || mod)();
      await this.analytics.setAnalyticsCollectionEnabled(true);
      if (__DEV__) console.log('[Analytics] Firebase Provider initialized.');
    } catch (err) {
      if (__DEV__) {
        console.log('[Analytics] Firebase native module not available (expected in Expo Go).');
      }
      this.analytics = null;
    }
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (!this.analytics) return;
    try {
      this.analytics.logEvent(eventName, params);
    } catch (err) {
      console.warn('[Analytics] Firebase failed to log event:', err);
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (!this.analytics) return;
    try {
      this.analytics.setUserId(userId);
      if (properties) {
        // Firebase setUserProperties expects Record<string, string | null>
        const stringProps: Record<string, string> = {};
        for (const [k, v] of Object.entries(properties)) {
          stringProps[k] = String(v);
        }
        this.analytics.setUserProperties(stringProps);
      }
    } catch (err) {
      console.warn('[Analytics] Firebase failed to set user properties:', err);
    }
  }
}

/**
 * Console Analytics Provider — logs events during development.
 */
class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'Console';

  async init(): Promise<void> {
    if (__DEV__) console.log('[Analytics] Console Provider initialized.');
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (__DEV__) {
      console.log(`[Analytics] Event: "${eventName}"`, params ? JSON.stringify(params) : '');
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (__DEV__) {
      console.log(`[Analytics] User: "${userId}"`, properties ? JSON.stringify(properties) : '');
    }
  }
}

/**
 * Meta (Facebook) Analytics Provider
 * Uses react-native-fbsdk-next for ROAS and App Install tracking.
 */
class MetaAnalyticsProvider implements AnalyticsProvider {
  name = 'Meta';
  private appEventsLogger: any = null;

  async init(): Promise<void> {
    try {
      const fbsdk = require('react-native-fbsdk-next');
      this.appEventsLogger = fbsdk.AppEventsLogger;
      if (__DEV__) {
        console.log('[Analytics] Meta Provider initialized.');
      }
    } catch (err) {
      if (__DEV__) {
        console.log('[Analytics] Meta SDK not available (expected in Expo Go).');
      }
    }
  }

  trackEvent(eventName: string, params?: AnalyticsEventParams): void {
    if (this.appEventsLogger && !__DEV__) {
      try {
        this.appEventsLogger.logEvent(
          eventName,
          params ? params.valueToSum || undefined : undefined,
          params
        );
      } catch (err) {
        console.warn('[Analytics] Meta failed to log event:', err);
      }
    } else if (__DEV__) {
      console.log(`[Analytics] [Meta Stub] Would track: "${eventName}"`, params);
    }
  }

  setUserProperties(userId: string, properties?: Record<string, any>): void {
    if (this.appEventsLogger && !__DEV__) {
      try {
        this.appEventsLogger.setUserID(userId);
        if (properties) this.appEventsLogger.setUserData(properties);
      } catch (err) {
        console.warn('[Analytics] Meta failed to set user data:', err);
      }
    } else if (__DEV__) {
      console.log(`[Analytics] [Meta Stub] Would set user: "${userId}"`, properties);
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
        console.error(`[Analytics] Failed to initialize "${provider.name}":`, err);
      }
    }
  }

  logEvent(eventName: string, params?: AnalyticsEventParams): void {
    for (const provider of this.providers) {
      try {
        provider.trackEvent(eventName, params);
      } catch (err) {
        console.error(`[Analytics] Failed to track event in "${provider.name}":`, err);
      }
    }
  }

  identify(userId: string, properties?: Record<string, any>): void {
    for (const provider of this.providers) {
      try {
        provider.setUserProperties(userId, properties);
      } catch (err) {
        console.error(`[Analytics] Failed to set user props in "${provider.name}":`, err);
      }
    }
  }

  // ── Semantic helpers ──────────────────────────────────────────

  logScreenView(screenName: string): void {
    this.logEvent('screen_view', { screen_name: screenName });
  }

  logUserRegister(playerId: string, username: string): void {
    this.identify(playerId, { username });
    this.logEvent('fb_mobile_complete_registration', { fb_registration_method: 'in_app' });
    this.logEvent('sign_up', { method: 'in_app' });
    this.logEvent('user_register', { player_id: playerId, username });
  }

  logUserLogin(playerId: string, username: string): void {
    this.identify(playerId, { username });
    this.logEvent('login', { method: 'in_app' });
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
