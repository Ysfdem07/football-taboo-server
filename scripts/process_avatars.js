const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const srcDir = 'C:/Users/ysfde/OneDrive/Desktop/Avatar';
const destDir = 'C:/Dev/FootballTaboo/assets/avatars';
const avatarComponentPath = 'C:/Dev/FootballTaboo/src/components/UserAvatar.tsx';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Clean old files in destDir
fs.readdirSync(destDir).forEach(f => {
  if (f.startsWith('avatar_')) {
    fs.unlinkSync(path.join(destDir, f));
  }
});

const files = fs.readdirSync(srcDir);
const sorted = files.filter(f => f.match(/^Avatar_\d+/i)).sort((a, b) => {
  const numA = parseInt(a.match(/\d+/)[0], 10);
  const numB = parseInt(b.match(/\d+/)[0], 10);
  return numA - numB;
});

const totalCount = sorted.length;

async function processImages() {
  for (let i = 0; i < totalCount; i++) {
    const file = sorted[i];
    const srcPath = path.join(srcDir, file);
    const destName = `avatar_${i + 1}.png`;
    const destPath = path.join(destDir, destName);
    
    await sharp(srcPath)
      .resize(512, 512, { fit: 'cover' })
      .png({ quality: 90, compressionLevel: 8 })
      .toFile(destPath);
      
    console.log(`Processed ${file} -> ${destName}`);
  }

  // Generate UserAvatar.tsx
  const mapEntries = Array.from({ length: totalCount }, (_, i) => 
    `  avatar_${i + 1}: require('../../assets/avatars/avatar_${i + 1}.png'),`
  ).join('\n');

  const componentCode = `import React from 'react';
import { View, Image, StyleSheet, ImageSourcePropType } from 'react-native';

export interface AvatarOption {
  id: string;
  image: ImageSourcePropType;
  borderColor: string;
}

export const AVATAR_MAP: Record<string, ImageSourcePropType> = {
${mapEntries}
};

const BORDER_COLORS = [
  '#00FF88', '#00BFFF', '#A855F7', '#FFD700', '#FF1493',
  '#39FF14', '#00F0FF', '#FF5722', '#FACC15', '#C026D3',
  '#10B981', '#38BDF8', '#EC4899', '#F59E0B', '#A0AEC0',
  '#E11D48', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
  '#D946EF', '#6366F1', '#14B8A6', '#EAB308'
];

export const AVATAR_OPTIONS: AvatarOption[] = Array.from({ length: ${totalCount} }, (_, i) => {
  const id = \`avatar_\${i + 1}\`;
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
`;

  fs.writeFileSync(avatarComponentPath, componentCode, 'utf8');
  console.log(`Updated UserAvatar.tsx with ${totalCount} avatars!`);
}

processImages().then(() => console.log(`Done! Total ${totalCount} avatars processed successfully!`));
