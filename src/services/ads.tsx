// src/services/ads.ts
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, NativeModules } from 'react-native';

const isFirebaseAvailable = !!NativeModules.RNFBAppModule;

let MobileAds: any = null;
let InterstitialAd: any = null;
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let AdEventType: any = null;

if (isFirebaseAvailable) {
  try {
    const googleAds = require('react-native-google-mobile-ads');
    MobileAds = googleAds.default;
    InterstitialAd = googleAds.InterstitialAd;
    BannerAd = googleAds.BannerAd;
    BannerAdSize = googleAds.BannerAdSize;
    TestIds = googleAds.TestIds;
    AdEventType = googleAds.AdEventType;
  } catch (err) {
    console.warn('[Ads] Failed to load Google Mobile Ads library:', err);
  }
}

// Keep track of the interstitial ad instance
let interstitialAdInstance: any = null;
let isInterstitialLoaded = false;

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
  } catch (err) {
    console.warn('[Ads] Initialization failed:', err);
  }
};

const loadInterstitial = () => {
  if (!isFirebaseAvailable || !InterstitialAd || !TestIds) return;

  try {
    interstitialAdInstance = InterstitialAd.createForAdRequest(TestIds.INTERSTITIAL, {
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

// Premium Mock Banner component for Expo Go testing
const MockBannerAd = () => {
  return (
    <View style={styles.mockBannerContainer}>
      <TouchableOpacity activeOpacity={0.8} style={styles.mockBannerContent}>
        <Text style={styles.mockBadge}>SPONSOR</Text>
        <Text style={styles.mockTitle}>⚽ Wordico Premium!</Text>
        <Text style={styles.mockDesc}>Reklamsız oyun, sınırsız kelimeler ve özel ligler için hemen yükseltin.</Text>
      </TouchableOpacity>
    </View>
  );
};

// Unified Banner Ad Component
export const BannerAdComponent: React.FC = () => {
  if (!isFirebaseAvailable || !BannerAd || !TestIds || !BannerAdSize) {
    return <MockBannerAd />;
  }

  try {
    return (
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={TestIds.BANNER}
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
    return <MockBannerAd />;
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
