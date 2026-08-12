import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ImageBackground,
  SafeAreaView, FlatList, ActivityIndicator, ScrollView, useWindowDimensions, StatusBar, Platform
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { getLeagueForKp, LEAGUES } from '../utils/LeagueHelper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar } from '../components/BottomNavBar';
import { LeagueBadge } from '../components/LeagueBadge';
import { Analytics } from '../services/analytics';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Leaderboard'>;

interface LeaderboardItem {
  id: string;
  username: string;
  avatar: string;
  kp: number;
  displayKp: number;
  categoryKp?: { football: number; cinema: number; music: number };
  matches_won: number;
  matches_played: number;
}

const CATEGORIES = [
  { id: 'football', label: 'FUTBOL',  icon: 'football',       color: '#39ff14', bg: require('../../assets/images/football_bg.jpg') },
  { id: 'cinema',   label: 'SİNEMA',  icon: 'videocam',        color: '#b026ff', bg: require('../../assets/images/cinema_bg.jpg')   },
  { id: 'music',    label: 'MÜZİK',   icon: 'musical-notes',   color: '#ff1493', bg: require('../../assets/images/music_bg.jpg')    },
];

export default function LeaderboardScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Leaderboard'>>();
  const insets = useSafeAreaInsets();
  const initialCategory = (route.params as any)?.categoryId || 'football';

  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState('Tümü');

  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 12;

  const currentCat = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];
  const NEON = currentCat.color;

  const fetchLeaderboard = useCallback((category: string) => {
    setLoading(true);
    const socket = getSocket();
    socket.emit('get_leaderboard', { category });

    const handleData = (res: any) => {
      if (res && res.leaderboard) {
        const formatted = res.leaderboard.map((item: any) => {
          let catKp = item.kp || 0;
          if (item.categoryKp && item.categoryKp[category] !== undefined) {
            catKp = item.categoryKp[category];
          }
          return {
            ...item,
            displayKp: catKp
          };
        });
        formatted.sort((a: any, b: any) => b.displayKp - a.displayKp);
        setLeaderboard(formatted);
      }
      setLoading(false);
    };

    socket.once('leaderboard_data', handleData);

    setTimeout(() => {
      setLoading(false);
    }, 5000);
  }, []);

  useEffect(() => {
    Analytics.logEvent('view_leaderboard', { category: activeCategory });
    const socket = getSocket();
    
    socket.on('leaderboard_data', (res: any) => {
      if (res && res.leaderboard) {
        const formatted = res.leaderboard.map((item: any) => {
          let catKp = item.kp || 0;
          if (item.categoryKp && item.categoryKp[activeCategory] !== undefined) {
            catKp = item.categoryKp[activeCategory];
          }
          return {
            ...item,
            displayKp: catKp
          };
        });
        formatted.sort((a: any, b: any) => b.displayKp - a.displayKp);
        setLeaderboard(formatted);
      }
      setLoading(false);
    });

    if (socket.connected) {
      fetchLeaderboard(activeCategory);
    } else {
      socket.once('connect', () => fetchLeaderboard(activeCategory));
      socket.connect();
    }

    return () => {
      socket.off('leaderboard_data');
    };
  }, []);

  const handleCategoryChange = (catId: string) => {
    setActiveCategory(catId);
    setSelectedLeague('Tümü');
    fetchLeaderboard(catId);
  };

  const filteredLeaderboard = selectedLeague === 'Tümü'
    ? leaderboard
    : leaderboard.filter(item => getLeagueForKp(item.displayKp ?? item.kp).name === selectedLeague);

  // Active Selected League Info for top-right banner placement
  const activeLeagueObj = selectedLeague !== 'Tümü' 
    ? LEAGUES.find(l => l.name === selectedLeague) 
    : null;
  const activeLeagueForBadge = activeLeagueObj 
    ? getLeagueForKp(activeLeagueObj.minKp) 
    : LEAGUES[LEAGUES.length - 1]; // Champions League badge as default for 'Tümü'

  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const kpToShow = item.displayKp ?? item.kp;
    const league = getLeagueForKp(kpToShow);
    const isTopThree = index < 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

    return (
      <View style={[
        styles.leaderboardItem,
        { borderColor: isTopThree ? rankColors[index] : `${NEON}25` },
        isTopThree && { backgroundColor: `${rankColors[index]}10` }
      ]}>
        <View style={styles.itemLeft}>
          <View style={styles.rankBadgeWrapper}>
            {isTopThree ? (
              <View style={[styles.rankPillTop3, { borderColor: rankColors[index], backgroundColor: `${rankColors[index]}20` }]}>
                <Ionicons name="trophy-sharp" size={12} color={rankColors[index]} style={{ marginRight: 3 }} />
                <Text style={[styles.rankPillText, { color: rankColors[index] }]}>#{index + 1}</Text>
              </View>
            ) : (
              <Text style={[styles.rankNumber, { color: NEON }]}>#{index + 1}</Text>
            )}
          </View>

          {/* Clean User & League Name (No User Avatar to keep list clean) */}
          <View style={styles.playerInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={[styles.leagueLabel, { color: league.color }]}>
              {league.name}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={[styles.kpText, { color: NEON }]}>{kpToShow} KP</Text>
          <Text style={styles.wonMatchesText}>{item.matches_won} Galibiyet</Text>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground source={currentCat.bg} style={styles.bgImage}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]} />
      <SafeAreaView style={styles.container}>

        {/* HEADER */}
        <View style={[styles.headerRow, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: NEON, textShadowColor: NEON }]}>
            LİG SIRALAMALARI
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* CATEGORY TABS */}
        <View style={styles.categoryTabs}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.catTab,
                { borderColor: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.15)' },
                activeCategory === cat.id && { backgroundColor: `${cat.color}20` }
              ]}
              onPress={() => handleCategoryChange(cat.id)}
              activeOpacity={0.8}
            >
              <Ionicons name={cat.icon as any} size={16} color={activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.5)'} />
              <Text style={[styles.catTabText, { color: activeCategory === cat.id ? cat.color : 'rgba(255,255,255,0.5)' }]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* LEAGUE FILTER */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leagueFilterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
          {LEAGUES.map(lg => (
            <TouchableOpacity
              key={lg.name}
              style={[
                styles.leagueFilterBtn,
                { borderColor: selectedLeague === lg.name ? lg.color : 'rgba(255,255,255,0.15)' },
                selectedLeague === lg.name && { backgroundColor: `${lg.color}25` }
              ]}
              onPress={() => setSelectedLeague(selectedLeague === lg.name ? 'Tümü' : lg.name)}
            >
              <Ionicons name={lg.vectorIcon as any} size={15} color={lg.color} style={{ marginRight: 6 }} />
              <Text style={[styles.leagueFilterText, { color: selectedLeague === lg.name ? lg.color : 'rgba(255,255,255,0.7)' }]}>
                {lg.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* TOP LEAGUE BANNER CARD WITH TOP-RIGHT LEAGUE EMBLEM */}
        <View style={[styles.leagueBannerCard, { borderColor: `${NEON}45` }]}>
          <View style={styles.leagueBannerLeft}>
            <Text style={[styles.leagueBannerCat, { color: NEON }]}>
              {currentCat.label} LİGİ
            </Text>
            <Text style={styles.leagueBannerTitle}>
              {selectedLeague === 'Tümü' ? 'Tüm Sıralamalar' : selectedLeague}
            </Text>
            <Text style={styles.leagueBannerSub}>
              {filteredLeaderboard.length} Oyuncu Listeleniyor
            </Text>
          </View>

          {/* Top-Right Prominent League Image Badge */}
          <View style={styles.leagueBannerRight}>
            <LeagueBadge 
              league={activeLeagueForBadge} 
              categoryId={activeCategory} 
              size="large" 
            />
          </View>
        </View>

        {/* LEADERBOARD LIST */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={NEON} />
            <Text style={[styles.loadingText, { color: NEON }]}>Yükleniyor...</Text>
          </View>
        ) : filteredLeaderboard.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="trophy-outline" size={60} color={`${NEON}50`} />
            <Text style={[styles.emptyText, { color: `${NEON}80` }]}>Henüz sıralama yok</Text>
            <Text style={styles.emptySubText}>Bu kategoride düello oyna ve ilk sıraya gir!</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLeaderboard}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        <BottomNavBar activeTab="leaderboard" navigation={navigation} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject },
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  categoryTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  catTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  catTabText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  leagueFilterScroll: {
    maxHeight: 44,
    marginBottom: 10,
  },
  leagueFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: 'rgba(5, 11, 20, 0.75)',
  },
  leagueFilterText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 11,
  },

  // League Header Banner Card with Top-Right Emblem Position
  leagueBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: 'rgba(5, 11, 20, 0.85)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  leagueBannerLeft: {
    flex: 1,
    justifyContent: 'center',
  },
  leagueBannerCat: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 1.5,
  },
  leagueBannerTitle: {
    color: '#FFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 18,
    marginTop: 2,
  },
  leagueBannerSub: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 2,
  },
  leagueBannerRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rankBadgeWrapper: { width: 42, alignItems: 'flex-start', justifyContent: 'center', marginRight: 6 },
  rankPillTop3: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  rankPillText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 11,
  },
  rankNumber: { fontSize: 13, fontFamily: 'Poppins_900Black', width: 34, textAlign: 'center' },
  playerInfo: { flex: 1, marginLeft: 6 },
  username: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  leagueLabel: { fontFamily: 'Poppins_600SemiBold', fontSize: 11, marginTop: 2 },
  itemRight: { alignItems: 'flex-end' },
  kpText: { fontFamily: 'Poppins_900Black', fontSize: 15 },
  wonMatchesText: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins_400Regular', fontSize: 11, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: 'Poppins_700Bold', fontSize: 14 },
  emptyText: { fontFamily: 'Poppins_700Bold', fontSize: 18, marginTop: 8 },
  emptySubText: { color: 'rgba(255,255,255,0.4)', fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', paddingHorizontal: 30 },
});
