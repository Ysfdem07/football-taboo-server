import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ImageBackground, Alert, StatusBar, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomNavBar } from '../components/BottomNavBar';
import { getSocket, initSocketWithUrl, fetchTunnelUrl } from '../services/socket';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';
import { CustomAlert } from '../components/CustomAlert';
import { showRewarded } from '../services/ads';

const THEMES = {
  football: require('../../assets/images/home_bg.jpg')
};

const NEON_GREEN = '#00FF88';
const NEON_GOLD = '#FFD700';
const NEON_PURPLE = '#A855F7';

export default function MarketScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  
  useEffect(() => {
    loadPlayer();
    setupSocket();
  }, []);

  const loadPlayer = async () => {
    try {
      const stored = await AsyncStorage.getItem('@logged_in_profile');
      if (stored) {
        setPlayer(JSON.parse(stored));
      }
    } catch (e) {
      console.log('Error loading player data:', e);
    }
  };

  const watchAdForCoins = () => {
    setWatchingAd(true);
    showRewarded(
      async (reward) => {
        if (!player || !player.id || player.id === 'guest') {
           let guestName = player?.username?.startsWith('Guest_') ? player.username : `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
           let guest = player || { id: 'guest', username: guestName, coins: 0, jokers: { revealLetters:0, extraTime:0, instantHints:0, shield:0 } };
           guest.coins = (guest.coins || 0) + 50;
           guest.id = 'guest';
           guest.username = guestName;
           setPlayer({...guest});
           await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(guest));
           CustomAlert.show(t('buySuccess'), language === 'en' ? 'You earned 50 Coins!' : '50 Jeton kazandınız!');
        } else {
          let s = getSocket();
          // Don't update local coins optimistically — wait for the server's
          // 'joker_bought' (success) or 'joker_error' (failure/cooldown)
          // response, handled in setupSocket(). Applying the +50 here
          // unconditionally let the client's displayed balance drift out of
          // sync with the DB whenever the server call silently failed.
          const grantReward = () => {
            setLoading(true);
            s!.emit('reward_free_coins', { playerId: player.id });
          };
          if (s && s.connected) {
            grantReward();
          } else if (s) {
            // Watching a rewarded ad takes real time (15-30s+), and the
            // socket can drop during that window (backgrounding behind the
            // ad overlay, brief network hiccup) — giving up immediately
            // meant a user who genuinely watched the whole ad got nothing.
            // Wait briefly for the socket's own auto-reconnect before
            // treating it as a real failure.
            setLoading(true);
            const timeout = setTimeout(() => {
              s!.off('connect', onReconnect);
              setLoading(false);
              CustomAlert.show(t('error'), t('serverError'));
            }, 8000);
            const onReconnect = () => {
              clearTimeout(timeout);
              grantReward();
            };
            s.once('connect', onReconnect);
          } else {
            CustomAlert.show(t('error'), t('serverError'));
          }
        }
      },
      () => setWatchingAd(false),
      'market',
      (message) => CustomAlert.show(t('error'), message)
    );
  };

  const setupSocket = async () => {
    let s = getSocket();
    if (!s) {
      const url = await fetchTunnelUrl();
      if (url) {
        s = initSocketWithUrl(url);
      }
    }
    
    if (s) {
      s.on('joker_bought', async (data: { player: any, jokerType: string }) => {
        setLoading(false);
        setPlayer(data.player);
        await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(data.player));
        if (data.jokerType === 'freeCoins') {
          CustomAlert.show(t('buySuccess'), language === 'en' ? 'You earned 50 Coins!' : '50 Jeton kazandınız!');
        } else {
          CustomAlert.show(t('buySuccess'), t('jokerBought'));
        }
      });
      
      s.on('joker_error', (data: { message: string }) => {
        setLoading(false);
        CustomAlert.show(t('error'), data.message);
      });
    }
  };

  const buyJoker = async (jokerType: string) => {
    let p = player;
    if (!p) p = { coins: 0, jokers: { revealLetters:0, extraTime:0, instantHints:0, shield:0 } };
    
    if ((p.coins || 0) < 50) return CustomAlert.show(t('insufficientFunds'), t('needMoreCoins'));
    
    if (!p.id || p.id === 'guest') {
      p.coins -= 50;
      if (!p.jokers) p.jokers = { revealLetters:0, extraTime:0, instantHints:0, shield:0 };
      p.jokers[jokerType] = (p.jokers[jokerType] || 0) + 1;
      setPlayer({...p});
      await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(p));
      CustomAlert.show(t('buySuccess'), t('jokerBought'));
      return;
    }
    
    setLoading(true);
    let s = getSocket();
    if (!s || !s.connected) {
      const url = await fetchTunnelUrl();
      if (url) s = initSocketWithUrl(url);
    }
    
    if (s && s.connected) {
      s.emit('buy_joker', { playerId: p.id, jokerType });
    } else {
      setLoading(false);
      CustomAlert.show(t('error'), t('serverError'));
    }
  };

  return (
    <ImageBackground source={THEMES.football} style={styles.bg}>
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: topPadding }]}>
          <Text style={styles.headerTitle}>🏪 {t('marketTitle')}</Text>
          <View style={styles.coinBadge}>
            <Ionicons name="cash" size={20} color={NEON_GOLD} />
            <Text style={styles.coinText}>{player?.coins || 0}</Text>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>{t('marketSubtitle')}</Text>
          
          <View style={styles.jokerCard}>
            <View style={styles.jokerInfo}>
              <Ionicons name="text" size={32} color={NEON_PURPLE} />
              <View style={styles.jokerTexts}>
                <Text style={styles.jokerName}>{t('revealLetters')}</Text>
                <Text style={styles.jokerDesc}>{t('revealLettersDesc')}</Text>
                <Text style={styles.jokerCount}>{t('owned')} {player?.jokers?.revealLetters || 0}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, loading && { opacity: 0.5 }]} 
              onPress={() => buyJoker('revealLetters')}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>50 {language === 'en' ? 'Coins' : 'Jeton'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.jokerCard}>
            <View style={styles.jokerInfo}>
              <Ionicons name="time" size={32} color="#00BFFF" />
              <View style={styles.jokerTexts}>
                <Text style={styles.jokerName}>{t('extraTime')}</Text>
                <Text style={styles.jokerDesc}>{t('extraTimeDesc')}</Text>
                <Text style={styles.jokerCount}>{t('owned')} {player?.jokers?.extraTime || 0}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, loading && { opacity: 0.5 }]} 
              onPress={() => buyJoker('extraTime')}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>50 {language === 'en' ? 'Coins' : 'Jeton'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.jokerCard}>
            <View style={styles.jokerInfo}>
              <Ionicons name="flash" size={32} color={NEON_GREEN} />
              <View style={styles.jokerTexts}>
                <Text style={styles.jokerName}>{t('instantHints')}</Text>
                <Text style={styles.jokerDesc}>{t('instantHintsDesc')}</Text>
                <Text style={styles.jokerCount}>{t('owned')} {player?.jokers?.instantHints || 0}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, loading && { opacity: 0.5 }]} 
              onPress={() => buyJoker('instantHints')}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>50 {language === 'en' ? 'Coins' : 'Jeton'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Kalkan Jokeri */}
          <View style={styles.jokerCard}>
            <View style={styles.jokerInfo}>
              <Ionicons name="shield-checkmark" size={32} color="#FFD700" />
              <View style={styles.jokerTexts}>
                <Text style={styles.jokerName}>{t('shield')}</Text>
                <Text style={styles.jokerDesc}>{t('shieldDesc')}</Text>
                <Text style={styles.jokerCount}>{t('owned')} {player?.jokers?.shield || 0}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, loading && { opacity: 0.5 }]} 
              onPress={() => buyJoker('shield')}
              disabled={loading}
            >
              <Text style={styles.buyBtnText}>50 {language === 'en' ? 'Coins' : 'Jeton'}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Reklam İzle Kazan Kartı */}
          <View style={[styles.jokerCard, { borderColor: NEON_GOLD, backgroundColor: 'rgba(255,215,0,0.05)' }]}>
            <View style={styles.jokerInfo}>
              <Ionicons name="play-circle" size={32} color={NEON_GOLD} />
              <View style={styles.jokerTexts}>
                <Text style={styles.jokerName}>{language === 'en' ? 'Watch Ad & Earn' : 'İzle ve Kazan'}</Text>
                <Text style={styles.jokerDesc}>{language === 'en' ? 'Watch a short ad to earn 50 free coins.' : 'Kısa bir reklam izle, 50 bedava jeton kazan.'}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.buyBtn, { backgroundColor: NEON_GOLD }, watchingAd && { opacity: 0.5 }]} 
              onPress={watchAdForCoins}
              disabled={watchingAd}
            >
              <Text style={[styles.buyBtnText, { color: '#000' }]}>+50 {language === 'en' ? 'Coins' : 'Jeton'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <BottomNavBar activeTab="market" navigation={navigation} />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#050B14' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.85)' },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
  },
  coinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,215,0,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.5)',
  },
  coinText: {
    color: NEON_GOLD,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    marginLeft: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  jokerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  jokerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jokerTexts: {
    marginLeft: 12,
    flex: 1,
  },
  jokerName: {
    color: '#fff',
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
  },
  jokerDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 4,
    paddingRight: 10,
  },
  jokerCount: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_500Medium',
    fontSize: 12,
  },
  buyBtn: {
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderWidth: 1,
    borderColor: NEON_GOLD,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buyBtnText: {
    color: NEON_GOLD,
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  }
});
