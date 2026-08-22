import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, ImageBackground, TextInput, Alert, Image, useWindowDimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket, fetchTunnelUrl, initSocketWithUrl, SOCKET_URL } from '../services/socket';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '../services/analytics';
import { BannerAdComponent } from '../services/ads';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomAlert } from '../components/CustomAlert';
import { useLanguage } from '../context/LanguageContext';

const THEMES = {
  football: require('../../assets/images/football_bg.jpg'),
  football_en: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  cinema_en: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
  music_en: require('../../assets/images/music_bg.jpg'),
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'OnlineLobby'>;
};

export default function OnlineLobbyScreen({ navigation, route }: any) {
  const [lobbyStatus, setLobbyStatus] = useState<'idle' | 'searching_match' | 'creating_room' | 'joining_room'>('idle');
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [playerName, setPlayerName] = useState('Misafir');
  const [maxRounds, setMaxRounds] = useState(10);
  const [socket, setSocket] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const initialMode = route.params?.mode;
  const [showRankedOptions, setShowRankedOptions] = useState(initialMode === 'ranked');
  const [showFriendlyOptions, setShowFriendlyOptions] = useState(initialMode === 'friendly');
  const [showFriendlyRoomSettings, setShowFriendlyRoomSettings] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadProfileOnFocus = async () => {
        try {
          const stored = await AsyncStorage.getItem('@logged_in_profile');
          if (stored) {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
            setPlayerName(parsed.username);
          }
        } catch (e) {}
      };
      loadProfileOnFocus();
    }, [])
  );

  useEffect(() => {
    Analytics.logScreenView('OnlineLobby');
    // Component yüklendiğinde otomatik olarak tünel URL'ini çek (Sadece ilk girişte)
    const initDynamicTunnel = async () => {
      try {
        const stored = await AsyncStorage.getItem('@logged_in_profile');
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setPlayerName(parsed.username);
        }
        
        const tunnel = await fetchTunnelUrl();
        if (tunnel) {
          // Arka planda sessizce socket'i yeni URL ile başlat
          const s = initSocketWithUrl(tunnel);
          setSocket(s);

          // Background profile sync to update cached email and stats
          if (stored) {
            const parsed = JSON.parse(stored);
            s.emit('login_profile', { username: parsed.username, password: parsed.password });
            s.once('login_response', async (res: any) => {
              if (res.success) {
                const updatedSession = { ...res.player, password: parsed.password };
                await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(updatedSession));
                setProfile(updatedSession);
              }
            });
          }
        }
      } catch (e) {
        // Hata olursa varsayılan ile devam et
      }
    };
    initDynamicTunnel();
    
    return () => {
      // Do not disconnect shared singleton socket when navigating to OnlineGame or RoomLobby
    };
  }, []);

  const ensureSocket = async (callback: (s: any) => void, onError: () => void) => {
    setIsConnecting(true);
    
    let s = getSocket();
    
    s.off('connect');
    s.off('connect_error');
    s.off('match_found');
    s.off('room_created');
    s.off('room_joined');
    s.off('join_error');

    if (s.connected) {
      setIsConnecting(false);
      callback(s);
    } else {
      const timeout = setTimeout(() => {
        s.off('connect');
        setIsConnecting(false);
        onError();
      }, 30000); // 30 saniye zaman aşımı

      s.on('connect', () => {
        clearTimeout(timeout);
        setIsConnecting(false);
        callback(s);
      });
      s.connect();
    }
    setSocket(s);
  };

  const categoryId = route.params?.categoryId || 'football';
  const { t, language } = useLanguage();

  const findMatch = () => {
    if (!profile || !profile.email) {
      CustomAlert.show(
        t('error'),
        language === 'en'
          ? 'You must sign in with email to play ranked and earn KP.'
          : 'Dereceli düello oynamak ve KP kazanmak için e-posta ile giriş yapmalısınız.',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: language === 'en' ? 'Go to Profile' : 'Profile Git', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }
    Analytics.logEvent('join_queue_start');
    setLobbyStatus('searching_match');
    ensureSocket((s) => {
      s.emit('join_queue', { 
        name: playerName.trim() || (language === 'en' ? 'Player' : 'Oyuncu'),
        dbPlayerId: profile?.id || profile?._id || null,
        category: categoryId
      });
      s.on('match_found', (data: any) => {
        Analytics.logEvent('join_queue_success', { roomId: data.roomId });
        setLobbyStatus('idle');
        navigation.navigate('OnlineGame', { roomId: data.roomId, categoryId: data.category || categoryId });
      });
    }, () => {
      Analytics.logEvent('join_queue_failed');
      setLobbyStatus('idle');
      CustomAlert.show(t('connectionError'), t('connectionErrorMsg'));
    });
  };

  const createRoom = (isRanked = false) => {
    if (isRanked && (!profile || !profile.email)) {
      CustomAlert.show(
        t('error'),
        language === 'en'
          ? 'You must sign in with email to play ranked and earn KP.'
          : 'Dereceli düello oynamak ve KP kazanmak için e-posta ile giriş yapmalısınız.',
        [
          { text: t('cancel'), style: 'cancel' },
          { text: language === 'en' ? 'Go to Profile' : 'Profile Git', onPress: () => navigation.navigate('Profile') }
        ]
      );
      return;
    }
    Analytics.logEvent('create_room_start', { isRanked });
    setLobbyStatus('creating_room');
    ensureSocket((s) => {
      s.emit('create_room', { 
        name: playerName.trim() || (language === 'en' ? 'Player' : 'Oyuncu'), 
        maxRounds: isRanked ? 10 : maxRounds,
        isRanked,
        dbPlayerId: profile?.id || profile?._id || null,
        category: categoryId
      });
      s.on('room_created', (data: any) => {
        Analytics.logEvent('create_room_success', { roomId: data.roomId, isRanked });
        setLobbyStatus('idle');
        navigation.navigate('RoomLobby', { roomId: data.roomId, roomCode: data.roomCode, isHost: true, categoryId: data.category || categoryId });
      });
    }, () => {
      Analytics.logEvent('create_room_failed', { isRanked });
      setLobbyStatus('idle');
      CustomAlert.show(t('connectionError'), t('connectionErrorMsg2'));
    });
  };

  const joinRoom = () => {
    if (!roomCodeInput.trim()) return;
    Analytics.logEvent('join_room_start', { roomCode: roomCodeInput.trim() });
    setLobbyStatus('joining_room');
    ensureSocket((s) => {
      s.emit('join_room', { 
        roomCode: roomCodeInput.trim(), 
        name: playerName.trim() || (language === 'en' ? 'Player' : 'Oyuncu'),
        dbPlayerId: profile?.id || profile?._id || null
      });
      
      s.on('room_joined', (data: any) => {
        Analytics.logEvent('join_room_success', { roomId: data.roomId });
        setLobbyStatus('idle');
        navigation.navigate('RoomLobby', { roomId: data.roomId, roomCode: data.roomCode, isHost: false, categoryId: data.category || categoryId });
      });
      
      s.on('join_error', (data: any) => {
        Analytics.logEvent('join_room_error', { message: data.message });
        setLobbyStatus('idle');
        CustomAlert.show(t('error'), data.message);
      });
    }, () => {
      Analytics.logEvent('join_room_failed');
      setLobbyStatus('idle');
      CustomAlert.show(t('connectionError'), t('connectionErrorMsg2'));
    });
  };

  const { width } = useWindowDimensions();
  // Card size calc
  const mainCardSize = Math.min((width - 20 * 2 - 14) / 2, 175);
  const mainIconSize = Math.round(mainCardSize * 0.48);
  const subCardW = Math.floor((width - 40 - 16) / 3);
  const subIconSize = Math.round(subCardW * 0.52);

  return (
    <ImageBackground source={(THEMES as any)[categoryId] || THEMES.football} style={styles.bgImage}>
      <View style={styles.cyberOverlay} />
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          <Text style={styles.title}>DÜELLO</Text>
          <Text style={styles.subtitle}>Gerçek Zamanlı Online Mod</Text>
          {lobbyStatus !== 'idle' ? (
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color="#00FF88" />
            <Text style={styles.searchingText}>
              {lobbyStatus === 'searching_match' ? 'Rakip Aranıyor...' : 
               lobbyStatus === 'creating_room' ? 'Oda Kuruluyor...' : 'Odaya Bağlanılıyor...'}
            </Text>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton, { marginTop: 25, width: 200 }]} 
              onPress={() => {
                setLobbyStatus('idle');
                if (socket) socket.disconnect();
              }}
            >
              <Text style={styles.buttonText}>İPTAL ET</Text>
            </TouchableOpacity>
          </View>
        ) : showJoinInput ? (
          <View style={[styles.searchingContainer, { width: '100%', paddingHorizontal: 20 }]}>
            <TextInput 
              style={[styles.input, { width: '100%', height: 60, fontSize: 22 }]} 
              placeholder="ODA KODU GİRİN" 
              placeholderTextColor="#aaa" 
              autoCapitalize="characters" 
              value={roomCodeInput} 
              onChangeText={setRoomCodeInput} 
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 10 }}>
              <TouchableOpacity style={[styles.button, { flex: 1, marginRight: 5 }]} onPress={joinRoom}>
                <Text style={styles.buttonText}>KATIL</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton, { flex: 1, marginLeft: 5 }]} onPress={() => setShowJoinInput(false)}>
                <Text style={styles.buttonText}>İPTAL</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.optionsContainer}>

            {/* 🏆 RANKED SUB-MENU 🏆 */}
            {showRankedOptions && (
              <>
                {!initialMode && (
                  <TouchableOpacity
                    style={[styles.collapseHeader, { borderColor: 'rgba(168,85,247,0.4)' }]}
                    onPress={() => setShowRankedOptions(false)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trophy" size={24} color={NEON_PURPLE} style={{ marginRight: 14 }} />
                    <Text style={styles.collapseTitle}>DERECELİ OYNA</Text>
                    <Ionicons name="chevron-up" size={20} color="#A855F7" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                )}

                <View style={styles.actionList}>
                  <TouchableOpacity style={[styles.premiumCard, { borderColor: 'rgba(0,191,255,0.3)' }]} onPress={findMatch} activeOpacity={0.8}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['rgba(0,191,255,0.12)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(0,191,255,0.15)' }]}>
                      <Ionicons name="flash" size={22} color="#00BFFF" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: '#00BFFF' }]}>1v1 Hızlı Eşleşme</Text>
                      <Text style={styles.actionSub}>Rastgele bir rakiple anında oyna</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.premiumCard, { borderColor: 'rgba(0,255,136,0.3)' }]} onPress={() => createRoom(true)} activeOpacity={0.8}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['rgba(0,255,136,0.12)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(0,255,136,0.15)' }]}>
                      <Ionicons name="add" size={26} color="#00FF88" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: '#00FF88' }]}>Oda Kur (Dereceli)</Text>
                      <Text style={styles.actionSub}>Arkadaşınla oyna, puan kazan</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.premiumCard, { borderColor: 'rgba(168,85,247,0.3)' }]} onPress={() => setShowJoinInput(true)} activeOpacity={0.8}>
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                    <LinearGradient colors={['rgba(168,85,247,0.12)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                    <View style={[styles.iconBox, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                      <Ionicons name="enter" size={22} color="#A855F7" />
                    </View>
                    <View style={styles.actionTextContainer}>
                      <Text style={[styles.actionTitle, { color: '#A855F7' }]}>Odaya Katıl</Text>
                      <Text style={styles.actionSub}>Kod ile odaya gir</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* 🟢 FRIENDLY SUB-MENU 🟢 */}
            {showFriendlyOptions && (
              <>
                {!initialMode && (
                  <TouchableOpacity
                    style={[styles.collapseHeader, { borderColor: 'rgba(0,255,136,0.4)' }]}
                    onPress={() => { setShowFriendlyOptions(false); setShowFriendlyRoomSettings(false); }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="people" size={24} color={NEON_GREEN} style={{ marginRight: 14 }} />
                    <Text style={styles.collapseTitle}>DOSTLUK MAÇI</Text>
                    <Ionicons name="chevron-up" size={20} color="#00FF88" style={{ marginLeft: 'auto' }} />
                  </TouchableOpacity>
                )}

                {!showFriendlyRoomSettings ? (
                  <View style={styles.actionList}>
                    <TouchableOpacity style={[styles.premiumCard, { borderColor: 'rgba(0,255,136,0.3)' }]} onPress={() => setShowFriendlyRoomSettings(true)} activeOpacity={0.8}>
                      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                      <LinearGradient colors={['rgba(0,255,136,0.12)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                      <View style={[styles.iconBox, { backgroundColor: 'rgba(0,255,136,0.15)' }]}>
                        <Ionicons name="add" size={26} color="#00FF88" />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: '#00FF88' }]}>Oda Kur (Dostluk)</Text>
                        <Text style={styles.actionSub}>Sıralamayı etkilemeyen oda kur</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.premiumCard, { borderColor: 'rgba(168,85,247,0.3)' }]} onPress={() => setShowJoinInput(true)} activeOpacity={0.8}>
                      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFillObject} />
                      <LinearGradient colors={['rgba(168,85,247,0.12)', 'transparent']} start={{x:0, y:0}} end={{x:1, y:0}} style={StyleSheet.absoluteFillObject} />
                      <View style={[styles.iconBox, { backgroundColor: 'rgba(168,85,247,0.15)' }]}>
                        <Ionicons name="enter" size={22} color="#A855F7" />
                      </View>
                      <View style={styles.actionTextContainer}>
                        <Text style={[styles.actionTitle, { color: '#A855F7' }]}>Odaya Katıl</Text>
                        <Text style={styles.actionSub}>Kod ile odaya gir</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Room settings panel */
                  <>
                    <View style={styles.roundsSelectionContainer}>
                      <Text style={styles.roundsLabel}>Özel Oda Tur Sayısı:</Text>
                      <View style={styles.roundsOptions}>
                        {[10, 20, 30, 50].map(val => (
                          <TouchableOpacity 
                            key={val} 
                            style={[styles.roundOptionBtn, maxRounds === val && styles.roundOptionBtnActive]}
                            onPress={() => setMaxRounds(val)}
                          >
                            <Text style={[styles.roundOptionText, maxRounds === val && styles.roundOptionTextActive]}>
                              {val}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <TouchableOpacity style={[styles.button, { marginTop: 10 }]} onPress={() => createRoom(false)}>
                      <Text style={styles.buttonText}>Oluştur ve Başla</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.cancelButton, { marginTop: 10 }]} onPress={() => setShowFriendlyRoomSettings(false)}>
                      <Text style={styles.buttonText}>Geri Dön</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

            {/* ── DEFAULT MAIN GRID ── */}
            {!showRankedOptions && !showFriendlyOptions && (
              <View style={styles.modeGrid}>
                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardRanked, { width: mainCardSize, height: mainCardSize }]}
                  onPress={() => { setShowRankedOptions(true); setShowFriendlyOptions(false); }}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint="dark" style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearGradient
                      colors={['rgba(168,85,247,0.4)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons 
                      name="trophy" 
                      size={mainIconSize * 0.8} 
                      color={NEON_PURPLE} 
                      style={{ marginBottom: 12 }} 
                    />
                    <Text style={[styles.modeLabel, { textShadowRadius: 10 }]}>DERECELİ</Text>
                    <Text style={[styles.modeSubLabel, { color: '#fff' }]}>OYNA</Text>
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeCard, styles.modeCardFriendly, { width: mainCardSize, height: mainCardSize }]}
                  onPress={() => { setShowFriendlyOptions(true); setShowRankedOptions(false); }}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint="dark" style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <LinearGradient
                      colors={['rgba(0,255,136,0.4)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.9)']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons 
                      name="people" 
                      size={mainIconSize * 0.8} 
                      color={NEON_GREEN} 
                      style={{ marginBottom: 12 }} 
                    />
                    <Text style={[styles.modeLabel, { textShadowRadius: 10 }]}>DOSTLUK</Text>
                    <Text style={[styles.modeSubLabel, { color: '#fff' }]}>MAÇI</Text>
                  </BlurView>
                </TouchableOpacity>
              </View>
            )}

          </View>
        )}
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back-outline" size={16} color="#00FF88" />
          <Text style={styles.backButtonText}>Ana Menüye Dön</Text>
        </TouchableOpacity>
        <BannerAdComponent />
      </SafeAreaView>
    </ImageBackground>
  );
}

