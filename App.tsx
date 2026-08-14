import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { Analytics } from './src/services/analytics';
import { RemoteConfig } from './src/services/remoteConfig';
import { initAds } from './src/services/ads';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';

import { LanguageProvider } from './src/context/LanguageContext';

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  useEffect(() => {
    // Initialize analytics, remote config, and ads on app launch
    const initServices = async () => {
      await Analytics.init();
      await RemoteConfig.init();
      await initAds();
    };
    initServices();
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <StatusBar style="light" translucent backgroundColor="transparent" />
        <AppNavigator />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
