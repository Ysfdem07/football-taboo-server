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
      btnColors: ['#32e010', '#25b00b'] as [string, string],
      image: require('../../assets/icons/football_3d_icon.jpg'),
      patternIcon: 'football-outline'
    },
    { 
      id: 'cinema', 
      title: t('cinema').toUpperCase(), 
      subtitle: language === 'en' ? 'Award Winning Movies & Shows, Directors and Characters' : 'Ödüllü Film ve Diziler, Ünlü Oyuncu ve Yönetmenler, Film ve Dizi Karakterleri',
      color: '#b026ff', 
      btnColors: ['#a826ff', '#7c15c5'] as [string, string],
      image: require('../../assets/icons/cinema_3d_icon.jpg'),
      patternIcon: 'film-outline'
    },
    { 
      id: 'music', 
      title: t('music').toUpperCase(), 
      subtitle: language === 'en' ? 'Famous Artists, Bands and Iconic Song Titles' : 'Ünlü Sanatçılar, Müzik Grupları ve Şarkı İsimleri',
      color: '#ff1493', 
      btnColors: ['#ff1493', '#d00c74'] as [string, string],
      image: require('../../assets/icons/music_3d_icon.jpg'),
      patternIcon: 'musical-notes-outline'
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

          {/* 3D STYLED WORDICO TITLE */}
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
              style={[styles.categoryCard, { borderColor: cat.color, shadowColor: cat.color }]}
              onPress={() => navigation.navigate('CategoryMenu', { categoryId: cat.id })}
              activeOpacity={0.88}
            >
              {/* Card Background Gradient */}
              <LinearGradient
                colors={[`${cat.color}25`, 'rgba(5,11,20,0.85)', 'rgba(5,11,20,0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />

              {/* Subdued Background Pattern Icon */}
              <Ionicons 
                name={cat.patternIcon as any} 
                size={140} 
                color={`${cat.color}08`} 
                style={styles.bgPatternIcon} 
              />

              <View style={styles.cardTop}>
                {/* 3D Large Category Emblem */}
                <View style={[styles.iconContainerClean, { borderColor: `${cat.color}60` }]}>
                  <Image source={cat.image} style={styles.catImageLarge} resizeMode="cover" />
                </View>

                {/* Text Section */}
                <View style={styles.textContainer}>
                  <Text 
                    style={[styles.cardTitle, { color: cat.color }]} 
                    allowFontScaling={false} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true}
                  >
                    {cat.title}
                  </Text>
                  <Text style={styles.cardSubtitle} allowFontScaling={false} numberOfLines={3}>
                    {cat.subtitle}
                  </Text>
                </View>

                {/* Glossy Pill-Shaped Action Button */}
                <TouchableOpacity 
                  style={styles.pillButtonWrapper}
                  onPress={() => navigation.navigate('CategoryMenu', { categoryId: cat.id })}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={cat.btnColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.pillButtonGradient}
                  >
                    <Text style={styles.pillButtonText} allowFontScaling={false}>
                      {t('playNow').replace('▶', '').trim()}
                    </Text>
                    <Ionicons name="play" size={12} color="#FFF" style={{ marginLeft: 3 }} />
                  </LinearGradient>
                </TouchableOpacity>
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
    marginBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  langToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1.5,
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
    fontSize: 34,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 255, 255, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  categoriesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 20,
  },
  categoryCard: {
    borderRadius: 28,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.85,
    shadowRadius: 18,
    elevation: 12,
    backgroundColor: 'rgba(5, 11, 20, 0.9)',
  },
  bgPatternIcon: {
    position: 'absolute',
    right: -20,
    bottom: -30,
    zIndex: 0,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    zIndex: 1,
  },
  iconContainerClean: {
    width: 86,
    height: 86,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1.5,
    backgroundColor: '#000',
  },
  catImageLarge: {
    width: 86,
    height: 86,
    borderRadius: 22,
  },
  textContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  pillButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  pillButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 24,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 14,
    letterSpacing: 1,
  }
});
