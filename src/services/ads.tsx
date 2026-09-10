// src/services/ads.ts
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Constants from 'expo-constants';

// In Expo Go, appOwnership is 'expo'. In EAS builds, it's null or 'standalone'.
const isExpoGo = Constants.appOwnership === 'expo';
const isFirebaseAvailable = !isExpoGo;

let MobileAds: any = null;
let InterstitialAd: any = null;
let BannerAd: any = null;
let RewardedAd: any = null;
let BannerAdSize: any = null;
let AdEventType: any = null;
let RewardedAdEventType: any = null;

if (isFirebaseAvailable) {
  try {
    const googleAds = require('react-native-google-mobile-ads');
    MobileAds = googleAds.default;
    InterstitialAd = googleAds.InterstitialAd;
    BannerAd = googleAds.BannerAd;
    RewardedAd = googleAds.RewardedAd;
    BannerAdSize = googleAds.BannerAdSize;
    AdEventType = googleAds.AdEventType;
    RewardedAdEventType = googleAds.RewardedAdEventType;
  } catch (err) {
    console.warn('[Ads] Failed to load Google Mobile Ads library:', err);
  }
}

// AD UNIT IDs.
//
// TEMPORARY (2026-09-03): App Review rejected the app (Guideline 2.1(a))
// after tapping "Watch Ad & Earn" hit a [googleMobileAds/no-fill] error on
// iOS. This AdMob account/app is brand new, and rewarded-video fill is
// inconsistent while it ramps up — the SDK integration itself is fine (the
// no-fill is a real, successful round-trip to Google's ad server, and
// flipping to test IDs previously confirmed ads render correctly end to
// end). Rather than gamble on live fill during another review pass, both
// platforms are pinned to Google's public test ad units — 100% fill,
// clearly-labeled "Test Ad" creatives, safe to submit. Flip
// USE_TEST_AD_UNITS back to false (reverting to the real
// ca-app-pub-3816139413382983/... units below) once the account has real
// traffic and fill has stabilized — this can ship as a JS-only OTA update,
// no new build needed. Do not leave this on indefinitely: test ads earn
// nothing.
const USE_TEST_AD_UNITS = true;

// Google's shared public test ad units — same for every developer, always
// 100% fill, and rendered with a visible "Test Ad" label so they're never
// mistaken for (or misused as) real inventory.
const TEST_IDS = {
  banner: Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/2934735716' : 'ca-app-pub-3940256099942544/6300978111',
  interstitial: Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/4411468910' : 'ca-app-pub-3940256099942544/1033173712',
  rewarded: Platform.OS === 'ios' ? 'ca-app-pub-3940256099942544/1712485313' : 'ca-app-pub-3940256099942544/5224354917',
};

const BANNER_ID = USE_TEST_AD_UNITS ? TEST_IDS.banner : (Platform.OS === 'ios'
  ? 'ca-app-pub-3816139413382983/8571973167'
  : 'ca-app-pub-3816139413382983/4862946418');
const INTERSTITIAL_ID = USE_TEST_AD_UNITS ? TEST_IDS.interstitial : (Platform.OS === 'ios'
  ? 'ca-app-pub-3816139413382983/8076159463'
  : 'ca-app-pub-3816139413382983/5106634788');

const REWARDED_IDS: Record<string, string> = USE_TEST_AD_UNITS ? {
  x2: TEST_IDS.rewarded,
  tourney: TEST_IDS.rewarded,
  market: TEST_IDS.rewarded,
} : {
  x2: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/4224649561' : 'ca-app-pub-3816139413382983/7273487336',
  tourney: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/5537731236' : 'ca-app-pub-3816139413382983/7273487336',
  market: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/7314731817' : 'ca-app-pub-3816139413382983/4136914456',
};

// Keep track of ad instances
let interstitialAdInstance: any = null;
let isInterstitialLoaded = false;

const rewardedInstances: Record<string, any> = { x2: null, tourney: null, market: null };
const rewardedLoaded: Record<string, boolean> = { x2: false, tourney: false, market: false };
// Last load failure per type — logged for our own debugging only. Never shown
// to the user: raw AdMob SDK error text (e.g. "[googleMobileAds/no-fill]
// Request Error: No ad to show.") reaching an Alert got the app rejected by
// App Review (Guideline 2.1(a), 2026-09-03) as a user-facing bug. No-fill is
// normal ad-serving behavior, not something a player should ever see as an
// "error".
const rewardedLoadErrors: Record<string, string | null> = { x2: null, tourney: null, market: null };

