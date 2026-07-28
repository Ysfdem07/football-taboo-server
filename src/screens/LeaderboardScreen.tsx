import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, FlatList, ActivityIndicator, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket } from '../services/socket';
import { getLeagueForKp, LEAGUES } from '../utils/LeagueHelper';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '../services/analytics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Leaderboard'>;
};

interface LeaderboardItem {
  id: string;
  username: string;
  avatar: string;
  kp: number;
  matches_won: number;
  matches_played: number;
}

export default function LeaderboardScreen({ navigation }: Props) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);

  const filteredLeaderboard = selectedLeague 
    ? leaderboard.filter(item => getLeagueForKp(item.kp).name === selectedLeague)
    : leaderboard;

  const socket = getSocket();

  useEffect(() => {
    Analytics.logScreenView('Leaderboard');
    const emitLeaderboard = () => {
      socket.emit('get_leaderboard');
    };

    socket.on('leaderboard_data', (res: any) => {
      setLeaderboard(res.leaderboard || []);
      setLoading(false);
    });

    if (socket.connected) {
      emitLeaderboard();
    } else {
      socket.once('connect', emitLeaderboard);
      socket.connect();
    }

    return () => {
      socket.off('connect', emitLeaderboard);
      socket.off('leaderboard_data');
    };
  }, []);

  const renderItem = ({ item, index }: { item: LeaderboardItem; index: number }) => {
    const league = getLeagueForKp(item.kp);
    const isTopThree = index < 3;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze

    return (
      <View style={[styles.leaderboardItem, isTopThree && { borderColor: rankColors[index], borderWidth: 1 }]}>
        <View style={styles.itemLeft}>
          {/* Rank Number or Medal */}
          {isTopThree ? (
            <Text style={styles.medalIcon}>
              {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
            </Text>
          ) : (
            <Text style={styles.rankNumber}>{index + 1}</Text>
          )}
          
          <Text style={styles.avatarEmoji}>{item.avatar || '⚽'}</Text>
          <View style={styles.playerInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={[styles.leagueLabel, { color: league.color }]}>
              {league.icon} {league.name}
            </Text>
          </View>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.kpText}>{item.kp} KP</Text>
          <Text style={styles.wonMatchesText}>{item.matches_won} Galibiyet</Text>
        </View>
      </View>
    );
  };

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Lig Sıralamaları</Text>
        </View>

        {/* Horizontal League Selector */}
        <View style={styles.leagueSelectorContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.leagueScroll}>
            <TouchableOpacity 
              style={[styles.leagueTabCard, selectedLeague === null && styles.leagueTabCardActive, selectedLeague === null && { borderColor: Colors.primary }]}
              onPress={() => setSelectedLeague(null)}
            >
              <Text style={styles.leagueTabIcon}>🌍</Text>
              <Text style={styles.leagueTabName}>Genel</Text>
              <Text style={styles.leagueTabKp}>Tüm Ligler</Text>
            </TouchableOpacity>

            {LEAGUES.map((league) => (
              <TouchableOpacity 
                key={league.name}
                style={[
                  styles.leagueTabCard, 
                  selectedLeague === league.name && styles.leagueTabCardActive,
                  { borderColor: selectedLeague === league.name ? league.color : 'rgba(255,255,255,0.05)' }
                ]}
                onPress={() => setSelectedLeague(league.name)}
              >
                <Text style={styles.leagueTabIcon}>{league.icon}</Text>
                <Text style={[styles.leagueTabName, { color: league.color }]}>{league.name}</Text>
                <Text style={styles.leagueTabKp}>
                  {league.maxKp === Infinity ? `${league.minKp}+ KP` : `${league.minKp}-${league.maxKp} KP`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Sıralama Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredLeaderboard}
            keyExtractor={(item) => item.id || item.username}
            renderItem={renderItem}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={48} color={Colors.textSecondary} />
                <Text style={styles.emptyText}>
                  {selectedLeague ? `${selectedLeague} Liginde Oyuncu Yok` : 'Henüz kayıtlı oyuncu yok.'}
                </Text>
                <Text style={styles.emptySubtext}>
                  {selectedLeague 
                    ? 'Dereceli maçları kazanarak bu lige ilk yükselen oyuncu siz olun!' 
                    : 'Profil oluşturup dereceli maçlarda yarışan ilk oyuncu siz olun!'}
                </Text>
              </View>
            }
          />
        )}
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
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 20, 0.88)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginLeft: 15,
    textShadowColor: 'rgba(0,255,136,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#00FF88',
    marginTop: 10,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.15)',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medalIcon: {
    fontSize: 22,
    width: 30,
    textAlign: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textSecondary,
    width: 30,
    textAlign: 'center',
  },
  avatarEmoji: {
    fontSize: 28,
    marginHorizontal: 12,
  },
  playerInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    marginBottom: 2,
  },
  leagueLabel: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  kpText: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginBottom: 2,
  },
  wonMatchesText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 30,
    lineHeight: 18,
  },
  leagueSelectorContainer: {
    height: 125,
    marginVertical: 12,
  },
  leagueScroll: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  leagueTabCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,136,0.15)',
    minWidth: 120,
    height: 98,
  },
  leagueTabCardActive: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  leagueTabIcon: {
    fontSize: 30,
    marginBottom: 5,
    textShadowColor: 'rgba(255, 255, 255, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  leagueTabName: {
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  leagueTabKp: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
