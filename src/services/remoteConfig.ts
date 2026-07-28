// src/services/remoteConfig.ts
import { NativeModules } from 'react-native';

class RemoteConfigService {
  private remoteConfig: any = null;
  private isAvailable = false;

  // Local fallback defaults
  private defaults = {
    game_time_limit: 60,
    game_win_score: 50,
    interstitial_interval: 2, // Show interstitial ad every 2 rounds
  };

  async init(): Promise<void> {
    try {
      this.isAvailable = !!NativeModules.RNFBAppModule;

      if (!this.isAvailable) {
        if (__DEV__) {
          console.log('[RemoteConfig] Native module (RNFBAppModule) is not available. Using local fallback defaults.');
        }
        return;
      }

      // Dynamic require ensures no static load crashes in Expo Go
      const rc = require('@react-native-firebase/remote-config').default;
      this.remoteConfig = rc();

      // Configure fetch settings (1 hour cache interval, custom dev interval)
      await this.remoteConfig.setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 10000 : 3600000,
      });

      // Set in-app default values
      await this.remoteConfig.setDefaults(this.defaults);

      // Fetch and activate configs
      const activated = await this.remoteConfig.fetchAndActivate();
      if (__DEV__) {
        console.log(`[RemoteConfig] Remote config fetched and activated. Status: ${activated}`);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn('[RemoteConfig] Failed to initialize remote config:', err);
      }
    }
  }

  getGameTimeLimit(): number {
    if (this.isAvailable && this.remoteConfig) {
      try {
        const val = this.remoteConfig.getValue('game_time_limit').asNumber();
        return val > 0 ? val : this.defaults.game_time_limit;
      } catch (e) {
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
      } catch (e) {
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
      } catch (e) {
        return this.defaults.interstitial_interval;
      }
    }
    return this.defaults.interstitial_interval;
  }
}

export const RemoteConfig = new RemoteConfigService();
export default RemoteConfig;
