import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

interface Clue {
  clueId: string;
  entityId: string;
  text: string;
  type: string;
  strength: number;
  isTop5: boolean;
}

interface Props {
  clues: Clue[]; // ordered by strength ascending
}

/**
 * Displays clues one by one with timed reveal.
 * Schedule: 0s, 2s, 5s, 8s, 11s (total 13 seconds).
 */
export default function CluePanel({ clues }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    const schedule = [0, 2000, 5000, 8000, 11000];
    const timers: NodeJS.Timeout[] = [];
    schedule.forEach((delay, idx) => {
      const t = setTimeout(() => {
        setVisibleCount((prev) => Math.max(prev, idx + 1));
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }, delay);
      timers.push(t);
    });
    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, []);

  return (
    <View style={styles.container}>
      {clues.slice(0, visibleCount).map((clue) => (
        <Animated.View key={clue.clueId} style={[styles.clueBox, { opacity: opacityAnim }]}> 
          <Text style={styles.clueText}>{clue.text}</Text>
          <View style={[styles.strengthBadge, { backgroundColor: strengthColor(clue.strength) }]}>
            <Text style={styles.badgeText}>G{clue.strength}</Text>
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

function strengthColor(strength: number): string {
  switch (strength) {
    case 1:
      return '#a3d5ff'; // weak
    case 2:
      return '#66b2ff';
    case 3:
      return '#3385ff';
    case 4:
      return '#0052cc'; // strong
    default:
      return '#999';
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  clueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  clueText: {
    color: Colors.white,
    fontSize: 18,
    flex: 1,
  },
  strengthBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
});
