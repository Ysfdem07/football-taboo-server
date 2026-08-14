import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

type Props = {
  route: ResultScreenRouteProp;
  navigation: ResultScreenNavigationProp;
};

const NEON_GREEN = '#00FF88';
const NEON_CYAN = '#00E5FF';
const NEON_GOLD = '#FFD700';

export default function ResultScreen({ route, navigation }: Props) {
  const { teamAScore, teamBScore, teamA, teamB } = route.params;

  let winner = '';
  let isTie = false;
  if (teamAScore > teamBScore) winner = teamA;
  else if (teamBScore > teamAScore) winner = teamB;
  else {
    winner = 'Berabere!';
    isTie = true;
  }

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <View style={styles.cyberOverlay} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          
          {/* HEADER ICON */}
          <View style={styles.iconContainer}>
            <Ionicons 
              name={isTie ? "git-compare-outline" : "trophy"} 
              size={64} 
              color={isTie ? NEON_CYAN : NEON_GOLD} 
            />
          </View>
          
          <Text style={styles.header}>MAÇ SONUCU</Text>
          
          {/* GLASSMORPHIC CARD */}
          <View style={styles.glassCard}>
            
            <View style={styles.winnerSection}>
              <Text style={styles.winnerLabel}>
                {isTie ? 'SONUÇ' : '🏆 KAZANAN 🏆'}
              </Text>
              <Text style={[styles.winnerText, isTie && { color: NEON_CYAN }]}>
                {winner}
              </Text>
            </View>
            
            <View style={styles.divider} />
            
            {/* SCORE ROWS */}
            <View style={styles.scoreRow}>
              <Text style={styles.teamText} numberOfLines={1} adjustsFontSizeToFit>{teamA}</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{teamAScore}</Text>
              </View>
            </View>
            
            <View style={styles.scoreRow}>
              <Text style={styles.teamText} numberOfLines={1} adjustsFontSizeToFit>{teamB}</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.scoreText}>{teamBScore}</Text>
              </View>
            </View>
            
          </View>

          {/* ACTION BUTTON */}
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Ionicons name="home-outline" size={20} color={NEON_GREEN} style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>ANA MENÜYE DÖN</Text>
          </TouchableOpacity>
          
        </View>
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
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
    shadowColor: NEON_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  header: {
    fontSize: 28,
    fontFamily: 'Poppins_900Black',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 30,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  glassCard: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    width: '100%',
    borderRadius: 24,
    padding: 30,
    marginBottom: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  winnerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  winnerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    marginBottom: 5,
  },
  winnerText: {
    fontSize: 34,
    fontFamily: 'Poppins_900Black',
    color: NEON_GOLD,
    textAlign: 'center',
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '100%',
    marginBottom: 25,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  teamText: {
    flex: 1,
    fontSize: 20,
    color: '#E0E0E0',
    fontFamily: 'Poppins_600SemiBold',
    marginRight: 15,
  },
  scoreBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 70,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  actionButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
});
