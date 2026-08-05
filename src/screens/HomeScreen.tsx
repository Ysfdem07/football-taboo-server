import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ActivityIndicator, Image, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { syncWords } from '../utils/WordSync';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '../services/analytics';
import { BannerAdComponent } from '../services/ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLeagueForKp } from '../utils/LeagueHelper';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const NEON_GREEN = '#00FF88';
const NEON_BLUE  = '#00BFFF';
const NEON_PURPLE = '#A855F7';

export default function HomeScreen({ navigation }: Props) {
  const [isSyncing, setIsSyncing] = useState(true);
  const [player, setPlayer] = useState<any>(null);
  const { width, height } = useWindowDimensions();

  const widthScale  = width / 375;
  const heightScale = height / 812;
  const scale = Math.min(widthScale, heightScale);

  const loadProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem('@logged_in_profile');
      if (stored) setPlayer(JSON.parse(stored));
      else setPlayer(null);
    } catch (e) {}
  };

  useEffect(() => {
    Analytics.logScreenView('Home');
    syncWords()
      .catch((err) => console.error('Sync error:', err))
      .finally(() => setIsSyncing(false));
    loadProfile();
    const unsubscribe = navigation.addListener('focus', loadProfile);
    return unsubscribe;
  }, [navigation]);

  const league = player ? getLeagueForKp(player.kp ?? 0) : null;

  // Responsive grid card size: square based on half screen width minus padding & gap
  const cardSize = Math.min((width - 20 * 2 - 14) / 2, 175);
  const modeIconSize = Math.round(cardSize * 0.48);

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      {/* Dark cyber overlay */}
      <View style={styles.cyberOverlay} />

      <SafeAreaView style={styles.container}>
        {/* ──────────── TOP BAR ──────────── */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topBarButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle-outline" size={20} color={NEON_GREEN} style={{ marginRight: 5 }} />
            <Text style={styles.topBarButtonText}>Profilim</Text>
          </TouchableOpacity>

          <Text style={styles.topBarTitle}>WORDICO</Text>

          <TouchableOpacity style={styles.topBarButton} onPress={() => navigation.navigate('Leaderboard')}>
            <Ionicons name="trophy-outline" size={18} color="#FFD700" style={{ marginRight: 5 }} />
            <Text style={styles.topBarButtonText}>Sıralama</Text>
          </TouchableOpacity>
        </View>

        {/* ──────────── MAIN CONTENT ──────────── */}
        <View style={[styles.mainWrapper, { paddingBottom: Math.max(16, Math.round(30 * heightScale)) }]}>

          {/* ── GLASSMORPHIC PROFILE CARD ── */}
          <TouchableOpacity style={styles.profileCard} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
            <View style={styles.profileCardLeft}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{player?.avatar || '⚽'}</Text>
              </View>
              <View>
                <Text style={styles.profileUsername}>{player?.username || 'Misafir'}</Text>
                <Text style={styles.profileKp}>⚡ {player?.kp ?? 0} KP</Text>
              </View>
            </View>
            <View style={styles.profileCardRight}>
              <View style={styles.leagueBadge}>
                <Text style={styles.leagueBadgeIcon}>{league?.icon || '🥉'}</Text>
                <Text style={styles.leagueBadgeName}>{league?.name || 'Bronz'}</Text>
              </View>
              {!player && <Text style={styles.loginHint}>Giriş Yap →</Text>}
            </View>
          </TouchableOpacity>

          {/* ── SECTION LABEL ── */}
          <Text style={styles.sectionLabel}>⚽  OYUN MODU SEÇ</Text>

          {/* ── GAME MODE GRID / SYNCING ── */}
          {isSyncing ? (
            <View style={styles.syncingContainer}>
              <ActivityIndicator size="large" color={NEON_GREEN} />
              <Text style={styles.syncingText}>Kelimeler Güncelleniyor...</Text>
            </View>
          ) : (
            <>
              {/* 2-column grid */}
              <View style={styles.modeGrid}>
                {/* DÜELLO (ONLINE) */}
                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardOnline, { width: cardSize, height: cardSize }]}
                  onPress={() => navigation.navigate('OnlineLobby')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.modeCardGlow, { backgroundColor: 'rgba(168,85,247,0.1)' }]} />
                  <Image
                    source={require('../../assets/icons/ranked.jpg')}
                    style={{ width: modeIconSize, height: modeIconSize, borderRadius: modeIconSize * 0.22 }}
                  />
                  <Text style={styles.modeLabel}>DÜELLO</Text>
                  <Text style={styles.modeSubLabel}>ONLINE</Text>
                </TouchableOpacity>

                {/* GELENEKSEL TABU */}
                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardClassic, { width: cardSize, height: cardSize }]}
                  onPress={() => navigation.navigate('Settings')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.modeCardGlow, { backgroundColor: 'rgba(0,191,255,0.08)' }]} />
                  <Image
                    source={require('../../assets/icons/classic_tabu.jpg')}
                    style={{ width: modeIconSize, height: modeIconSize, borderRadius: modeIconSize * 0.22 }}
                  />
                  <Text style={styles.modeLabel}>GELENEKSEL</Text>
                  <Text style={styles.modeSubLabel}>TABU</Text>
                </TouchableOpacity>
              </View>

              {/* HAFTALIK TURNUVA BANNER */}
              <TouchableOpacity
                style={styles.tournamentBanner}
                onPress={() => navigation.navigate('Tournament')}
                activeOpacity={0.85}
              >
                <View style={styles.tournamentBannerInner}>
                  <Text style={styles.tournamentBannerIcon}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tournamentBannerTitle}>HAFTALIK TURNUVA</Text>
                    <Text style={styles.tournamentBannerSub}>İpuçlardan futbolcuyu bul • Günde 1 hak</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FFD700" />
                </View>
              </TouchableOpacity>

              {/* NASIL OYNANIR */}
              <TouchableOpacity
                style={styles.howToPlayButton}
                onPress={() => navigation.navigate('HowToPlay')}
                activeOpacity={0.8}
              >
                <Ionicons name="help-circle-outline" size={20} color={NEON_GREEN} style={{ marginRight: 8 }} />
                <Text style={styles.howToPlayText}>NASIL OYNANIR?</Text>
              </TouchableOpacity>

              {/* HAKKIMIZDA */}
              <TouchableOpacity style={styles.infoLink} onPress={() => navigation.navigate('About')}>
                <Ionicons name="information-circle-outline" size={15} color="rgba(255,255,255,0.4)" style={{ marginRight: 6 }} />
                <Text style={styles.infoLinkText}>Hakkımızda / Bilgi</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <BannerAdComponent />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cyberOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 8, 20, 0.88)',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  // ── TOP BAR ──
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  topBarTitle: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_900Black',
    fontSize: 17,
    letterSpacing: 2,
    textShadowColor: 'rgba(0,255,136,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  topBarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.08)',
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  topBarButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
  },

  // ── MAIN WRAPPER ──
  mainWrapper: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },

  // ── PROFILE CARD ──
  profileCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.22)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 22,
  },
  profileCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderWidth: 2,
    borderColor: 'rgba(0,255,136,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22 },
  profileUsername: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  profileKp: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    marginTop: 1,
  },
  profileCardRight: { alignItems: 'flex-end', gap: 6 },
  leagueBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  leagueBadgeIcon: { fontSize: 16 },
  leagueBadgeName: {
    color: '#FFD700',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  loginHint: {
    color: 'rgba(0,255,136,0.65)',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },

  // ── SECTION LABEL ──
  sectionLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 2.5,
    marginBottom: 12,
  },

  // ── GAME MODE GRID ──
  modeGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  modeCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 12,
    gap: 8,
  },
  modeCardOnline: {
    borderColor: NEON_PURPLE,
    shadowColor: NEON_PURPLE,
  },
  modeCardClassic: {
    borderColor: NEON_BLUE,
    shadowColor: NEON_BLUE,
  },
  modeCardGlow: {
    ...StyleSheet.absoluteFillObject,
  },
  modeLabel: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  modeSubLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: -4,
  },

  // ── TOURNAMENT BANNER ──
  tournamentBanner: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,215,0,0.5)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,215,0,0.06)',
    marginBottom: 10,
    overflow: 'hidden',
  },
  tournamentBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  tournamentBannerIcon:  { fontSize: 28 },
  tournamentBannerTitle: {
    color: '#FFD700',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },
  tournamentBannerSub: {
    color: 'rgba(255,215,0,0.6)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 1,
  },

  // ── HOW TO PLAY ──
  howToPlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,136,0.3)',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 12,
    backgroundColor: 'rgba(0,255,136,0.05)',
  },
  howToPlayText: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 1,
  },

  // ── INFO LINK ──
  infoLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLinkText: {
    color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },

  // ── SYNCING ──
  syncingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  syncingText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    marginTop: 12,
  },
});
