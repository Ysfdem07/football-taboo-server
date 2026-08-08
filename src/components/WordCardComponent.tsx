import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD_NEON = '#FFD700';
const DARK_BG = '#08090E';

interface WordCardProps {
  word: string;
  forbidden?: string[];
  category?: string;
  isUnlocked?: boolean;
  onPress?: () => void;
  width?: number;
  compact?: boolean;
  isSelected?: boolean;
}

// Deterministic stat generator based on word name hash
function generateWordicoStats(word: string) {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = (hash << 5) - hash + word.charCodeAt(i);
    hash |= 0;
  }
  const pos = Math.abs(hash);
  const hiz = 75 + (pos % 22);
  const sut = 70 + ((pos >> 2) % 27);
  const pas = 72 + ((pos >> 3) % 25);
  const dribling = 76 + ((pos >> 4) % 23);
  const defans = 40 + ((pos >> 5) % 45);
  const fizik = 65 + ((pos >> 6) % 28);
  const ovr = Math.round((hiz + sut + pas + dribling + defans + fizik) / 6);
  return { hiz, sut, pas, dribling, defans, fizik, ovr };
}

export default function WordCardComponent({
  word,
  forbidden = [],
  category = 'football',
  isUnlocked = true,
  onPress,
  width = 110,
  compact = false,
  isSelected = false,
}: WordCardProps) {
  const isMini = compact || width < 100;
  const cardHeight = width * (isMini ? 1.42 : 1.5);
  const stats = generateWordicoStats(word);

  const ContainerComponent = onPress ? TouchableOpacity : View;

  return (
    <ContainerComponent
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.cardContainer,
        { width, height: cardHeight },
        !isUnlocked && styles.cardLocked,
        isSelected && styles.cardSelectedBorder,
      ]}
    >
      <View style={[styles.innerFrame, !isUnlocked && styles.innerFrameLocked]}>
        
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={[styles.wordicoBrandText, { fontSize: Math.max(6, width * 0.075) }]}>
            WORDICO
          </Text>
          <View style={styles.topRightIconCircle}>
            <Ionicons
              name={category === 'cinema' ? 'film' : category === 'music' ? 'musical-notes' : 'football'}
              size={Math.max(7, width * 0.085)}
              color={isUnlocked ? GOLD_NEON : '#666'}
            />
          </View>
        </View>

        {/* Center Emblem */}
        <View style={styles.visualWrapper}>
          {isUnlocked ? (
            <Image
              source={require('../../assets/images/wordico_winged_w.jpg')}
              style={{ width: width * 0.58, height: width * 0.42, resizeMode: 'contain' }}
            />
          ) : (
            <Ionicons name="lock-closed" size={width * 0.22} color={GOLD_NEON} />
          )}
        </View>

        {/* Bottom Title & 6 Boxed Stats Grid */}
        <View style={styles.bottomInfo}>
          <Text
            style={[styles.cardTitle, { fontSize: Math.max(6.5, Math.min(10.5, width * 0.08)) }]}
            numberOfLines={1}
          >
            {isUnlocked ? word.toUpperCase() : '???'}
          </Text>

          {isUnlocked && (
            <View style={styles.statGridContainer}>
              <View style={styles.statGridRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>HİZ</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.hiz}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>ŞUT</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.sut}</Text>
                </View>
              </View>
              <View style={styles.statGridRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>PAS</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.pas}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>DRB</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.dribling}</Text>
                </View>
              </View>
              <View style={styles.statGridRow}>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>DEF</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.defans}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statBoxLabel, isMini && { fontSize: 5.5 }]}>FİZ</Text>
                  <Text style={[styles.statBoxValue, isMini && { fontSize: 6 }]}>{stats.fizik}</Text>
                </View>
              </View>
            </View>
          )}
        </View>

      </View>
    </ContainerComponent>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: DARK_BG,
    borderRadius: 8,
    borderWidth: 1.2,
    borderColor: GOLD_NEON,
    padding: 1.5,
    shadowColor: GOLD_NEON,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    margin: 1,
  },
  cardSelectedBorder: {
    borderColor: '#39FF14',
    borderWidth: 2,
    shadowColor: '#39FF14',
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 6,
    transform: [{ translateY: -4 }],
  },
  cardLocked: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(10, 11, 16, 0.96)',
    shadowOpacity: 0.1,
  },
  innerFrame: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 215, 0, 0.45)',
    padding: 1.5,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  innerFrameLocked: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 12,
    paddingHorizontal: 1,
  },
  wordicoBrandText: {
    color: GOLD_NEON,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  topRightIconCircle: {
    opacity: 0.9,
  },
  visualWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomInfo: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: 1,
  },
  cardTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  statGridContainer: {
    width: '100%',
    paddingHorizontal: 1,
    marginTop: 1.5,
  },
  statGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 0.5,
  },
  statBox: {
    flex: 0.48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.6,
    borderColor: GOLD_NEON,
    borderRadius: 3,
    paddingHorizontal: 2,
    paddingVertical: 0.5,
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  statBoxLabel: {
    color: GOLD_NEON,
    fontSize: 6.5,
    fontWeight: '600',
  },
  statBoxValue: {
    color: '#FFFFFF',
    fontSize: 7,
    fontWeight: 'bold',
  },
});
