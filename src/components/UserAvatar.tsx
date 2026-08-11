import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export interface AvatarOption {
  id: string;
  name: string;
  category: string;
  iconType: 'Ionicons' | 'MaterialCommunityIcons';
  iconName: string;
  colors: [string, string];
  borderColor: string;
  badgeText: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  {
    id: 'cyber_fox',
    name: 'Siber Tilki',
    category: 'Cartoon Gamer',
    iconType: 'MaterialCommunityIcons',
    iconName: 'fox',
    colors: ['#FF512F', '#DD2476'],
    borderColor: '#FF512F',
    badgeText: 'TILKİ'
  },
  {
    id: 'lion_king',
    name: 'Aslan Kral',
    category: 'Cartoon Gamer',
    iconType: 'Ionicons',
    iconName: 'paw',
    colors: ['#F857A6', '#FF5858'],
    borderColor: '#FFD700',
    badgeText: 'KRAL'
  },
  {
    id: 'panda_gamer',
    name: 'Panda Oyuncu',
    category: 'Cartoon Gamer',
    iconType: 'MaterialCommunityIcons',
    iconName: 'panda',
    colors: ['#00F2FE', '#4FACFE'],
    borderColor: '#00F2FE',
    badgeText: 'PANDA'
  },
  {
    id: 'soccer_hero',
    name: 'Futbol Efsanesi',
    category: 'Football',
    iconType: 'Ionicons',
    iconName: 'football',
    colors: ['#11998E', '#38EF7D'],
    borderColor: '#38EF7D',
    badgeText: 'GOAT'
  },
  {
    id: 'cyber_hero',
    name: 'Siber Şampiyon',
    category: 'Gaming',
    iconType: 'Ionicons',
    iconName: 'game-controller',
    colors: ['#8E2DE2', '#4A00E0'],
    borderColor: '#A855F7',
    badgeText: 'ESPOR'
  },
  {
    id: 'flash_speed',
    name: 'Yıldırım Kahraman',
    category: 'Gaming',
    iconType: 'Ionicons',
    iconName: 'flash',
    colors: ['#FFB75E', '#ED8F03'],
    borderColor: '#FFD700',
    badgeText: 'FLASH'
  },
  {
    id: 'diamond_dragon',
    name: 'Elmas Ejder',
    category: 'Special',
    iconType: 'MaterialCommunityIcons',
    iconName: 'dragon',
    colors: ['#00C6FF', '#0072FF'],
    borderColor: '#00F0FF',
    badgeText: 'ELİT'
  },
  {
    id: 'ninja_ace',
    name: 'Ninja Nişancı',
    category: 'Gaming',
    iconType: 'MaterialCommunityIcons',
    iconName: 'ninja',
    colors: ['#FF416C', '#FF4B2B'],
    borderColor: '#FF416C',
    badgeText: 'NINJA'
  },
  {
    id: 'cyber_knight',
    name: 'Zırhlı Şövalye',
    category: 'Gaming',
    iconType: 'MaterialCommunityIcons',
    iconName: 'shield-crown',
    colors: ['#616161', '#242424'],
    borderColor: '#E2E8F0',
    badgeText: 'ŞÖVALYE'
  },
  {
    id: 'cinema_director',
    name: 'Sinema Yıldızı',
    category: 'Cinema',
    iconType: 'Ionicons',
    iconName: 'videocam',
    colors: ['#B224EF', '#7579FF'],
    borderColor: '#E040FB',
    badgeText: 'SİNEMA'
  },
  {
    id: 'music_maestro',
    name: 'Ses Virtüözü',
    category: 'Music',
    iconType: 'Ionicons',
    iconName: 'musical-notes',
    colors: ['#F107A3', '#7B2CBF'],
    borderColor: '#FF1493',
    badgeText: 'MÜZİK'
  },
  {
    id: 'golden_trophy',
    name: 'Altın Kupa',
    category: 'Special',
    iconType: 'Ionicons',
    iconName: 'trophy',
    colors: ['#FFE000', '#799F0C'],
    borderColor: '#FFD700',
    badgeText: 'ŞAMPİYON'
  }
];

const EMOJI_MAP: Record<string, string> = {
  '⚽': 'soccer_hero',
  '👑': 'lion_king',
  '🔥': 'ninja_ace',
  '⚡': 'flash_speed',
  '💎': 'diamond_dragon',
  '🚀': 'cyber_hero',
  '🌟': 'cyber_fox',
  '🎯': 'ninja_ace',
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
  const iconSize = Math.round(size * 0.54);

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
        {option.iconType === 'MaterialCommunityIcons' ? (
          <MaterialCommunityIcons name={option.iconName as any} size={iconSize} color="#FFFFFF" />
        ) : (
          <Ionicons name={option.iconName as any} size={iconSize} color="#FFFFFF" />
        )}
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
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  badgePill: {
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(5, 11, 20, 0.9)',
  },
  badgeText: {
    fontSize: 9,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  }
});