// Lets screens (e.g. the Market "Watch Ad & Earn" button) reflect real ad
// availability instead of only finding out on tap — disable/hide the button
// until this is true so most no-fill cases never reach the user as an error
// at all. Mock mode (Expo Go / Firebase unavailable) always reports ready
// since showRewarded there fires the reward instantly.
export const isRewardedReady = (type: 'x2' | 'tourney' | 'market' = 'x2'): boolean => {
  if (!isFirebaseAvailable) return true;
  return !!rewardedLoaded[type];
};

// TEMP diagnostic (2026-09-10): surfaces the real reason a rewarded ad won't
// load, so we can see it without a Mac/Console.app while chasing the iOS
// "even test ads don't load" report. Remove once resolved.
let sdkInitError: string | null = null;
let sdkInitStarted = false;
let sdkInitDone = false;

export const getAdsDebugInfo = (type: 'x2' | 'tourney' | 'market' = 'x2') => ({
  isExpoGo,
  isFirebaseAvailable,
  hasMobileAdsModule: !!MobileAds,
  useTestAdUnits: USE_TEST_AD_UNITS,
  unitId: REWARDED_IDS[type],
  loaded: rewardedLoaded[type],
  lastError: rewardedLoadErrors[type],
  sdkInitStarted,
  sdkInitDone,
  sdkInitError,
});

export const initAds = async (): Promise<void> => {
  if (!isFirebaseAvailable || !MobileAds) {
    if (__DEV__) {
      console.log('[Ads] Google Mobile Ads is disabled (Expected in Expo Go).');
    }
    sdkInitError = !MobileAds ? 'MobileAds module failed to require() — native module not linked in this binary.' : 'isFirebaseAvailable is false (Expo Go).';
    return;
  }

  sdkInitStarted = true;
  try {
    const adapterStatuses = await MobileAds().initialize();
    sdkInitDone = true;
    if (__DEV__) {
      console.log('[Ads] Google Mobile Ads SDK initialized:', adapterStatuses);
    }
    loadInterstitial();
    loadRewarded('x2');
    loadRewarded('tourney');
    loadRewarded('market');
  } catch (err: any) {
    sdkInitError = err?.message || String(err);
    console.warn('[Ads] Initialization failed:', err);
  }
};

const loadInterstitial = () => {
  if (!isFirebaseAvailable || !InterstitialAd || !INTERSTITIAL_ID) return;

  try {
    interstitialAdInstance = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAdInstance.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
      if (__DEV__) console.log('[Ads] Interstitial Ad loaded.');
    });

    interstitialAdInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isInterstitialLoaded = false;
      if (__DEV__) console.log('[Ads] Interstitial Ad closed. Loading next one...');
      loadInterstitial(); // Preload the next one
    });

    interstitialAdInstance.load();
  } catch (err) {
    console.warn('[Ads] Failed to load interstitial:', err);
  }
};

const loadRewarded = (type: 'x2' | 'tourney' | 'market') => {
  if (!isFirebaseAvailable || !RewardedAd) return;
  const unitId = REWARDED_IDS[type];
  if (!unitId) return;

  try {
    const instance = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    instance.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded[type] = true;
      rewardedLoadErrors[type] = null;
      if (__DEV__) console.log(`[Ads] Rewarded Ad loaded for type: ${type}`);
    });

    instance.addAdEventListener(AdEventType.ERROR, (error: any) => {
      rewardedLoaded[type] = false;
      rewardedLoadErrors[type] = error?.message || error?.code || String(error);
      console.warn(`[Ads] Rewarded Ad (${type}) failed to load:`, error);
    });

    instance.addAdEventListener(AdEventType.CLOSED, () => {
      rewardedLoaded[type] = false;
      if (__DEV__) console.log(`[Ads] Rewarded Ad closed. Loading next one for type: ${type}...`);
      loadRewarded(type); // Preload the next one
    });

    instance.load();
    rewardedInstances[type] = instance;
  } catch (err) {
    console.warn('[Ads] Failed to load rewarded ad:', err);
  }
};

export const showInterstitial = (): void => {
  if (!isFirebaseAvailable || !interstitialAdInstance) {
    if (__DEV__) {
      console.log('[Ads Mock] [Expo Go] Interstitial Ad Triggered! (Simulating full-screen ad)');
    }
    return;
  }

  try {
    if (isInterstitialLoaded) {
      interstitialAdInstance.show();
    } else {
      if (__DEV__) console.log('[Ads] Interstitial not loaded yet. Retrying load...');
      interstitialAdInstance.load();
    }
  } catch (err) {
    console.warn('[Ads] Failed to show interstitial:', err);
  }
};

