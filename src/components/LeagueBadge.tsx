import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { LeagueInfo } from '../utils/LeagueHelper';

interface LeagueBadgeProps {
  league: LeagueInfo;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({ 
  league, 
  size = 'medium',
  showLabel = false 
}) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const badgeSize = isSmall ? 32 : isLarge ? 56 : 42;
  const iconSize = isSmall ? 16 : isLarge ? 28 : 20;

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.badgeFrame, 
          { 
            width: badgeSize, 
            height: badgeSize, 
            borderRadius: badgeSize / 2,
            borderColor: league.color,
            shadowColor: league.color,
          }
        ]}
      >
        <LinearGradient
          colors={league.badgeBg}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons 
          name={league.vectorIcon as any} 
          size={iconSize} 
          color={league.color} 
        />
      </View>

      {showLabel && (
        <View style={[styles.labelPill, { borderColor: `${league.color}60` }]}>
          <Text style={[styles.labelText, { color: league.color }]} allowFontScaling={false}>
            {league.name}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeFrame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 6,
  },
  labelPill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.8)',
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  }
});
