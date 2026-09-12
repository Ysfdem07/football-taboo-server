import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ImageBackground, SafeAreaView, Animated, Keyboard,
  KeyboardAvoidingView, Platform, ScrollView,
  useWindowDimensions, TouchableWithoutFeedback
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { useLanguage } from '../context/LanguageContext';
import { CustomAlert } from '../components/CustomAlert';

type Nav  = NativeStackNavigationProp<RootStackParamList, 'TournamentGame'>;
type Route = RouteProp<RootStackParamList, 'TournamentGame'>;

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';
const SECS_PER_Q  = 40;

const THEMES = {
  football: require('../../assets/images/football_bg.jpg'),
  football_en: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  cinema_en: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
  music_en: require('../../assets/images/music_bg.jpg'),
};

// Turkish letters first (ı/ğ/ş don't reliably fold via NFD), then a generic
// Unicode accent-strip for everything else the word database's non-Turkish
// names bring in (é, ñ, ç, ü, ø, etc.) — matches server.js's normalizeText,
// which already did this; this client-side copy (used for Tournament's own
// guess check) was missing the NFD step, so e.g. "Grégory" (kept as "grgory"
// after just dropping the é) never matched a plain "gregory" guess.
function normalizeText(t: string) {
  return t
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '').trim();
}

