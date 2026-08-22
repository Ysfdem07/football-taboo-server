import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView, StatusBar } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket } from '../services/socket';
import { Analytics } from '../services/analytics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { showInterstitial, showRewarded } from '../services/ads';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../components/CustomAlert';

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';
const NEON_GOLD   = '#FFD700';

const THEMES = {
  football: require('../../assets/images/football_bg.jpg'),
  football_en: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  cinema_en: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
  music_en: require('../../assets/images/music_bg.jpg'),
};

type Props = {
  route: RouteProp<RootStackParamList, 'OnlineGame'>;
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnlineGame'>;
};

export default function OnlineGameScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const categoryId = route.params?.categoryId || 'football';
  const bgImageSource = THEMES[categoryId as keyof typeof THEMES] || THEMES.football;
  const socket = getSocket();

  const [wordHint, setWordHint] = useState<string>('...');
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [hints, setHints] = useState<string[]>([]);
  const [guess, setGuess] = useState('');
  const [myOriginalId] = useState(socket.id); // Captures the socket ID on mount, robust against reconnects

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
  const [passVotesCount, setPassVotesCount] = useState<number>(0);
  const [hasPassed, setHasPassed] = useState<boolean>(false);
  const [kpChanges, setKpChanges] = useState<Record<string, number>>({});
  const [coinChanges, setCoinChanges] = useState<Record<string, number>>({});
  const [serverPotentialScore, setServerPotentialScore] = useState<number | null>(null);
  const [lastPenalty, setLastPenalty] = useState<number>(10);
  
  const [player, setPlayer] = useState<any>(null);
  const [jokerLoading, setJokerLoading] = useState(false);
  const [rewardCollected, setRewardCollected] = useState(false);

  const inputRef = React.useRef<TextInput>(null);
  const transitionAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const stored = await AsyncStorage.getItem('@logged_in_profile');
        if (stored) setPlayer(JSON.parse(stored));
      } catch(e) {}
    };
    loadProfile();
  }, []);

  const useJoker = (jokerType: string) => {
    if (!player || !player.id) return;
    const count = player.jokers?.[jokerType] || 0;
    if (count <= 0) {
      CustomAlert.show('Joker Yok', 'Marketten joker satın alabilirsin!');
      return;
    }
    setJokerLoading(true);
    socket.emit('use_joker', { roomId, playerId: player.id, jokerType });
  };

  // Smooth fade-in for round transition screens
  useEffect(() => {
    if (gameOver && !isFinal) {
      Animated.timing(transitionAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      transitionAnim.setValue(0);
    }
  }, [gameOver, isFinal]);

  const buzzerTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const toastTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    Analytics.logScreenView('OnlineGame');
    socket.on('game_start', (data: any) => {
      Analytics.logGameStart(roomId, data.isRanked ? 'ranked' : 'friendly', 'giver');
      setGameOver(false);
      setIsFinal(false);
      setWinnerMessage('');
      setWordHint(data.wordHint);
      setTimeLeft(data.timeLeft);
      setHints(data.firstHint ? [data.firstHint] : []);
      if (data.potentialScore !== undefined) setServerPotentialScore(data.potentialScore);
      setCurrentRound(data.currentRound);
      if (data.maxRounds) setMaxRounds(data.maxRounds);
      setGuessingPlayerId(null);
      if (data.scores) setScores(data.scores);
      if (data.players) setPlayers(data.players);
      setGuess('');
      setPassVotesCount(0);
      setHasPassed(false);
      setBuzzerLocked(false); // FIX: reset buzzer on new round
      setShowWrongGuess(false); // FIX: reset wrong guess toast
      setJokerLoading(false); // FIX: unlock jokers
    });

    socket.on('time_tick', (data: any) => {
      setTimeLeft(data.timeLeft);
    });

    socket.on('pass_update', (data: any) => {
      if (data && data.votesCount !== undefined) {
        setPassVotesCount(data.votesCount);
      }
    });

    socket.on('hint_revealed', (data: any) => {
      // FIX: prevent duplicate hints from stale events between rounds
      setHints(prev => {
        if (prev.includes(data.hint)) return prev;
        return [...prev, data.hint];
      });
      if (data.potentialScore !== undefined) setServerPotentialScore(data.potentialScore);
    });

    socket.on('word_hint_update', (data: any) => {
      setWordHint(data.wordHint);
      if (data.potentialScore !== undefined) setServerPotentialScore(data.potentialScore);
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

    socket.on('joker_used_success', async (data: any) => {
      setJokerLoading(false);
      if (data.player) {
        setPlayer(data.player);
        await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(data.player));
      }
    });

    socket.on('joker_used', (data: any) => {
      if (data.message) CustomAlert.show('Joker Kullanıldı!', data.message);
      if (data.hint) setWordHint(data.hint);
    });

    socket.on('joker_error', (data: any) => {
      setJokerLoading(false);
      CustomAlert.show('Joker Hatası', data.message || 'Joker kullanılamadı.');
    });

    // Server sends updated profile after coin/KP rewards
    socket.on('coins_updated', async (data: any) => {
      if (data.player) {
        setPlayer(data.player);
        try {
          // Preserve password from cached profile
          const stored = await AsyncStorage.getItem('@logged_in_profile');
          const cached = stored ? JSON.parse(stored) : {};
          const merged = { ...data.player, password: cached.password };
          await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(merged));
        } catch (e) {}
      }
    });

    socket.on('wrong_guess', (data?: any) => {
      setShowWrongGuess(true);
      if (data && data.penalty !== undefined) setLastPenalty(data.penalty);
      if (data && data.scores) setScores(data.scores);
      
      if (data && data.playerId === socket.id) {
        setBuzzerLocked(true);
        if (buzzerTimerRef.current) clearTimeout(buzzerTimerRef.current);
        buzzerTimerRef.current = setTimeout(() => {
          setBuzzerLocked(false);
        }, 5000);
      }

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
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
          const winnerName = data.winnerName || 'RAKİBİNİZ';
          setWinnerMessage(winnerName.toUpperCase() + ' KELİMEYİ BİLDİ!\n\nKelime: ' + data.word);
        }
      } else if (data.reason === 'pass') {
        setWinnerMessage('PAS GEÇİLDİ!\nTüm oyuncular pas geçti.\n\nKelime: ' + data.word);
      } else {
        setWinnerMessage('SÜRE DOLDU!\nKimse bilemedi.\n\nKelime: ' + data.word);
      }
    });

    socket.on('game_over', async (data: any) => {
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
      if (data.coinChanges) setCoinChanges(data.coinChanges);

      // Primary reliable path: server embeds updated profile directly in game_over, keyed by dbPlayerId
      try {
        const stored = await AsyncStorage.getItem('@logged_in_profile');
        if (stored) {
          const cached = JSON.parse(stored);
          const cachedId = cached.id || cached._id;
          const myUpdate = data.playerUpdates?.[cachedId];
          if (myUpdate) {
            setPlayer(myUpdate);
            await AsyncStorage.setItem('@logged_in_profile', JSON.stringify({ ...myUpdate, password: cached.password }));
          }
        }
      } catch (e) {}
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
      if (buzzerTimerRef.current) clearTimeout(buzzerTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      
      socket.emit('leave_room', { roomId });
      
      socket.off('game_start');
      socket.off('time_tick');
      socket.off('pass_update');
      socket.off('hint_revealed');
      socket.off('word_hint_update');
      socket.off('guess_turn_started');
      socket.off('guess_time_tick');
      socket.off('guess_turn_ended');
      socket.off('joker_used_success');
      socket.off('joker_used');
      socket.off('joker_error');
      socket.off('coins_updated');
      socket.off('wrong_guess');
      socket.off('round_ended');
      socket.off('game_over');
      socket.off('player_disconnected');
      socket.off('opponent_disconnected');
    };
  }, []);

  // Prevent accidental back navigation (Android back button, iOS swipe back)
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // If the game is over, let them go back immediately without asking
      if (gameOver) {
        return;
      }

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      CustomAlert.show(
        'Oyundan Ayrıl?',
        'Oyundan çıkmak istediğinize emin misiniz? Çıkarsanız oyunu hükmen kaybedebilirsiniz.',
        [
          { text: 'İptal', style: 'cancel', onPress: () => {} },
          {
            text: 'Çık',
            style: 'destructive',
            onPress: () => {
              socket.disconnect();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, gameOver]);

  const sendGuess = () => {
    if (!guess.trim() || gameOver) return;
    socket.emit('guess_word', { roomId, guess, playerId: myOriginalId });
    setGuess('');
  };

  const requestGuessTurn = () => {
    if (gameOver || guessingPlayerId) return;
    socket.emit('request_guess_turn', { roomId, playerId: myOriginalId });
  };

  const sendPass = () => {
    if (gameOver || hasPassed) return; // Allow pass even during guess turn
    setHasPassed(true);
    socket.emit('pass_round', { roomId, playerId: myOriginalId });
  };

  if (gameOver) {
    if (!isFinal) {
      const isTimeout = winnerMessage.includes('SÜRE');
      const isPass = winnerMessage.includes('PAS');
      const isCorrectWin = winnerMessage.includes('TEBRİKLER');

      // Renk ve ikon seçimi
      let cardBorderColor = NEON_GOLD;
      let titleColor = NEON_GOLD;
      let statusIcon = 'information-circle-outline';

      if (isCorrectWin) {
        cardBorderColor = NEON_GREEN;
        titleColor = NEON_GREEN;
        statusIcon = 'checkmark-circle-outline';
      } else if (isPass) {
        cardBorderColor = NEON_BLUE;
        titleColor = NEON_BLUE;
        statusIcon = 'play-skip-forward-outline';
      } else if (isTimeout) {
        cardBorderColor = '#ff4444';
        titleColor = '#ff4444';
        statusIcon = 'time-outline';
      } else {
        cardBorderColor = NEON_GOLD;
        titleColor = NEON_GOLD;
        statusIcon = 'trophy-outline';
      }

      return (
        <ImageBackground source={bgImageSource} style={styles.bgImage}>
          <View style={styles.overlay} />
          <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <Animated.View style={[styles.transitionCard, { opacity: transitionAnim, borderColor: cardBorderColor, shadowColor: cardBorderColor }]}>
              <Ionicons name={statusIcon as any} size={48} color={titleColor} style={{ marginBottom: 12 }} />
              
              <Text style={[styles.transitionTitle, { color: titleColor }]}>
                {isCorrectWin ? 'TEBRİKLER!' : isPass ? 'PAS GEÇİLDİ!' : isTimeout ? 'SÜRE DOLDU!' : 'TUR SONU!'}
              </Text>
              
              <Text style={styles.transitionDetail}>
                {winnerMessage}
              </Text>

              <View style={styles.loadingSection}>
                <Text style={styles.nextRoundText}>Sonraki Tur Hazırlanıyor...</Text>
                <View style={styles.loadingBarBg}>
                  <View style={styles.loadingBarFill} />
                </View>
              </View>
            </Animated.View>
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
      <ImageBackground source={bgImageSource} style={styles.bgImage}>
        {/* Heavy dark overlay for contrast */}
        <View style={styles.gameOverOverlay} />

        <SafeAreaView style={styles.gameOverSafeArea}>
          <View style={styles.gameOverContent}>

            {/* ── Header ── */}
            <View style={styles.gameOverHeader}>
              <Text style={styles.gameOverTitle}>OYUN BİTTİ</Text>
              <Text style={[
                styles.resultText,
                {
                  color: resultText === 'KAZANDIN!' ? NEON_GREEN
                       : resultText === 'BERABERE!'  ? NEON_GOLD
                       : '#FF4444',
                }
              ]}>{resultText}</Text>
            </View>

            {/* ── Scores ── */}
            <View style={styles.finalScoreContainer}>
              {players.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map((p, index) => {
                const kpVal = kpChanges[p.id];
                const coinVal = coinChanges[p.id];
                const isMe = p.id === socket.id;
                const isWinner = winnerIds.includes(p.id);
                return (
                  <View key={p.id} style={[
                    styles.finalScoreRow,
                    isMe && { backgroundColor: 'rgba(0,255,136,0.06)', borderRadius: 10, paddingHorizontal: 8 },
                  ]}>
                    {/* Rank icon */}
                    <Text style={{ fontSize: 18, marginRight: 6 }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </Text>

                    <Text style={[styles.finalScoreLabel, isMe && { color: NEON_GREEN }]} numberOfLines={1}>
                      {isMe ? p.name + ' (Sen)' : p.name}
                    </Text>

                    {/* Badges */}
                    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                      {kpVal !== undefined && kpVal !== 0 ? (
                        <View style={[
                          styles.kpBadge,
                          {
                            backgroundColor: kpVal >= 0 ? 'rgba(46,204,113,0.18)' : 'rgba(231,76,60,0.18)',
                            borderColor: kpVal >= 0 ? '#2ECC71' : '#E74C3C',
                          }
                        ]}>
                          <Text style={{ color: kpVal >= 0 ? '#2ECC71' : '#E74C3C', fontFamily: 'Poppins_700Bold', fontSize: 11 }}>
                            {kpVal >= 0 ? `+${kpVal}` : `${kpVal}`} KP
                          </Text>
                        </View>
                      ) : null}

                      {coinVal !== undefined && coinVal > 0 ? (
                        <View style={[styles.kpBadge, { backgroundColor: 'rgba(255,215,0,0.18)', borderColor: NEON_GOLD }]}>
                          <Text style={{ color: NEON_GOLD, fontFamily: 'Poppins_700Bold', fontSize: 11 }}>
                            +{coinVal} 🪙
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.finalScoreValue}>{scores[p.id] || 0} Puan</Text>
                  </View>
                );
              })}
            </View>

            {/* ── My updated balance ── */}
            {player?.coins !== undefined && (
              <View style={styles.balanceChip}>
                <Text style={styles.balanceChipLabel}>Güncel Jeton Bakiyeniz</Text>
                <Text style={styles.balanceChipValue}>{player.coins} 🪙</Text>
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={styles.gameOverActions}>
              {winnerIds.includes(socket.id) && !rewardCollected && (
                <TouchableOpacity
                  style={styles.rewardButton}
                  onPress={() => {
                    showRewarded(() => {
                      socket.emit('reward_double_coins', { playerId: player?.id });
                      setRewardCollected(true);
                      CustomAlert.show('Tebrikler!', "Kazancınız 2'ye katlandı (+50 Jeton eklendi).");
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="videocam" size={20} color="#000" style={{ marginRight: 8 }} />
                  <Text style={styles.rewardButtonText}>REKLAM İZLE — JETONu 2x KAT!</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  socket.disconnect();
                  showInterstitial();
                  navigation.replace('Home');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="home-outline" size={18} color={NEON_GREEN} style={{ marginRight: 8 }} />
                <Text style={styles.menuButtonText}>ANA MENÜYE DÖN</Text>
              </TouchableOpacity>
            </View>

          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;

  const guessingPlayer = players.find(p => p.id === guessingPlayerId);
  const guessingPlayerName = guessingPlayer ? (guessingPlayer.id === socket.id ? guessingPlayer.name + " (Sen)" : guessingPlayer.name) : "Oyuncu";

  return (
    <ImageBackground source={bgImageSource} style={styles.bgImage}>
      {/* Dark Cyber Stadium Overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={[styles.scoreBoard, { paddingTop: topPadding }]}>
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
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'center', position: 'relative' }]}>
              <TouchableOpacity 
                onPress={() => {
                  CustomAlert.show(
                    'Oyundan Ayrıl?',
                    'Oyundan çıkmak istediğinize emin misiniz? Çıkarsanız oyunu hükmen kaybedebilirsiniz.',
                    [
                      { text: 'İptal', style: 'cancel' },
                      { text: 'Çık', style: 'destructive', onPress: () => {
                        socket.disconnect();
                        navigation.navigate('Home');
                      }}
                    ]
                  );
                }} 
                style={{ position: 'absolute', left: 20, top: 0, zIndex: 10, padding: 5 }}
              >
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.roundText}>TUR {currentRound} / {maxRounds}</Text>
                <View style={styles.timerWrap}>
                  <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#ff4444' : NEON_GREEN }]}>{timeLeft}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.gameArea}>
            {/* Word Letter Placeholders with dynamic guess mapping */}
            {(() => {
              // wordHint formatı sunucudan "M____" veya "____ ____" şeklinde boşluklu gelir.
              // Kelimeleri boşluklara göre bölüyoruz
              const words = wordHint.split(' ');
              const guessChars = guess.split('');
              
              let globalCharIndex = 0;
              let typedIndex = 0; // Yazılan tahminlerin sırasını takip etmek için

              // Boşluksuz en uzun kelimenin harf sayısını bulalım
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

              const isMyTurn = guessingPlayerId === socket.id;

              return (
                <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
                  <View style={styles.wordsWrapper}>
                    {words.map((word, wordIdx) => {
                    const charBoxes = word.split('').map((char, charIdx) => {
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
                          key={charIdx} 
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
                </TouchableOpacity>
              );
            })()}
            
            {/* Clues Card style list */}
            <View style={styles.cluesCard}>
              {/* Potential Score Badge */}
              <View style={styles.potentialScoreContainer}>
                <Ionicons name="star" size={16} color={NEON_GOLD} />
                <Text style={styles.potentialScoreText}>
                  {(() => {
                    if (serverPotentialScore !== null) {
                      return `Kazanılacak Puan: +${serverPotentialScore}`;
                    }
                    const hintsPenalty = Math.max(0, hints.length - 1);
                    const revealedLetters = Math.max(0, wordHint.replace(/[\s_]/g, '').length - 1);
                    const potentialScore = Math.max(10, 100 - hintsPenalty * 10 - revealedLetters * 10);
                    return `Kazanılacak Puan: +${potentialScore}`;
                  })()}
                </Text>
              </View>

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
          </ScrollView>

          <View style={[styles.inputArea, { paddingBottom: Math.max(20, insets.bottom + 16) }]}>

            {/* ─── Always-visible Jokers Bar ─────────────────────────────── */}
            <View style={styles.jokersBar}>
              {/* Harf Aç — active any time */}
              <TouchableOpacity
                style={[styles.jokerBtnWide, jokerLoading && { opacity: 0.45 }]}
                onPress={() => useJoker('revealLetters')}
                disabled={jokerLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="text" size={18} color={NEON_PURPLE} />
                <Text style={[styles.jokerBtnLabel, { color: NEON_PURPLE }]}>Harf Aç</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText}>{player?.jokers?.revealLetters || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* +5 Sn — only active during OWN guess turn */}
              <TouchableOpacity
                style={[
                  styles.jokerBtnWide,
                  (jokerLoading || guessingPlayerId !== socket.id) && { opacity: 0.35 },
                ]}
                onPress={() => useJoker('extraTime')}
                disabled={jokerLoading || guessingPlayerId !== socket.id}
                activeOpacity={0.8}
              >
                <Ionicons name="time" size={18} color="#00BFFF" />
                <Text style={[styles.jokerBtnLabel, { color: '#00BFFF' }]}>+5 Sn</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText}>{player?.jokers?.extraTime || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* İpucu — active any time */}
              <TouchableOpacity
                style={[styles.jokerBtnWide, jokerLoading && { opacity: 0.45 }]}
                onPress={() => useJoker('instantHints')}
                disabled={jokerLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={18} color={NEON_GREEN} />
                <Text style={[styles.jokerBtnLabel, { color: NEON_GREEN }]}>İpucu</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText}>{player?.jokers?.instantHints || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* Kalkan — only active during OWN guess turn */}
              <TouchableOpacity
                style={[
                  styles.jokerBtnWide,
                  (jokerLoading || guessingPlayerId !== socket.id) && { opacity: 0.35 },
                ]}
                onPress={() => useJoker('shield')}
                disabled={jokerLoading || guessingPlayerId !== socket.id}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={18} color="#FFD700" />
                <Text style={[styles.jokerBtnLabel, { color: '#FFD700' }]}>Kalkan</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText}>{player?.jokers?.shield || 0}</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ─── Action Buttons ─────────────────────────────────────────── */}
            {!guessingPlayerId ? (
              // Normal turn: buzzer + pass
              <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={[styles.buzzerButton, { flex: 1 }, buzzerLocked && styles.buzzerButtonLocked]}
                  onPress={requestGuessTurn}
                  disabled={buzzerLocked}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buzzerButtonText}>
                    {buzzerLocked ? 'BEKLEYİN (5)' : '⚡ TAHMİN ET!'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.passBtn, hasPassed && styles.passBtnDisabled]}
                  onPress={sendPass}
                  disabled={hasPassed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.passBtnText}>
                    {hasPassed
                      ? `✓ PAS (${passVotesCount}/${players.length || 2})`
                      : `⏭ PAS (${passVotesCount}/${players.length || 2})`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : guessingPlayerId === socket.id ? (
              // My guess turn: input + send + pass
              <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <TextInput
                    ref={inputRef}
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
                    maxLength={wordHint.replace(/\s+/g, '').length}
                    underlineColorAndroid="transparent"
                  />
                  <View style={styles.inlineTimerWrap}>
                    <Text style={styles.guessTimerText}>{guessTimeLeft}s</Text>
                  </View>
                  <TouchableOpacity style={[styles.guessBtn, { flex: 1 }]} onPress={sendGuess} activeOpacity={0.85}>
                    <Text style={styles.guessBtnText}>GÖNDER ▶</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.passBtn, hasPassed && styles.passBtnDisabled, { width: '100%' }]}
                  onPress={sendPass}
                  disabled={hasPassed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.passBtnText}>
                    {hasPassed
                      ? `✓ PAS (${passVotesCount}/${players.length || 2})`
                      : `⏭ PAS GEÇ (${passVotesCount}/${players.length || 2})`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Opponent's guess turn: waiting label + pass
              <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText}>
                    ⏳ {guessingPlayerName} tahmin ediyor... ({guessTimeLeft})
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.passBtn, hasPassed && styles.passBtnDisabled, { width: '100%' }]}
                  onPress={sendPass}
                  disabled={hasPassed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.passBtnText}>
                    {hasPassed
                      ? `✓ PAS (${passVotesCount}/${players.length || 2})`
                      : `⏭ PAS GEÇ (${passVotesCount}/${players.length || 2})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showWrongGuess && (
            <Text style={styles.wrongGuessText}>❌ Yanlış Tahmin! (-{lastPenalty} Puan)</Text>
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
  potentialScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: NEON_GOLD,
    borderRadius: 8,
    paddingVertical: 6,
    marginBottom: 10,
    gap: 6,
  },
  potentialScoreText: {
    color: NEON_GOLD,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
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
    flexDirection: 'column',
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: 'rgba(0,8,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  jokersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  jokerBtnWide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  jokerBtnLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    letterSpacing: 0.3,
  },
  invisibleInput: {
    position: 'absolute',
    left: -999,
    top: 0,
    width: 40,
    height: 40,
    opacity: 0.01,
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
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  guessBtnText: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: 1,
  },
  jokersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 4,
  },
  jokerBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  jokerBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ff4444',
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jokerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
  },
  buzzerButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 215, 0, 0.06)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.5)',
  },
  buzzerButtonLocked: {
    backgroundColor: 'rgba(255,215,0,0.02)',
    borderColor: 'rgba(255,215,0,0.1)',
    opacity: 0.5,
  },
  buzzerButtonText: {
    color: NEON_GOLD,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
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
  transitionCard: {
    borderWidth: 2,
    borderRadius: 20,
    backgroundColor: 'rgba(0,8,20,0.95)',
    paddingVertical: 30,
    paddingHorizontal: 24,
    width: '85%',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  transitionTitle: {
    fontSize: 26,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 10,
  },
  transitionDetail: {
    fontSize: 16,
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 25,
  },
  loadingSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  nextRoundText: {
    fontSize: 13,
    color: NEON_BLUE,
    fontFamily: 'Poppins_600SemiBold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  loadingBarBg: {
    width: '80%',
    height: 6,
    backgroundColor: '#1a1a2e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  loadingBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: NEON_PURPLE,
    borderRadius: 3,
  },
  // ─── Game Over Screen Styles ────────────────────────────────────────────────
  gameOverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 4, 10, 0.82)',
  },
  gameOverSafeArea: {
    flex: 1,
  },
  gameOverContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 0,
  },
  gameOverHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameOverTitle: {
    fontSize: 38,
    fontFamily: 'Poppins_900Black',
    color: Colors.white,
    letterSpacing: 2,
    textAlign: 'center',
  },
  resultText: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    marginTop: 4,
    textAlign: 'center',
    letterSpacing: 1,
  },
  finalScoreContainer: {
    backgroundColor: 'rgba(5, 12, 22, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 136, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
    width: '100%',
  },
  finalScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    gap: 6,
  },
  finalScoreLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins_600SemiBold',
    flex: 1,
  },
  kpBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  finalScoreValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    minWidth: 72,
    textAlign: 'right',
  },
  balanceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    width: '100%',
    marginBottom: 8,
  },
  balanceChipLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
  },
  balanceChipValue: {
    color: NEON_GOLD,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
  },
  gameOverActions: {
    width: '100%',
    gap: 12,
  },
  rewardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEON_GREEN,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
  },
  rewardButtonText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: NEON_GREEN,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    width: '100%',
  },
  menuButtonText: {
    color: NEON_GREEN,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.8,
  },
  passBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 25,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBtnDisabled: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    opacity: 0.5,
  },
  passBtnText: {
    color: '#ffffff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