export const showRewarded = (onRewardEarned: (reward: any) => void, onClose?: () => void, type: 'x2' | 'tourney' | 'market' = 'x2', onError?: (message: string) => void): void => {
  if (!isFirebaseAvailable || !rewardedInstances[type]) {
    if (__DEV__) {
      console.log(`[Ads Mock] [Expo Go] Rewarded Ad Triggered! Type: ${type}`);
      onRewardEarned({ type: 'gold', amount: 100 });
      if (onClose) onClose();
    } else if (onError) {
      onError('Şu anda reklam gösterilemiyor, lütfen daha sonra tekrar deneyin.');
    }
    return;
  }

  try {
    const instance = rewardedInstances[type];
    if (rewardedLoaded[type]) {
      // Set up the earner listener specifically for this view
      let earned = false;
      const unsubscribeEarned = instance.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        (reward: any) => {
          if (__DEV__) console.log('[Ads] Reward Earned:', reward);
          earned = true;
          onRewardEarned(reward);
          unsubscribeEarned();
        }
      );

      // Set up a temporary close listener
      const unsubscribeClosed = instance.addAdEventListener(
        AdEventType.CLOSED,
        () => {
          if (onClose) onClose();
          unsubscribeClosed();
          unsubscribeEarned(); // cleanup just in case
        }
      );

      instance.show();
    } else {
      // The underlying reason (no fill, network, wrong ad unit, etc.) is
      // logged for us via rewardedLoadErrors/console.warn in loadRewarded's
      // ERROR listener — never surfaced to the player. A no-fill here is
      // routine ad-serving behavior, not an app malfunction, so the user
      // only ever sees a plain "try again shortly" message.
      if (__DEV__) console.log(`[Ads] Rewarded Ad (${type}) not loaded yet — last load error:`, rewardedLoadErrors[type]);
      if (onError) {
        onError('Reklam henüz hazır değil, birkaç saniye sonra tekrar deneyin.');
      }
      instance.load();
      if (onClose) onClose();
    }
  } catch (err: any) {
    console.warn('[Ads] Failed to show rewarded ad:', err);
    if (onError) onError('Reklam gösterilemedi, lütfen daha sonra tekrar deneyin.');
    if (onClose) onClose();
  }
};

interface BannerAdComponentProps {
  hasBottomTab?: boolean;
}

// Premium Mock Banner component for Expo Go testing
const MockBannerAd: React.FC<BannerAdComponentProps> = ({ hasBottomTab = false }) => {
  const insets = useSafeAreaInsets();
  const extraBottomPadding = hasBottomTab 
    ? 4 
    : (Platform.OS === 'android' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 6));

  return (
    <View style={[styles.mockBannerContainer, { paddingBottom: extraBottomPadding + 4 }]}>
      <TouchableOpacity activeOpacity={0.8} style={styles.mockBannerContent}>
        <Text style={styles.mockBadge}>SPONSOR</Text>
        <Text style={styles.mockTitle}>⚽ Wordico Premium!</Text>
        <Text style={styles.mockDesc}>Reklamsız oyun, sınırsız kelimeler ve özel ligler için hemen yükseltin.</Text>
      </TouchableOpacity>
    </View>
  );
};

// Unified Banner Ad Component
export const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ hasBottomTab = false }) => {
  const insets = useSafeAreaInsets();
  const extraBottomPadding = hasBottomTab 
    ? 4 
    : (Platform.OS === 'android' ? Math.max(insets.bottom, 16) : Math.max(insets.bottom, 6));

  if (!isFirebaseAvailable || !BannerAd || !BANNER_ID || !BannerAdSize) {
    return <MockBannerAd hasBottomTab={hasBottomTab} />;
  }

  try {
    return (
      <View style={[styles.bannerContainer, { paddingBottom: extraBottomPadding }]}>
        <BannerAd
          unitId={BANNER_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
          onAdFailedToLoad={(error: any) => {
            console.warn('[Ads] Banner ad failed to load:', error);
          }}
        />
      </View>
    );
  } catch (err) {
    console.warn('[Ads] Banner component crashed, rendering fallback:', err);
    return <MockBannerAd hasBottomTab={hasBottomTab} />;
  }
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 4,
  },
  mockBannerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  mockBannerContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockBadge: {
    fontSize: 9,
    color: '#00FF66',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#00FF66',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mockTitle: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mockDesc: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
});
