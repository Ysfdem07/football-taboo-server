import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ImageBackground, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { getSocket } from '../services/socket';
import { getLeagueForKp } from '../utils/LeagueHelper';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analytics } from '../services/analytics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

const AVATARS = ['⚽', '🏆', '🥇', '👕', '👟', '🧤', '📣', '🏟️', '👑', '🔥', '🦁', '🦅'];

export default function ProfileScreen({ navigation }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'forgot_request' | 'forgot_verify'>('login');
  const [loading, setLoading] = useState(false);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('⚽');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isRegisterMode = authStep === 'register';

  // Player Profile State
  const [player, setPlayer] = useState<any>(null);

  const socket = getSocket();

  useEffect(() => {
    Analytics.logScreenView('Profile');
    // Check local storage for active profile session
    const loadLocalSession = async () => {
      try {
        const stored = await AsyncStorage.getItem('@logged_in_profile');
        if (stored) {
          const profile = JSON.parse(stored);
          setPlayer(profile);
          setIsLoggedIn(true);
          
          const emitSync = () => {
            socket.emit('login_profile', { username: profile.username, password: profile.password });
          };

          if (socket.connected) {
            emitSync();
          } else {
            socket.once('connect', emitSync);
            socket.connect();
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadLocalSession();

    // Socket Response Listeners
    socket.on('register_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        Analytics.logUserRegister(res.player.id, res.player.username);
        saveSession(res.player);
        Alert.alert('Başarılı', 'Profiliniz başarıyla oluşturuldu!');
      } else {
        Alert.alert('Kayıt Hatası', res.error || 'Bilinmeyen hata.');
      }
    });

    socket.on('login_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        Analytics.logUserLogin(res.player.id, res.player.username);
        saveSession(res.player);
      } else {
        // If local autologin fails, clear session
        AsyncStorage.removeItem('@logged_in_profile');
        setIsLoggedIn(false);
        setPlayer(null);
        if (!loading) {
          Alert.alert('Giriş Hatası', res.error || 'Şifre hatalı.');
        }
      }
    });

    socket.on('forgot_password_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        if (res.devMode) {
          Alert.alert('Geliştirici Modu (Test)', `SMTP kurulu olmadığı için üretilen kod ekrana yansıtıldı:\n\nKOD: ${res.code}`);
        } else {
          Alert.alert('Başarılı', res.message);
        }
        setAuthStep('forgot_verify');
      } else {
        Alert.alert('Hata', res.error || 'Sıfırlama kodu gönderilemedi.');
      }
    });

    socket.on('reset_password_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        Alert.alert('Başarılı', res.message);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        setAuthStep('login');
      } else {
        Alert.alert('Sıfırlama Hatası', res.error || 'Şifre güncellenemedi.');
      }
    });

    return () => {
      socket.off('register_response');
      socket.off('login_response');
      socket.off('forgot_password_response');
      socket.off('reset_password_response');
    };
  }, []);

  const saveSession = async (profile: any) => {
    try {
      // Save password hash/value locally to support auto-login
      const sessionData = { ...profile, password: password || profile.password };
      await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(sessionData));
      setPlayer(sessionData);
      setIsLoggedIn(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuth = () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    const isEmailInput = username.includes('@');
    if (isRegisterMode || !isEmailInput) {
      if (username.length < 3 || username.length > 30) {
        Alert.alert('Hata', 'Kullanıcı adı 3-30 karakter arasında olmalıdır.');
        return;
      }
    }

    if (isRegisterMode) {
      if (password.length < 6 || password.length > 20) {
        Alert.alert('Hata', 'Şifre 6-20 karakter arasında olmalıdır.');
        return;
      }
    }

    if (isRegisterMode) {
      if (!email.trim()) {
        Alert.alert('Hata', 'E-posta adresi gereklidir.');
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
      if (!marketingConsent) {
        Alert.alert('Hata', 'Devam etmek için Gizlilik Politikası ve veri işleme koşullarını onaylamalısınız.');
        return;
      }
    }

    setLoading(true);
    if (isRegisterMode) {
      socket.emit('register_profile', { 
        username, 
        password, 
        avatar: selectedAvatar,
        email: email.trim(),
        marketingConsent
      });
    } else {
      socket.emit('login_profile', { username, password });
    }
  };

  const handleForgotRequest = () => {
    if (!resetEmail.trim()) {
      Alert.alert('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      Alert.alert('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setLoading(true);

    // Safety timeout: If socket fails to respond in 15 seconds, close spinner and show alert
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      Alert.alert('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    }, 15000);

    socket.emit('forgot_password', { email: resetEmail.trim() });

    // Store timeout reference on socket or clean it up dynamically when response arrives
    socket.once('forgot_password_response', () => {
      clearTimeout(safetyTimeout);
    });
  };

  const handleForgotVerify = () => {
    if (!resetCode.trim() || !newPassword.trim()) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (resetCode.trim().length !== 6) {
      Alert.alert('Hata', 'Doğrulama kodu 6 haneli olmalıdır.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }
    setLoading(true);
    socket.emit('reset_password', { 
      email: resetEmail.trim(), 
      code: resetCode.trim(), 
      newPassword 
    });
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@logged_in_profile');
      setIsLoggedIn(false);
      setPlayer(null);
      setUsername('');
      setPassword('');
      Alert.alert('Çıkış Yapıldı', 'Profil oturumu sonlandırıldı.');
    } catch (e) {
      console.error(e);
    }
  };

  // League computation
  const kp = player ? player.kp : 0;
  const league = getLeagueForKp(kp);
  const nextLeague = getLeagueForKp(kp + 1000); // Simple threshold estimate
  
  // Calculate win rate
  const winRate = player && player.matches_played > 0 
    ? Math.round((player.matches_won / player.matches_played) * 100) 
    : 0;

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Oyuncu Profili</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoggedIn && player ? (
            // LOGGED IN VIEW
            <View style={styles.profileContainer}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarEmoji}>{player.avatar || '⚽'}</Text>
              </View>
              
              <Text style={styles.username}>{player.username}</Text>
              {player.email && <Text style={styles.emailText}>{player.email}</Text>}
              
              {/* League & KP Card */}
              <View style={styles.leagueCard}>
                <Text style={styles.leagueIcon}>{league.icon}</Text>
                <Text style={[styles.leagueName, { color: league.color }]}>{league.name}</Text>
                <Text style={styles.kpText}>{player.kp} KP</Text>
                
                {/* KP Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: league.color,
                        width: `${Math.min(100, (player.kp % 1000) / 10)}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  Sonraki Kupa için: {1000 - (player.kp % 1000)} KP gerekli
                </Text>
              </View>

              {/* Statistics Grid */}
              <Text style={styles.sectionHeader}>Kariyer İstatistikleri</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{player.matches_played}</Text>
                    <Text style={styles.statLbl}>Maç</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{player.matches_won}</Text>
                    <Text style={styles.statLbl}>Galibiyet</Text>
                  </View>
                </View>
                
                <View style={styles.centeredStatsRow}>
                  <View style={styles.statBoxCent}>
                    <Text style={styles.statVal}>{winRate}%</Text>
                    <Text style={styles.statLbl}>Kazanma Oranı</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>Oturumu Kapat</Text>
              </TouchableOpacity>
            </View>
            ) : authStep === 'forgot_request' ? (
              // FORGOT PASSWORD REQUEST VIEW
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Şifremi Unuttum</Text>
                <Text style={styles.authSubtitle}>
                  Kayıtlı e-posta adresinizi girin, şifre sıfırlama kodunu gönderelim.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="E-posta Adresi"
                  placeholderTextColor="#888"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={handleForgotRequest}>
                    <Text style={styles.authButtonText}>KOD GÖNDER</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setAuthStep('login')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>Geri Dön</Text>
                </TouchableOpacity>
              </View>
            ) : authStep === 'forgot_verify' ? (
              // FORGOT PASSWORD VERIFY/RESET VIEW
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Şifreyi Yenile</Text>
                <Text style={styles.authSubtitle}>
                  E-postanıza gönderilen 6 haneli kodu ve belirlemek istediğiniz yeni şifrenizi girin.
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder="6 Haneli Doğrulama Kodu"
                  placeholderTextColor="#888"
                  value={resetCode}
                  onChangeText={setResetCode}
                  autoCapitalize="none"
                  keyboardType="number-pad"
                  maxLength={6}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Yeni Şifre"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                  autoCapitalize="none"
                />

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={handleForgotVerify}>
                    <Text style={styles.authButtonText}>ŞİFREYİ GÜNCELLE</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setAuthStep('forgot_request')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>Yeniden Kod Gönder</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // AUTH LOGIN / REGISTER VIEW
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>{isRegisterMode ? 'Yeni Profil Oluştur' : 'Profiline Giriş Yap'}</Text>
                <Text style={styles.authSubtitle}>
                  {isRegisterMode ? 'Lig sıralamasına katılmak ve KP toplamak için kaydol!' : 'Kariyer puanlarını ve rütbeni korumak için giriş yap.'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder={isRegisterMode ? "Kullanıcı Adı" : "Kullanıcı Adı veya E-posta"}
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder="Şifre"
                  placeholderTextColor="#888"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                />

                {!isRegisterMode && (
                  <TouchableOpacity onPress={() => setAuthStep('forgot_request')} style={styles.forgotLink}>
                    <Text style={styles.forgotLinkText}>Şifremi Unuttum</Text>
                  </TouchableOpacity>
                )}

                {isRegisterMode && (
                  <TextInput
                    style={styles.input}
                    placeholder="E-posta Adresi"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                )}

                {isRegisterMode && (
                  <View style={styles.avatarSelectionSection}>
                    <Text style={styles.avatarSelectLabel}>Avatar Seçin:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
                      {AVATARS.map(av => (
                        <TouchableOpacity 
                          key={av} 
                          style={[styles.avatarSelector, selectedAvatar === av && styles.avatarSelectorActive]}
                          onPress={() => setSelectedAvatar(av)}
                        >
                          <Text style={styles.avatarSelectorText}>{av}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {isRegisterMode && (
                  <TouchableOpacity 
                    style={styles.consentRow} 
                    onPress={() => setMarketingConsent(!marketingConsent)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.checkbox, marketingConsent && styles.checkboxChecked]}>
                      {marketingConsent && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                    </View>
                    <Text style={styles.consentText}>
                      Kullanım Koşulları, Gizlilik Politikası ve reklam benzer hedef kitlesi için veri işlemeyi kabul ediyorum.
                    </Text>
                  </TouchableOpacity>
                )}

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
                    <Text style={styles.authButtonText}>{isRegisterMode ? 'KAYIT OL' : 'GİRİŞ YAP'}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setAuthStep(isRegisterMode ? 'login' : 'register')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>
                    {isRegisterMode ? 'Zaten bir hesabın var mı? Giriş Yap' : 'Henüz hesabın yok mu? Profil Yarat'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 8, 20, 0.88)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(0,255,136,0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginLeft: 15,
    textShadowColor: 'rgba(0,255,136,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  scrollContent: {
    padding: 20,
  },
  authCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
    marginTop: 40,
  },
  authTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 25,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  avatarSelectionSection: {
    marginVertical: 10,
  },
  avatarSelectLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
  },
  avatarScroll: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  avatarSelector: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  avatarSelectorActive: {
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0,255,136,0.15)',
  },
  avatarSelectorText: {
    fontSize: 24,
  },
  authButton: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#00FF88',
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 14,
    elevation: 12,
  },
  authButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
  },
  toggleLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleLinkText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(29, 185, 84, 0.1)',
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  avatarEmoji: {
    fontSize: 50,
  },
  username: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: Colors.white,
    marginBottom: 8,
  },
  emailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  leagueCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 25,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,136,0.25)',
    marginBottom: 25,
  },
  leagueIcon: {
    fontSize: 50,
    marginBottom: 5,
  },
  leagueName: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 5,
  },
  kpText: {
    fontSize: 15,
    color: Colors.white,
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 15,
  },
  progressBarBg: {
    width: '100%',
    height: 10,
    backgroundColor: Colors.background,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textSecondary,
    alignSelf: 'flex-start',
    marginBottom: 12,
    marginLeft: 5,
  },
  statsGrid: {
    width: '100%',
    marginBottom: 25,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  centeredStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  statBox: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    width: '48%',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
  },
  statBoxCent: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    width: '48%',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
  },
  statVal: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginBottom: 4,
  },
  statLbl: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(220,53,69,0.2)',
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 16,
    marginTop: 10,
    marginBottom: 40,
    borderWidth: 1.5,
    borderColor: '#DC3545',
    shadowColor: '#DC3545',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  logoutButtonText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    paddingHorizontal: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#7F8C8D',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: '#00FF88',
    borderColor: '#00FF88',
  },
  consentText: {
    color: '#BDC3C7',
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 15,
    marginRight: 5,
  },
  forgotLinkText: {
    color: '#00FF88',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textDecorationLine: 'underline',
  },
});
