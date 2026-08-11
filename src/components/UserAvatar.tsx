import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface AvatarOption {
  id: string;
  name: string;
  category: 'Football' | 'Gaming' | 'Special' | 'Cinema' | 'Music';
  icon: string;
  colors: [string, string];
  borderColor: string;
  badgeText: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'soccer_hero',
    name: 'Saha Yıldızı',
    category: 'Football',
    icon: 'football',
    colors: ['#059669', '#022C22'],
    borderColor: '#39FF14',
    badgeText: 'FUTBOL'
  },
  {
    id: 'cyber_striker',
    name: 'Siber Golcü',
    category: 'Gaming',
    icon: 'game-controller',
    colors: ['#0284C7', '#0F172A'],
    borderColor: '#38BDF8',
    badgeText: 'ESPOR'
  },
  {
    id: 'neon_crown',
    name: 'Kral Şampiyon',
    category: 'Special',
    icon: 'ribbon',
    colors: ['#D97706', '#451A03'],
    borderColor: '#FFD700',
    badgeText: 'EFSANE'
  },
  {
    id: 'flame_master',
    name: 'Alev Fırtınası',
    category: 'Gaming',
    icon: 'flame',
    colors: ['#EA580C', '#431407'],
    borderColor: '#FF5722',
    badgeText: 'YANGIN'
  },
  {
    id: 'flash_speed',
    name: 'Yıldırım Hızı',
    category: 'Gaming',
    icon: 'flash',
    colors: ['#CA8A04', '#422006'],
    borderColor: '#FACC15',
    badgeText: 'HIZLI'
  },
  {
    id: 'diamond_elite',
    name: 'Elmas Seçkin',
    category: 'Special',
    icon: 'diamond',
    colors: ['#0284C7', '#0C4A6E'],
    borderColor: '#00F0FF',
    badgeText: 'ELİT'
  },
  {
    id: 'cyber_star',
    name: 'Galaksi Yıldızı',
    category: 'Special',
    icon: 'star',
    colors: ['#9333EA', '#3B0764'],
    borderColor: '#D8B4FE',
    badgeText: 'STAR'
  },
  {
    id: 'bullseye_master',
    name: 'Keskin Nişancı',
    category: 'Gaming',
    icon: 'disc',
    colors: ['#DC2626', '#450A0A'],
    borderColor: '#FF2A6D',
    badgeText: 'HEDEF'
  },
  {
    id: 'shield_guardian',
    name: 'Çelik Muhafız',
    category: 'Gaming',
    icon: 'shield-checkmark',
    colors: ['#475569', '#0F172A'],
    borderColor: '#94A3B8',
    badgeText: 'DEFANS'
  },
  {
    id: 'cinema_director',
    name: 'Yönetmen',
    category: 'Cinema',
    icon: 'videocam',
    colors: ['#7E22CE', '#3B0764'],
    borderColor: '#C026D3',
    badgeText: 'SİNEMA'
  },
  {
    id: 'music_maestro',
    name: 'Ses Maestrosu',
    category: 'Music',
    icon: 'musical-notes',
    colors: ['#BE185D', '#4C0519'],
    borderColor: '#FF1493',
    badgeText: 'MÜZİK'
  },
  {
    id: 'golden_trophy',
    name: 'Kupa Avcısı',
    category: 'Special',
    icon: 'trophy',
    colors: ['#B45309', '#451A03'],
    borderColor: '#F59E0B',
    badgeText: 'ŞAMPİYON'
  }
];

const EMOJI_MAP: Record<string, string> = {
  '⚽': 'soccer_hero',
  '👑': 'neon_crown',
  '🔥': 'flame_master',
  '⚡': 'flash_speed',
  '💎': 'diamond_elite',
  '🚀': 'cyber_star',
  '🌟': 'cyber_star',
  '🎯': 'bullseye_master',
};

export function getAvatarOption(avatarIdOrEmoji?: string): AvatarOption {
  if (!avatarIdOrEmoji) return AVATAR_OPTIONS[0];

  const mappedId = EMOJI_MAP[avatarIdOrEmoji] || avatarIdOrEmoji;
  const found = AVATAR_OPTIONS.find(a => a.id === mappedId);
  return found || AVATAR_OPTIONS[0];
}

interface UserAvatarProps {
  avatar?: string;
  size?: number;
  showBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatar, 
  size = 40,
  showBadge = false 
}) => {
  const option = getAvatarOption(avatar);
  const iconSize = Math.round(size * 0.52);

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.avatarFrame, 
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2, 
            borderColor: option.borderColor,
            shadowColor: option.borderColor 
          }
        ]}
      >
        <LinearGradient
          colors={option.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <Ionicons name={option.icon as any} size={iconSize} color={option.borderColor} />
      </View>

      {showBadge && (
        <View style={[styles.badgePill, { borderColor: option.borderColor }]}>
          <Text style={[styles.badgeText, { color: option.borderColor }]} allowFontScaling={false}>
            {option.badgeText}
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
  avatarFrame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  badgePill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.85)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  }
});
