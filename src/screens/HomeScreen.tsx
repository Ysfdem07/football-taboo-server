import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ActivityIndicator, Image, useWindowDimensions, Linking, ScrollView, StatusBar, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar } from '../components/BottomNavBar';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../context/LanguageContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 12) : 14;

  const CATEGORIES = [
    { 
      id: 'football', 
      title: t('football').toUpperCase(), 
      subtitle: language === 'en' ? 'Legendary Footballers, Managers, Teams and Terms' : 'Efsane Futbolcular, Teknik Direktörler, Futbol Takımları ve Terimleri',
      color: '#39ff14', 
      icon: 'football'
    },
    { 
      id: 'cinema', 
      title: t('cinema').toUpperCase(), 
      subtitle: language === 'en' ? 'Award Winning Movies & Shows, Directors and Characters' : 'Ödüllü Film ve Diziler, Ünlü Oyuncu ve Yönetmenler, Film ve Dizi Karakterleri',
      color: '#b026ff', 
      icon: 'videocam'
    },
    { 
      id: 'music', 
      title: t('music').toUpperCase(), 
      subtitle: language === 'en' ? 'Famous Artists, Bands and Iconic Song Titles' : 'Ünlü Sanatçılar, Müzik Grupları ve Şarkı İsimleri',
      color: '#ff1493', 
      icon: 'musical-notes'
    }
  ];

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const profileData = await AsyncStorage.getItem('@logged_in_profile');
          if (profileData) {
            setPlayer(JSON.parse(profileData));
          } else {
            setPlayer(null);
          }
        } catch (error) {
          console.error('Profile read error', error);
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    }, [])
  );

  const toggleLanguage = () => {
    const nextLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
  };

  return (
    <ImageBackground source={require('../../assets/images/home_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        
        {/* TOP BAR */}
        <View style={[styles.topBar, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('About')}>
            <Ionicons name="information-outline" size={22} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.topBarTitle} allowFontScaling={false}>WORDICO</Text>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* Language Switcher Button (TR 🇹🇷 / EN 🇬🇧) */}
            <TouchableOpacity 
              style={[styles.langToggleBtn, { borderColor: language === 'tr' ? '#FFD700' : '#00BFFF' }]} 
              onPress={toggleLanguage}
              activeOpacity={0.8}
            >
              <Text style={styles.langFlag}>{language === 'tr' ? '🇹🇷' : '🇬🇧'}</Text>
              <Text style={styles.langText}>{language === 'tr' ? 'TR' : 'EN'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconButton, { borderColor: '#00FFFF' }]} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={20} color="#00FFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES LIST SCROLLVIEW */}
        <ScrollView 
          style={{ flex: 1 }} 
          contentContainerStyle={styles.categoriesContainer} 
          showsVerticalScrollIndicator={false}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity 
              key={cat.id} 
              style={[styles.categoryCard, { borderColor: cat.color, shadowColor: cat.color, backgroundColor: 'rgba(5, 11, 20, 0.85)' }]}
              onPress={() => navigation.navigate('CategoryMenu', { categoryId: cat.id })}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[`${cat.color}35`, 'rgba(5,11,20,0.7)', 'rgba(5,11,20,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.cardTop}>
                <View style={styles.iconContainerClean}>
                  {cat.id === 'football' ? (
                    <Image source={require('../../assets/icons/football_logo.jpg')} style={styles.catImageLarge} />
                  ) : cat.id === 'cinema' ? (
                    <Image source={require('../../assets/icons/cinema_logo.jpg')} style={styles.catImageLarge} />
                  ) : cat.id === 'music' ? (
                    <Image source={require('../../assets/icons/music_logo.jpg')} style={styles.catImageLarge} />
                  ) : (
                    <Ionicons name={cat.icon as any} size={52} color={cat.color} />
                  )}
                </View>
                <View style={styles.textContainer}>
                  <Text 
                    style={[styles.cardTitle, { color: cat.color }]} 
                    allowFontScaling={false} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true}
                  >
                    {cat.title}
                  </Text>
                  <Text style={styles.cardSubtitle} allowFontScaling={false}>{cat.subtitle}</Text>
                </View>
                <View style={[styles.modlarBtn, { borderColor: cat.color, backgroundColor: `${cat.color}30` }]}>
                  <Text style={[styles.modlarText, { color: '#FFF' }]} allowFontScaling={false}>{t('playNow')}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <BottomNavBar activeTab="home" navigation={navigation} />

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050B14'
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: 'rgba(5,11,20,0.85)',
  },
  langFlag: {
    fontSize: 14,
  },
  langText: {
    color: '#FFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 26,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowRadius: 10,
  },
  categoriesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 22,
  },
  categoryCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 20,
  },
  iconContainerClean: {
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    overflow: 'hidden',
  },
  catImageLarge: {
    width: 68,
    height: 68,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
  },
  cardTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 26,
    textShadowRadius: 10,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },
  modlarBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 6,
  },
  modlarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 9,
  }
});
