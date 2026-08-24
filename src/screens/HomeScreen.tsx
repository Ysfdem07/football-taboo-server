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
import { getSocket } from '../services/socket';
import { registerForPushNotificationsAsync } from '../services/notifications';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;

  const trToUpper = (str: string) => {
    if (language === 'tr') {
      return str.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
    }
    return str.toUpperCase();
  };

  const CATEGORIES = [
    { 
      id: language === 'en' ? 'football_en' : 'football', 
      title: trToUpper(t('football')), 
      subtitle: language === 'en' ? 'Top Leagues, Legends, Teams and Moments' : 'Süper Lig, Avrupa Ligleri ve Efsaneler',
      color: '#39ff14', 
      btnColors: ['#32e010', '#1fa30a'] as [string, string],
      image: require('../../assets/icons/football_3d_icon.png'),
      patternIcon: 'football-outline'
    },
    { 
      id: language === 'en' ? 'cinema_en' : 'cinema', 
      title: trToUpper(t('cinema')), 
      subtitle: language === 'en' ? 'Blockbusters, Actors, Directors and Genres' : 'Kült Filmler, Oyuncular ve Yönetmenler',
      color: '#b026ff', 
      btnColors: ['#a826ff', '#7c15c5'] as [string, string],
      image: require('../../assets/icons/cinema_3d_icon.png'),
      patternIcon: 'film-outline'
    },
    { 
      id: language === 'en' ? 'music_en' : 'music',
      title: trToUpper(t('music')), 
      subtitle: language === 'en' ? 'Famous Artists, Bands and Iconic Song Titles' : 'Ünlü Sanatçılar, Müzik Grupları ve Şarkı İsimleri',
      color: '#ff1493', 
      btnColors: ['#ff1493', '#c8096f'] as [string, string],
      image: require('../../assets/icons/music_3d_icon.png'),
      patternIcon: 'musical-notes-outline'
    }
  ];

  useFocusEffect(
    useCallback(() => {
      const loadProfileAndToken = async () => {
        try {
          // 1. Her zaman bildirim izni iste (Guest de olsa)
          const token = await registerForPushNotificationsAsync();
          const socket = getSocket();

          // 2. Profili kontrol et
          const profileData = await AsyncStorage.getItem('@logged_in_profile');
          if (profileData) {
            const parsed = JSON.parse(profileData);
            setPlayer(parsed);
            // Kayıtlı oyuncuysa ID'siyle kaydet
            if (parsed.id && parsed.id !== 'guest' && token) {
              // save_push_token trusts socket.data.playerId (session-bound),
              // not the playerId in this payload — and that only gets set
              // once login_profile actually resolves. Home is the app's
              // first screen, so on a fresh launch this socket usually
              // hasn't authenticated yet; sending save_push_token straight
              // away silently no-ops server-side. Re-login first (safe to
              // call repeatedly) and only save the token once that's back.
              const emitTokenSave = () => socket.emit('save_push_token', { playerId: parsed.id, token });
              socket.once('login_response', emitTokenSave);
              const emitLogin = () => socket.emit('login_profile', { username: parsed.username, password: parsed.password });
              if (socket.connected) emitLogin(); else socket.once('connect', emitLogin);
            } else if (token) {
              socket.emit('save_guest_push_token', { token });
            }
          } else {
            // İlk açılış, ne hesap ne misafir profili var — ismi (ve
            // coins/jokers'ı) daha sonra rastgele üretmek yerine hemen
            // burada kilitliyoruz, böylece login olmadığı sürece her
            // ekranda ve her oturumda aynı "Guest_XXXX" ismiyle görünür.
            const guest = {
              id: 'guest',
              username: `Guest_${Math.floor(1000 + Math.random() * 9000)}`,
              coins: 0,
              jokers: { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 },
            };
            await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(guest));
            setPlayer(guest);
            if (token) {
              socket.emit('save_guest_push_token', { token });
            }
          }
        } catch (error) {
          console.error('Profile read error', error);
        } finally {
          setLoading(false);
        }
      };
      loadProfileAndToken();
    }, [])
  );

  const toggleLanguage = () => {
    const nextLang = language === 'tr' ? 'en' : 'tr';
    setLanguage(nextLang);
  };

  return (
    <ImageBackground source={require('../../assets/images/home_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        
        {/* TOP BAR ICONS ROW */}
        <View style={[styles.topBar, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('About')}>
            <Ionicons name="information-outline" size={22} color="#FFF" />
          </TouchableOpacity>

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
              <Ionicons name="person-outline" size={20} color="#00FFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 3D WORDICO HEADER TITLE - Shifted down matching mockup */}
        <View style={styles.headerTitleRow}>
          <Text style={styles.topBarTitle} allowFontScaling={false}>WORDICO</Text>
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
                {/* 3D Large Category Emblem (Transparent PNG, No Black Box Frame) */}
                <View style={styles.iconContainerClean}>
                  <Image source={cat.image} style={styles.catImageLarge} resizeMode="contain" />
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
                      {language === 'en' ? 'PLAY' : 'OYNA'}
                    </Text>
                    <Ionicons name="play" size={11} color="#FFF" style={{ marginLeft: 3 }} />
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
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  headerTitleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
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
    fontSize: 38,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  categoriesContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 18,
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
    paddingHorizontal: 14,
    paddingVertical: 18,
    zIndex: 1,
  },
  iconContainerClean: {
    width: 102,
    height: 102,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  catImageLarge: {
    width: 102,
    height: 102,
  },
  textContainer: {
    flex: 1,
    marginLeft: 10,
    marginRight: 6,
  },
  cardTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 24,
    letterSpacing: 1,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 6,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 14,
  },
  pillButtonWrapper: {
    borderRadius: 22,
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
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 22,
  },
  pillButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 13,
    letterSpacing: 0.8,
  }
});
