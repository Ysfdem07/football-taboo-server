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

type CategoryMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryMenu'>;
type CategoryMenuScreenRouteProp = RouteProp<RootStackParamList, 'CategoryMenu'>;

const THEMES = {
  football: { 
    color: '#39ff14', 
    bg: require('../../assets/images/football_bg.jpg'), 
    title: 'FUTBOL',
    classicIcon: 'flash-outline',
    duelIcon: 'game-controller-outline',
    tournamentIcon: 'trophy-outline'
  },
  cinema: { 
    color: '#b026ff', 
    bg: require('../../assets/images/cinema_bg.jpg'), 
    title: 'SİNEMA',
    classicIcon: 'film-outline', 
    duelIcon: 'videocam-outline', 
    tournamentIcon: 'star-outline'
  },
  music: { 
    color: '#ff1493', 
    bg: require('../../assets/images/music_bg.jpg'), 
    title: 'MÜZİK',
    classicIcon: 'musical-notes-outline', 
    duelIcon: 'headset-outline', 
    tournamentIcon: 'radio-outline'
  }
};

function getWeekRange(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMon = (day === 0 ? -6 : 1 - day);
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMon);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const MONTHS = ['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

export default function CategoryMenuScreen() {
  const navigation = useNavigation<CategoryMenuScreenNavigationProp>();
  const route = useRoute<CategoryMenuScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { categoryId } = route.params;
  const [loading, setLoading] = useState(false);

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;

  const theme = THEMES[categoryId as keyof typeof THEMES] || THEMES.football;
  const NEON_COLOR = theme.color;

  const checkWordsAndNavigate = async (destination: 'Game' | 'OnlineLobby' | 'Tournament') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(destination as any, { categoryId });
    }, 500);
  };

  return (
    <ImageBackground source={theme.bg} style={styles.backgroundImage}>
      <View style={styles.darkOverlay} />
      
      <SafeAreaView style={styles.container}>
        
        {loading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <ActivityIndicator size="large" color={NEON_COLOR} />
            <Text style={[styles.loadingText, { color: NEON_COLOR }]}>BAĞLANIYOR...</Text>
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
          {categoryId === 'football' ? (
            <TouchableOpacity 
              style={[styles.backBtn, { borderColor: `${NEON_COLOR}80` }]} 
              onPress={() => navigation.navigate('CardAlbum', { categoryId: 'football' } as any)}
            >
              <Ionicons name="albums-outline" size={20} color={NEON_COLOR} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          <View style={styles.topRow}>
            {/* WEEKLY TOURNAMENT BOX CARD */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => checkWordsAndNavigate('Tournament')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.glassCard, { backgroundColor: 'rgba(5, 11, 20, 0.85)' }]}>
                <LinearGradient
                  colors={[`${NEON_COLOR}40`, 'rgba(5,11,20,0.7)', 'rgba(5,11,20,0.95)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}80` }]} />
                
                <Ionicons name={theme.tournamentIcon as any} size={48} color={NEON_COLOR} style={[styles.halfIcon]} />
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  HAFTALIK
                </Text>
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  TURNUVA
                </Text>
                
                <View style={styles.tournamentSubRowShort}>
                  <Ionicons name="calendar-outline" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.tournamentSubShort} allowFontScaling={false}>{getWeekRange()}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* ONLINE DUEL BOX CARD */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => checkWordsAndNavigate('OnlineLobby')}
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
                  ONLİNE
                </Text>
                <Text 
                  style={[styles.halfButtonTitle, { color: '#fff' }]} 
                  allowFontScaling={false} 
                  numberOfLines={1} 
                  adjustsFontSizeToFit={true}
                >
                  DÜELLO
                </Text>

                <View style={styles.tournamentSubRowShort}>
                  <Ionicons name="people-outline" size={11} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.tournamentSubShort} allowFontScaling={false}>1v1 & Lobi Maçı</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* LEADERBOARD */}
          <TouchableOpacity
            style={[styles.leaderboardBtn, { borderColor: `${NEON_COLOR}60`, shadowColor: NEON_COLOR }]}
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
                <Text style={[styles.leaderboardBtnText, { color: '#FFFFFF' }]} allowFontScaling={false}>LİG SIRALAMASI</Text>
                <Ionicons name="chevron-forward" size={18} color={`${NEON_COLOR}80`} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Pitch Battle (Beta mode - disabled for initial release) */}
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
