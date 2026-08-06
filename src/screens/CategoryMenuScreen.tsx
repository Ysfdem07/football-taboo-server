import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

type CategoryMenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryMenu'>;
type CategoryMenuScreenRouteProp = RouteProp<RootStackParamList, 'CategoryMenu'>;

const THEMES = {
  football: { 
    color: '#39ff14', 
    bg: require('../../assets/images/football_bg.jpg'), 
    title: 'FUTBOL',
    classicIcon: 'flash-outline',
    duelIcon: 'game-controller-outline',
    tournamentIcon: 'trophy-outline'
  },
  cinema: { 
    color: '#b026ff', 
    bg: require('../../assets/images/cinema_bg.jpg'), 
    title: 'SİNEMA',
    classicIcon: 'film-outline', 
    duelIcon: 'videocam-outline', 
    tournamentIcon: 'star-outline'
  },
  music: { 
    color: '#ff1493', 
    bg: require('../../assets/images/music_bg.jpg'), 
    title: 'MÜZİK',
    classicIcon: 'musical-notes-outline', 
    duelIcon: 'headset-outline', 
    tournamentIcon: 'radio-outline'
  }
};

export default function CategoryMenuScreen() {
  const navigation = useNavigation<CategoryMenuScreenNavigationProp>();
  const route = useRoute<CategoryMenuScreenRouteProp>();
  const { categoryId } = route.params;
  const [loading, setLoading] = useState(false);

  const theme = THEMES[categoryId as keyof typeof THEMES] || THEMES.football;
  const NEON_COLOR = theme.color;

  const checkWordsAndNavigate = async (destination: 'Game' | 'OnlineLobby' | 'Tournament') => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate(destination as any, { categoryId });
    }, 500);
  };

  return (
    <ImageBackground source={theme.bg} style={styles.backgroundImage}>
      <View style={styles.darkOverlay} />
      
      <SafeAreaView style={styles.container}>
        
        {loading && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 }]}>
            <ActivityIndicator size="large" color={NEON_COLOR} />
            <Text style={[styles.loadingText, { color: NEON_COLOR }]}>BAĞLANIYOR...</Text>
          </View>
        )}

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <Ionicons name="chevron-back" size={28} color={NEON_COLOR} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrapper}>
            <Text style={[styles.headerTitle, { color: NEON_COLOR, textShadowColor: NEON_COLOR }]}>
              {theme.title}
            </Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          
          <View style={styles.topRow}>
            {/* CLASSIC MODE */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => navigation.navigate('Settings' as any, { categoryId })}
              disabled={loading}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                <LinearGradient
                  colors={[`${NEON_COLOR}30`, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}70` }]} />
                
                <Ionicons name={theme.classicIcon as any} size={48} color={NEON_COLOR} style={[styles.halfIcon, { textShadowColor: NEON_COLOR }]} />
                <Text style={[styles.halfButtonTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>GELENEKSEL</Text>
                <Text style={[styles.halfButtonTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>MOD</Text>
              </BlurView>
            </TouchableOpacity>

            {/* ONLINE DUEL */}
            <TouchableOpacity 
              style={[styles.halfButtonContainer, { shadowColor: NEON_COLOR }]}
              onPress={() => checkWordsAndNavigate('OnlineLobby')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <BlurView intensity={40} tint="dark" style={styles.glassCard}>
                <LinearGradient
                  colors={[`${NEON_COLOR}30`, 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientOverlay}
                />
                <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}70` }]} />

                <Ionicons name={theme.duelIcon as any} size={48} color={NEON_COLOR} style={[styles.halfIcon, { textShadowColor: NEON_COLOR }]} />
                <Text style={[styles.halfButtonTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>ONLİNE</Text>
                <Text style={[styles.halfButtonTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>DÜELLO</Text>
              </BlurView>
            </TouchableOpacity>
          </View>

          {/* WEEKLY TOURNAMENT */}
          <TouchableOpacity 
            style={[styles.tournamentBtn, { shadowColor: NEON_COLOR }]}
            onPress={() => checkWordsAndNavigate('Tournament')}
            disabled={loading}
            activeOpacity={0.8}
          >
            <BlurView intensity={40} tint="dark" style={styles.tournamentGlassCard}>
              <LinearGradient
                colors={[`${NEON_COLOR}40`, 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientOverlay}
              />
              <View style={[styles.neonBorder, { borderColor: `${NEON_COLOR}80` }]} />

              <View style={styles.tournamentContent}>
                <Ionicons 
                  name={theme.tournamentIcon as any} 
                  size={60} 
                  color={NEON_COLOR} 
                  style={{ textShadowColor: NEON_COLOR, textShadowOffset: {width:0, height:0}, textShadowRadius: 20 }} 
                />
                <View style={styles.tournamentTextWrap}>
                  <Text style={[styles.tournamentTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>HAFTALIK</Text>
                  <Text style={[styles.tournamentTitle, { color: '#fff', textShadowColor: NEON_COLOR }]}>TURNUVA</Text>
                  
                  <View style={styles.tournamentSubRow}>
                    <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.tournamentSub}>Pazar 23:59</Text>
                  </View>
                </View>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,15,0.6)', 
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  headerTitleWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 2,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  content: {
    paddingHorizontal: 20,
    gap: 20, 
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  halfButtonContainer: {
    flex: 1,
    borderRadius: 24,
    elevation: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  glassCard: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingVertical: 35,
    overflow: 'hidden',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  neonBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1.5,
    borderRadius: 24,
  },
  halfIcon: {
    marginBottom: 15,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  halfButtonTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1.5,
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    lineHeight: 22,
  },
  tournamentBtn: {
    borderRadius: 24,
    elevation: 25,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  tournamentGlassCard: {
    borderRadius: 24,
    padding: 30,
    overflow: 'hidden',
  },
  tournamentContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 25,
  },
  tournamentTextWrap: {
    alignItems: 'flex-start',
  },
  tournamentTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_900Black',
    letterSpacing: 1.5,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    lineHeight: 28,
  },
  tournamentSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tournamentSub: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
  },
  loadingText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 16,
    marginTop: 15,
    letterSpacing: 2,
    textShadowOffset: { width:0, height:0 },
    textShadowRadius: 10,
  }
});