const NEON_GREEN  = '#00FF88';
const NEON_BLUE   = '#00BFFF';
const NEON_PURPLE = '#A855F7';

const styles = StyleSheet.create({
  bgImage: { flex: 1, width: '100%', height: '100%' },
  cyberOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 8, 20, 0.88)',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  mainWrapper: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 44,
    fontFamily: 'Poppins_900Black',
    color: NEON_GREEN,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 28,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
    letterSpacing: 0.5,
  },
  nameInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '80%',
    padding: 15,
    borderRadius: 12,
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  searchingContainer: { alignItems: 'center' },
  searchingText: {
    color: NEON_GREEN,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  // Generic action button
  button: {
    backgroundColor: 'rgba(168,85,247,0.2)',
    paddingVertical: 16,
    borderRadius: 14,
    width: '85%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: NEON_PURPLE,
  },
  cancelButton: {
    backgroundColor: 'rgba(220,53,69,0.2)',
    borderColor: '#DC3545',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    letterSpacing: 0.5,
  },
  // ── MAIN MODE GRID (same as HomeScreen) ──
  optionsContainer: {
    alignItems: 'center',
    width: '100%',
  },
  modeGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  modeCard: {
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 8,
  },
  modeCardRanked: {
    borderColor: NEON_PURPLE,
  },
  modeCardFriendly: {
    borderColor: NEON_GREEN,
  },
  modeCardGlow: { ...StyleSheet.absoluteFillObject },
  modeLabel: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  modeSubLabel: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: -4,
  },
  // ── COLLAPSE HEADER (when sub-menu is open) ──
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.4)',
  },
  collapseIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 14,
  },
  collapseTitle: {
    color: '#FFFFFF',
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    letterSpacing: 0.5,
  },
  // ── PREMIUM VERTICAL ACTION LIST ──
  actionList: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 14,
    paddingRight: 20,
    overflow: 'hidden',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionTitle: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 16,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  actionSub: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
  },
  backButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,136,0.06)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
    gap: 6,
  },
  backButtonText: {
    color: NEON_GREEN,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: 200,
    padding: 15,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 20,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  roundsSelectionContainer: {
    marginVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  roundsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  roundsOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
  },
  roundOptionBtn: {
    backgroundColor: 'rgba(0,255,136,0.07)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  roundOptionBtnActive: {
    backgroundColor: NEON_GREEN,
    borderColor: NEON_GREEN,
    shadowColor: NEON_GREEN,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  roundOptionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  roundOptionTextActive: { color: '#000' },
});

