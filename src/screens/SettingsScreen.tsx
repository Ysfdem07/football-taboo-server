import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ImageBackground, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { Analytics } from '../services/analytics';
import { RemoteConfig } from '../services/remoteConfig';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Settings'>;
};

export default function SettingsScreen({ navigation }: Props) {
  const [teamA, setTeamA] = useState('Takım A');
  const [teamB, setTeamB] = useState('Takım B');
  const [timeLimit, setTimeLimit] = useState(RemoteConfig.getGameTimeLimit());
  const [winScore, setWinScore] = useState(RemoteConfig.getGameWinScore());

  useEffect(() => {
    Analytics.logScreenView('Settings');
  }, []);

  const startGame = () => {
    Analytics.logEvent('offline_game_start', { timeLimit, winScore, teamA, teamB });
    navigation.navigate('Game', {
      timeLimit,
      winScore,
      teamA,
      teamB,
    });
  };

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <View style={styles.cyberOverlay} />
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>OYUN AYARLARI</Text>
      
      <View style={styles.card}>
        <Text style={styles.label}>1. Takım İsmi</Text>
        <TextInput 
          style={styles.input}
          value={teamA}
          onChangeText={setTeamA}
          placeholderTextColor={Colors.textSecondary}
        />

        <Text style={styles.label}>2. Takım İsmi</Text>
        <TextInput 
          style={styles.input}
          value={teamB}
          onChangeText={setTeamB}
          placeholderTextColor={Colors.textSecondary}
        />
        
        <Text style={styles.label}>Süre (Saniye): {timeLimit}</Text>
        <View style={styles.row}>
          {[60, 90, 120].map(t => (
            <TouchableOpacity 
              key={t}
              style={[styles.optionBtn, timeLimit === t && styles.optionBtnActive]}
              onPress={() => setTimeLimit(t)}
            >
              <Text style={styles.optionText}>{t}s</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Kazanma Puanı: {winScore}</Text>
        <View style={styles.row}>
          {[30, 50, 100].map(s => (
            <TouchableOpacity 
              key={s}
              style={[styles.optionBtn, winScore === s && styles.optionBtnActive]}
              onPress={() => setWinScore(s)}
            >
              <Text style={styles.optionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>OYUNA BAŞLA</Text>
      </TouchableOpacity>
      </SafeAreaView>
    </ImageBackground>
  );
}

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';

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
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: NEON_GREEN,
    textAlign: 'center',
    marginBottom: 28,
    textShadowColor: 'rgba(0,255,136,0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  card: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginBottom: 8,
    marginTop: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  optionBtn: {
    flex: 1,
    backgroundColor: 'rgba(0,191,255,0.07)',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
  },
  optionBtnActive: {
    backgroundColor: 'rgba(0,255,136,0.2)',
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  optionText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
  },
  startButton: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 14,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 1,
  },
});
