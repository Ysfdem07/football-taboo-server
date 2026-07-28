import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';

type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;
type ResultScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Result'>;

type Props = {
  route: ResultScreenRouteProp;
  navigation: ResultScreenNavigationProp;
};

export default function ResultScreen({ route, navigation }: Props) {
  const { teamAScore, teamBScore, teamA, teamB } = route.params;

  let winner = '';
  if (teamAScore > teamBScore) winner = teamA;
  else if (teamBScore > teamAScore) winner = teamB;
  else winner = 'Berabere!';

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <View style={styles.container}>
      <Text style={styles.header}>OYUN BİTTİ</Text>
      
      <View style={styles.card}>
        <Text style={styles.winnerText}>
          {winner === 'Berabere!' ? 'Maç Berabere!' : `KAZANAN:\n${winner}`}
        </Text>
        
        <View style={styles.divider} />
        
        <View style={styles.scoreRow}>
          <Text style={styles.teamText}>{teamA}</Text>
          <Text style={styles.scoreText}>{teamAScore}</Text>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.teamText}>{teamB}</Text>
          <Text style={styles.scoreText}>{teamBScore}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.buttonText}>ANA MENÜYE DÖN</Text>
      </TouchableOpacity>
    </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 40,
    fontFamily: 'Poppins_900Black',
    color: Colors.white,
    marginBottom: 40,
  },
  card: {
    backgroundColor: Colors.cardBackground,
    width: '100%',
    borderRadius: 20,
    padding: 30,
    marginBottom: 40,
    alignItems: 'center',
  },
  winnerText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    width: '100%',
    marginVertical: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  teamText: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontFamily: 'Poppins_600SemiBold',
  },
  scoreText: {
    fontSize: 24,
    color: Colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 12,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
});
