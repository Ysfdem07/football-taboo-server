import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

export interface AvatarOption {
  id: string;
  image: ImageSourcePropType;
  borderColor: string;
}

export const AVATAR_MAP: Record<string, ImageSourcePropType> = {
  avatar_1: require('../../assets/avatars/avatar_1.png'),
  avatar_2: require('../../assets/avatars/avatar_2.png'),
  avatar_3: require('../../assets/avatars/avatar_3.png'),
  avatar_4: require('../../assets/avatars/avatar_4.png'),
  avatar_5: require('../../assets/avatars/avatar_5.png'),
  avatar_6: require('../../assets/avatars/avatar_6.png'),
  avatar_7: require('../../assets/avatars/avatar_7.png'),
  avatar_8: require('../../assets/avatars/avatar_8.png'),
  avatar_9: require('../../assets/avatars/avatar_9.png'),
  avatar_10: require('../../assets/avatars/avatar_10.png'),
  avatar_11: require('../../assets/avatars/avatar_11.png'),
  avatar_12: require('../../assets/avatars/avatar_12.png'),
  avatar_13: require('../../assets/avatars/avatar_13.png'),
  avatar_14: require('../../assets/avatars/avatar_14.png'),
  avatar_15: require('../../assets/avatars/avatar_15.png'),
};

const BORDER_COLORS = [
  '#00FF88', '#00BFFF', '#A855F7', '#FFD700', '#FF1493',
  '#39FF14', '#00F0FF', '#FF5722', '#FACC15', '#C026D3',
  '#10B981', '#38BDF8', '#EC4899', '#F59E0B', '#A0AEC0'
];

export const AVATAR_OPTIONS: AvatarOption[] = Array.from({ length: 15 }, (_, i) => {
  const id = `avatar_${i + 1}`;
  return {
    id,
    image: AVATAR_MAP[id],
    borderColor: BORDER_COLORS[i % BORDER_COLORS.length],
  };
});

const LEGACY_MAP: Record<string, string> = {
  '⚽': 'avatar_1',
  '👑': 'avatar_2',
  '🔥': 'avatar_3',
  '⚡': 'avatar_4',
  '💎': 'avatar_5',
  '🚀': 'avatar_6',
  '🌟': 'avatar_7',
  '🎯': 'avatar_8',
  'soccer_hero': 'avatar_1',
  'cyber_fox': 'avatar_2',
  'lion_king': 'avatar_3',
  'panda_gamer': 'avatar_4',
  'cyber_hero': 'avatar_5',
  'flash_speed': 'avatar_6',
  'diamond_dragon': 'avatar_7',
  'ninja_ace': 'avatar_8',
  'cyber_knight': 'avatar_9',
  'cinema_director': 'avatar_10',
  'music_maestro': 'avatar_11',
  'golden_trophy': 'avatar_12',
};

export function getAvatarOption(avatarIdOrEmoji?: string): AvatarOption {
  if (!avatarIdOrEmoji) return AVATAR_OPTIONS[0];

  const mappedId = LEGACY_MAP[avatarIdOrEmoji] || avatarIdOrEmoji;
  const found = AVATAR_OPTIONS.find(a => a.id === mappedId);
  return found || AVATAR_OPTIONS[0];
}

interface UserAvatarProps {
  avatar?: string;
  size?: number;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  avatar, 
  size = 40
}) => {
  const option = getAvatarOption(avatar);

  return (
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
      <Image 
        source={option.image} 
        style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  avatarFrame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: '#0F172A',
  }
});
