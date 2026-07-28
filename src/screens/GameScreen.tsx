import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getWords, Word } from '../utils/WordSync';
import { showInterstitial } from '../services/ads';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

type Props = {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
};

export default function GameScreen({ route, navigation }: Props) {
  const { timeLimit, winScore, teamA, teamB } = route.params;

  const [currentTeam, setCurrentTeam] = useState<'A' | 'B'>('A');
  const [teamAScore, setTeamAScore] = useState(0);
  const [teamBScore, setTeamBScore] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [availableWords, setAvailableWords] = useState<Word[]>([]);
  const [currentCard, setCurrentCard] = useState<Word | null>(null);
  const [displayedForbiddenWords, setDisplayedForbiddenWords] = useState<string[]>([]);

  // We use ref to store the interval ID
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load words from local storage / fallback words.json
  useEffect(() => {
    const loadWords = async () => {
      const words = await getWords();
      setAllWords(words);
      setAvailableWords(words);
    };
    loadWords();
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current as NodeJS.Timeout);
          endRound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRound = () => {
    setIsPlaying(true);
    setIsPaused(false);
    setTimeLeft(timeLimit);
    drawNextCard();
    startTimer();
  };

  const handlePause = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
    startTimer();
  };

  const handleEndGame = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    showInterstitial();
    navigation.replace('Result', { teamAScore, teamBScore, teamA, teamB });
  };

  const endRound = () => {
    setIsPlaying(false);
    
    // Check win condition
    if (teamAScore >= winScore || teamBScore >= winScore) {
      showInterstitial();
      navigation.replace('Result', { teamAScore, teamBScore, teamA, teamB });
      return;
    }
    
    // Switch turn
    setCurrentTeam(prev => prev === 'A' ? 'B' : 'A');
  };

  const drawNextCard = () => {
    // If we've run out of words, reload
    const wordsToUse = availableWords.length > 0 ? availableWords : (allWords.length > 0 ? allWords : []);
    if (wordsToUse.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * wordsToUse.length);
    const selectedCard = wordsToUse[randomIndex];
    console.log("DRAWN CARD DEBUG:", JSON.stringify(selectedCard));
    
    // Remove selected card from available
    const newWords = [...wordsToUse];
    newWords.splice(randomIndex, 1);
    setAvailableWords(newWords);
    
    setCurrentCard(selectedCard);

    // Shuffler and picker for 5 random forbidden words
    if (selectedCard && selectedCard.forbidden) {
      const shuffled = [...selectedCard.forbidden].sort(() => 0.5 - Math.random());
      setDisplayedForbiddenWords(shuffled.slice(0, 5));
    } else {
      setDisplayedForbiddenWords([]);
    }
  };

  const handleCorrect = () => {
    if (currentTeam === 'A') setTeamAScore(prev => prev + 1);
    else setTeamBScore(prev => prev + 1);
    drawNextCard();
  };

  const handleTaboo = () => {
    if (currentTeam === 'A') setTeamAScore(prev => prev - 1);
    else setTeamBScore(prev => prev - 1);
    drawNextCard();
  };

  const handlePass = () => {
    drawNextCard();
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isPlaying) {
    return (
      <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home" size={28} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.readyText}>Sıra: {currentTeam === 'A' ? teamA : teamB}</Text>
          <View style={styles.scoreBoard}>
            <Text style={styles.scoreText}>{teamA}: {teamAScore}</Text>
            <Text style={styles.scoreText}>{teamB}: {teamBScore}</Text>
          </View>
          <TouchableOpacity style={styles.startRoundBtn} onPress={startRound}>
            <Text style={styles.startRoundText}>TURU BAŞLAT</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
      {!isPaused && (
        <View style={styles.topActionBar}>
          <TouchableOpacity onPress={handlePause} style={styles.topActionBtn}>
            <Ionicons name="pause" size={24} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEndGame} style={styles.topActionBtn}>
            <Ionicons name="stop" size={24} color={Colors.danger} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.teamName, currentTeam === 'A' && styles.activeTeam]}>{teamA}</Text>
          <Text style={styles.score}>{teamAScore}</Text>
        </View>
        <View style={styles.timerContainer}>
          <Text style={[styles.timer, timeLeft <= 10 && styles.timerDanger]}>{timeLeft}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.teamName, currentTeam === 'B' && styles.activeTeam]}>{teamB}</Text>
          <Text style={styles.score}>{teamBScore}</Text>
        </View>
      </View>

      {isPaused ? (
        <View style={styles.pausedContainer}>
          <Text style={styles.pausedText}>MOLA</Text>
          <TouchableOpacity style={styles.startRoundBtn} onPress={handleResume}>
            <Text style={styles.startRoundText}>DEVAM ET</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.startRoundBtn, { backgroundColor: Colors.danger, marginTop: 20 }]} onPress={handleEndGame}>
            <Text style={styles.startRoundText}>OYUNU BİTİR</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {currentCard && (
            <View style={styles.card}>
              <Text style={styles.mainWord}>{currentCard.word}</Text>
              <View style={styles.divider} />
              {displayedForbiddenWords.map((word: string, index: number) => (
                <Text key={index} style={styles.forbiddenWord}>{word}</Text>
              ))}
            </View>
          )}

          <View style={styles.controls}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.danger }]} onPress={handleTaboo}>
              <Text style={styles.actionText}>TABU (-1)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.warning }]} onPress={handlePass}>
              <Text style={styles.actionText}>PAS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.success }]} onPress={handleCorrect}>
              <Text style={styles.actionText}>DOĞRU (+1)</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // semi-transparent background to let image show through
  },
  homeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
  },
  readyText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: '40%',
    marginBottom: 30,
  },
  scoreBoard: {
    backgroundColor: Colors.cardBackground,
    marginHorizontal: 40,
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
  },
  scoreText: {
    fontSize: 24,
    color: Colors.white,
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_700Bold',
  },
  startRoundBtn: {
    backgroundColor: Colors.primary,
    marginHorizontal: 60,
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
  },
  startRoundText: {
    color: Colors.white,
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
  },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  topActionBtn: {
    padding: 10,
  },
  pausedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 40,
  },
  pausedText: {
    fontSize: 36,
    color: Colors.warning,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    flex: 1,
  },
  teamName: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 5,
  },
  activeTeam: {
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
  },
  score: {
    color: Colors.white,
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
  },
  timerContainer: {
    backgroundColor: Colors.cardBackground,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  timer: {
    color: Colors.primary,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  timerDanger: {
    color: Colors.danger,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 30,
    marginTop: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  mainWord: {
    fontSize: 32,
    fontFamily: 'Poppins_900Black',
    color: Colors.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    marginBottom: 15,
  },
  forbiddenWord: {
    fontSize: 20,
    color: '#FFD700', // Yellow
    marginVertical: 8,
    fontFamily: 'Poppins_600SemiBold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 10,
  },
  actionBtn: {
    width: width * 0.28,
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    color: Colors.white,
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
});