export default function TournamentGameScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const insets     = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { cards, categoryId: catId } = route.params;
  const categoryId = catId || 'football';

  const [qIndex, setQIndex]           = useState(0);
  const [hintsShown, setHintsShown]   = useState(1);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);
  const [timeLeft, setTimeLeft]       = useState(SECS_PER_Q);
  const [guess, setGuess]             = useState('');
  const [totalScore, setTotalScore]   = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback]       = useState<'correct' | 'wrong' | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [finished, setFinished]       = useState(false);
  const [scoreResult, setScoreResult] = useState<{ rank: number; totalPlayers: number; completedPerfectly: boolean } | null>(null);
  const [player, setPlayer]           = useState<{ id: string; username: string; avatar: string } | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // The keyboard used to be pinned open for the whole round (permanently
  // eating half the screen). Now it only opens once the player actually
  // taps "TAHMİN ET!" — full-screen reading otherwise, keyboard-driven
  // typing on demand, matching the duel/tutorial screens' buzz-in pattern.
  const [isGuessing, setIsGuessing]   = useState(false);

  const flashAnim  = useRef(new Animated.Value(0)).current;
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef   = useRef<TextInput>(null);
  const isKeyboardOpenRef = useRef(false);

  // Smooth, flicker-free focus maintainer — only while actively guessing;
  // a hint/letter tap outside guessing mode must not summon the keyboard.
  const ensureFocus = useCallback(() => {
    if (finished || !isGuessing) return;
    requestAnimationFrame(() => {
      if (!inputRef.current?.isFocused()) {
        inputRef.current?.focus();
      }
    });
  }, [finished, isGuessing]);

  const handleBuzzIn = useCallback(() => {
    if (finished || feedback) return;
    setIsGuessing(true);
    // A plain requestAnimationFrame call raced the native `editable` prop
    // commit on Android — the input was still non-editable when .focus()
    // landed, so the soft keyboard never opened. A short setTimeout gives
    // the re-render time to actually reach native before we focus.
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [finished, feedback]);

  // Handler for explicit screen tap when keyboard was closed (e.g. Android back button) —
  // only re-opens it if we were actively guessing already.
  const handleManualScreenTap = useCallback(() => {
    if (finished || !isGuessing) return;
    if (!isKeyboardOpenRef.current) {
      inputRef.current?.blur();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 40);
    } else if (!inputRef.current?.isFocused()) {
      inputRef.current?.focus();
    }
  }, [finished, isGuessing]);

  useEffect(() => {
    AsyncStorage.getItem('@logged_in_profile').then(raw => { if (raw) setPlayer(JSON.parse(raw)); });

    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      isKeyboardOpenRef.current = true;
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      isKeyboardOpenRef.current = false;
      setKeyboardVisible(false);
      setIsGuessing(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Prevent accidental back navigation (Android back button, iOS swipe
  // back) — the header's own X button already confirms before exiting,
  // but that only guards its own onPress; the hardware back button and
  // iOS's edge-swipe gesture both skip it entirely and go straight to
  // React Navigation's default back action unless this is intercepted too.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (finished) return;

      e.preventDefault();

      CustomAlert.show(
        t('exitTournamentTitle'),
        t('exitTournamentMsg'),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('exitBtn'),
            style: 'destructive',
            onPress: () => {
              if (timerRef.current) clearInterval(timerRef.current);
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, finished]);

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

  const rawCard = cards[qIndex];
  const currentCard = React.useMemo(() => {
    if (!rawCard) return rawCard;
    return {
      ...rawCard,
      forbidden: [...(rawCard.forbidden || [])].sort(() => Math.random() - 0.5)
    };
  }, [qIndex, rawCard]);

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
    flashScreen(false, `${t('timeOutFeedback')}\n${t('answerWas')} ${currentCard.word.toUpperCase()}`);
  };

  const handleGuess = () => {
    if (feedback || finished) return;
    if (!guess.trim()) return;
    if (timerRef.current) clearInterval(timerRef.current);

    const wordClean = currentCard.word.replace(/[\s-]+/g, '');
    if (revealedIndices.length >= wordClean.length) {
      setGuess('');
      flashScreen(false, `${t('timeOutFeedback')}\n${t('answerWas')} ${currentCard.word.toUpperCase()}`);
      return;
    }

    const isCorrect = normalizeText(guess) === normalizeText(currentCard.word);
    if (isCorrect) {
      const earned = Math.max(10, 100 - (hintsShown - 1) * 10 - revealedIndices.length * 10);
      setTotalScore(prev => prev + earned);
      setCorrectCount(prev => prev + 1);
      flashScreen(true, t('correctFeedback'));
    } else {
      flashScreen(false, `${t('wrongFeedback')}\n${t('answerWas')} ${currentCard.word.toUpperCase()}`);
    }
    setGuess('');
    setIsGuessing(false);
    inputRef.current?.blur();
  };

  const handleSkip = () => {
    if (feedback || finished) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setGuess('');
    setIsGuessing(false);
    inputRef.current?.blur();
    flashScreen(false, `${t('passedFeedback')}\n${t('answerWas')} ${currentCard.word.toUpperCase()}`);
  };

  const handleShowHint = () => {
    if (hintsShown < currentCard.forbidden.length) {
      setHintsShown(prev => prev + 1);
    }
    ensureFocus();
  };

  const handleShowLetter = () => {
    const wordClean = currentCard.word.replace(/[\s-]+/g, '');
    if (revealedIndices.length >= wordClean.length) return;

    const unrevealed: number[] = [];
    for (let i = 0; i < currentCard.word.length; i++) {
      if (currentCard.word[i] !== ' ' && currentCard.word[i] !== '-' && !revealedIndices.includes(i)) {
        unrevealed.push(i);
      }
    }
    if (unrevealed.length > 0) {
      const randIdx = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      setRevealedIndices(prev => [...prev, randIdx]);
      
      // Kelimenin tamamı açıldıysa anında pas say (0 puan)
      if (unrevealed.length === 1) {
        if (timerRef.current) clearInterval(timerRef.current);
        setGuess('');
        flashScreen(false, `${t('timeOutFeedback')}\n${t('answerWas')} ${currentCard.word.toUpperCase()}`);
      }
    }
    ensureFocus();
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
      setIsGuessing(false);
    }
  };

  // Render the word block helper with dynamic screen scaling & distinct word spacing
  const renderWordPlaceholder = () => {
    if (!currentCard) return null;
    const words = currentCard.word.split(' ');
    const guessChars = guess.split('');
    let globalCharIndex = 0;
    let typedIndex = 0;

    const longestWordLength = Math.max(...words.map(w => w.length));
    const isTallScreen = screenHeight > 750;

    // Kutu boyutu, sabit eşikler yerine gerçek ekran genişliğine göre
    // hesaplanıyor — böylece uzun bir kelime (ya da büyük sistem yazı tipi
    // ayarı) asla ekranın dışına taşamaz. wordRow'daki flexWrap, minimum
    // okunabilir boyutun altına inilirse ikinci satıra kaydırarak ek bir
    // güvenlik ağı sağlıyor.
    const TILE_GAP = 4;
    const availableWidth = screenWidth - 32; // wordsWrapper paddingHorizontal (16*2)
    let boxWidth = Math.floor((availableWidth - (longestWordLength - 1) * TILE_GAP) / longestWordLength);
    boxWidth = Math.max(14, Math.min(isTallScreen ? 34 : 28, boxWidth));
    const boxHeight = Math.round(boxWidth * 1.25);
    const fontSize = Math.max(10, Math.round(boxWidth * 0.55));

    return (
      <TouchableOpacity activeOpacity={1} onPress={handleManualScreenTap} style={styles.wordsWrapper}>
        {words.map((word, wordIdx) => {
          const charBoxes = word.split('').map((char, charIdx) => {
            const index = globalCharIndex;
            globalCharIndex++;
            // A hyphen inside a name (e.g. "Jean-Alain") gets no box at all —
            // it's never something the player types — but the index still
            // has to advance so later real letters keep lining up with
            // revealedIndices, which was built against the raw word string.
            if (char === '-') return null;
            const isRevealed = revealedIndices.includes(index);

            let displayChar = '';
            let isPrediction = false;

            if (typedIndex < guessChars.length) {
              displayChar = guessChars[typedIndex].toUpperCase();
              isPrediction = true;
              typedIndex++;
            } else if (isRevealed) {
              displayChar = char.toUpperCase();
            }

            return (
              <View 
                key={charIdx} 
                style={[
                  styles.charBox, 
                  { width: boxWidth, height: boxHeight, borderRadius: boxWidth * 0.22 },
                  isPrediction && { borderColor: NEON_GREEN, backgroundColor: 'rgba(0,255,136,0.15)' }
                ]}
              >
                <Text style={[styles.charText, { fontSize }, isPrediction && { color: NEON_GREEN }]}>
                  {displayChar}
                </Text>
              </View>
            );
          });

          if (wordIdx < words.length - 1) {
            globalCharIndex++;
          }

          return (
            <View key={wordIdx} style={styles.wordRow}>
              {charBoxes}
            </View>
          );
        })}
      </TouchableOpacity>
    );
  };

  const finishGame = () => {
    setFinished(true);
    const socket = getSocket();
    if (socket && player) {
      socket.emit('submit_tournament_score', {
        playerId: player.id,
        username: player.username,
        avatar: player.avatar,
        score: totalScore,
        correctCount,
        category: categoryId,
      });
    }
  };

  const timerColor = timeLeft <= 10 ? '#ff4444' : timeLeft <= 20 ? NEON_GOLD : NEON_GREEN;
  const timerPct   = timeLeft / SECS_PER_Q;

  const flashBg = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,8,20,0)', feedback === 'correct' ? 'rgba(0,255,136,0.25)' : 'rgba(255,68,68,0.25)'],
  });

  const potentialScore = Math.max(10, 100 - (hintsShown - 1) * 10 - revealedIndices.length * 10);
  const isTallScreen = screenHeight > 750;

  // ─── Finished Screen ─────────────────────────────────────────────────────
  if (finished) {
    return (
      <ImageBackground source={(THEMES as any)[categoryId] || THEMES.football} style={styles.bg}>
        <View style={styles.overlay} />
        <SafeAreaView style={styles.finishedContainer}>
          <Text style={styles.finishedTitle}>{t('tournamentFinishedTitle')}</Text>
          <Text style={styles.finishedScore}>{totalScore}</Text>
          <Text style={styles.finishedScoreLabel}>{t('points')}</Text>
          <Text style={styles.finishedSub}>{correctCount} / {cards.length} {t('correctAnswers')}</Text>

          {scoreResult && (
            <View style={styles.rankCard}>
              <Text style={styles.rankLabel}>{t('yourWeeklyRank')}</Text>
              <Text style={styles.rankValue}>#{scoreResult.rank}</Text>
              <Text style={styles.rankSub}>{scoreResult.totalPlayers} {t('outOfPlayers')}</Text>
              {scoreResult.completedPerfectly && (
                <Text style={styles.perfectText}>{t('perfectCompleted')}</Text>
              )}
            </View>
          )}

          {!player && (
            <View style={styles.guestWarning}>
              <Text style={styles.guestWarningText}>
                ⚠️ {language === 'en' ? 'Played as guest — sign in to save your score.' : 'Misafir olarak oynadın — skoru kaydetmek için giriş yapmalısın.'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.backToTournamentBtn} onPress={() => navigation.navigate('Tournament', { categoryId })}>
            <Text style={styles.backToTournamentText}>{t('viewLeaderboard')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>{t('homeMenu')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  // ─── Game Screen ──────────────────────────────────────────────────────────
  return (
    <ImageBackground source={(THEMES as any)[categoryId] || THEMES.football} style={styles.bg}>
      <TouchableWithoutFeedback onPress={handleManualScreenTap}>
        <View style={{ flex: 1 }}>
          <View style={styles.overlay} />
          <Animated.View style={[StyleSheet.absoluteFillObject, { backgroundColor: flashBg }]} pointerEvents="none" />
          
          <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView 
              style={{ flex: 1 }} 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <ScrollView 
                  style={{ flex: 1 }} 
                  contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 6 }}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <TouchableOpacity activeOpacity={1} onPress={handleManualScreenTap} style={{ flex: 1, justifyContent: 'space-between' }}>
                    <View>
                      {/* Top Bar (With Safe Insets Top Padding) */}
                      <View style={[styles.topBar, { paddingTop: Math.max(insets.top + 4, 12), position: 'relative' }]}>
                        <TouchableOpacity 
                          onPress={() => {
                            CustomAlert.show(
                              t('exitTournamentTitle'),
                              t('exitTournamentMsg'),
                              [
                                { text: t('cancel'), style: 'cancel' },
                                { text: t('exitBtn'), style: 'destructive', onPress: () => {
                                  if (timerRef.current) clearInterval(timerRef.current);
                                  navigation.goBack(); 
                                } }
                              ]
                            );
                          }}
                          style={{ position: 'absolute', left: 10, top: Math.max(insets.top + 4, 12) - 2, zIndex: 10, padding: 5 }}
                        >
                          <Ionicons name="close" size={30} color="#fff" />
                        </TouchableOpacity>
                        <Text style={[styles.qCounter, { marginLeft: 34 }]}>{qIndex + 1} / {cards.length}</Text>
                        <View style={styles.timerWrap}>
                          <Text style={[styles.timerText, { color: timerColor }]}>{timeLeft}</Text>
                          <View style={styles.timerBarBg}>
                            <View style={[styles.timerBarFill, { width: `${timerPct * 100}%` as any, backgroundColor: timerColor }]} />
                          </View>
                        </View>
                        <Text style={styles.scoreText}>{totalScore} {t('points').toLowerCase()}</Text>
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

                      {/* 1. WORD LETTER PLACEHOLDERS (DYNAMIC SIZING + CLEAR WORD GAP) */}
                      {renderWordPlaceholder()}
                    </View>

                    {/* 2. CLUES CARD (COMPACT WITH SCORE BADGE MOVED TO FIRST CLUE ROW) */}
                    <TouchableOpacity activeOpacity={1} onPress={handleManualScreenTap} style={styles.cluesCard}>
                      {/* Forbidden Word Clues */}
                      {currentCard.forbidden.map((clue, i) => (
                        <View key={i} style={[styles.clueRow, i >= hintsShown && styles.clueHidden]}>
                          <Ionicons
                            name={i < hintsShown ? 'chevron-forward-circle' : 'lock-closed-outline'}
                            size={12}
                            color={i < hintsShown ? NEON_BLUE : '#555'}
                          />
                          <Text style={[styles.clueText, { fontSize: isTallScreen ? 16 : 14 }, i >= hintsShown && styles.clueTextHidden]}>
                            {i < hintsShown ? clue : '? ? ? ? ?'}
                          </Text>

                          {/* First clue row has the compact score badge on the right! */}
                          {i === 0 && (
                            <View style={styles.compactScoreBadge}>
                              <Ionicons name="star" size={10} color={NEON_GOLD} />
                              <Text style={styles.compactScoreText}>{potentialScore} {t('points')}</Text>
                            </View>
                          )}
                        </View>
                      ))}

                      {/* Action Buttons inside Clues Card */}
                      <View style={styles.gameActionsRow}>
                        <TouchableOpacity 
                          style={[styles.neonActionButton, { flex: 1, marginVertical: 0 }]} 
                          onPress={handleShowHint} 
                          disabled={hintsShown >= currentCard.forbidden.length}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle-outline" size={14} color={NEON_PURPLE} />
                          <Text style={styles.neonActionText} numberOfLines={1}>{t('showHint')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                          style={[styles.neonActionButton, { flex: 1, borderColor: NEON_GOLD, backgroundColor: 'rgba(255,215,0,0.06)', marginVertical: 0 }]} 
                          onPress={handleShowLetter}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="help-circle-outline" size={14} color={NEON_GOLD} />
                          <Text style={[styles.neonActionText, { color: NEON_GOLD }]} numberOfLines={1}>{t('getLetter')}</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </ScrollView>

                {/* Input Section (Actions + Permanent TextInput) */}
                <View style={[styles.inputSection, { paddingBottom: keyboardVisible ? 6 : Math.max(insets.bottom, 10) }]}>
                  {/* Only mounted/focusable once the player taps "TAHMİN ET!" —
                      keeps the keyboard off-screen the rest of the round so
                      the clue card gets the full screen to work with. */}
                  <TextInput
                    ref={inputRef}
                    style={styles.invisibleInput}
                    value={guess}
                    onChangeText={(text) => {
                      // editable stays true at all times — gating it on
                      // isGuessing made the native input non-focusable right
                      // when we needed to open the keyboard (race with the
                      // prop commit on Android, no soft keyboard at all).
                      // Ignoring input while not actively guessing achieves
                      // the same "can't type outside a buzz-in" guarantee.
                      if (feedback || finished || !isGuessing) return;
                      const cleanText = text.replace(/\s+/g, '');
                      setGuess(cleanText);
                    }}
                    onSubmitEditing={handleGuess}
                    autoCorrect={false}
                    autoCapitalize="characters"
                    returnKeyType="send"
                    editable={true}
                    maxLength={currentCard ? currentCard.word.replace(/\s+/g, '').length : 20}
                    blurOnSubmit={false}
                    showSoftInputOnFocus={true}
                    caretHidden={true}
                    disableFullscreenUI={true}
                  />

                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={!!feedback} activeOpacity={0.8}>
                      <Text style={styles.skipBtnText}>{t('pass')}</Text>
                    </TouchableOpacity>
                    {isGuessing ? (
                      <TouchableOpacity style={styles.guessBtn} onPress={handleGuess} disabled={!!feedback} activeOpacity={0.8}>
                        <Text style={styles.guessBtnText}>{t('send')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={styles.buzzBtn} onPress={handleBuzzIn} disabled={!!feedback} activeOpacity={0.8}>
                        <Text style={[styles.guessBtnText, { color: NEON_GOLD }]}>⚡ {language === 'en' ? 'BUZZ IN!' : 'TAHMİN ET!'}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </SafeAreaView>

          {/* Feedback Overlay - Centered over clues box */}
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
        </View>
      </TouchableWithoutFeedback>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:      { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,8,20,0.92)' },

  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 190 : 165,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    zIndex: 9999,
  },
  feedbackBadge: {
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(0,8,20,0.95)',
    paddingVertical: 16,
    paddingHorizontal: 28,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  feedbackText: {
    fontSize: 21,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1,
    textAlign: 'center',
  },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 4,
  },
  qCounter:  { color: '#aaa', fontFamily: 'Poppins_600SemiBold', fontSize: 13, width: 50 },
  timerWrap: { alignItems: 'center', flex: 1 },
  timerText: { fontFamily: 'Poppins_900Black', fontSize: 32 },
  timerBarBg:{ width: 90, height: 4, backgroundColor: '#1a1a2e', borderRadius: 2, marginTop: 1 },
  timerBarFill: { height: 4, borderRadius: 2 },
  scoreText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 13, width: 80, textAlign: 'right' },

  progressDots: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 4, marginBottom: 4 },
  dot:          { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#333' },
  dotDone:      { backgroundColor: NEON_GREEN },
  dotCurrent:   { backgroundColor: NEON_BLUE, width: 13 },

  // Word Letter Placeholders (Top Section)
  wordsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 6,
    rowGap: 10,
    columnGap: 20, // Distinct 20px gap between separate words!
  },
  wordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: '100%',
    gap: 4
  },
  charBox: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,191,255,0.5)',
    backgroundColor: 'rgba(0,191,255,0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  charText: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold'
  },

  // Clues Card (Below Word Placeholders)
  cluesCard: {
    flex: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 18,
    borderWidth: 1.5, borderColor: 'rgba(0,191,255,0.3)',
    backgroundColor: 'rgba(0,191,255,0.06)',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  compactScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  compactScoreText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
  },

  clueRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  clueHidden:     { opacity: 0.35 },
  clueText: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    flex: 1,
    textShadowColor: 'rgba(0,191,255,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4
  },
  clueTextHidden: { color: 'rgba(255,255,255,0.18)' },

  gameActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 14,
    width: '100%'
  },
  neonActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: NEON_PURPLE,
    borderRadius: 16,
    backgroundColor: 'rgba(168,85,247,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 2,
    shadowColor: NEON_PURPLE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  neonActionText: {
    color: NEON_PURPLE,
    fontFamily: 'Poppins_700Bold',
    fontSize: 11,
    letterSpacing: 0.5,
  },

  inputSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(0,8,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  invisibleInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 40,
    opacity: 0.001,
    zIndex: -1,
  },
  actionRow:   { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtnText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 14, letterSpacing: 0.5 },
  guessBtn: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buzzBtn: {
    flex: 2,
    borderWidth: 1.5,
    borderColor: NEON_GOLD,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guessBtnText: { color: NEON_GREEN, fontFamily: 'Poppins_700Bold', fontSize: 15, letterSpacing: 1 },

  // Finished
  finishedContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  finishedTitle: { color: '#FFFFFF', fontFamily: 'Poppins_900Black', fontSize: 24, letterSpacing: 3 },
  finishedScore: { color: NEON_GREEN, fontFamily: 'Poppins_900Black', fontSize: 72, marginTop: 8 },
  finishedScoreLabel: { color: '#FFFFFF', fontFamily: 'Poppins_600SemiBold', fontSize: 16, letterSpacing: 3, marginTop: -8 },
  finishedSub:   { color: '#fff', fontFamily: 'Poppins_600SemiBold', fontSize: 16, marginTop: 8 },
  rankCard: {
    marginTop: 24, borderWidth: 1, borderColor: NEON_GREEN, borderRadius: 16,
    backgroundColor: 'rgba(0,255,136,0.06)', padding: 20, alignItems: 'center', width: '100%',
  },
  rankLabel:   { color: NEON_GREEN, fontFamily: 'Poppins_600SemiBold', fontSize: 11, letterSpacing: 2 },
  rankValue:   { color: '#fff', fontFamily: 'Poppins_900Black', fontSize: 48, marginTop: 4 },
  rankSub:     { color: '#aaa', fontFamily: 'Poppins_400Regular', fontSize: 13 },
  perfectText: { color: NEON_GREEN, fontFamily: 'Poppins_600SemiBold', fontSize: 13, marginTop: 10, textAlign: 'center' },
  guestWarning: {
    marginTop: 16, borderWidth: 1, borderColor: '#ff4444', borderRadius: 10,
    padding: 12, backgroundColor: 'rgba(255,68,68,0.06)',
  },
  guestWarningText: { color: '#ff4444', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center' },
  backToTournamentBtn: {
    marginTop: 24,
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    backgroundColor: 'rgba(0,255,136,0.12)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backToTournamentText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 15, letterSpacing: 1 },
  homeBtn: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    width: '100%',
    alignItems: 'center',
  },
  homeBtnText: { color: '#FFFFFF', fontFamily: 'Poppins_700Bold', fontSize: 15, letterSpacing: 1 },
});
