import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface UserAvatarProps {
  avatar?: string;
  size?: number;
}

const AVATAR_MAP: Record<string, { icon: string; colors: [string, string]; borderColor: string }> = {
  '⚽': { icon: 'football', colors: ['#059669', '#022C22'], borderColor: '#10B981' },
  '👑': { icon: 'ribbon', colors: ['#D97706', '#451A03'], borderColor: '#F59E0B' },
  '🔥': { icon: 'flame', colors: ['#EA580C', '#431407'], borderColor: '#F97316' },
  '⚡': { icon: 'flash', colors: ['#EAB308', '#422006'], borderColor: '#FACC15' },
  '💎': { icon: 'diamond', colors: ['#0284C7', '#0C4A6E'], borderColor: '#38BDF8' },
  '🚀': { icon: 'rocket', colors: ['#C026D3', '#4C0519'], borderColor: '#F472B6' },
  '🌟': { icon: 'star', colors: ['#9333EA', '#3B0764'], borderColor: '#A855F7' },
  '🎯': { icon: 'disc', colors: ['#DC2626', '#450A0A'], borderColor: '#EF4444' },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({ avatar = '⚽', size = 38 }) => {
  const config = AVATAR_MAP[avatar || '⚽'] || AVATAR_MAP['⚽'];
  const iconSize = Math.round(size * 0.52);

  return (
    <View 
      style={[
        styles.avatarCircle, 
        { 
          width: size, 
          height: size, 
          borderRadius: size / 2, 
          borderColor: config.borderColor,
          shadowColor: config.borderColor 
        }
      ]}
    >
      <LinearGradient
        colors={config.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <Ionicons name={config.icon as any} size={iconSize} color={config.borderColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarCircle: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  }
});
