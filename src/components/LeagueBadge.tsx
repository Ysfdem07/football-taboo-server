import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LeagueInfo, getLeagueLogo } from '../utils/LeagueHelper';

interface LeagueBadgeProps {
  league: LeagueInfo;
  categoryId?: string;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({ 
  league, 
  categoryId = 'football',
  size = 'medium',
  showLabel = false 
}) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const badgeSize = isSmall ? 40 : isLarge ? 72 : 54;
  const imageSize = badgeSize - 4;
  const logoSource = getLeagueLogo(categoryId, league.id);

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
        <Image 
          source={logoSource} 
          style={{ width: imageSize, height: imageSize, borderRadius: imageSize / 2 }}
          resizeMode="cover"
        />
      </View>

      {showLabel && (
        <View style={[styles.labelPill, { borderColor: `${league.color}80` }]}>
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
    shadowOpacity: 0.85,
    shadowRadius: 10,
    elevation: 8,
    backgroundColor: '#0F172A',
  },
  labelPill: {
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.9)',
  },
  labelText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  }
});
