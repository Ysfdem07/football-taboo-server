// src/services/remoteConfig.ts
// Firebase Remote Config Service
// Safe dynamic require — falls back to local defaults if native module is missing.

class RemoteConfigService {
  private remoteConfig: any = null;
  private isAvailable = false;

  // Local fallback defaults (used in Expo Go or if fetch fails)
  private defaults = {
    game_time_limit: 60,
    game_win_score: 50,
    interstitial_interval: 2,
  };

  async init(): Promise<void> {
    try {
      const mod = require('@react-native-firebase/remote-config');
      this.remoteConfig = (mod.default || mod)();
      this.isAvailable = true;

      await this.remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 10000 : 3600000,
      });

      await this.remoteConfig.setDefaults(this.defaults);

      const activated = await this.remoteConfig.fetchAndActivate();
      if (__DEV__) {
        console.log(`[RemoteConfig] Initialized. Activated new values: ${activated}`);
      }
    } catch (err) {
      this.isAvailable = false;
      if (__DEV__) {
        console.log('[RemoteConfig] Native module not available (expected in Expo Go). Using local defaults.');
      }
    }
  }

  getGameTimeLimit(): number {
    if (this.isAvailable && this.remoteConfig) {
      try {
        const val = this.remoteConfig.getValue('game_time_limit').asNumber();
        return val > 0 ? val : this.defaults.game_time_limit;
      } catch {
        return this.defaults.game_time_limit;
      }
    }
    return this.defaults.game_time_limit;
  }

  getGameWinScore(): number {
    if (this.isAvailable && this.remoteConfig) {
      try {
        const val = this.remoteConfig.getValue('game_win_score').asNumber();
        return val > 0 ? val : this.defaults.game_win_score;
      } catch {
        return this.defaults.game_win_score;
      }
    }
    return this.defaults.game_win_score;
  }

  getInterstitialInterval(): number {
    if (this.isAvailable && this.remoteConfig) {
      try {
        const val = this.remoteConfig.getValue('interstitial_interval').asNumber();
        return val >= 0 ? val : this.defaults.interstitial_interval;
      } catch {
        return this.defaults.interstitial_interval;
      }
    }
    return this.defaults.interstitial_interval;
  }
}

export const RemoteConfig = new RemoteConfigService();
export default RemoteConfig;
