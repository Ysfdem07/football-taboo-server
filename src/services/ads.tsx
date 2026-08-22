// src/services/ads.ts
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const isFirebaseAvailable = !!NativeModules.RNGoogleMobileAdsModule;

let MobileAds: any = null;
let InterstitialAd: any = null;
let BannerAd: any = null;
let RewardedAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
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
    TestIds = googleAds.TestIds;
    AdEventType = googleAds.AdEventType;
    RewardedAdEventType = googleAds.RewardedAdEventType;
  } catch (err) {
    console.warn('[Ads] Failed to load Google Mobile Ads library:', err);
  }
}

// AD UNIT IDs
const BANNER_ID = __DEV__ ? (TestIds ? TestIds.BANNER : '') : (Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/8571973167' : 'ca-app-pub-3816139413382983/4862946418');
const INTERSTITIAL_ID = __DEV__ ? (TestIds ? TestIds.INTERSTITIAL : '') : (Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/8076159463' : 'ca-app-pub-3816139413382983/5106634788');

const REWARDED_IDS: Record<string, string> = {
  x2: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/4224649561' : 'ca-app-pub-3816139413382983/7273487336',
  tourney: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/5537731236' : 'ca-app-pub-3816139413382983/7273487336',
  market: Platform.OS === 'ios' ? 'ca-app-pub-3816139413382983/7314731817' : 'ca-app-pub-3816139413382983/4136914456'
};

// Keep track of ad instances
let interstitialAdInstance: any = null;
let isInterstitialLoaded = false;

const rewardedInstances: Record<string, any> = { x2: null, tourney: null, market: null };
const rewardedLoaded: Record<string, boolean> = { x2: false, tourney: false, market: false };

export const initAds = async (): Promise<void> => {
  if (!isFirebaseAvailable || !MobileAds) {
    if (__DEV__) {
      console.log('[Ads] Google Mobile Ads is disabled (Expected in Expo Go).');
    }
    return;
  }

  try {
    const adapterStatuses = await MobileAds().initialize();
    if (__DEV__) {
      console.log('[Ads] Google Mobile Ads SDK initialized:', adapterStatuses);
    }
    loadInterstitial();
    loadRewarded('x2');
    loadRewarded('tourney');
    loadRewarded('market');
  } catch (err) {
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
  const unitId = __DEV__ && TestIds ? TestIds.REWARDED : REWARDED_IDS[type];
  if (!unitId) return;

  try {
    const instance = RewardedAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    instance.addAdEventListener(RewardedAdEventType.LOADED, () => {
      rewardedLoaded[type] = true;
      if (__DEV__) console.log(`[Ads] Rewarded Ad loaded for type: ${type}`);
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

export const showRewarded = (onRewardEarned: (reward: any) => void, onClose?: () => void, type: 'x2' | 'tourney' | 'market' = 'x2'): void => {
  if (!isFirebaseAvailable || !rewardedInstances[type]) {
    if (__DEV__) {
      console.log(`[Ads Mock] [Expo Go] Rewarded Ad Triggered! Type: ${type}`);
      onRewardEarned({ type: 'gold', amount: 100 });
      if (onClose) onClose();
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
      if (__DEV__) console.log('[Ads] Rewarded Ad not loaded yet. Retrying load...');
      instance.load();
      if (onClose) onClose();
    }
  } catch (err) {
    console.warn('[Ads] Failed to show rewarded ad:', err);
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
