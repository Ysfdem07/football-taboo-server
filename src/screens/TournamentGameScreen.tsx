import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ImageBackground, SafeAreaView, Animated, Keyboard,
  KeyboardAvoidingView, Platform, Alert, ScrollView
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';

type Nav  = NativeStackNavigationProp<RootStackParamList, 'TournamentGame'>;
type Route = RouteProp<RootStackParamList, 'TournamentGame'>;

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';
const SECS_PER_Q  = 40; // 40 saniyeye yukseltildi

function normalizeText(t: string) {
  return t.toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/[âäàá]/g, 'a')
    .replace(/[îïìí]/g, 'i')
    .replace(/[ûüùú]/g, 'u')
    .replace(/[ôöòó]/g, 'o')
    .replace(/[^a-z0-9]/g, '').trim(); // Boşlukları da tamamen normalizeText içinde temizliyoruz
}

export default function TournamentGameScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { cards }  = route.params;

  const [qIndex, setQIndex]           = useState(0);
  const [hintsShown, setHintsShown]   = useState(1);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft]       = useState(SECS_PER_Q);
  const [guess, setGuess]             = useState('');
  const [totalScore, setTotalScore]   = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback]       = useState<'correct' | 'wrong' | null>(null);
  const [feedbackText, setFeedbackText] = useState(''); // Ekranda belirecek metin
  const [finished, setFinished]       = useState(false);
  const [scoreResult, setScoreResult] = useState<{ rank: number; totalPlayers: number; completedPerfectly: boolean } | null>(null);
  const [player, setPlayer]           = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const flashAnim  = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef   = useRef<TextInput>(null);

  useEffect(() => {
    AsyncStorage.getItem('@logged_in_profile').then(raw => { if (raw) setPlayer(JSON.parse(raw)); });

    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Listen for score result
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socket.on('tournament_score_result', (data: any) => {
      if (data.success) setScoreResult(data);
    });
    return () => { socket.off('tournament_score_result'); };
  }, []);

  // Timer
  useEffect(() => {
    if (finished || feedback) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [qIndex, feedback, finished]);

  const currentCard = cards[qIndex];

  const flashScreen = (correct: boolean, text: string) => {
    setFeedback(correct ? 'correct' : 'wrong');
    setFeedbackText(text);
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    setTimeout(() => {
      setFeedback(null);
      setFeedbackText('');
      nextQuestion();
    }, 900);
  };

  const handleTimeout = () => {
    flashScreen(false, `SÜRE DOLDU! ⏱️\nDoğru Cevap: ${currentCard.word.toUpperCase()}`);
  };

  const handleGuess = () => {
    Keyboard.dismiss();
    if (!guess.trim() || feedback) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = normalizeText(guess) === normalizeText(currentCard.word);
    if (isCorrect) {
      // Score: max(10, 100 - (hintsShown-1)*10 - revealedLetters*10)
      const earned = Math.max(10, 100 - (hintsShown - 1) * 10 - revealedIndices.length * 10);
      setTotalScore(prev => prev + earned);
      setCorrectCount(prev => prev + 1);
      flashScreen(true, 'DOĞRU! 🎉');
    } else {
      flashScreen(false, `YANLIŞ! ❌\nDoğru Cevap: ${currentCard.word.toUpperCase()}`);
    }
    setGuess('');
  };

  const handleSkip = () => {
    if (feedback) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setGuess('');
    flashScreen(false, `PAS GEÇİLDİ! ➡️\nDoğru Cevap: ${currentCard.word.toUpperCase()}`);
  };

  const handleShowHint = () => {
    if (hintsShown < currentCard.forbidden.length) {
      setHintsShown(prev => prev + 1);
    }
  };

  const handleShowLetter = () => {
    const wordClean = currentCard.word.replace(/\s+/g, '');
    if (revealedIndices.length >= wordClean.length) return;

    // Pick a random unrevealed index
    const unrevealed: number[] = [];
    for (let i = 0; i < currentCard.word.length; i++) {
      if (currentCard.word[i] !== ' ' && !revealedIndices.includes(i)) {
        unrevealed.push(i);
      }
    }
    if (unrevealed.length > 0) {
      const randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedIndices(prev => [...prev, randIdx]);
    }
  };

  const nextQuestion = () => {
    const next = qIndex + 1;
    if (next >= cards.length) {
      finishGame();
    } else {
      setQIndex(next);
      setHintsShown(1);
      setRevealedIndices([]);
      setTimeLeft(SECS_PER_Q);
      setGuess('');
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  };

  // Render the word block helper (Kelimelerin alt satıra bölünmesini engellemek için)
  const renderWordPlaceholder = () => {
    // Kelimeleri boşluklara göre bölüyoruz
    const words = currentCard.word.split(' ');
    
    // Kullanıcının yazdığı harfleri (boşluksuz) bir diziye çeviriyoruz
    const guessChars = guess.split('');
    let globalCharIndex = 0;
    let typedIndex = 0; // Yazılan tahminlerin sırasını takip etmek için

    // Kelimedeki toplam karakter sayısını bulalım (boşluksuz en uzun kelime)
    const longestWordLength = Math.max(...words.map(w => w.length));

    // Harf sayısına göre dinamik kutu boyutları
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

    return (
      <View style={styles.wordsWrapper}>
        {words.map((word, wordIdx) => {
          const charBoxes = word.split('').map((char, charIdx) => {
            const index = globalCharIndex;
            globalCharIndex++; // global index takibi
            const isRevealed = revealedIndices.includes(index);
            
            let displayChar = '';
            let isPrediction = false;

            // Eğer kullanıcı bu karakter sırasına kadar tahmin yazmışsa
            if (typedIndex < guessChars.length) {
              displayChar = guessChars[typedIndex].toUpperCase();
              // Eğer harf zaten açık ise ve kullanıcının yazdığı harfle uyuşuyorsa veya uyuşmuyorsa bile üstüne yazsın
              // Kendi yazdıklarını yeşil neon renkte gösterelim
              isPrediction = true;
              typedIndex++;
            } else if (isRevealed) {
              // Kullanıcı henüz bu sıraya kadar yazmadıysa ancak harf açılmışsa
              displayChar = char.toUpperCase();
            }

            return (
              <View 
                key={charIdx} 
                style={[
                  styles.charBox, 
                  { width: boxWidth, height: boxHeight, borderRadius: boxWidth * 0.22 },
                  isPrediction && { borderColor: NEON_GREEN, backgroundColor: 'rgba(0,255,136,0.08)' } // Kullanıcının yazdıkları yeşil neon parlasın
                ]}
              >
                <Text style={[styles.charText, { fontSize }, isPrediction && { color: NEON_GREEN }]}>
                  {displayChar}
                </Text>
              </View>
            );
          });

          // Her kelimeden sonra boşluk için globalIndex'i arttırıyoruz (son kelime hariç)
          if (wordIdx < words.length - 1) {
            globalCharIndex++;
          }

          return (
            <View key={wordIdx} style={styles.wordRow}>
              {charBoxes}
            </View>
          );
        })}
      </View>
    );
  };

  const finishGame = () => {
    setFinished(true);
    // Submit score
    const socket = getSocket();
    if (socket && player) {
      socket.emit('submit_tournament_score', {
        playerId: player.id,
        username: player.username,
        avatar: player.avatar,
        score: totalScore,
        correctCount,
      });
    }
  };

  const timerColor = timeLeft <= 10 ? '#ff4444' : timeLeft <= 20 ? NEON_GOLD : NEON_GREEN;
  const timerPct   = timeLeft / SECS_PER_Q;

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,8,20,0)', feedback === 'correct' ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,68,0.25)'],
  });

  // ─── Finished Screen ─────────────────────────────────────────────────────
  if (finished) {
    return (
      <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bg}>
        <View style={styles.overlay} />
        <SafeAreaView style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>TURNUVA BITTI</Text>
          <Text style={styles.finishedScore}>{totalScore}</Text>
          <Text style={styles.finishedScoreLabel}>PUAN</Text>
          <Text style={styles.finishedSub}>{correctCount} / {cards.length} doğru</Text>

          {scoreResult && (
            <View style={styles.rankCard}>
              <Text style={styles.rankLabel}>BU HAFTAKİ SIRAMAN</Text>
              <Text style={styles.rankValue}>#{scoreResult.rank}</Text>
              <Text style={styles.rankSub}>{scoreResult.totalPlayers} katılımcı arasında</Text>
              {scoreResult.completedPerfectly && (
                <Text style={styles.perfectText}>🏆 Mükemmel! Bu haftaki turnuvayı tamamladın!</Text>
              )}
            </View>
          )}

          {!player && (
            <View style={styles.guestWarning}>
              <Text style={styles.guestWarningText}>⚠️ Misafir olarak oynadın — skoru kaydetmek için giriş yapmalısın.</Text>
            </View>
          )}

          <TouchableOpacity style={styles.backToTournamentBtn} onPress={() => navigation.navigate('Tournament')}>
            <Text style={styles.backToTournamentText}>SIRALAMAYI GÖR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>Ana Menü</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ─── Game Screen ──────────────────────────────────────────────────────────
  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bg}>
      <View style={styles.overlay} />
      <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: flashBg }]} pointerEvents="none" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView 
          style={{ flex: 1, justifyContent: 'space-between' }} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 95 : 0}
        >
          <View style={{ flex: 1, justifyContent: 'space-between' }}>
            <ScrollView 
              style={{ flex: 1 }} 
              contentContainerStyle={{ paddingBottom: 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Top Bar */}
              <View style={styles.topBar}>
                <Text style={styles.qCounter}>{qIndex + 1} / {cards.length}</Text>
                <View style={styles.timerWrap}>
                  <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
                  <View style={styles.timerBarBg}>
                    <View style={[styles.timerBarFill, { width: `${timerPct * 100}%` as any, backgroundColor: timerColor }]} />
                  </View>
                </View>
                <Text style={styles.scoreText}>{totalScore} puan</Text>
              </View>

              {/* Progress dots */}
              <View style={styles.progressDots}>
                {cards.map((_, i) => (
                  <View key={i} style={[
                    styles.dot,
                    i < qIndex && styles.dotDone,
                    i === qIndex && styles.dotCurrent,
                  ]} />
                ))}
              </View>

              {/* Clues */}
              <View style={styles.cluesCard}>
                {/* Potential Score Badge */}
                <View style={styles.potentialScoreContainer}>
                  <Ionicons name="star" size={16} color={NEON_GOLD} />
                  <Text style={styles.potentialScoreText}>
                    Kazanılacak Puan: {Math.max(10, 100 - (hintsShown - 1) * 10 - revealedIndices.length * 10)}
                  </Text>
                </View>

                {currentCard.forbidden.map((clue, i) => (
                  <View key={i} style={[styles.clueRow, i >= hintsShown && styles.clueHidden]}>
                    <Ionicons
                      name={i < hintsShown ? 'eye-outline' : 'lock-closed-outline'}
                      size={14}
                      color={i < hintsShown ? NEON_BLUE : '#444'}
                    />
                    <Text style={[styles.clueText, i >= hintsShown && styles.clueTextHidden]}>
                      {i < hintsShown ? clue : '? ? ? ? ?'}
                    </Text>
                  </View>
                ))}

                {/* Yan Yana Aksiyon Butonları */}
                <View style={styles.gameActionsRow}>
                  <TouchableOpacity 
                    style={[styles.neonActionButton, { flex: 1, marginVertical: 0 }]} 
                    onPress={handleShowHint} 
                    disabled={hintsShown >= currentCard.forbidden.length}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={NEON_PURPLE} />
                    <Text style={styles.neonActionText} numberOfLines={1}>İpucu Göster (-10)</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.neonActionButton, { flex: 1, borderColor: NEON_GOLD, backgroundColor: 'rgba(255,215,0,0.06)', marginVertical: 0 }]} 
                    onPress={handleShowLetter}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="help-circle-outline" size={14} color={NEON_GOLD} />
                    <Text style={[styles.neonActionText, { color: NEON_GOLD }]} numberOfLines={1}>Harf Al (-10)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Word Letter Placeholders */}
              {renderWordPlaceholder()}
            </ScrollView>

            {/* Input Section - KeyboardAvoidingView will push the action buttons above keyboard */}
            <View style={styles.inputSection}>
              {/* Invisible TextInput that keeps focus and captures keyboard events */}
              <TextInput
                ref={inputRef}
                style={styles.invisibleInput}
                value={guess}
                onChangeText={(text) => {
                  // Sadece harfleri alıp boşluksuz tutuyoruz
                  const cleanText = text.replace(/\s+/g, '');
                  setGuess(cleanText);
                }}
                onSubmitEditing={handleGuess}
                autoCorrect={false}
                autoCapitalize="characters"
                returnKeyType="send"
                editable={!feedback}
                maxLength={currentCard.word.replace(/\s+/g, '').length}
                autoFocus={true}
              />

              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={!!feedback}>
                  <Text style={styles.skipBtnText}>PAS GEÇ</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.guessBtn} onPress={handleGuess} disabled={!!feedback}>
                  <Text style={styles.guessBtnText}>GÖNDER ▶</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Feedback Overlay */}
      {!!feedbackText && (
        <View style={styles.feedbackOverlay} pointerEvents="none">
          <View style={[
            styles.feedbackBadge,
            { borderColor: feedback === 'correct' ? NEON_GREEN : '#ff4444' }
          ]}>
            <Text style={[
              styles.feedbackText,
              { color: feedback === 'correct' ? NEON_GREEN : '#ff4444' }
            ]}>
              {feedbackText}
            </Text>
          </View>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,8,20,0.92)' },

  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 9999,
  },
  feedbackBadge: {
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(0,8,20,0.95)',
    paddingVertical: 20,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  feedbackText: {
    fontSize: 26,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textAlign: 'center',
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6,
  },
  qCounter:  { color: '#aaa', fontFamily: 'Poppins_600SemiBold', fontSize: 14, width: 50 },
  timerWrap: { alignItems: 'center', flex: 1 },
  timerText: { fontFamily: 'Poppins_900Black', fontSize: 28 },
  timerBarBg:{ width: 100, height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, marginTop: 2 },
  timerBarFill: { height: 4, borderRadius: 2 },
  scoreText: { color: NEON_GOLD, fontFamily: 'Poppins_700Bold', fontSize: 14, width: 80, textAlign: 'right' },

  progressDots: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 4, marginBottom: 8 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333' },
  dotDone:      { backgroundColor: NEON_GREEN },
  dotCurrent:   { backgroundColor: NEON_BLUE, width: 14 },

  cluesCard: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,191,255,0.25)',
    backgroundColor: 'rgba(0,191,255,0.05)', padding: 8,
  },
  potentialScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: NEON_GOLD,
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 8,
    gap: 6,
  },
  potentialScoreText: {
    color: NEON_GOLD,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  clueRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  clueHidden:     { opacity: 0.3 },
  clueText: { 
    color: '#ffffff', 
    fontFamily: 'Poppins_700Bold', 
    fontSize: 16, 
    flex: 1,
    textShadowColor: 'rgba(0,191,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4
  },
  clueTextHidden: { color: 'rgba(255,255,255,0.15)' },
  gameActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
    width: '100%'
  },

  wordsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 14,
    gap: 16
  },
  wordRow: {
    flexDirection: 'row',
    gap: 5
  },
  charBox: {
    width: 30, 
    height: 38,
    borderWidth: 1.5,
    borderColor: 'rgba(0,191,255,0.5)',
    borderRadius: 8,
    backgroundColor: 'rgba(0,191,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  charText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Poppins_700Bold'
  },
  neonActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: NEON_PURPLE,
    borderRadius: 20,
    backgroundColor: 'rgba(168,85,247,0.06)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginVertical: 6,
    shadowColor: NEON_PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  neonActionText: {
    color: NEON_PURPLE,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14, // klavyeye çok yapışmasın diye alt boşluk
    marginTop: 'auto'
  },
  invisibleInput: {
    position: 'absolute',
    width: 0,
    height: 0,
    opacity: 0,
  },
  actionRow:   { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, borderWidth: 1, borderColor: '#555', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  skipBtnText: { color: '#888', fontFamily: 'Poppins_600SemiBold', fontSize: 14 },
  guessBtn: {
    flex: 2, backgroundColor: NEON_GREEN, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  guessBtnText: { color: '#000814', fontFamily: 'Poppins_700Bold', fontSize: 15 },

  // Finished
  finishedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  finishedTitle: { color: NEON_GOLD, fontFamily: 'Poppins_900Black', fontSize: 22, letterSpacing: 3 },
  finishedScore: { color: NEON_GREEN, fontFamily: 'Poppins_900Black', fontSize: 72, marginTop: 8 },
  finishedScoreLabel: { color: '#aaa', fontFamily: 'Poppins_400Regular', fontSize: 16, letterSpacing: 3, marginTop: -8 },
  finishedSub:   { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginTop: 8 },
  rankCard: {
    marginTop: 24, borderWidth: 1, borderColor: NEON_GOLD, borderRadius: 16,
    backgroundColor: 'rgba(255,215,0,0.06)', padding: 20, alignItems: 'center', width: '100%',
  },
  rankLabel:   { color: NEON_GOLD, fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2 },
  rankValue:   { color: '#fff', fontFamily: 'Poppins_900Black', fontSize: 48, marginTop: 4 },
  rankSub:     { color: '#aaa', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  perfectText: { color: NEON_GOLD, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 10, textAlign: 'center' },
  guestWarning: {
    marginTop: 16, borderWidth: 1, borderColor: '#ff4444', borderRadius: 10,
    padding: 12, backgroundColor: 'rgba(255,68,68,0.06)',
  },
  guestWarningText: { color: '#ff4444', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center' },
  backToTournamentBtn: {
    marginTop: 24, backgroundColor: NEON_GREEN, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center',
  },
  backToTournamentText: { color: '#000814', fontFamily: 'Poppins_700Bold', fontSize: 15 },
  homeBtn: {
    marginTop: 10, paddingVertical: 10, alignItems: 'center', width: '100%',
  },
  homeBtnText: { color: '#888', fontFamily: 'Poppins_400Regular', fontSize: 14 },
});
