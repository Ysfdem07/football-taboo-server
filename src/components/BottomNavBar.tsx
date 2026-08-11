import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface BottomNavBarProps {
  activeTab: 'home' | 'howToPlay' | 'leaderboard' | 'profile' | 'none';
  navigation: any;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, navigation }) => {
  const insets = useSafeAreaInsets();
  // Ensure Android 3-button bar or gesture bar safe area inset is respected
  const extraBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 12) : Math.max(insets.bottom, 6);

  return (
    <View style={[styles.bottomBar, { paddingBottom: extraBottomPadding, height: 56 + extraBottomPadding }]}>
      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => activeTab !== 'home' && navigation.navigate('Home')}
      >
        <Ionicons 
          name={activeTab === 'home' ? "home" : "home-outline"} 
          size={22} 
          color={activeTab === 'home' ? "#00FFFF" : "#888"} 
        />
        <Text style={[styles.tabText, { color: activeTab === 'home' ? "#00FFFF" : "#888" }]} allowFontScaling={false}>
          Ana Sayfa
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => activeTab !== 'howToPlay' && navigation.navigate('HowToPlay')}
      >
        <Ionicons 
          name={activeTab === 'howToPlay' ? "help-circle" : "help-circle-outline"} 
          size={22} 
          color={activeTab === 'howToPlay' ? "#00FFFF" : "#888"} 
        />
        <Text style={[styles.tabText, { color: activeTab === 'howToPlay' ? "#00FFFF" : "#888" }]} allowFontScaling={false}>
          Nasıl Oynanır?
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => activeTab !== 'leaderboard' && navigation.navigate('Leaderboard', {})}
      >
        <Ionicons 
          name={activeTab === 'leaderboard' ? "trophy" : "trophy-outline"} 
          size={22} 
          color={activeTab === 'leaderboard' ? "#00FFFF" : "#888"} 
        />
        <Text style={[styles.tabText, { color: activeTab === 'leaderboard' ? "#00FFFF" : "#888" }]} allowFontScaling={false}>
          Sıralama
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.tabItem} 
        onPress={() => activeTab !== 'profile' && navigation.navigate('Profile')}
      >
        <Ionicons 
          name={activeTab === 'profile' ? "person" : "person-outline"} 
          size={22} 
          color={activeTab === 'profile' ? "#00FFFF" : "#888"} 
        />
        <Text style={[styles.tabText, { color: activeTab === 'profile' ? "#00FFFF" : "#888" }]} allowFontScaling={false}>
          Profil
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(5, 11, 20, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  tabText: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: '600'
  }
});
