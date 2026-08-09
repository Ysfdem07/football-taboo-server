import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ActivityIndicator, Image, useWindowDimensions, Linking, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNavBar } from '../components/BottomNavBar';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const CATEGORIES = [
  { 
    id: 'football', 
    title: 'FUTBOL', 
    subtitle: 'Efsane Futbolcular, Teknik Direktörler, Futbol Takımları ve Terimleri',
    color: '#39ff14', 
    icon: 'football'
  },
  { 
    id: 'cinema', 
    title: 'SİNEMA', 
    subtitle: 'Ödüllü Film ve Diziler, Ünlü Oyuncu ve Yönetmenler, Film ve Dizi Karakterleri',
    color: '#b026ff', 
    icon: 'videocam'
  },
  { 
    id: 'music', 
    title: 'MÜZİK', 
    subtitle: 'Ünlü Sanatçılar, Müzik Grupları ve Şarkı İsimleri',
    color: '#ff1493', 
    icon: 'musical-notes'
  }
];

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadProfile = async () => {
        try {
          const profileData = await AsyncStorage.getItem('@logged_in_profile');
          if (profileData) {
            setPlayer(JSON.parse(profileData));
          } else {
            setPlayer(null);
          }
        } catch (error) {
          console.error('Profile read error', error);
        } finally {
          setLoading(false);
        }
      };
      loadProfile();
    }, [])
  );

  return (
    <ImageBackground source={require('../../assets/images/home_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('About')}>
            <Ionicons name="information-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} allowFontScaling={false}>WORDICO</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[styles.iconButton, { borderColor: '#00FFFF' }]} onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person" size={20} color="#00FFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* CATEGORIES LIST SCROLLVIEW */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
          {CATEGORIES.map((cat) => (
            <BlurView intensity={40} tint="dark" key={cat.id} style={[styles.categoryCard, { borderColor: cat.color, shadowColor: cat.color }]}>
              <LinearGradient
                colors={[`${cat.color}30`, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Top Section */}
              <TouchableOpacity 
                style={styles.cardTop} 
                onPress={() => navigation.navigate('CategoryMenu', { categoryId: cat.id })}
                activeOpacity={0.8}
              >
                <View style={[styles.iconContainer, (cat.id === 'football' || cat.id === 'cinema' || cat.id === 'music') && { overflow: 'hidden', borderRadius: 30 }]}>
                  {cat.id === 'football' ? (
                    <Image source={require('../../assets/icons/football_logo.jpg')} style={{ width: 60, height: 60, opacity: 0.9 }} />
                  ) : cat.id === 'cinema' ? (
                    <Image source={require('../../assets/icons/cinema_logo.jpg')} style={{ width: 60, height: 60, opacity: 0.9 }} />
                  ) : cat.id === 'music' ? (
                    <Image source={require('../../assets/icons/music_logo.jpg')} style={{ width: 60, height: 60, opacity: 0.9 }} />
                  ) : (
                    <Ionicons name={cat.icon as any} size={42} color={cat.color} />
                  )}
                </View>
                <View style={styles.textContainer}>
                  <Text 
                    style={[styles.cardTitle, { color: cat.color }]} 
                    allowFontScaling={false} 
                    numberOfLines={1} 
                    adjustsFontSizeToFit={true}
                  >
                    {cat.title}
                  </Text>
                  <Text style={styles.cardSubtitle} allowFontScaling={false}>{cat.subtitle}</Text>
                </View>
                <View style={[styles.modlarBtn, { borderColor: cat.color, backgroundColor: `${cat.color}20` }]}>
                  <Text style={[styles.modlarText, { color: '#FFF' }]} allowFontScaling={false}>MODLAR &gt;</Text>
                </View>
              </TouchableOpacity>

              {/* Bottom Section (Tournament) */}
              <TouchableOpacity 
                style={[styles.tournamentBanner, { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => navigation.navigate('Tournament', { categoryId: cat.id })}
                activeOpacity={0.8}
              >
                <Text style={styles.tournamentText} allowFontScaling={false}>Haftalık Turnuva</Text>
                <View style={styles.oynaBtn}>
                  <Text style={[styles.oynaText, { color: cat.color }]} allowFontScaling={false}>Oyna</Text>
                  <Ionicons name="play" size={16} color={cat.color} />
                </View>
              </TouchableOpacity>
            </BlurView>
          ))}
        </ScrollView>

        {/* BOTTOM TAB BAR */}
        <BottomNavBar activeTab="home" navigation={navigation} />

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#050B14'
  },
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 20,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  topBarTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_900Black',
    fontSize: 26,
    letterSpacing: 2,
    textShadowColor: 'rgba(255,255,255,0.8)',
    textShadowRadius: 10,
  },
  categoriesContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 50,
    gap: 16,
  },
  categoryCard: {
    borderRadius: 24,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 18,
  },
  iconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitle: {
    fontFamily: 'Poppins_900Black',
    fontSize: 28,
    textShadowRadius: 10,
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 14,
  },
  modlarBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 8,
  },
  modlarText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
  },
  tournamentBanner: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  tournamentText: {
    color: '#FFF',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  oynaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  oynaText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    backgroundColor: 'rgba(5,10,20,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  tabItem: {
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    color: '#888',
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
  }
});
