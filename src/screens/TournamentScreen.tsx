import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ImageBackground, SafeAreaView, ActivityIndicator, Platform, StatusBar
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { BannerAdComponent, showRewarded } from '../services/ads';
import { UserAvatar } from '../components/UserAvatar';
import { useLanguage } from '../context/LanguageContext';
import { CustomAlert } from '../components/CustomAlert';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Tournament'>;

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';

const THEMES = {
  football: require('../../assets/images/football_bg.jpg'),
  football_en: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  cinema_en: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
  music_en: require('../../assets/images/music_bg.jpg'),
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
  const { t, language } = useLanguage();
  const categoryId = (route.params as any)?.categoryId || 'football';
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [player, setPlayer] = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [watchingAd, setWatchingAd] = useState(false);

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerIdRef = useRef<string>('guest');
  const isLoadingRef = useRef<boolean>(true);

  const clearLoadTimeout = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const startLoadTimeout = () => {
    clearLoadTimeout();
    isLoadingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      if (isLoadingRef.current) {
        setLoadError(true);
        setLoading(false);
        isLoadingRef.current = false;
      }
    }, 15000);
  };

  const emitFetch = useCallback((pid?: string) => {
    const socket = getSocket();
    if (!socket) return;
    if (!socket.connected) socket.connect();
    const playerId = pid ?? playerIdRef.current;
    socket.emit('get_weekly_tournament', { playerId, category: categoryId });
    socket.emit('get_tournament_leaderboard', { category: categoryId });
  }, [categoryId]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) { setLoadError(true); setLoading(false); return; }
    if (!socket.connected) socket.connect();

    const handleConnect = () => { emitFetch(); };

    const handleTournamentData = (data: TournamentData) => {
      clearLoadTimeout();
      isLoadingRef.current = false;
      if (data && !data.error) {
        setTournamentData(data);
        setLoading(false);
        setLoadError(false);
      } else if (data && data.error && (data.error.toLowerCase().includes('hazirlan') || data.error.toLowerCase().includes('hazırlan') || data.error.toLowerCase().includes('preparing'))) {
        setTimeout(() => {
          isLoadingRef.current = true;
          emitFetch();
        }, 3000);
      } else {
        setLoadError(true);
        setLoading(false);
      }
    };

    const handleLeaderboard = (data: LeaderboardEntry[]) => {
      if (Array.isArray(data)) setLeaderboard(data);
    };

    socket.off('connect', handleConnect);
    socket.off('weekly_tournament_data', handleTournamentData);
    socket.off('tournament_leaderboard', handleLeaderboard);
    socket.on('connect', handleConnect);
    socket.on('weekly_tournament_data', handleTournamentData);
    socket.on('tournament_leaderboard', handleLeaderboard);

    AsyncStorage.getItem('@logged_in_profile').then(raw => {
      let pid = 'guest';
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          setPlayer(parsed);
          pid = parsed.id || 'guest';
        } catch {}
      }
      playerIdRef.current = pid;
      startLoadTimeout();
      emitFetch(pid);
    }).catch(() => {
      startLoadTimeout();
      emitFetch('guest');
    });

    return () => {
      clearLoadTimeout();
      socket.off('connect', handleConnect);
      socket.off('weekly_tournament_data', handleTournamentData);
      socket.off('tournament_leaderboard', handleLeaderboard);
    };
  }, [categoryId]);

  useFocusEffect(useCallback(() => {
    if (!isLoadingRef.current) {
      setLoading(true);
      setLoadError(false);
      isLoadingRef.current = true;
      startLoadTimeout();
      emitFetch();
    }
  }, [emitFetch]));

  const formatDate = (d: string, isEnd = false) => {
    const date = new Date(d);
    if (isEnd) {
      date.setHours(date.getHours() - 12);
    }
    const monthsTr = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = language === 'en' ? monthsEn : monthsTr;
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getTimeRemaining = () => {
    if (!tournamentData?.endDate) return '';
    const diff = new Date(tournamentData.endDate).getTime() - Date.now();
    if (diff <= 0) return language === 'en' ? 'Tournament ended' : 'Turnuva bitti';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    return language === 'en'
      ? `${days} ${t('daysLeft')} ${hours} ${t('hoursLeft')}`
      : `${days} gün ${hours} saat kaldı`;
  };

  const handlePlay = () => {
    if (!player) {
      CustomAlert.show(
        language === 'en' ? 'Sign In Required' : 'Giriş Gerekli',
        language === 'en' ? 'Please create a profile to enter the tournament.' : 'Turnuvaya katılmak için profil oluşturmalısın.',
        [{ text: t('ok'), onPress: () => navigation.navigate('Profile') }]
      );
      return;
    }
    if (!tournamentData?.cards?.length) return;
    navigation.navigate('TournamentGame', { cards: tournamentData.cards, categoryId });
  };

  const handleWatchAd = () => {
    if (!player) return;
    setWatchingAd(true);
    showRewarded(
      (_reward) => {
        const socket = getSocket();
        if (socket) {
          socket.emit('grant_tournament_ad_attempt', { playerId: player.id, category: categoryId });
          CustomAlert.show(
            language === 'en' ? 'Congratulations!' : 'Tebrikler!',
            language === 'en' ? 'Watched ad to the end. +1 Attempt granted! 🎁' : 'Reklamı sonuna kadar izledin. +1 Hak kazandın! 🎁'
          );
        }
      },
      () => { setWatchingAd(false); },
      'tourney'
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
    if (tournamentData.blockedForWeek) return {
      text: language === 'en' ? '🏆 You completed this week! See you next week.' : '🏆 Bu haftayı tamamladın! Gelecek hafta görüşürüz.',
      color: NEON_GOLD, canPlay: false, showAd: false, bestScore: undefined
    };
    const remaining = 3 - tournamentData.attempts;
    if (remaining <= 0) {
      return {
        text: language === 'en'
          ? '❌ Your 3 daily attempts are used up. Watch an ad for +1 attempt!'
          : '❌ Bugünlük 3 hakkın da bitti. Reklam izleyerek +1 hak kazanabilirsin!',
        color: '#ff5555', canPlay: false, showAd: true, bestScore: undefined
      };
    }
    return {
      text: language === 'en' ? `Daily Attempts Left: ${remaining}/3` : `Kalan Günlük Hak: ${remaining}/3`,
      bestScore: tournamentData.myBestScore,
      color: NEON_GREEN, canPlay: true, showAd: false
    };
  };

  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  const status = getStatusInfo() as any;

  const ListHeader = () => (
    <View style={{ paddingHorizontal: 16 }}>

      {/* WEEK CARD */}
      <LinearGradient
        colors={['rgba(168,85,247,0.22)', 'rgba(50,10,110,0.10)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.weekCard}
      >
        <Text style={styles.weekLabel}>{t('thisWeek')}</Text>
        <Text style={styles.weekRange}>
          {tournamentData
            ? `${formatDate(tournamentData.startDate)}  –  ${formatDate(tournamentData.endDate, true)}`
            : '–'}
        </Text>
        <View style={styles.countdownRow}>
          <Ionicons name="time-outline" size={13} color={NEON_PURPLE} style={{ marginRight: 4 }} />
          <Text style={styles.countdown}>{getTimeRemaining()}</Text>
        </View>
      </LinearGradient>

      {/* MY SCORE CARD */}
      {player && tournamentData && tournamentData.attempts > 0 && (
        <LinearGradient
          colors={['rgba(255,215,0,0.20)', 'rgba(100,60,0,0.08)']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.myScoreCard}
        >
          <View style={styles.myScoreRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.myScoreLabel}>{t('yourScore')}</Text>
              <Text style={styles.myScoreValue}>
                {tournamentData.myBestScore}
                <Text style={styles.myScoreUnit}> {t('points').toLowerCase()}</Text>
              </Text>
              <Text style={styles.myCorrectText}>{tournamentData.myCorrectCount}/20 {t('correctAnswers')}</Text>
            </View>
            <View style={styles.rankBadge}>
              <Text style={styles.rankEmoji}>{getRankEmoji(tournamentData.myRank)}</Text>
              <Text style={styles.rankLabel}>{language === 'en' ? 'RANK' : 'SIRA'}</Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {/* STATUS / ACTION CARD */}
      {status && (
        <View style={[styles.actionCard, { borderColor: `${status.color}40` }]}>
          <View style={styles.attemptsRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.attemptsText, { color: status.color }]}>{status.text}</Text>
              {status.bestScore !== undefined && (
                <Text style={styles.bestScoreText}>
                  {language === 'en' ? 'Best score' : 'En iyi skor'}:{' '}
                  <Text style={{ color: NEON_GOLD, fontFamily: 'Poppins_900Black', fontSize: 18 }}>{status.bestScore}</Text>
                </Text>
              )}
            </View>
          </View>

          {status.canPlay && (
            <TouchableOpacity onPress={handlePlay} activeOpacity={0.8} style={styles.playBtnWrap}>
              <LinearGradient
                colors={['#00FF88', '#00C060']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.playBtn}
              >
                <Text style={styles.playBtnText}>{t('startTournament')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {status.showAd && (
            <TouchableOpacity onPress={handleWatchAd} activeOpacity={0.82} style={[styles.playBtnWrap, { marginTop: 10 }]}>
              <LinearGradient
                colors={['#FFD700', '#E09000']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.playBtn}
              >
                <Ionicons name="play-circle" size={18} color="#1A0800" style={{ marginRight: 8 }} />
                <Text style={[styles.playBtnText, { color: '#1A0800' }]}>{t('watchAdForRight')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* LEADERBOARD TITLE */}
      <View style={styles.lbHeader}>
        <Ionicons name="podium-sharp" size={13} color={NEON_BLUE} style={{ marginRight: 6 }} />
        <Text style={styles.sectionTitle}>{t('weeklyLeaderboard')}</Text>
      </View>
    </View>
  );

  return (
    <ImageBackground source={(THEMES as any)[categoryId] || THEMES.football} style={styles.bg}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>

        {/* HEADER */}
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <LinearGradient
              colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.03)']}
              style={styles.backBtnGrad}
            >
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t('weeklyTournamentTitle')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={NEON_GREEN} />
            <Text style={styles.loadingText}>{t('loading')}</Text>
          </View>
        ) : loadError ? (
          <View style={styles.centered}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
            <Text style={[styles.loadingText, { color: '#ff6666', textAlign: 'center' }]}>
              {language === 'en'
                ? 'Could not connect to server.\nCheck your internet connection.'
                : 'Sunucuya bağlanılamadı.\nİnternet bağlantını kontrol et.'}
            </Text>
            <TouchableOpacity
              style={{ marginTop: 20, borderRadius: 12, overflow: 'hidden' }}
              onPress={() => {
                setLoading(true); setLoadError(false);
                isLoadingRef.current = true; startLoadTimeout(); emitFetch();
              }}
            >
              <LinearGradient colors={[NEON_GREEN, '#009944']} style={{ paddingHorizontal: 32, paddingVertical: 14 }}>
                <Text style={{ color: '#000', fontFamily: 'Poppins_700Bold', fontSize: 15 }}>{t('retry')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={leaderboard}
            keyExtractor={(item) => item.playerId}
            ListHeaderComponent={<ListHeader />}
            renderItem={({ item, index }) => {
              const isMe = item.playerId === player?.id;
              const top3Colors = ['#FFD700', '#C0C0C0', '#CD7F32'];
              const isTop3 = index < 3;
              return (
                <View style={[styles.lbRow, isMe && styles.lbRowMe, { marginHorizontal: 16 }]}>
                  <View style={[styles.lbRankBadge, isTop3 && { backgroundColor: `${top3Colors[index]}20` }]}>
                    <Text style={[styles.lbRankText, isTop3 && { color: top3Colors[index], fontSize: 16 }]}>
                      {isTop3 ? getRankEmoji(item.rank) : item.rank}
                    </Text>
                  </View>
                  <UserAvatar avatar={item.avatar} size={38} />
                  <View style={styles.lbInfo}>
                    <Text style={styles.lbUsername} numberOfLines={1}>{item.username}{item.completedPerfectly ? ' 🏆' : ''}</Text>
                    <Text style={styles.lbSub}>{item.correctCount}/20 {t('correctAnswers')}</Text>
                  </View>
                  <View style={styles.lbScoreWrap}>
                    <Text style={styles.lbScore}>{item.score}</Text>
                    <Text style={styles.lbScoreUnit}>{t('points').toLowerCase()}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyBoard}>
                <Text style={styles.emptyText}>{t('noOnePlayedYet')}</Text>
              </View>
            )}
            ListFooterComponent={<View style={{ height: 24 }} />}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BannerAdComponent />
      </SafeAreaView>

      {watchingAd && (
        <View style={styles.adOverlay}>
          <ActivityIndicator size="large" color={NEON_GOLD} />
          <Text style={styles.adText}>📺 {language === 'en' ? 'Loading Ad...' : 'Reklam Yükleniyor...'}</Text>
          <Text style={styles.adSub}>
            {language === 'en'
              ? 'Please do not close. +1 attempt will be rewarded.'
              : 'Lütfen kapatmayın. +1 hak verilecektir.'}
          </Text>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,5,20,0.92)' },
  container: { flex: 1 },
  centered:  { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { color: NEON_GREEN, marginTop: 12, fontFamily: 'Poppins_400Regular', fontSize: 14 },

  // HEADER
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 40, height: 40 },
  backBtnGrad: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerEmoji:  { fontSize: 22 },
  headerTitle:  {
    color: NEON_GOLD, fontSize: 19, fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textShadowColor: 'rgba(255,215,0,0.45)', textShadowRadius: 12,
  },

  // WEEK CARD
  weekCard: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(168,85,247,0.45)',
    padding: 20, alignItems: 'center',
    marginBottom: 12, marginTop: 8,
  },
  weekLabel: {
    color: NEON_PURPLE, fontSize: 10, fontFamily: 'Poppins_700Bold',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8,
  },
  weekRange: {
    color: '#fff', fontSize: 26, fontFamily: 'Poppins_900Black', letterSpacing: 0.5,
    marginBottom: 8,
  },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  countdown: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontFamily: 'Poppins_400Regular' },

  // MY SCORE CARD
  myScoreCard: {
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
    padding: 18, marginBottom: 12,
  },
  myScoreRow:   { flexDirection: 'row', alignItems: 'center' },
  myScoreLabel: {
    color: NEON_GOLD, fontSize: 10, fontFamily: 'Poppins_700Bold',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4,
  },
  myScoreValue: { color: '#fff', fontSize: 30, fontFamily: 'Poppins_900Black' },
  myScoreUnit:  { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontFamily: 'Poppins_400Regular' },
  myCorrectText:{ color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Poppins_400Regular', marginTop: 2 },
  rankBadge:    { alignItems: 'center', paddingLeft: 16 },
  rankEmoji:    { fontSize: 38 },
  rankLabel:    { color: NEON_GOLD, fontSize: 9, fontFamily: 'Poppins_700Bold', letterSpacing: 2, marginTop: 4 },

  // ACTION CARD
  actionCard: {
    borderRadius: 18, borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16, marginBottom: 20,
  },
  attemptsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  attemptsEmoji: { fontSize: 22, marginTop: 1 },
  attemptsText:  { fontFamily: 'Poppins_700Bold', fontSize: 16, lineHeight: 22 },
  bestScoreText: { color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins_500Medium', fontSize: 14, marginTop: 6 },
  playBtnWrap:   { marginTop: 16, borderRadius: 16, overflow: 'hidden' },
  playBtn:       {
    flexDirection: 'row', paddingVertical: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnText:   { color: '#001A0D', fontSize: 17, fontFamily: 'Poppins_900Black', letterSpacing: 2 },

  // LEADERBOARD
  lbHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, paddingHorizontal: 2,
  },
  sectionTitle: {
    color: NEON_BLUE, fontSize: 11, fontFamily: 'Poppins_700Bold',
    letterSpacing: 3, textTransform: 'uppercase',
  },
  lbRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12,
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  lbRowMe: {
    borderColor: `${NEON_GREEN}50`,
    backgroundColor: 'rgba(0,255,136,0.07)',
  },
  lbRankBadge: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  lbRankText: {
    fontSize: 13, fontFamily: 'Poppins_700Bold',
    color: 'rgba(255,255,255,0.45)', textAlign: 'center',
  },
  lbInfo:     { flex: 1, marginLeft: 2 },
  lbUsername: { color: '#fff', fontSize: 14, fontFamily: 'Poppins_600SemiBold' },
  lbSub:      { color: 'rgba(255,255,255,0.38)', fontSize: 11, fontFamily: 'Poppins_400Regular', marginTop: 1 },
  lbScoreWrap:  { alignItems: 'flex-end' },
  lbScore:    { color: NEON_GOLD, fontSize: 18, fontFamily: 'Poppins_900Black' },
  lbScoreUnit:{ color: 'rgba(255,215,0,0.45)', fontSize: 10, fontFamily: 'Poppins_400Regular' },

  emptyBoard: { paddingVertical: 36, alignItems: 'center', paddingHorizontal: 16 },
  emptyText:  { color: 'rgba(255,255,255,0.32)', fontFamily: 'Poppins_400Regular', fontSize: 14, textAlign: 'center', marginTop: 8 },

  // AD OVERLAY
  adOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center', alignItems: 'center', zIndex: 9999,
  },
  adText: { color: NEON_GOLD, fontSize: 17, fontFamily: 'Poppins_700Bold', marginTop: 16 },
  adSub:  {
    color: 'rgba(255,255,255,0.4)', fontSize: 12, fontFamily: 'Poppins_400Regular',
    marginTop: 6, textAlign: 'center', paddingHorizontal: 30,
  },
});
