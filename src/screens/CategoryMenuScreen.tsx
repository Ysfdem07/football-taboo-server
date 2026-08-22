import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ActivityIndicator, ScrollView, StatusBar, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar } from '../components/BottomNavBar';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../components/CustomAlert';

type CategoryMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryMenu'>;
type CategoryMenuScreenRouteProp = RouteProp<RootStackParamList, 'CategoryMenu'>;

export default function CategoryMenuScreen() {
  const navigation = useNavigation<CategoryMenuScreenNavigationProp>();
  const route = useRoute<CategoryMenuScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { categoryId } = route.params;
  const [loading, setLoading] = useState(false);

  const trToUpper = (str: string) => {
    if (language === 'tr') {
      return str.replace(/i/g, 'İ').replace(/ı/g, 'I').toUpperCase();
    }
    return str.toUpperCase();
  };

  const THEMES = {
    football: { 
      color: '#39ff14', 
      bg: require('../../assets/images/football_bg.jpg'), 
      title: trToUpper(t('football')),
      classicIcon: 'flash-outline',
      duelIcon: 'game-controller-outline',
      tournamentIcon: 'trophy-outline'
    },
    cinema: { 
      color: '#b026ff', 
      bg: require('../../assets/images/cinema_bg.jpg'), 
      title: trToUpper(t('cinema')),
      classicIcon: 'film-outline', 
      duelIcon: 'videocam-outline', 
      tournamentIcon: 'star-outline'
    },
    music: { 
      color: '#ff1493', 
      bg: require('../../assets/images/music_bg.jpg'), 
      title: trToUpper(t('music')),
      classicIcon: 'musical-notes-outline', 
      duelIcon: 'headset-outline', 
      tournamentIcon: 'radio-outline'
    }
  };

  const getWeekRange = (): string => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMon);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const months = language === 'en' ? MONTHS_EN : MONTHS_TR;
    const fmt = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;
    return `${fmt(monday)} - ${fmt(sunday)}`;
  };

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  const baseCategory = categoryId.replace('_en', '');
  const theme = THEMES[baseCategory as keyof typeof THEMES] || THEMES.football;
  const NEON_COLOR = theme.color;

  const checkWordsAndNavigate = async (destination: 'Game' | 'OnlineLobby' | 'Tournament', mode?: 'ranked' | 'friendly') => {
    if (destination === 'Tournament' || (destination === 'OnlineLobby' && mode === 'ranked')) {
      const profileData = await AsyncStorage.getItem('@logged_in_profile');
      if (!profileData) {
        CustomAlert.show(
          t('error'),
          language === 'en' ? 'You need to log in to play ranked modes!' : 'Dereceli maç oynamak veya turnuvaya katılmak için giriş yapmalısınız!',
          [
            { text: t('cancel'), style: 'cancel' },
            { text: language === 'en' ? 'Sign In' : 'Giriş Yap', onPress: () => navigation.navigate('Profile') }
          ]
        );
        return;
      }
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(destination as any, { categoryId, mode });
    }, 500);
  };

  return (
    <ImageBackground source={theme.bg} style={styles.backgroundImage}>
      <View style={styles.darkOverlay} />
      
      <SafeAreaView style={styles.container}>
        
        {loading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <ActivityIndicator size="large" color={NEON_COLOR} />
            <Text style={[styles.loadingText, { color: NEON_COLOR }]}>{trToUpper(t('loading'))}</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={[styles.header, { marginTop: topPadding }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="chevron-back" size={28} color={NEON_COLOR} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Text style={[styles.headerTitle, { color: NEON_COLOR, textShadowColor: NEON_COLOR }]}>
              {theme.title}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topRow}>
            {/* FRIENDLY MATCH BOX CARD */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => checkWordsAndNavigate('OnlineLobby', 'friendly')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.glassCard, { backgroundColor: 'rgba(5, 11, 20, 0.85)' }]}>
                <LinearGradient
                  colors={[`${NEON_COLOR}35`, 'rgba(5,11,20,0.7)', 'rgba(5,11,20,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}70` }]} />
                
                <Ionicons name="people-outline" size={48} color={NEON_COLOR} style={[styles.halfIcon]} />
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  {language === 'en' ? 'FRIENDLY' : 'DOSTLUK'}
                </Text>
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  {language === 'en' ? 'MATCH' : 'MAÇI'}
                </Text>
                
                <View style={styles.tournamentSubRowShort}>
                  <Ionicons name="game-controller-outline" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.tournamentSubShort} allowFontScaling={false}>{language === 'en' ? 'No Rank, Just Fun' : 'Serbest Oda'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* RANKED DUEL BOX CARD */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => checkWordsAndNavigate('OnlineLobby', 'ranked')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.glassCard, { backgroundColor: 'rgba(5, 11, 20, 0.85)' }]}>
                <LinearGradient
                  colors={[`${NEON_COLOR}35`, 'rgba(5,11,20,0.7)', 'rgba(5,11,20,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}70` }]} />

                <Ionicons name={theme.duelIcon as any} size={48} color={NEON_COLOR} style={[styles.halfIcon]} />
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  {language === 'en' ? 'RANKED' : 'DERECELİ'}
                </Text>
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  {language === 'en' ? 'DUEL' : 'DÜELLO'}
                </Text>

                <View style={styles.tournamentSubRowShort}>
                  <Ionicons name="analytics-outline" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.tournamentSubShort} allowFontScaling={false}>{language === 'en' ? 'Earn KP' : 'KP Kazan'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* WEEKLY TOURNAMENT BOX CARD (FULL WIDTH) */}
          <TouchableOpacity 
            style={[styles.fullWidthCardContainer, { shadowColor: NEON_COLOR, marginTop: 16 }]}
            onPress={() => checkWordsAndNavigate('Tournament')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View style={[styles.glassCard, { backgroundColor: 'rgba(5, 11, 20, 0.85)', paddingVertical: 20 }]}>
              <LinearGradient
                colors={[`${NEON_COLOR}40`, 'rgba(5,11,20,0.7)', 'rgba(5,11,20,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientOverlay}
              />
              <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}80` }]} />
              
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={theme.tournamentIcon as any} size={48} color={NEON_COLOR} style={{ marginRight: 16 }} />
                <View>
                  <Text 
                    style={[styles.halfButtonTitle, { color: '#fff', fontSize: 19, textAlign: 'left', marginBottom: 2 }]} 
                    allowFontScaling={false} 
                    adjustsFontSizeToFit={true}
                    numberOfLines={1}
                  >
                    {language === 'en' ? 'WEEKLY TOURNAMENT' : 'HAFTALIK TURNUVA'}
                  </Text>
                  <View style={[styles.tournamentSubRowShort, { justifyContent: 'flex-start', marginTop: 4 }]}>
                    <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={[styles.tournamentSubShort, { fontSize: 13, marginLeft: 4 }]} allowFontScaling={false}>{getWeekRange()}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* LEADERBOARD */}
          <TouchableOpacity
            style={[styles.leaderboardBtn, { borderColor: `${NEON_COLOR}60`, shadowColor: NEON_COLOR, marginTop: 16 }]}
            onPress={() => navigation.navigate('Leaderboard', { categoryId })}
            activeOpacity={0.8}
          >

            <View style={[styles.leaderboardGlassCard, { backgroundColor: 'rgba(5, 11, 20, 0.85)' }]}>
              <LinearGradient
                colors={[`${NEON_COLOR}25`, 'rgba(5,11,20,0.9)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.gradientOverlay}
              />
              <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}40` }]} />
              <View style={styles.leaderboardContent}>
                <Ionicons name="trophy" size={28} color={NEON_COLOR} />
                <Text style={[styles.leaderboardBtnText, { color: '#FFFFFF' }]} allowFontScaling={false}>{t('leagueLeaderboards')}</Text>
                <Ionicons name="chevron-forward" size={18} color={`${NEON_COLOR}80`} />
              </View>
            </View>
          </TouchableOpacity>

        </ScrollView>

        <BottomNavBar activeTab="none" navigation={navigation} />

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,15,0.6)', 
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 20, 
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfButtonContainer: {
    flex: 1,
    borderRadius: 24,
    elevation: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  glassCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 35,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  neonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 24,
  },
  halfIcon: {
    marginBottom: 15,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  halfButtonTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    lineHeight: 22,
  },
  tournamentBtn: {
    borderRadius: 24,
    elevation: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  tournamentGlassCard: {
    borderRadius: 24,
    padding: 30,
    overflow: 'hidden',
  },
  tournamentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
  },
  tournamentTextWrap: {
    alignItems: 'flex-start',
  },
  tournamentTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 28,
  },
  tournamentSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tournamentSub: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  tournamentSubRowShort: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tournamentSubShort: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  loadingText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 16,
    marginTop: 15,
    letterSpacing: 2,
    textShadowOffset: { width:0, height:0 },
    textShadowRadius: 10,
  },
  leaderboardBtn: {
    borderRadius: 18,
    borderWidth: 1,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  fullWidthCardContainer: {
    width: '100%',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderRadius: 24,
  },
  leaderboardGlassCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  leaderboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  leaderboardBtnText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 16,
    letterSpacing: 1.5,
    flex: 1,
    textAlign: 'center',
    textShadowOffset: { width:0, height:0 },
    textShadowRadius: 8,
  },
});
