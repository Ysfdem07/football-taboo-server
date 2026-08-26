import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getWords, Word } from '../utils/WordSync';
import { showInterstitial } from '../services/ads';
import { useLanguage } from '../context/LanguageContext';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

type Props = {
  route: GameScreenRouteProp;
  navigation: GameScreenNavigationProp;
};

export default function GameScreen({ route, navigation }: Props) {
  const { timeLimit, winScore, teamA, teamB } = route.params;
  const { language } = useLanguage();

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
        <View style={styles.cyberOverlay} />
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={styles.homeButton} onPress={() => navigation.navigate('Home')}>
            <Ionicons name="home" size={28} color={'#00FF88'} />
          </TouchableOpacity>
          
          <View style={styles.glassCardMenu}>
            <Text style={styles.readyText}>{language === 'en' ? 'Turn: ' : 'Sıra: '}{currentTeam === 'A' ? teamA : teamB}</Text>
            <View style={styles.scoreBoard}>
              <Text style={styles.scoreText}>{teamA}: {teamAScore}</Text>
              <Text style={styles.scoreText}>{teamB}: {teamBScore}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.startRoundBtn} onPress={startRound}>
            <Text style={styles.startRoundText}>{language === 'en' ? 'START ROUND' : 'TURU BAŞLAT'}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <View style={styles.cyberOverlay} />
      <SafeAreaView style={styles.container}>
      {!isPaused && (
        <View style={styles.topActionBar}>
          <TouchableOpacity onPress={handlePause} style={styles.topActionBtn}>
            <Ionicons name="pause" size={28} color={'#00E5FF'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleEndGame} style={styles.topActionBtn}>
            <Ionicons name="stop" size={28} color={'#FF0055'} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.scoreContainer}>
          <Text style={[styles.teamName, currentTeam === 'A' && styles.activeTeam]}>{teamA}</Text>
          <Text style={styles.score}>{teamAScore}</Text>
        </View>
        <View style={[styles.timerContainer, timeLeft <= 10 && styles.timerContainerDanger]}>
          <Text style={[styles.timer, timeLeft <= 10 && styles.timerDanger]}>{timeLeft}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={[styles.teamName, currentTeam === 'B' && styles.activeTeam]}>{teamB}</Text>
          <Text style={styles.score}>{teamBScore}</Text>
        </View>
      </View>

      {isPaused ? (
        <View style={styles.pausedContainer}>
          <View style={styles.glassCardMenu}>
            <Text style={styles.pausedText}>{language === 'en' ? 'PAUSED' : 'MOLA'}</Text>
            <TouchableOpacity style={styles.startRoundBtn} onPress={handleResume}>
              <Text style={styles.startRoundText}>{language === 'en' ? 'RESUME' : 'DEVAM ET'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.startRoundBtn, styles.endGameBtn]} onPress={handleEndGame}>
              <Text style={[styles.startRoundText, { color: '#FFF' }]}>{language === 'en' ? 'END GAME' : 'OYUNU BİTİR'}</Text>
            </TouchableOpacity>
          </View>
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
            <TouchableOpacity style={[styles.actionBtn, styles.btnTaboo]} onPress={handleTaboo}>
              <Text style={styles.actionText}>{language === 'en' ? 'TABOO (-1)' : 'TABU (-1)'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnPass]} onPress={handlePass}>
              <Text style={[styles.actionText, { color: '#000' }]}>{language === 'en' ? 'PASS' : 'PAS'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.btnCorrect]} onPress={handleCorrect}>
              <Text style={[styles.actionText, { color: '#000' }]}>{language === 'en' ? 'CORRECT (+1)' : 'DOĞRU (+1)'}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </SafeAreaView>
    </ImageBackground>
  );
}

const { width } = Dimensions.get('window');

const NEON_GREEN = '#00FF88';
const NEON_CYAN = '#00E5FF';
const NEON_GOLD = '#FFD700';
const NEON_RED = '#FF0055';

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cyberOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 8, 20, 0.90)',
  },
  container: {
    flex: 1,
  },
  homeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    padding: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.3)',
  },
  glassCardMenu: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    marginHorizontal: 30,
    marginTop: '30%',
    marginBottom: 40,
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  readyText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: NEON_CYAN,
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0,229,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scoreBoard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  scoreText: {
    fontSize: 24,
    color: Colors.white,
    textAlign: 'center',
    marginVertical: 10,
    fontFamily: 'Poppins_700Bold',
  },
  startRoundBtn: {
    backgroundColor: NEON_GREEN,
    marginHorizontal: 60,
    padding: 20,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  endGameBtn: {
    backgroundColor: NEON_RED,
    marginTop: 20,
    shadowColor: NEON_RED,
  },
  startRoundText: {
    color: '#000',
    fontSize: 20,
    fontFamily: 'Poppins_800ExtraBold',
    letterSpacing: 1,
  },
  topActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
  },
  topActionBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  pausedContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  pausedText: {
    fontSize: 36,
    color: NEON_GOLD,
    fontFamily: 'Poppins_900Black',
    textAlign: 'center',
    marginBottom: 40,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
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
    color: NEON_GREEN,
    fontFamily: 'Poppins_700Bold',
    textShadowColor: 'rgba(0,255,136,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  score: {
    color: Colors.white,
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
  },
  timerContainer: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
  },
  timerContainerDanger: {
    backgroundColor: 'rgba(255,0,85,0.1)',
    borderColor: NEON_RED,
    shadowColor: NEON_RED,
  },
  timer: {
    color: NEON_GREEN,
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
  },
  timerDanger: {
    color: NEON_RED,
  },
  card: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    marginHorizontal: 30,
    marginTop: 20,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  mainWord: {
    fontSize: 32,
    fontFamily: 'Poppins_900Black',
    color: Colors.white,
    marginBottom: 15,
    textAlign: 'center',
    textShadowColor: 'rgba(255,255,255,0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginBottom: 15,
  },
  forbiddenWord: {
    fontSize: 20,
    color: NEON_GOLD,
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
    borderWidth: 1,
  },
  btnTaboo: {
    backgroundColor: 'rgba(255,0,85,0.15)',
    borderColor: NEON_RED,
  },
  btnPass: {
    backgroundColor: NEON_GOLD,
    borderColor: NEON_GOLD,
    shadowColor: NEON_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  btnCorrect: {
    backgroundColor: NEON_GREEN,
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  actionText: {
    color: Colors.white,
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 16,
  },
});
