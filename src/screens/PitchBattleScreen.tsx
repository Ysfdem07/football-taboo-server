import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ImageBackground,
  ScrollView,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Line, Circle, Path, Rect, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import WordCardComponent from '../components/WordCardComponent';
import { Analytics } from '../services/analytics';

const GOLD_NEON = '#FFD700';
const CYAN_NEON = '#00FFFF';
const GREEN_NEON = '#39FF14';

interface CardItem {
  id: string;
  word: string;
  forbidden: string[];
  cost: number;
}

interface LaneState {
  id: 'defans' | 'ortasaha' | 'forvet';
  title: string;
  userCards: CardItem[];
  aiCards: CardItem[];
}

const SAMPLE_DECK: CardItem[] = [
  { id: 'p1', word: 'Lionel Messi', forbidden: ['Barcelona', 'Sol Ayak', 'GOAT', '10 Numara', 'Arjantin'], cost: 5 },
  { id: 'p2', word: 'Cristiano Ronaldo', forbidden: ['Real Madrid', '7 Numara', 'Portekiz', 'Juventus', 'Siuuu'], cost: 5 },
  { id: 'p3', word: 'Diego Maradona', forbidden: ['Arjantin', 'Napoli', 'Tanrının Eli', '10 Numara', 'Dünya Kupası'], cost: 4 },
  { id: 'p4', word: 'Zinedine Zidane', forbidden: ['Fransa', 'Real Madrid', 'Kafa Atma', 'Juventus', '10 Numara'], cost: 4 },
  { id: 'p5', word: 'Ronaldinho', forbidden: ['Brezilya', 'Barcelona', 'Çalım', 'Gülümseme', 'Samba'], cost: 3 },
  { id: 'p6', word: 'Alex de Souza', forbidden: ['Fenerbahçe', '10 Numara', 'Brezilya', 'Kaptan', 'Heykel'], cost: 3 },
  { id: 'p7', word: 'Gheorghe Hagi', forbidden: ['Galatasaray', '10 Numara', 'Romanya', 'Sol Ayak', 'Maradona'], cost: 3 },
  { id: 'p8', word: 'Fernando Muslera', forbidden: ['Galatasaray', 'Kaleci', 'Uruguay', 'Kaptan', 'Kurtarış'], cost: 2 },
  { id: 'p9', word: 'Mauro Icardi', forbidden: ['Galatasaray', 'Aşkın Olayım', 'Arjantin', 'Forvet', 'Golcü'], cost: 2 },
  { id: 'p10', word: 'Kylian Mbappe', forbidden: ['Fransa', 'PSG', 'Hızlı', 'Real Madrid', 'Dünya Kupası'], cost: 4 },
];

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PitchBattle'>;
};

// Calculate Power for a card based on lane
function getCardLanePower(word: string, lane: 'defans' | 'ortasaha' | 'forvet'): number {
  let hash = 0;
  for (let i = 0; i < word.length; i++) hash = (hash << 5) - hash + word.charCodeAt(i);
  const pos = Math.abs(hash);
  const hiz = 75 + (pos % 22);
  const sut = 70 + ((pos >> 2) % 27);
  const pas = 72 + ((pos >> 3) % 25);
  const dribling = 76 + ((pos >> 4) % 23);
  const defans = 40 + ((pos >> 5) % 45);
  const fizik = 65 + ((pos >> 6) % 28);

  if (lane === 'defans') return Math.round((defans * 1.3 + fizik * 1.1) * 2.2);
  if (lane === 'ortasaha') return Math.round((pas * 1.3 + dribling * 1.1) * 2.2);
  return Math.round((sut * 1.3 + hiz * 1.1) * 2.2);
}

