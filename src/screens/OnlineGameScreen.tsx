import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ImageBackground, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket } from '../services/socket';
import { Analytics } from '../services/analytics';
import { Ionicons } from '@expo/vector-icons';
import { showInterstitial } from '../services/ads';

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';

type Props = {
  route: RouteProp<RootStackParamList, 'OnlineGame'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnlineGame'>;
};

export default function OnlineGameScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const socket = getSocket();

  const [wordHint, setWordHint] = useState<string>('...');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [hints, setHints] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [maxRounds, setMaxRounds] = useState(10);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [players, setPlayers] = useState<any[]>([]);
  const [isFinal, setIsFinal] = useState(false);
  const [showWrongGuess, setShowWrongGuess] = useState(false);
  const [guessingPlayerId, setGuessingPlayerId] = useState<string | null>(null);
  const [guessTimeLeft, setGuessTimeLeft] = useState<number>(0);
  const [buzzerLocked, setBuzzerLocked] = useState(false);
  const [kpChanges, setKpChanges] = useState<Record<string, number>>({});

  useEffect(() => {
    Analytics.logScreenView('OnlineGame');
    socket.on('game_start', (data: any) => {
      Analytics.logGameStart(roomId, data.isRanked ? 'ranked' : 'friendly', 'giver');
      setGameOver(false);
      setWinnerMessage('');
      setWordHint(data.wordHint);
      setTimeLeft(data.timeLeft);
      setHints([data.firstHint]);
      setCurrentRound(data.currentRound);
      if (data.maxRounds) setMaxRounds(data.maxRounds);
      setGuessingPlayerId(null);
      if (data.scores) setScores(data.scores);
      if (data.players) setPlayers(data.players);
      setGuess('');
    });

    socket.on('time_tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('hint_revealed', (data: any) => {
      setHints(prev => [...prev, data.hint]);
    });

    socket.on('word_hint_update', (data: any) => {
      setWordHint(data.wordHint);
    });

    socket.on('guess_turn_started', (data: any) => {
      setGuessingPlayerId(data.playerId);
      setGuessTimeLeft(data.time);
    });

    socket.on('guess_time_tick', (data: any) => {
      setGuessTimeLeft(data.time);
    });

    socket.on('guess_turn_ended', () => {
      setGuessingPlayerId(null);
    });

    socket.on('wrong_guess', (data?: any) => {
      setShowWrongGuess(true);
      if (data && data.scores) setScores(data.scores);
      
      if (data && data.playerId === socket.id) {
        setBuzzerLocked(true);
        setTimeout(() => {
          setBuzzerLocked(false);
        }, 5000);
      }

      setTimeout(() => {
        setShowWrongGuess(false);
      }, 2000);
    });

    socket.on('round_ended', (data: any) => {
      setGameOver(true);
      setScores(data.scores);
      if (data.reason === 'correct_guess') {
        if (data.winnerId === socket.id) {
          setWinnerMessage('TEBRİKLER! KELİMEYİ BİLDİNİZ!\n\nKelime: ' + data.word);
        } else {
          setWinnerMessage('RAKİBİNİZ KELİMEYİ BİLDİ!\n\nKelime: ' + data.word);
        }
      } else {
        setWinnerMessage('SÜRE DOLDU!\nKimse bilemedi.\n\nKelime: ' + data.word);
      }
    });

    socket.on('game_over', (data: any) => {
      Analytics.logEvent('online_game_over', { 
        roomId, 
        scores: data.scores, 
        winnerId: data.winnerId,
        kpChanges: data.kpChanges 
      });
      setGameOver(true);
      setIsFinal(true);
      if (data.scores) setScores(data.scores);
      if (data.players) setPlayers(data.players);
      if (data.kpChanges) setKpChanges(data.kpChanges);
    });

    socket.on('player_disconnected', (data: any) => {
      if (data.players) setPlayers(data.players);
    });

    socket.on('opponent_disconnected', () => {
      Analytics.logEvent('online_opponent_disconnected', { roomId });
      setGameOver(true);
      setIsFinal(true);
      setWinnerMessage('Rakip oyundan ayrıldı! Hükmen kazandınız.');
    });

    return () => {
      socket.off('game_start');
      socket.off('time_tick');
      socket.off('hint_revealed');
      socket.off('word_hint_update');
      socket.off('guess_turn_started');
      socket.off('guess_time_tick');
      socket.off('guess_turn_ended');
      socket.off('wrong_guess');
      socket.off('round_ended');
      socket.off('game_over');
      socket.off('opponent_disconnected');
    };
  }, []);

  const sendGuess = () => {
    if (!guess.trim() || gameOver) return;
    socket.emit('guess_word', { roomId, guess });
    setGuess('');
  };

  const requestGuessTurn = () => {
    if (gameOver || guessingPlayerId) return;
    socket.emit('request_guess_turn', { roomId });
  };

  if (gameOver) {
    if (!isFinal) {
      return (
        <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
          <SafeAreaView style={styles.container}>
            <View style={styles.gameOverCard}>
              <Text style={styles.gameOverText}>{winnerMessage}</Text>
              <Text style={styles.nextRoundText}>Sonraki Tur Başlıyor...</Text>
            </View>
          </SafeAreaView>
        </ImageBackground>
      );
    }

    const myScore = scores[socket.id] || 0;
    
    let highestScore = -Infinity;
    let winnerIds: string[] = [];
    Object.keys(scores).forEach(id => {
      if (scores[id] > highestScore) {
        highestScore = scores[id];
        winnerIds = [id];
      } else if (scores[id] === highestScore) {
        winnerIds.push(id);
      }
    });

    let resultText = '';
    if (winnerIds.length === 1 && winnerIds[0] === socket.id) {
      resultText = 'KAZANDIN!';
    } else if (winnerIds.includes(socket.id)) {
      resultText = 'BERABERE!';
    } else {
      resultText = 'KAYBETTİN!';
    }

    return (
      <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
        <SafeAreaView style={styles.container}>
          <Text style={styles.gameOverTitle}>OYUN BİTTİ</Text>
          <Text style={styles.resultText}>{resultText}</Text>
          
          <View style={styles.finalScoreContainer}>
            {players.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map((p, index) => {
              const kpVal = kpChanges[p.id];
              const kpTextStr = kpVal !== undefined ? (kpVal >= 0 ? ` (+${kpVal} KP)` : ` (${kpVal} KP)`) : '';
              const kpColorStr = kpVal !== undefined ? (kpVal >= 0 ? '#2ECC71' : '#E74C3C') : '#aaa';
              return (
                <View key={p.id} style={styles.finalScoreRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <Text style={styles.finalScoreLabel} numberOfLines={1}>{p.id === socket.id ? p.name + " (Sen)" : p.name}</Text>
                    {kpTextStr ? <Text style={{ color: kpColorStr, fontFamily: 'Poppins_700Bold', marginLeft: 6, fontSize: 13 }}>{kpTextStr}</Text> : null}
                  </View>
                  <Text style={styles.finalScoreValue}>{scores[p.id] || 0}</Text>
                </View>
              );
            })}
          </View>

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => {
              socket.disconnect();
              showInterstitial();
              navigation.replace('Home');
            }}
          >
            <Text style={styles.menuButtonText}>ANA MENÜYE DÖN</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const guessingPlayer = players.find(p => p.id === guessingPlayerId);
  const guessingPlayerName = guessingPlayer ? (guessingPlayer.id === socket.id ? guessingPlayer.name + " (Sen)" : guessingPlayer.name) : "Oyuncu";

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      {/* Dark Cyber Stadium Overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={styles.scoreBoard}>
          {players.map((p, index) => (
            <Text key={p.id} style={[
              styles.scoreText, 
              p.id === socket.id ? { borderColor: NEON_BLUE, color: '#fff' } : { borderColor: '#444', color: '#aaa' }
            ]}>
              {p.id === socket.id ? p.name + " (Sen)" : p.name}: {scores[p.id] || 0}
            </Text>
          ))}
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.roundText}>TUR {currentRound} / {maxRounds}</Text>
            <View style={styles.timerWrap}>
              <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#ff4444' : NEON_GREEN }]}>{timeLeft}</Text>
            </View>
          </View>
          
          <View style={styles.gameArea}>
            {/* Word Letter Placeholders with dynamic guess mapping */}
            {(() => {
              // Sunucudan gelen "M _ _ S I" veya "_ _ _ _" verisini regex ile tek boşluklara normalize edip bölüyoruz
              const cleanHint = wordHint.trim().replace(/\s+/g, ' ');
              const chars = cleanHint ? cleanHint.split(' ') : [];
              const guessChars = guess.split('');
              let typedIndex = 0;

              // Harf sayısına göre dinamik kutu boyutu
              const longestWordLength = chars.length;
              let boxWidth = 32;
              let boxHeight = 40;
              let fontSize = 18;

              if (longestWordLength >= 14) {
                boxWidth = 20;
                boxHeight = 28;
                fontSize = 12;
              } else if (longestWordLength >= 11) {
                boxWidth = 24;
                boxHeight = 32;
                fontSize = 14;
              } else if (longestWordLength >= 9) {
                boxWidth = 28;
                boxHeight = 36;
                fontSize = 16;
              }

              const isMyTurn = guessingPlayerId === socket.id;

              return (
                <View style={styles.wordsWrapper}>
                  <View style={styles.wordRow}>
                    {chars.map((char, index) => {
                      const isRevealed = char !== '_';
                      let displayChar = '';
                      let isPrediction = false;

                      // Eğer sıra bizdeyse ve bu karakter sırasına kadar tahmin yazmışsak
                      if (isMyTurn && typedIndex < guessChars.length) {
                        displayChar = guessChars[typedIndex].toUpperCase();
                        isPrediction = true;
                        typedIndex++;
                      } else if (isRevealed) {
                        // Sıra bizde değilse veya henüz buraya kadar yazmamışsak ve harf açıksa
                        displayChar = char.toUpperCase();
                      }

                      return (
                        <View 
                          key={index} 
                          style={[
                            styles.charBox, 
                            { width: boxWidth, height: boxHeight, borderRadius: boxWidth * 0.22 },
                            isPrediction && { borderColor: NEON_GREEN, backgroundColor: 'rgba(0,255,136,0.08)' }
                          ]}
                        >
                          <Text style={[styles.charText, { fontSize }, isPrediction && { color: NEON_GREEN }]}>
                            {displayChar}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })()}
            
            {/* Clues Card style list */}
            <View style={styles.cluesCard}>
              {hints.map((h, i) => (
                <View key={i} style={styles.clueRow}>
                  <Ionicons name="eye-outline" size={14} color={NEON_BLUE} />
                  <Text style={styles.clueText}>{h}</Text>
                </View>
              ))}
              {hints.length === 0 && (
                <Text style={styles.emptyCluesText}>Henüz ipucu verilmedi...</Text>
              )}
            </View>
          </View>

          <View style={styles.inputArea}>
            {!guessingPlayerId ? (
              <TouchableOpacity 
                style={[styles.buzzerButton, buzzerLocked && styles.buzzerButtonLocked]} 
                onPress={requestGuessTurn}
                disabled={buzzerLocked}
                activeOpacity={0.85}
              >
                <Text style={styles.buzzerButtonText}>
                  {buzzerLocked ? 'BEKLEYİN (5)' : '⚡ TAHMİN ET! (BUZZER)'}
                </Text>
              </TouchableOpacity>
            ) : guessingPlayerId === socket.id ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 16 }}>
                {/* Invisible input */}
                <TextInput
                  style={styles.invisibleInput}
                  value={guess}
                  onChangeText={(text) => {
                    const cleanText = text.replace(/\s+/g, '');
                    setGuess(cleanText);
                  }}
                  onSubmitEditing={sendGuess}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  maxLength={wordHint.trim().replace(/\s+/g, ' ').split(' ').length}
                />
                
                <View style={{ flex: 1, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <View style={styles.inlineTimerWrap}>
                    <Text style={styles.guessTimerText}>{guessTimeLeft}s</Text>
                  </View>
                  <TouchableOpacity style={styles.guessBtn} onPress={sendGuess} activeOpacity={0.85}>
                    <Text style={styles.guessBtnText}>GÖNDER ▶</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>⏳ {guessingPlayerName} tahmin ediyor... ({guessTimeLeft})</Text>
              </View>
            )}
          </View>

          {showWrongGuess && (
            <Text style={styles.wrongGuessText}>❌ Yanlış Tahmin! (-3 Puan)</Text>
          )}

        </KeyboardAvoidingView>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,8,20,0.92)'
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  scoreBoard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 10,
    flexWrap: 'wrap',
  },
  scoreText: {
    color: Colors.white,
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    borderWidth: 1.5,
    borderColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    margin: 4,
    backgroundColor: 'rgba(0,8,20,0.85)',
  },
  header: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  roundText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 6,
    letterSpacing: 1,
  },
  timerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 36,
    fontFamily: 'Poppins_900Black',
    color: NEON_GREEN,
    textShadowColor: 'rgba(0,255,136,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 12
  },
  wordRow: {
    flexDirection: 'row',
    gap: 5
  },
  charBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,191,255,0.4)',
    borderRadius: 8,
    backgroundColor: 'rgba(0,191,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  charText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold'
  },
  cluesCard: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,191,255,0.25)',
    backgroundColor: 'rgba(0,191,255,0.05)',
    padding: 10,
    width: '90%',
    minHeight: 120,
  },
  clueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  clueText: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    flex: 1,
    textShadowColor: 'rgba(0,191,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 3,
  },
  emptyCluesText: {
    color: '#555',
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginTop: 20,
  },
  inputArea: {
    flexDirection: 'row',
    marginBottom: Platform.OS === 'ios' ? 24 : 14,
    paddingHorizontal: 16,
  },
  invisibleInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  inlineTimerWrap: {
    width: 50,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ff4444',
    backgroundColor: 'rgba(255,68,68,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guessTimerText: {
    color: '#ff4444',
    fontSize: 16,
    fontFamily: 'Poppins_900Black',
  },
  guessBtn: {
    flex: 1,
    backgroundColor: NEON_GREEN,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  guessBtnText: {
    color: '#000814',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
  },
  buzzerButton: {
    flex: 1,
    backgroundColor: NEON_GOLD,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
    borderWidth: 1.5,
    borderColor: NEON_GOLD,
    shadowColor: NEON_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  buzzerButtonLocked: {
    backgroundColor: 'rgba(255,215,0,0.1)',
    borderColor: 'rgba(255,215,0,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  buzzerButtonText: {
    color: '#000',
    fontFamily: 'Poppins_900Black',
    fontSize: 16,
    letterSpacing: 1,
  },
  waitingContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,8,20,0.85)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    height: 52,
  },
  waitingText: {
    color: '#aaa',
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  wrongGuessText: {
    color: '#ff4444',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  gameOverCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  gameOverText: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  nextRoundText: {
    fontSize: 20,
    color: Colors.primary,
    fontFamily: 'Poppins_700Bold',
    marginTop: 20,
  },
  gameOverTitle: {
    fontSize: 48,
    fontFamily: 'Poppins_900Black',
    color: Colors.white,
    marginBottom: 10,
    marginTop: 40,
  },
  resultText: {
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
    marginBottom: 40,
  },
  finalScoreContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
    borderRadius: 15,
    marginBottom: 40,
    width: '80%',
  },
  finalScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  finalScoreLabel: {
    color: Colors.white,
    fontSize: 22,
  },
  finalScoreValue: {
    color: Colors.warning,
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  menuButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  menuButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
});
