import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ImageBackground, SafeAreaView, ActivityIndicator, Alert, Platform, StatusBar
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { BannerAdComponent, showRewarded } from '../services/ads';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tournament'>;

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';

const THEMES = {
  football: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
};

interface LeaderboardEntry {
  rank: number; playerId: string; username: string;
  avatar: string; score: number; correctCount: number; completedPerfectly: boolean;
}

interface TournamentData {
  weekId: string; startDate: string; endDate: string;
  cards: { word: string; forbidden: string[] }[];
  myBestScore: number; myCorrectCount: number; myRank: number;
  canPlayToday: boolean; blockedForWeek: boolean; attempts: number;
  error?: string;
}

export default function TournamentScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Tournament'>>();
  const categoryId = (route.params as any)?.categoryId || 'football';
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [player, setPlayer] = useState<{ id: string; username: string; avatar: string } | null>(null);

  const loadPlayer = async () => {
    try {
      const raw = await AsyncStorage.getItem('@logged_in_profile');
      if (raw) setPlayer(JSON.parse(raw));
    } catch {}
  };

  const fetchTournament = useCallback(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('get_weekly_tournament', { playerId: player?.id || 'guest', category: categoryId });
    socket.emit('get_tournament_leaderboard', { category: categoryId });
  }, [player, categoryId]);

  useFocusEffect(useCallback(() => {
    loadPlayer();
  }, []));

  useEffect(() => {
    const socket = getSocket();
    if (!socket) { setLoadError(true); setLoading(false); return; }

    // Timeout: 8 saniye içinde veri gelmezse hata göster
    const timeout = setTimeout(() => {
      if (loading) { setLoadError(true); setLoading(false); }
    }, 8000);

    socket.on('weekly_tournament_data', (data: TournamentData) => {
      clearTimeout(timeout);
      setTournamentData(data);
      setLoading(false);
      setLoadError(false);
    });
    socket.on('tournament_leaderboard', (data: LeaderboardEntry[]) => {
      setLeaderboard(data);
    });

    fetchTournament();
    return () => {
      clearTimeout(timeout);
      socket.off('weekly_tournament_data');
      socket.off('tournament_leaderboard');
    };
  }, [fetchTournament]);

  useEffect(() => {
    if (player !== null) fetchTournament();
  }, [player, fetchTournament]);

  const [watchingAd, setWatchingAd] = useState(false);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  const getTimeRemaining = () => {
    if (!tournamentData?.endDate) return '';
    const diff = new Date(tournamentData.endDate).getTime() - Date.now();
    if (diff <= 0) return 'Turnuva bitti';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return `${days} gün ${hours} saat kaldı`;
  };

  const handlePlay = () => {
    if (!player) {
      Alert.alert('Giriş Gerekli', 'Turnuvaya katılmak için profil oluşturmalısın.', [
        { text: 'Tamam', onPress: () => navigation.navigate('Profile') }
      ]);
      return;
    }
    if (!tournamentData?.cards?.length) return;
    navigation.navigate('TournamentGame', { cards: tournamentData.cards, categoryId });
  };

  const handleWatchAd = () => {
    if (!player) return;
    setWatchingAd(true);
    
    showRewarded(
      (reward) => {
        // This runs if the user actually watched the ad to the end
        const socket = getSocket();
        if (socket) {
          socket.emit('grant_tournament_ad_attempt', { playerId: player.id, category: categoryId });
          Alert.alert('Tebrikler!', 'Reklamı sonuna kadar izledin. +1 Hak kazandın! 🎁');
        }
      },
      () => {
        // This runs when the ad is closed (either successfully finished or skipped)
        setWatchingAd(false);
      }
    );
  };

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getStatusInfo = () => {
    if (!tournamentData) return null;
    if (tournamentData.error) return { text: tournamentData.error, color: '#ff4444', canPlay: false, showAd: false };
    if (tournamentData.blockedForWeek) return { text: '🏆 Bu haftayı tamamladın! Gelecek hafta görüşürüz.', color: NEON_GOLD, canPlay: false, showAd: false };
    
    const remaining = 3 - tournamentData.attempts;
    if (remaining <= 0) {
      return { 
        text: '❌ Bugünlük ücretsiz 3 hakkın da bitti. Reklam izleyerek hemen +1 hak kazanabilirsin!', 
        color: '#ff4444', 
        canPlay: false, 
        showAd: true 
      };
    }
    
    return { 
      text: `🎯 Kalan Günlük Hak: ${remaining}/3\nEn iyi skorun: ${tournamentData.myBestScore}`, 
      color: remaining === 1 ? NEON_GOLD : NEON_BLUE, 
      canPlay: true, 
      showAd: false 
    };
  };

  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;

  const status = getStatusInfo();

  return (
    <ImageBackground source={(THEMES as any)[categoryId] || THEMES.football} style={styles.bg}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back-outline" size={20} color={NEON_GREEN} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🏆 HAFTALIK TURNUVA</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NEON_GREEN} />
            <Text style={styles.loadingText}>Turnuva yükleniyor...</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>⚠️</Text>
            <Text style={[styles.loadingText, { color: '#ff4444', textAlign: 'center' }]}>
              Sunucuya bağlanılamadı.{'\n'}İnternet bağlantını kontrol et.
            </Text>
            <TouchableOpacity
              style={[styles.playBtn, { marginTop: 20, paddingHorizontal: 32 }]}
              onPress={() => { setLoading(true); setLoadError(false); fetchTournament(); }}
            >
              <Text style={styles.playBtnText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.playerId}
            ListHeaderComponent={() => (
              <View>
                {/* Week Info Card */}
                <View style={styles.weekCard}>
                  <Text style={styles.weekLabel}>BU HAFTA</Text>
                  <Text style={styles.weekRange}>
                    {tournamentData ? `${formatDate(tournamentData.startDate)} – ${formatDate(tournamentData.endDate)}` : '—'}
                  </Text>
                  <Text style={styles.countdown}>{getTimeRemaining()}</Text>
                </View>

                {/* My Score Card */}
                {player && tournamentData && tournamentData.attempts > 0 && (
                  <View style={styles.myScoreCard}>
                    <Text style={styles.myScoreLabel}>SENİN SKORUN</Text>
                    <View style={styles.myScoreRow}>
                      <Text style={styles.myRankText}>{getRankEmoji(tournamentData.myRank)}</Text>
                      <View>
                        <Text style={styles.myScoreValue}>{tournamentData.myBestScore} puan</Text>
                        <Text style={styles.myCorrectText}>{tournamentData.myCorrectCount}/20 doğru</Text>
                      </View>
                    </View>
                  </View>
                )}

                 {/* Status + Play Button */}
                {status && (
                  <View style={[styles.statusBanner, { borderColor: status.color }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.text}</Text>
                    {status.canPlay && (
                      <TouchableOpacity style={styles.playBtn} onPress={handlePlay} activeOpacity={0.85}>
                        <Text style={styles.playBtnText}>TURNUVAYA BAŞLA ▶</Text>
                      </TouchableOpacity>
                    )}
                    {status.showAd && (
                      <TouchableOpacity 
                        style={[styles.playBtn, { backgroundColor: NEON_GOLD, marginTop: 10 }]} 
                        onPress={handleWatchAd} 
                        activeOpacity={0.85}
                      >
                        <Text style={[styles.playBtnText, { color: '#000' }]}>📺 REKLAM İZLE (+1 HAK)</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Leaderboard Title */}
                <Text style={styles.sectionTitle}>HAFTALIK SIRALAMA</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={[
                styles.lbRow,
                item.playerId === player?.id && styles.lbRowMe
              ]}>
                <Text style={styles.lbRank}>{getRankEmoji(item.rank)}</Text>
                <Text style={styles.lbAvatar}>{item.avatar}</Text>
                <View style={styles.lbInfo}>
                  <Text style={styles.lbUsername}>{item.username}{item.completedPerfectly ? ' 🏆' : ''}</Text>
                  <Text style={styles.lbSub}>{item.correctCount}/20 doğru</Text>
                </View>
                <Text style={styles.lbScore}>{item.score}</Text>
              </View>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyText}>Henüz kimse oynamadı. İlk sen ol! 🎯</Text>
              </View>
            )}
            ListFooterComponent={<View style={{ height: 20 }} />}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        )}
        <BannerAdComponent />
      </SafeAreaView>

      {watchingAd && (
        <View style={styles.adOverlay}>
          <ActivityIndicator size="large" color={NEON_GOLD} />
          <Text style={styles.adText}>📺 Reklam Yükleniyor ve İzleniyor...</Text>
          <Text style={styles.adSub}>Lütfen kapatmayın, 4 saniye içinde +1 hak verilecektir.</Text>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:          { flex: 1 },
  overlay:     { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,8,20,0.90)' },
  container:   { flex: 1 },
  centered:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: NEON_GREEN, marginTop: 12, fontFamily: 'Poppins_400Regular' },

  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  adText: {
    color: NEON_GOLD,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginTop: 15,
  },
  adSub: {
    color: '#aaa',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    marginTop: 5,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  backBtn:     { padding: 8 },
  headerTitle: {
    color: NEON_GOLD, fontSize: 16, fontFamily: 'Poppins_700Bold', letterSpacing: 1,
  },

  weekCard: {
    borderWidth: 1, borderColor: NEON_PURPLE, borderRadius: 12,
    backgroundColor: 'rgba(168,85,247,0.08)', padding: 16,
    alignItems: 'center', marginBottom: 12, marginTop: 8,
  },
  weekLabel:   { color: NEON_PURPLE, fontSize: 11, fontFamily: 'Poppins_600SemiBold', letterSpacing: 2 },
  weekRange:   { color: '#fff', fontSize: 20, fontFamily: 'Poppins_700Bold', marginTop: 4 },
  countdown:   { color: '#aaa', fontSize: 13, fontFamily: 'Poppins_400Regular', marginTop: 4 },

  myScoreCard: {
    borderWidth: 1, borderColor: NEON_GOLD, borderRadius: 12,
    backgroundColor: 'rgba(255,215,0,0.06)', padding: 14, marginBottom: 12,
  },
  myScoreLabel: { color: NEON_GOLD, fontSize: 10, fontFamily: 'Poppins_600SemiBold', letterSpacing: 2 },
  myScoreRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 12 },
  myRankText:   { fontSize: 32 },
  myScoreValue: { color: '#fff', fontSize: 22, fontFamily: 'Poppins_700Bold' },
  myCorrectText:{ color: '#aaa', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  statusBanner: {
    borderWidth: 1, borderRadius: 12, padding: 14,
    backgroundColor: 'rgba(0,255,136,0.05)', marginBottom: 16,
  },
  statusText:  { color: NEON_GREEN, fontSize: 13, fontFamily: 'Poppins_500Medium', textAlign: 'center' },
  playBtn: {
    marginTop: 12, backgroundColor: NEON_GREEN, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  playBtnText: { color: '#000814', fontSize: 15, fontFamily: 'Poppins_700Bold', letterSpacing: 1 },

  sectionTitle: {
    color: NEON_BLUE, fontSize: 12, fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 2, marginBottom: 8,
  },

  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
  },
  lbRowMe: {
    borderColor: NEON_GREEN, backgroundColor: 'rgba(0,255,136,0.07)',
  },
  lbRank:     { fontSize: 18, width: 36, textAlign: 'center' },
  lbAvatar:   { fontSize: 22 },
  lbInfo:     { flex: 1 },
  lbUsername: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  lbSub:      { color: '#888', fontSize: 11, fontFamily: 'Poppins_400Regular' },
  lbScore:    { color: NEON_GOLD, fontSize: 16, fontFamily: 'Poppins_700Bold' },

  emptyBoard: { padding: 24, alignItems: 'center' },
  emptyText:  { color: '#888', fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center' },
});