export default function PitchBattleScreen({ navigation }: Props) {
  // Start Game at Turn 1 with 1 Energy & Empty Field Lanes!
  const [turn, setTurn] = useState<number>(1);
  const [energy, setEnergy] = useState<number>(1);
  const [maxEnergy, setMaxEnergy] = useState<number>(1);
  
  const [userHand, setUserHand] = useState<CardItem[]>([]);
  const [selectedHandCard, setSelectedHandCard] = useState<CardItem | null>(null);

  const [lanes, setLanes] = useState<LaneState[]>([
    { id: 'forvet', title: 'ATTACK', userCards: [], aiCards: [] },
    { id: 'ortasaha', title: 'MIDFIELD', userCards: [], aiCards: [] },
    { id: 'defans', title: 'DEFENSE', userCards: [], aiCards: [] },
  ]);

  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winnerMessage, setWinnerMessage] = useState<string>('');

  const { width } = useWindowDimensions();
  const miniCardWidth = Math.max(50, Math.min(68, Math.floor((width - 64) / 3.6)));

  useEffect(() => {
    Analytics.logScreenView('PitchBattle');
    // Start game dealing 4 initial cards
    setUserHand(SAMPLE_DECK.slice(0, 4));
  }, []);

  // Compute lane scores
  const getLaneScores = (lane: LaneState) => {
    const userScore = lane.userCards.reduce((sum, c) => sum + getCardLanePower(c.word, lane.id), 0);
    const aiScore = lane.aiCards.reduce((sum, c) => sum + getCardLanePower(c.word, lane.id), 0);
    return { userScore, aiScore };
  };

  // Compute total scores
  const getTotalScores = () => {
    let totalUser = 0;
    let totalAI = 0;
    lanes.forEach(l => {
      const { userScore, aiScore } = getLaneScores(l);
      totalUser += userScore;
      totalAI += aiScore;
    });
    return { totalUser, totalAI };
  };

  // Place card into a lane
  const handleSelectLane = (targetLaneId: 'defans' | 'ortasaha' | 'forvet') => {
    if (!selectedHandCard) return;

    if (selectedHandCard.cost > energy) {
      CustomAlert.show('Yetersiz Enerji', `Bu kart ${selectedHandCard.cost} enerji istiyor. Mevcut enerjin: ${energy}`);
      return;
    }

    const targetLane = lanes.find(l => l.id === targetLaneId);
    if (targetLane && targetLane.userCards.length >= 3) {
      CustomAlert.show('Bölge Dolu', 'Her bölgeye en fazla 3 kart yerleştirebilirsin!');
      return;
    }

    setLanes(prev => prev.map(lane => {
      if (lane.id === targetLaneId) {
        return { ...lane, userCards: [...lane.userCards, selectedHandCard] };
      }
      return lane;
    }));

    setEnergy(prev => prev - selectedHandCard.cost);
    setUserHand(prev => prev.filter(c => c.id !== selectedHandCard.id));
    setSelectedHandCard(null);
  };

  // End Turn & AI Move
  const handleEndTurn = () => {
    if (turn >= 6) {
      finishGame();
      return;
    }

    const currentTurn = turn;
    const nextTurn = currentTurn + 1;
    const nextMaxEnergy = Math.min(6, nextTurn);

    // AI plays 1 card into open lanes
    const usedIds = [
      ...userHand.map(h => h.id),
      ...lanes.flatMap(l => [...l.userCards.map(uc => uc.id), ...l.aiCards.map(ac => ac.id)])
    ];
    const availableAICards = SAMPLE_DECK.filter(c => !usedIds.includes(c.id));
    
    if (availableAICards.length > 0) {
      const randomAICard = availableAICards[Math.floor(Math.random() * availableAICards.length)];
      const openLanes = lanes.filter(l => l.aiCards.length < 3);
      if (openLanes.length > 0 && randomAICard) {
        const randomLane = openLanes[Math.floor(Math.random() * openLanes.length)];
        setLanes(prev => prev.map(lane => {
          if (lane.id === randomLane.id) {
            return { ...lane, aiCards: [...lane.aiCards, randomAICard] };
          }
          return lane;
        }));
      }
    }

    if (userHand.length < 5) {
      const drawnCard = SAMPLE_DECK.find(c => !usedIds.includes(c.id));
      if (drawnCard) {
        setUserHand(prev => [...prev, drawnCard]);
      }
    }

    setTurn(nextTurn);
    setMaxEnergy(nextMaxEnergy);
    setEnergy(nextMaxEnergy);

    if (nextTurn > 6) {
      finishGame();
    }
  };

  const finishGame = () => {
    let userWonLanes = 0;
    let aiWonLanes = 0;
    let { totalUser, totalAI } = getTotalScores();

    lanes.forEach(lane => {
      const { userScore, aiScore } = getLaneScores(lane);
      if (userScore > aiScore) userWonLanes++;
      else if (aiScore > userScore) aiWonLanes++;
    });

    let msg = '';
    if (userWonLanes >= 2) {
      msg = `🎉 MÜKEMMEL ZAFER! (${userWonLanes} Bölge Kazandın)\nToplam Puan: ${totalUser} - ${totalAI}`;
    } else if (aiWonLanes >= 2) {
      msg = `💔 MAĞLUBİYET! Rakip ${aiWonLanes} Bölge Kazandı.\nToplam Puan: ${totalUser} - ${totalAI}`;
    } else {
      if (totalUser >= totalAI) {
        msg = `🎉 BERABERLİKTE ZAFER! Toplam Puan Üstünlüğü (${totalUser} vs ${totalAI})`;
      } else {
        msg = `💔 BERABERLİKTE MAĞLUBİYET! Toplam Puan (${totalUser} vs ${totalAI})`;
      }
    }

    setWinnerMessage(msg);
    setGameOver(true);
  };

  return (
    <LinearGradient colors={['#03050B', '#091224', '#050B18', '#020409']} style={styles.container}>
      
      {/* Dark Stadium Floodlight Overlay */}
      <View style={styles.stadiumFloodlights}>
        <LinearGradient colors={['rgba(0, 255, 255, 0.25)', 'transparent']} style={styles.lightBeamLeft} />
        <LinearGradient colors={['rgba(255, 215, 0, 0.25)', 'transparent']} style={styles.lightBeamRight} />
      </View>

      <SafeAreaView style={styles.safeContainer}>
        
        {/* Top Scoreboard Badges Header: DEFANS (Cyan), ORTA SAHA (Gold), FORVET (Gold) */}
        <View style={styles.topScoreboardBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={GOLD_NEON} />
          </TouchableOpacity>

          <View style={styles.zonesScoreHeader}>
            {lanes.map((lane) => {
              const { userScore, aiScore } = getLaneScores(lane);
              const isDefans = lane.id === 'defans';
              const color = isDefans ? CYAN_NEON : GOLD_NEON;
              return (
                <View key={lane.id} style={[styles.zoneHeaderBadge, { borderColor: color }]}>
                  <View style={[styles.zoneTitleChip, { borderColor: color }]}>
                    <Text style={[styles.zoneTitleText, { color }]}>{lane.title}</Text>
                  </View>
                  <View style={styles.zoneScoreRow}>
                    <Text style={styles.aiScoreText}>{aiScore}</Text>
                    <Text style={styles.vsText}>vs</Text>
                    <Text style={styles.userScoreText}>{userScore}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Central Perspective Board View with Horizontally Aligned Pitch Background */}
        <View style={styles.perspectiveBoardWrapper}>
          
          {/* Pitch Image Rotated Horizontally & Scaled so Goals appear on Left & Right */}
          <View style={styles.pitchImageWrapper}>
            <ImageBackground
              source={require('../../assets/images/pitch_perspective_bg.jpg')}
              style={styles.pitchImage}
              resizeMode="cover"
            />
          </View>

          {/* SVG Overlay: Neon Zone Dividers & Goal Nets */}
          <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
            <Defs>
              <SvgGradient id="cyanLine" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#00FFFF" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#00FFFF" stopOpacity="0.4" />
              </SvgGradient>
              <SvgGradient id="goldLine" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
                <Stop offset="100%" stopColor="#FFD700" stopOpacity="0.4" />
              </SvgGradient>
            </Defs>

            {/* Field Outer Border Line */}
            <Rect x="2%" y="2%" width="96%" height="96%" rx="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" fill="none" />
          </Svg>

          {/* 3 Interactive Field Lanes */}
          <View style={styles.lanesGrid}>
            {lanes.map((lane) => {
              const isDefans = lane.id === 'defans';
              const isOrtaSaha = lane.id === 'ortasaha';
              const borderColor = isDefans ? CYAN_NEON : isOrtaSaha ? GOLD_NEON : '#FF4500';

              return (
                <TouchableOpacity
                  key={lane.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectLane(lane.id)}
                  style={[
                    styles.laneColumn,
                    selectedHandCard && styles.laneColumnHighlight,
                  ]}
                >
                  {/* Top Zone: OPPONENT (PLAYER 2) VISIBLE CARDS */}
                  <View style={styles.opponentCardsZone} pointerEvents="none">
                    {lane.aiCards.map((c, idx) => (
                      <WordCardComponent
                        key={idx}
                        word={c.word}
                        forbidden={c.forbidden}
                        width={miniCardWidth}
                        compact={true}
                      />
                    ))}
                  </View>

                  {/* Bottom Zone: PLAYER 1 (USER) VISIBLE CARDS */}
                  <View style={styles.userCardsZone} pointerEvents="none">
                    {lane.userCards.map((c, idx) => (
                      <WordCardComponent
                        key={idx}
                        word={c.word}
                        forbidden={c.forbidden}
                        width={miniCardWidth}
                        compact={true}
                      />
                    ))}
                  </View>

                  {selectedHandCard && lane.userCards.length < 3 && (
                    <View style={styles.placeOverlay}>
                      <Text style={styles.placeOverlayText}>+ SAHAYA KOY</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

        </View>

        {/* Dynamic Action Bar when a Card in Hand is Selected */}
        {selectedHandCard && (
          <View style={styles.placementActionsBar}>
            <Text style={styles.placementTitleText}>
              ⚡ {selectedHandCard.word.toUpperCase()} Hangi Bölgeye Konulsun?
            </Text>
            <View style={styles.placementButtonsRow}>
              <TouchableOpacity
                style={[styles.placementBtn, { borderColor: CYAN_NEON }]}
                onPress={() => handleSelectLane('defans')}
              >
                <Ionicons name="shield-outline" size={13} color={CYAN_NEON} />
                <Text style={[styles.placementBtnText, { color: CYAN_NEON }]}>DEFANS</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.placementBtn, { borderColor: GOLD_NEON }]}
                onPress={() => handleSelectLane('ortasaha')}
              >
                <Ionicons name="football-outline" size={13} color={GOLD_NEON} />
                <Text style={[styles.placementBtnText, { color: GOLD_NEON }]}>ORTA SAHA</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.placementBtn, { borderColor: GREEN_NEON }]}
                onPress={() => handleSelectLane('forvet')}
              >
                <Ionicons name="flame-outline" size={13} color={GREEN_NEON} />
                <Text style={[styles.placementBtnText, { color: GREEN_NEON }]}>FORVET</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Control Bar: Energy Capsule | TUR 1/6 | TURU BİTİR > */}
        <View style={styles.bottomControlBar}>
          {/* Energy Capsule */}
          <View style={styles.energyCapsule}>
            <Text style={styles.energyNumberText}>{energy}/{maxEnergy}</Text>
            <View style={styles.energySpheresRow}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.energySphere,
                    i <= energy ? styles.energySphereActive : styles.energySphereInactive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Turn Counter */}
          <Text style={styles.turnCounterText}>TUR {turn}/6</Text>

          {/* End Turn Button */}
          <TouchableOpacity style={styles.endTurnButton} onPress={handleEndTurn}>
            <Text style={styles.endTurnButtonText}>{turn >= 6 ? 'BİTİR' : 'TURU BİTİR >'}</Text>
          </TouchableOpacity>
        </View>

        {/* Ultra-Compact Player Hand Cards Carousel at Bottom */}
        <View style={styles.handWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.handScroll}>
            {userHand.map((c) => {
              const isSelected = selectedHandCard?.id === c.id;
              return (
                <View key={c.id} style={styles.handCardContainer}>
                  <View style={styles.costBadge} pointerEvents="none">
                    <Text style={styles.costBadgeText}>⚡{c.cost}</Text>
                  </View>
                  <WordCardComponent
                    word={c.word}
                    forbidden={c.forbidden}
                    width={miniCardWidth * 0.95}
                    compact={true}
                    isSelected={isSelected}
                    onPress={() => setSelectedHandCard(isSelected ? null : c)}
                  />
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Victory / Defeat Modal */}
        <Modal visible={gameOver} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Ionicons name="trophy" size={54} color={GOLD_NEON} />
              <Text style={styles.modalTitle}>MAÇ SONUCU</Text>
              <Text style={styles.modalMessage}>{winnerMessage}</Text>
              
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  setGameOver(false);
                  navigation.goBack();
                }}
              >
                <Text style={styles.modalBtnText}>ANA MENÜYE DÖN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  stadiumFloodlights: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'space-between',
    pointerEvents: 'none',
  },
  lightBeamLeft: { width: '45%', height: '35%', opacity: 0.7 },
  lightBeamRight: { width: '45%', height: '35%', opacity: 0.7 },
  safeContainer: { flex: 1, justifyContent: 'space-between' },

  perspectiveBoardWrapper: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    marginVertical: 4,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    backgroundColor: '#040B16',
  },
  pitchImageWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  pitchImage: {
    width: '100%',
    height: '100%',
    opacity: 1.0,
  },

  topScoreboardBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 2,
  },
  backBtn: { padding: 4, marginRight: 2 },
  zonesScoreHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 4,
  },
  zoneHeaderBadge: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 22, 0.88)',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 3,
    alignItems: 'center',
  },
  zoneTitleChip: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  zoneTitleText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 9.5,
    letterSpacing: 0.6,
  },
  zoneScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  aiScoreText: { color: CYAN_NEON, fontFamily: 'Poppins_700Bold', fontSize: 13 },
  vsText: { color: '#AAA', fontSize: 9, fontWeight: '600' },
  userScoreText: { color: GOLD_NEON, fontFamily: 'Poppins_700Bold', fontSize: 13 },

  lanesGrid: {
    flex: 1,
    flexDirection: 'column',
    marginVertical: 4,
    gap: 4,
    zIndex: 10,
  },
  laneColumn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  laneColumnHighlight: {
    backgroundColor: 'rgba(57, 255, 20, 0.15)',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GREEN_NEON,
  },
  opponentCardsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userCardsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  placeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(57, 255, 20, 0.25)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeOverlayText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 9,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },

  placementActionsBar: {
    backgroundColor: 'rgba(12, 16, 26, 0.95)',
    borderWidth: 1.5,
    borderColor: GOLD_NEON,
    borderRadius: 10,
    marginHorizontal: 8,
    marginVertical: 2,
    padding: 5,
    alignItems: 'center',
  },
  placementTitleText: {
    color: GOLD_NEON,
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  placementButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 6,
  },
  placementBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  placementBtnText: {
    fontWeight: 'bold',
    fontSize: 9.5,
  },

  bottomControlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginVertical: 2,
  },
  energyCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 12, 22, 0.92)',
    borderWidth: 1.5,
    borderColor: GREEN_NEON,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
    gap: 5,
  },
  energyNumberText: { color: GREEN_NEON, fontWeight: 'bold', fontSize: 12 },
  energySpheresRow: { flexDirection: 'row', gap: 3 },
  energySphere: { width: 9, height: 9, borderRadius: 4.5 },
  energySphereActive: { backgroundColor: GREEN_NEON },
  energySphereInactive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  turnCounterText: { color: CYAN_NEON, fontFamily: 'Poppins_900Black', fontSize: 13 },
  endTurnButton: {
    backgroundColor: GOLD_NEON,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
  },
  endTurnButtonText: { color: '#000', fontFamily: 'Poppins_700Bold', fontSize: 11.5 },

  handWrapper: {
    paddingHorizontal: 4,
    paddingBottom: 2,
  },
  handScroll: {
    paddingRight: 8,
    alignItems: 'center',
  },
  handCardContainer: {
    marginHorizontal: 2,
  },
  costBadge: {
    position: 'absolute',
    top: 2,
    right: 3,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderWidth: 1,
    borderColor: GOLD_NEON,
    borderRadius: 6,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
  },
  costBadgeText: { color: GOLD_NEON, fontSize: 8, fontWeight: 'bold' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#10121C',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: GOLD_NEON,
    padding: 24,
    alignItems: 'center',
    width: '90%',
  },
  modalTitle: { color: GOLD_NEON, fontSize: 22, fontWeight: 'bold', marginVertical: 12 },
  modalMessage: { color: '#FFF', fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  modalBtn: {
    backgroundColor: GOLD_NEON,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 },
});
