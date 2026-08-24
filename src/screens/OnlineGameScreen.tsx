import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, SafeAreaView, ImageBackground, KeyboardAvoidingView, Platform, Dimensions, Animated, ScrollView, StatusBar, Keyboard } from 'react-native';
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
import { useLanguage } from '../context/LanguageContext';

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
  const { t, language } = useLanguage();

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
  const [forfeitQuitterId, setForfeitQuitterId] = useState<string | null>(null);
  
  const [player, setPlayer] = useState<any>(null);
  const [jokerLoading, setJokerLoading] = useState(false);
  const [rewardCollected, setRewardCollected] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const inputRef = React.useRef<TextInput>(null);
  const transitionAnim = React.useRef(new Animated.Value(0)).current;

  // Track keyboard visibility so the bottom action area can reclaim the
  // padding it reserves for the (Android) system nav bar once the keyboard
  // is already occupying that space — otherwise the clue list above gets
  // squeezed to a sliver whenever a guess turn opens the keyboard.
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Explicitly focus the hidden guess input whenever it becomes my turn.
  // Relying on <TextInput autoFocus> alone is unreliable on Android (most
  // visibly on some Samsung/One UI devices) when the input mounts inside a
  // conditionally-rendered branch — a delayed retry after the initial paint
  // reliably brings the keyboard up where a single autoFocus call did not.
  useEffect(() => {
    if (guessingPlayerId !== myOriginalId) return;
    inputRef.current?.focus();
    const retry = setTimeout(() => inputRef.current?.focus(), 150);
    return () => clearTimeout(retry);
  }, [guessingPlayerId]);

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
      CustomAlert.show(t('noJokerTitle'), t('noJokerMsg'));
      return;
    }
    setJokerLoading(true);
    // playerId here is the room-scoped participant id (matches scores/
    // guessingPlayerId, same as guess_word/pass_round/request_guess_turn) —
    // NOT the account id. The server separately trusts socket.data.playerId
    // (session-bound) for the actual DB joker-inventory check.
    socket.emit('use_joker', { roomId, playerId: myOriginalId, jokerType });
  };

  // Shared by game_over and opponent_disconnected (forfeit) — both carry the
  // same coinChanges/playerUpdates shape and need the same credit logic.
  const applyRewardData = async (data: any) => {
    try {
      const stored = await AsyncStorage.getItem('@logged_in_profile');
      const cached = stored ? JSON.parse(stored) : {};
      const cachedId = cached.id || cached._id;

      if (cachedId && cachedId !== 'guest') {
        // Real account: server embeds the updated profile directly, keyed
        // by dbPlayerId — this is the reliable path.
        const myUpdate = data.playerUpdates?.[cachedId];
        if (myUpdate) {
          setPlayer(myUpdate);
          await AsyncStorage.setItem('@logged_in_profile', JSON.stringify({ ...myUpdate, password: cached.password }));
        }
      } else {
        // Guests have no DB record for the server to credit — coins are
        // applied to the local-only guest profile instead, same convention
        // MarketScreen's ad-reward flow uses (@logged_in_profile, id:'guest').
        const myCoins = data.coinChanges?.[myOriginalId];
        if (myCoins) {
          const guest = {
            ...cached,
            id: 'guest',
            username: cached.username || data.players?.find((p: any) => p.id === myOriginalId)?.name || 'Misafir',
            coins: (cached.coins || 0) + myCoins,
            jokers: cached.jokers || { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 },
          };
          setPlayer(guest);
          await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(guest));
        }
      }
    } catch (e) {}
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
      setBuzzerLocked(false);
      setShowWrongGuess(false);
      setJokerLoading(false);
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
      } else {
        setPlayer((prev: any) => {
          if (!prev) return prev;
          const updated = { ...prev };
          if (updated.jokers && updated.jokers[data.jokerType] > 0) {
            updated.jokers[data.jokerType] -= 1;
          }
          AsyncStorage.setItem('@logged_in_profile', JSON.stringify(updated)).catch(()=>{});
          return updated;
        });
      }
    });

    socket.on('joker_used', (data: any) => {
      if (data.message) CustomAlert.show(t('jokerUsedTitle'), data.message);
      if (data.hint) setWordHint(data.hint);
    });

    socket.on('joker_error', (data: any) => {
      setJokerLoading(false);
      CustomAlert.show(t('jokerErrorTitle'), data.message || t('jokerErrorMsg'));
    });

    // Server sends updated profile after coin/KP rewards
    socket.on('coins_updated', async (data: any) => {
      if (data.player) {
        setPlayer(data.player);
        try {
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
      
      if (data && data.playerId === myOriginalId) {
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
        if (data.winnerId === myOriginalId) {
          setWinnerMessage(t('correctWin') + ' KELİMEYİ BİLDİNİZ!\n\nKelime: ' + data.word);
        } else {
          const winnerName = data.winnerName || 'RAKİBİNİZ';
          setWinnerMessage(winnerName.toUpperCase() + ' KELİMEYİ BİLDİ!\n\nKelime: ' + data.word);
        }
      } else if (data.reason === 'pass') {
        setWinnerMessage(t('passDone') + '\n\nKelime: ' + data.word);
      } else {
        setWinnerMessage(t('timeUp') + data.word);
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
      await applyRewardData(data);
    });

    socket.on('player_disconnected', (data: any) => {
      if (data.players) setPlayers(data.players);
    });

    socket.on('opponent_disconnected', async (data: any) => {
      Analytics.logEvent('online_opponent_disconnected', { roomId, quitterId: data?.quitterId });
      setGameOver(true);
      setIsFinal(true);
      setWinnerMessage(language === 'en' ? 'Opponent left! You won by forfeit.' : 'Rakip oyundan ayrıldı! Hükmen kazandınız.');
      if (data?.quitterId) {
        // Marks the winner directly instead of leaving the final screen to
        // compare frozen scores from the moment they left — which could
        // easily show a tie/loss for the player who actually should win.
        setForfeitQuitterId(data.quitterId);
      }
      if (data?.scores) setScores(data.scores);
      if (data?.kpChanges) setKpChanges(data.kpChanges);
      if (data?.coinChanges) setCoinChanges(data.coinChanges);
      if (data) await applyRewardData(data);
    });

    // If the transport drops mid-match (backgrounding, brief network loss —
    // common enough on iOS that we already had to work around it for OTA
    // updates) socket.io reconnects with a NEW socket.id. That new socket
    // was never joined to this room, so it would silently stop receiving
    // any further round/turn/score events for the rest of the match. This
    // asks the server to put it back in the room and hand back a full
    // state snapshot so the screen can resume exactly where it left off.
    const rejoinOnReconnect = () => {
      socket.emit('rejoin_room', { roomId, oldPlayerId: myOriginalId });
    };
    socket.on('connect', rejoinOnReconnect);

    socket.on('room_synced', (data: any) => {
      if (data.players) setPlayers(data.players);
      if (data.scores) setScores(data.scores);
      if (data.currentRound !== undefined) setCurrentRound(data.currentRound);
      if (data.maxRounds) setMaxRounds(data.maxRounds);
      if (data.timeLeft !== undefined) setTimeLeft(data.timeLeft);
      if (data.wordHint) setWordHint(data.wordHint);
      if (data.hints) setHints(data.hints);
      if (data.potentialScore !== undefined) setServerPotentialScore(data.potentialScore);
      setGuessingPlayerId(data.guessingPlayerId || null);
      if (data.guessTimeLeft !== undefined) setGuessTimeLeft(data.guessTimeLeft);
      if (data.passVotesCount !== undefined) setPassVotesCount(data.passVotesCount);
      if (data.hasPassed !== undefined) setHasPassed(data.hasPassed);
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
      socket.off('connect', rejoinOnReconnect);
      socket.off('room_synced');
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
        t('exitGameTitle'),
        t('exitGameMsg'),
        [
          { text: t('cancel'), style: 'cancel', onPress: () => {} },
          {
            text: t('exitBtn'),
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
                <Text style={styles.nextRoundText}>{language === 'en' ? 'Preparing next round...' : 'Sonraki Tur Hazırlanıyor...'}</Text>
                <View style={styles.loadingBarBg}>
                  <View style={styles.loadingBarFill} />
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        </ImageBackground>
      );
    }

    const myScore = scores[myOriginalId] || 0;
    
    let winnerIds: string[] = [];
    if (forfeitQuitterId) {
      // Forfeit: whoever's left wins outright, regardless of whatever the
      // scores happened to be frozen at the moment the other player left.
      winnerIds = players.map(p => p.id).filter(id => id !== forfeitQuitterId);
    } else {
      let highestScore = -Infinity;
      Object.keys(scores).forEach(id => {
        if (scores[id] > highestScore) {
          highestScore = scores[id];
          winnerIds = [id];
        } else if (scores[id] === highestScore) {
          winnerIds.push(id);
        }
      });
    }

    let resultText = '';
    if (winnerIds.length === 1 && winnerIds[0] === myOriginalId) {
      resultText = language === 'en' ? 'YOU WON!' : 'KAZANDIN!';
    } else if (winnerIds.includes(myOriginalId)) {
      resultText = language === 'en' ? 'DRAW!' : 'BERABERE!';
    } else {
      resultText = language === 'en' ? 'YOU LOST!' : 'KAYBETTİN!';
    }

    return (
      <ImageBackground source={bgImageSource} style={styles.bgImage}>
        {/* Heavy dark overlay for contrast */}
        <View style={styles.gameOverOverlay} />

        <SafeAreaView style={styles.gameOverSafeArea}>
          <View style={styles.gameOverContent}>

            {/* ── Header ── */}
            <View style={styles.gameOverHeader}>
              <Text style={styles.gameOverTitle}>{language === 'en' ? 'GAME OVER' : 'OYUN BİTTİ'}</Text>
              <Text style={[
                styles.resultText,
                {
                  color: (resultText === 'KAZANDIN!' || resultText === 'YOU WON!') ? NEON_GREEN
                       : (resultText === 'BERABERE!' || resultText === 'DRAW!')  ? NEON_GOLD
                       : '#FF4444',
                }
              ]}>{resultText}</Text>
              {forfeitQuitterId && (
                <Text style={styles.forfeitSubtitle} numberOfLines={2} maxFontSizeMultiplier={1.2}>{winnerMessage}</Text>
              )}
            </View>

            {/* ── Scores ── */}
            <View style={styles.finalScoreContainer}>
              {players.sort((a, b) => (scores[b.id] || 0) - (scores[a.id] || 0)).map((p, index) => {
                const kpVal = kpChanges[p.id];
                const coinVal = coinChanges[p.id];
                const isMe = p.id === myOriginalId;
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

                    <Text style={styles.finalScoreValue}>{scores[p.id] || 0} {language === 'en' ? 'Pts' : 'Puan'}</Text>
                  </View>
                );
              })}
            </View>

            {/* ── My updated balance ── */}
            {player?.coins !== undefined && (
              <View style={styles.balanceChip}>
                <Text style={styles.balanceChipLabel}>{language === 'en' ? 'Current Coin Balance' : 'Güncel Jeton Bakiyeniz'}</Text>
                <Text style={styles.balanceChipValue}>{player.coins} 🪙</Text>
              </View>
            )}

            {/* ── Action Buttons ── */}
            <View style={styles.gameOverActions}>
              {winnerIds.includes(myOriginalId) && !rewardCollected && (
                <TouchableOpacity
                  style={styles.rewardButton}
                  onPress={() => {
                    showRewarded(() => {
                      socket.emit('reward_double_coins', { playerId: player?.id });
                      setRewardCollected(true);
                      CustomAlert.show(t('rewardTitle'), t('rewardDoubled'));
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
                <Text style={styles.menuButtonText}>{language === 'en' ? 'BACK TO MAIN MENU' : 'ANA MENÜYE DÖN'}</Text>
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
  const guessingPlayerName = guessingPlayer ? (guessingPlayer.id === myOriginalId ? guessingPlayer.name + " (Sen)" : guessingPlayer.name) : "Oyuncu";

  return (
    <ImageBackground source={bgImageSource} style={styles.bgImage}>
      {/* Dark Cyber Stadium Overlay */}
      <View style={styles.overlay} />

      <SafeAreaView style={styles.container}>
        <View style={[styles.scoreBoard, { paddingTop: topPadding }]}>
          {players.map((p, index) => (
            <Text key={p.id} style={[
              styles.scoreText,
              p.id === myOriginalId ? { borderColor: NEON_BLUE, color: '#fff' } : { borderColor: '#444', color: '#aaa' }
            ]} numberOfLines={1} maxFontSizeMultiplier={1.3}>
              {p.id === myOriginalId ? p.name + " (Sen)" : p.name}: {scores[p.id] || 0}
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
            contentContainerStyle={{ paddingBottom: 5, flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, { flexDirection: 'row', justifyContent: 'center', position: 'relative' }]}>
              <TouchableOpacity 
                onPress={() => {
                  CustomAlert.show(
                    t('exitGameTitle'),
                    t('exitGameMsg'),
                    [
                      { text: t('cancel'), style: 'cancel' },
                      { text: t('exitBtn'), style: 'destructive', onPress: () => {
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
                <Text style={styles.roundText} maxFontSizeMultiplier={1.3}>TUR {currentRound} / {maxRounds}</Text>
                <View style={styles.timerWrap}>
                  <Text style={[styles.timerText, { color: timeLeft <= 10 ? '#ff4444' : NEON_GREEN }]} maxFontSizeMultiplier={1.2}>{timeLeft}</Text>
                </View>
              </View>
            </View>
            
            <View style={[styles.gameArea, keyboardVisible && { justifyContent: 'flex-start' }]}>
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

              const isMyTurn = guessingPlayerId === myOriginalId;

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
              {hints.map((h, i) => (
                <View key={i} style={styles.clueRow}>
                  <Ionicons name="eye-outline" size={14} color={NEON_BLUE} />
                  <Text style={styles.clueText} maxFontSizeMultiplier={1.3}>{h}</Text>

                  {/* First clue row carries the compact potential-score badge on the right */}
                  {i === 0 && (
                    <View style={styles.compactScoreBadge}>
                      <Ionicons name="star" size={10} color={NEON_GOLD} />
                      <Text style={styles.compactScoreText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                        {(() => {
                          if (serverPotentialScore !== null) return `+${serverPotentialScore}`;
                          const hintsPenalty = Math.max(0, hints.length - 1);
                          const revealedLetters = Math.max(0, wordHint.replace(/[\s_]/g, '').length - 1);
                          const potentialScore = Math.max(10, 100 - hintsPenalty * 10 - revealedLetters * 10);
                          return `+${potentialScore}`;
                        })()}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
              {hints.length === 0 && (
                <Text style={styles.emptyCluesText} maxFontSizeMultiplier={1.3}>Henüz ipucu verilmedi...</Text>
              )}
            </View>
            </View>

          {showWrongGuess && (
            <Text style={styles.wrongGuessText} maxFontSizeMultiplier={1.3}>{language === 'en' ? `❌ Wrong Guess! (-${lastPenalty} Pts)` : `❌ Yanlış Tahmin! (-${lastPenalty} Puan)`}</Text>
          )}

          <View style={[styles.inputArea, { paddingBottom: keyboardVisible ? 8 : Math.max(20, insets.bottom + 16) }]}>

            {/* ─── Always-visible Jokers Bar ─────────────────────────────── */}
            <View style={styles.jokersBar}>
              {/* Harf Aç — active any time */}
              <TouchableOpacity
                style={[styles.jokerBtnWide, jokerLoading && { opacity: 0.45 }]}
                onPress={() => useJoker('revealLetters')}
                disabled={jokerLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="text" size={16} color={NEON_PURPLE} />
                <Text style={[styles.jokerBtnLabel, { color: NEON_PURPLE }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.2}>Harf Aç</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText} maxFontSizeMultiplier={1.2}>{player?.jokers?.revealLetters || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* +5 Sn — only active during OWN guess turn */}
              <TouchableOpacity
                style={[
                  styles.jokerBtnWide,
                  (jokerLoading || guessingPlayerId !== myOriginalId) && { opacity: 0.35 },
                ]}
                onPress={() => useJoker('extraTime')}
                disabled={jokerLoading || guessingPlayerId !== myOriginalId}
                activeOpacity={0.8}
              >
                <Ionicons name="time" size={16} color="#00BFFF" />
                <Text style={[styles.jokerBtnLabel, { color: '#00BFFF' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.2}>+5 Sn</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText} maxFontSizeMultiplier={1.2}>{player?.jokers?.extraTime || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* İpucu — active any time */}
              <TouchableOpacity
                style={[styles.jokerBtnWide, jokerLoading && { opacity: 0.45 }]}
                onPress={() => useJoker('instantHints')}
                disabled={jokerLoading}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={16} color={NEON_GREEN} />
                <Text style={[styles.jokerBtnLabel, { color: NEON_GREEN }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.2}>İpucu</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText} maxFontSizeMultiplier={1.2}>{player?.jokers?.instantHints || 0}</Text>
                </View>
              </TouchableOpacity>

              {/* Kalkan — only active during OWN guess turn */}
              <TouchableOpacity
                style={[
                  styles.jokerBtnWide,
                  (jokerLoading || guessingPlayerId !== myOriginalId) && { opacity: 0.35 },
                ]}
                onPress={() => useJoker('shield')}
                disabled={jokerLoading || guessingPlayerId !== myOriginalId}
                activeOpacity={0.8}
              >
                <Ionicons name="shield-checkmark" size={16} color="#FFD700" />
                <Text style={[styles.jokerBtnLabel, { color: '#FFD700' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} maxFontSizeMultiplier={1.2}>Kalkan</Text>
                <View style={styles.jokerBadge}>
                  <Text style={styles.jokerBadgeText} maxFontSizeMultiplier={1.2}>{player?.jokers?.shield || 0}</Text>
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
                  <Text style={styles.buzzerButtonText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                    {buzzerLocked ? 'BEKLEYİN (5)' : '⚡ TAHMİN ET!'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.passBtn, hasPassed && styles.passBtnDisabled]}
                  onPress={sendPass}
                  disabled={hasPassed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.passBtnText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                    {hasPassed
                      ? `✓ PAS (${passVotesCount}/${players.length || 2})`
                      : `⏭ PAS (${passVotesCount}/${players.length || 2})`}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : guessingPlayerId === myOriginalId ? (
              // My guess turn: input + send (no pass — you're the one guessing)
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', width: '100%' }}>
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
                  <Text style={styles.guessTimerText} maxFontSizeMultiplier={1.2}>{guessTimeLeft}s</Text>
                </View>
                <TouchableOpacity style={[styles.guessBtn, { flex: 1 }]} onPress={sendGuess} activeOpacity={0.85}>
                  <Text style={styles.guessBtnText} numberOfLines={1} maxFontSizeMultiplier={1.2}>GÖNDER ▶</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Opponent's guess turn: waiting label + pass
              <View style={{ flexDirection: 'column', gap: 8, width: '100%' }}>
                <View style={styles.waitingContainer}>
                  <Text style={styles.waitingText} numberOfLines={2} maxFontSizeMultiplier={1.3}>
                    ⏳ {guessingPlayerName} {language === 'en' ? `is guessing... (${guessTimeLeft})` : `tahmin ediyor... (${guessTimeLeft})`}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.passBtn, hasPassed && styles.passBtnDisabled, { width: '100%' }]}
                  onPress={sendPass}
                  disabled={hasPassed}
                  activeOpacity={0.85}
                >
                  <Text style={styles.passBtnText} numberOfLines={1} maxFontSizeMultiplier={1.2}>
                    {hasPassed
                      ? `✓ PAS (${passVotesCount}/${players.length || 2})`
                      : `⏭ PAS GEÇ (${passVotesCount}/${players.length || 2})`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 5,
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
  compactScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: NEON_GOLD,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
  },
  compactScoreText: {
    color: NEON_GOLD,
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
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
    gap: 6,
    paddingVertical: 4,
  },
  jokerBtnWide: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  jokerBtnLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 12,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  invisibleInput: {
    // Kept ON-screen (not shifted off with a large negative offset) — some
    // Android IMEs (notably Samsung One UI) refuse to raise the soft
    // keyboard for a focused view positioned outside the visible bounds.
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 40,
    opacity: 0.001,
    zIndex: -1,
  },
  inlineTimerWrap: {
    width: 46,
    height: 40,
    borderRadius: 10,
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
    borderRadius: 20,
    height: 40,
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
  forfeitSubtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 6,
    textAlign: 'center',
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
