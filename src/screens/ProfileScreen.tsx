import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ImageBackground, SafeAreaView, ScrollView, Alert, ActivityIndicator, StatusBar, Platform, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { Colors } from '../constants/Colors';
import { getLeagueForKp } from '../utils/LeagueHelper';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNavBar } from '../components/BottomNavBar';
import { LeagueBadge } from '../components/LeagueBadge';
import { UserAvatar, AVATAR_OPTIONS, getAvatarOption } from '../components/UserAvatar';
import { Analytics } from '../services/analytics';
import { useLanguage } from '../context/LanguageContext';
import { CustomAlert } from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export default function ProfileScreen({ navigation }: Props) {
  const { t, language } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authStep, setAuthStep] = useState<'login' | 'register' | 'forgot_request' | 'forgot_verify'>('register');
  const [loading, setLoading] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  
  const CATEGORY_META = language === 'en' ? [
    { id: 'football_en', label: t('football'),  icon: '⚽', color: '#39ff14' },
    { id: 'cinema_en',   label: t('cinema'),  icon: '🎬', color: '#b026ff' },
    { id: 'music_en',    label: t('music'),   icon: '🎵', color: '#ff1493' },
  ] : [
    { id: 'football', label: t('football'),  icon: '⚽', color: '#39ff14' },
    { id: 'cinema',   label: t('cinema'),  icon: '🎬', color: '#b026ff' },
    { id: 'music',    label: t('music'),   icon: '🎵', color: '#ff1493' },
  ];
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('soccer_hero');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Password Reset State
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // "Add email" (logged-in players who signed up without one)
  const [addingEmail, setAddingEmail] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // "Change username" (logged-in players)
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');

  // Quick username+password login — for players who actually know their
  // password (pre-hidden-password accounts, or anyone who wrote theirs
  // down): faster than the full email-recovery round trip for a routine
  // logout/login on the same device.
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

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
          if (profile && profile.id && profile.id !== 'guest') {
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
        CustomAlert.show('Başarılı', 'Profiliniz başarıyla oluşturuldu!');
      } else {
        CustomAlert.show('Kayıt Hatası', res.error || 'Bilinmeyen hata.');
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
          CustomAlert.show('Giriş Hatası', res.error || 'Şifre hatalı.');
        }
      }
    });

    socket.on('forgot_password_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        if (res.devMode) {
          CustomAlert.show('Geliştirici Modu (Test)', `SMTP kurulu olmadığı için üretilen kod ekrana yansıtıldı:\n\nKOD: ${res.code}`);
        } else {
          CustomAlert.show('Başarılı', res.message);
        }
        setAuthStep('forgot_verify');
      } else {
        CustomAlert.show('Hata', res.error || 'Sıfırlama kodu gönderilemedi.');
      }
    });

    socket.on('reset_password_response', (res: any) => {
      setLoading(false);
      if (res.success) {
        // Account recovered — log straight in on this device instead of
        // sending them to a login form (there's no password to type there).
        saveSession(res.player);
        Analytics.logUserLogin(res.player.id, res.player.username);
        setResetEmail('');
        setResetCode('');
        setNewPassword('');
        CustomAlert.show('Hesabın Geri Geldi! 🎉', 'Hesabına bu cihazdan giriş yapıldı.');
      } else {
        CustomAlert.show('Kurtarma Hatası', res.error || 'Hesap kurtarılamadı.');
      }
    });

    socket.on('update_email_response', async (res: any) => {
      setLoading(false);
      if (res.success) {
        setPlayer(res.player);
        setAddingEmail(false);
        setEmailInput('');
        try {
          const stored = await AsyncStorage.getItem('@logged_in_profile');
          const cached = stored ? JSON.parse(stored) : {};
          await AsyncStorage.setItem('@logged_in_profile', JSON.stringify({ ...cached, ...res.player }));
        } catch (e) {}
        CustomAlert.show('Başarılı! 🎉', 'E-posta hesabına eklendi — artık bu cihazı kaybedersen hesabını kurtarabilirsin.');
      } else {
        CustomAlert.show('Hata', res.error || 'E-posta eklenemedi.');
      }
    });

    socket.on('update_username_response', async (res: any) => {
      setLoading(false);
      if (res.success) {
        setPlayer(res.player);
        setEditingUsername(false);
        setUsernameInput('');
        try {
          const stored = await AsyncStorage.getItem('@logged_in_profile');
          const cached = stored ? JSON.parse(stored) : {};
          await AsyncStorage.setItem('@logged_in_profile', JSON.stringify({ ...cached, ...res.player }));
        } catch (e) {}
        CustomAlert.show('Başarılı! 🎉', 'Kullanıcı adın güncellendi.');
      } else {
        CustomAlert.show('Hata', res.error || 'Kullanıcı adı güncellenemedi.');
      }
    });

    socket.on('delete_account_response', async (res: any) => {
      setLoading(false);
      if (res.success) {
        await AsyncStorage.removeItem('@logged_in_profile');
        setIsLoggedIn(false);
        setPlayer(null);
        setAuthStep('register');
        CustomAlert.show(
          language === 'en' ? 'Account Deleted' : 'Hesap Silindi',
          language === 'en' ? 'Your account has been permanently deleted.' : 'Hesabın kalıcı olarak silindi.'
        );
      } else {
        CustomAlert.show('Hata', res.error || 'Hesap silinemedi.');
      }
    });

    return () => {
      socket.off('register_response');
      socket.off('login_response');
      socket.off('forgot_password_response');
      socket.off('reset_password_response');
      socket.off('update_email_response');
      socket.off('update_username_response');
      socket.off('delete_account_response');
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

  const handleSelectAvatar = async (avatarId: string) => {
    if (!player) return;
    const updatedPlayer = { ...player, avatar: avatarId };
    setPlayer(updatedPlayer);
    setSelectedAvatar(avatarId);
    setShowAvatarModal(false);

    try {
      await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(updatedPlayer));
    } catch (e) {
      console.warn('[Profile] Error saving avatar locally:', e);
    }

    if (socket && socket.connected) {
      socket.emit('update_avatar', { playerId: player.id, avatar: avatarId });
    }

    CustomAlert.show('Başarılı! 🎉', 'Profil avatarın başarıyla güncellendi.');
  };

  const handleAddEmail = () => {
    if (!emailInput.trim()) {
      CustomAlert.show('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      CustomAlert.show('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setLoading(true);
    socket.emit('update_email', { email: emailInput.trim() });
  };

  const handleChangeUsername = () => {
    if (usernameInput.trim().length < 3 || usernameInput.trim().length > 30) {
      CustomAlert.show('Hata', 'Kullanıcı adı 3-30 karakter arasında olmalıdır.');
      return;
    }
    setLoading(true);
    socket.emit('update_username', { username: usernameInput.trim() });
  };

  // The account still has a password server-side (login_profile needs one),
  // but the user never sees or types it — this device just remembers it
  // (saveSession) for silent auto-login. Recovering on a new device
  // (handleForgotVerify) generates a fresh one the same way.
  const generateHiddenPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 24; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
  };

  // Only the register flow remains here — there's no password for the user
  // to type at login anymore. Returning to an already-set-up device happens
  // silently (loadLocalSession's cached-credential login_profile call);
  // returning to a NEW device happens via handleForgotVerify (account
  // recovery), which also generates+submits a fresh hidden password.
  const handleAuth = () => {
    if (!username.trim()) {
      CustomAlert.show('Hata', 'Lütfen kullanıcı adınızı girin.');
      return;
    }
    if (username.length < 3 || username.length > 30) {
      CustomAlert.show('Hata', 'Kullanıcı adı 3-30 karakter arasında olmalıdır.');
      return;
    }
    // Email is optional — only used for account recovery — but if they did
    // type something, it has to actually look like an email.
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        CustomAlert.show('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
        return;
      }
    }
    if (!marketingConsent) {
      CustomAlert.show('Hata', 'Devam etmek için Gizlilik Politikası ve veri işleme koşullarını onaylamalısınız.');
      return;
    }

    const generatedPassword = generateHiddenPassword();
    setPassword(generatedPassword);
    setLoading(true);
    socket.emit('register_profile', {
      username,
      password: generatedPassword,
      avatar: selectedAvatar,
      email: email.trim(),
      marketingConsent
    });
  };

  const handlePasswordLogin = () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      CustomAlert.show('Hata', 'Lütfen kullanıcı adı ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    socket.emit('login_profile', { username: loginUsername.trim(), password: loginPassword });
  };

  const handleForgotRequest = () => {
    if (!resetEmail.trim()) {
      CustomAlert.show('Hata', 'Lütfen e-posta adresinizi girin.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail.trim())) {
      CustomAlert.show('Hata', 'Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    setLoading(true);

    // Safety timeout: If socket fails to respond in 15 seconds, close spinner and show alert
    const safetyTimeout = setTimeout(() => {
      setLoading(false);
      CustomAlert.show('Bağlantı Hatası', 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.');
    }, 15000);

    socket.emit('forgot_password', { email: resetEmail.trim() });

    // Store timeout reference on socket or clean it up dynamically when response arrives
    socket.once('forgot_password_response', () => {
      clearTimeout(safetyTimeout);
    });
  };

  const handleForgotVerify = () => {
    if (!resetCode.trim()) {
      CustomAlert.show('Hata', 'Lütfen doğrulama kodunu girin.');
      return;
    }
    if (resetCode.trim().length !== 6) {
      CustomAlert.show('Hata', 'Doğrulama kodu 6 haneli olmalıdır.');
      return;
    }
    // No password field to type here either — recovering the account on
    // this device just needs a fresh hidden password generated and set,
    // same as at registration.
    const generatedPassword = generateHiddenPassword();
    setNewPassword(generatedPassword);
    setLoading(true);
    socket.emit('reset_password', {
      email: resetEmail.trim(),
      code: resetCode.trim(),
      newPassword: generatedPassword
    });
  };

  // Without an email on file, there is no password the user knows and no
  // recovery path — logging out of an account like that means losing it
  // for good. Warn before doing something that permanent instead of
  // silently letting it happen.
  const confirmLogout = () => {
    if (player && !player.email) {
      CustomAlert.show(
        language === 'en' ? "You'll lose this account" : 'Bu hesabı kaybedeceksin',
        language === 'en'
          ? "This account has no email on file, so there's no way to get back in after logging out. Add an email first if you want to keep access."
          : 'Bu hesapta kayıtlı e-posta yok, bu yüzden çıkış yaptıktan sonra tekrar giriş yapmanın hiçbir yolu olmayacak. Erişimini korumak istiyorsan önce e-posta ekle.',
        [
          { text: language === 'en' ? 'Cancel' : 'Vazgeç', style: 'cancel' },
          { text: language === 'en' ? 'Add Email' : 'E-posta Ekle', onPress: () => setAddingEmail(true) },
          { text: language === 'en' ? 'Log Out Anyway' : 'Yine de Çık', style: 'destructive', onPress: handleLogout }
        ]
      );
    } else {
      handleLogout();
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@logged_in_profile');
      setIsLoggedIn(false);
      setPlayer(null);
      setUsername('');
      setPassword('');
      setAuthStep('register');
      CustomAlert.show('Çıkış Yapıldı', 'Profil oturumu sonlandırıldı.');
    } catch (e) {
      console.error(e);
    }
  };

  // Two-step confirm — this is irreversible (App Store / Play Store both
  // require account deletion to be offered in-app, but nothing requires it
  // to be easy to trigger by accident).
  const confirmDeleteAccount = () => {
    CustomAlert.show(
      language === 'en' ? 'Delete your account?' : 'Hesabını sil?',
      language === 'en'
        ? 'This permanently deletes your account, stats, coins and jokers. This cannot be undone.'
        : 'Bu işlem hesabını, istatistiklerini, jetonlarını ve jokerlerini kalıcı olarak siler. Geri alınamaz.',
      [
        { text: language === 'en' ? 'Cancel' : 'Vazgeç', style: 'cancel' },
        {
          text: language === 'en' ? 'Delete' : 'Sil',
          style: 'destructive',
          onPress: () => {
            CustomAlert.show(
              language === 'en' ? 'Are you sure?' : 'Emin misin?',
              language === 'en' ? 'Last chance — this really can\'t be undone.' : 'Son kez soruyoruz — bu gerçekten geri alınamaz.',
              [
                { text: language === 'en' ? 'Cancel' : 'Vazgeç', style: 'cancel' },
                { text: language === 'en' ? 'Yes, delete it' : 'Evet, sil', style: 'destructive', onPress: handleDeleteAccount }
              ]
            );
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    setLoading(true);
    socket.emit('delete_account', {});
  };

  // Overall Profile Level computation
  const kp = player ? player.kp : 0;
  const overallLevel = Math.floor(kp / 500) + 1;
  const nextLevelKp = 500 - (kp % 500);
  const progressPercent = (kp % 500) / 500 * 100;

  const getCategoryKp = (catId: string) => {
    return (player as any)?.categoryKp?.[catId] ?? 0;
  };

  // Same hybrid format as the leaderboard ("68% (24G)"), including the
  // same <5-match safeguard so a small sample doesn't show a misleading
  // percentage (1 win out of 1 match reading as "100%").
  const getCategoryWinRateText = (catId: string) => {
    const won = (player as any)?.categoryWins?.[catId] ?? 0;
    const played = (player as any)?.categoryMatchesPlayed?.[catId] ?? 0;
    if (!played || played < 5) return `${won} ${t('wins')}`;
    const pct = Math.round((won / played) * 100);
    return language === 'en' ? `${pct}% (${won}W)` : `%${pct} (${won}G)`;
  };
  
  const insets = useSafeAreaInsets();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;

  // Calculate win rate
  const winRate = player && player.matches_played > 0 
    ? Math.round((player.matches_won / player.matches_played) * 100) 
    : 0;

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.headerRow, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('playerProfile')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {isLoggedIn && player ? (
            // LOGGED IN VIEW
            <View style={styles.profileContainer}>
              <View style={{ marginBottom: 6, alignItems: 'center' }}>
                <UserAvatar avatar={player.avatar} size={84} />
              </View>

              <TouchableOpacity 
                style={styles.changeAvatarBtn} 
                onPress={() => setShowAvatarModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil-sharp" size={13} color="#00FF88" style={{ marginRight: 6 }} />
                <Text style={styles.changeAvatarText}>{t('changeAvatar')}</Text>
              </TouchableOpacity>
              
              {editingUsername ? (
                <View style={[styles.addEmailForm, { marginTop: 8 }]}>
                  <TextInput
                    style={styles.addEmailInput}
                    placeholder={language === 'en' ? 'Username' : 'Kullanıcı Adı'}
                    placeholderTextColor="#888"
                    value={usernameInput}
                    onChangeText={setUsernameInput}
                    autoCapitalize="none"
                    autoFocus
                  />
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.addEmailSaveBtn} onPress={handleChangeUsername}>
                        <Text style={styles.addEmailSaveBtnText}>{language === 'en' ? 'Save' : 'Kaydet'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addEmailCancelBtn} onPress={() => { setEditingUsername(false); setUsernameInput(''); }}>
                        <Text style={styles.addEmailCancelBtnText}>{language === 'en' ? 'Cancel' : 'Vazgeç'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}
                  onPress={() => { setUsernameInput(player.username); setEditingUsername(true); }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.username}>{player.username}</Text>
                  <Ionicons name="pencil-sharp" size={13} color="#00FF88" style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
              {player.email ? (
                <Text style={styles.emailText}>{player.email}</Text>
              ) : addingEmail ? (
                <View style={styles.addEmailForm}>
                  <TextInput
                    style={styles.addEmailInput}
                    placeholder={language === 'en' ? 'Email Address' : 'E-posta Adresi'}
                    placeholderTextColor="#888"
                    value={emailInput}
                    onChangeText={setEmailInput}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoFocus
                  />
                  {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.addEmailSaveBtn} onPress={handleAddEmail}>
                        <Text style={styles.addEmailSaveBtnText}>{language === 'en' ? 'Save' : 'Kaydet'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.addEmailCancelBtn} onPress={() => { setAddingEmail(false); setEmailInput(''); }}>
                        <Text style={styles.addEmailCancelBtnText}>{language === 'en' ? 'Cancel' : 'Vazgeç'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <TouchableOpacity onPress={() => setAddingEmail(true)} style={styles.addEmailPrompt} activeOpacity={0.8}>
                  <Ionicons name="mail-outline" size={13} color="#FFD700" style={{ marginRight: 5 }} />
                  <Text style={styles.addEmailPromptText}>
                    {language === 'en' ? 'Add email to protect your account' : 'Hesabını korumak için e-posta ekle'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Overall Level Card */}
              <View style={styles.leagueCard}>
                <View style={{ marginBottom: 8, padding: 16, backgroundColor: 'rgba(0,255,136,0.1)', borderRadius: 40 }}>
                  <Ionicons name="star" size={44} color="#00FF88" />
                </View>
                <Text style={[styles.leagueName, { color: '#00FF88', fontSize: 22 }]}>
                  {language === 'en' ? 'Player Level' : 'Oyuncu Seviyesi'} {overallLevel}
                </Text>
                <Text style={styles.kpText}>{language === 'en' ? 'Total' : 'Toplam'}: {player.kp} KP</Text>
                
                {/* KP Progress Bar */}
                <View style={styles.progressBarBg}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { 
                        backgroundColor: '#00FF88',
                        width: `${progressPercent}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {language === 'en' ? 'Next level requires' : 'Sonraki Seviye İçin:'} {nextLevelKp} {t('kpRequired')}
                </Text>
              </View>

              {/* Category League Badges */}
              <Text style={styles.sectionHeader}>{t('categoryLeagues')}</Text>
              <View style={styles.categoryLeaguesGrid}>
                {CATEGORY_META.map(cat => {
                  const catKp = getCategoryKp(cat.id);
                  const catLeague = getLeagueForKp(catKp, language as 'tr'|'en');
                  return (
                    <View key={cat.id} style={[styles.categoryLeagueCard, { borderColor: `${cat.color}50` }]}>
                      <Text style={[styles.categoryLeagueLabel, { color: cat.color }]}>{cat.label}</Text>
                      <View style={{ marginVertical: 6 }}>
                        <LeagueBadge league={catLeague} categoryId={cat.id} size="medium" />
                      </View>
                      <Text style={[styles.categoryLeagueName, { color: catLeague.color }]}>{catLeague.name}</Text>
                      <Text style={[styles.categoryKpText, { color: cat.color }]}>{catKp} KP</Text>
                      <Text style={styles.categoryWinRateText}>{getCategoryWinRateText(cat.id)}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Statistics Grid */}
              <Text style={styles.sectionHeader}>{t('careerStats')}</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{player.matches_played}</Text>
                    <Text style={styles.statLbl}>{t('matches')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statVal}>{player.matches_won}</Text>
                    <Text style={styles.statLbl}>{t('wins')}</Text>
                  </View>
                </View>
                
                <View style={styles.centeredStatsRow}>
                  <View style={styles.statBoxCent}>
                    <Text style={styles.statVal}>{winRate}%</Text>
                    <Text style={styles.statLbl}>{t('winRate')}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
                <Ionicons name="log-out-outline" size={20} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.logoutButtonText}>{t('logout')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={confirmDeleteAccount} style={styles.deleteAccountLink}>
                <Text style={styles.deleteAccountLinkText}>
                  {language === 'en' ? 'Delete Account' : 'Hesabımı Sil'}
                </Text>
              </TouchableOpacity>
            </View>
            ) : authStep === 'forgot_request' ? (
              // ACCOUNT RECOVERY REQUEST VIEW
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Hesabımı Kurtar</Text>
                <Text style={styles.authSubtitle}>
                  Hesabına kayıtlı e-posta adresini gir, doğrulama kodunu gönderelim.
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
              // ACCOUNT RECOVERY VERIFY VIEW — no password field here either;
              // handleForgotVerify generates one behind the scenes.
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Kodu Doğrula</Text>
                <Text style={styles.authSubtitle}>
                  E-postana gönderilen 6 haneli kodu gir, hesabın bu cihaza geri gelsin.
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

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={handleForgotVerify}>
                    <Text style={styles.authButtonText}>HESABIMI GERİ GETİR</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setAuthStep('forgot_request')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>Yeniden Kod Gönder</Text>
                </TouchableOpacity>
              </View>
            ) : isRegisterMode ? (
              // REGISTER VIEW — username + avatar only, no password to type;
              // the app generates and remembers one silently.
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>
                  {language === 'en' ? 'Create New Profile' : 'Yeni Profil Oluştur'}
                </Text>
                <Text style={styles.authSubtitle}>
                  {language === 'en' ? 'Register to join the league rankings and collect KP!' : 'Lig sıralamasına katılmak ve KP toplamak için kaydol!'}
                </Text>

                <TextInput
                  style={styles.input}
                  placeholder={language === 'en' ? "Username" : "Kullanıcı Adı"}
                  placeholderTextColor="#888"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />

                <TextInput
                  style={styles.input}
                  placeholder={language === 'en' ? "Email Address (optional)" : "E-posta Adresi (opsiyonel)"}
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.emailHintText}>
                  {language === 'en'
                    ? "Without this, your account can't be recovered if you lose this device — you'll never need to type a password otherwise."
                    : 'Bunu eklemezseniz, bu cihazı kaybettiğinizde hesabınız kurtarılamaz — aksi halde hiçbir zaman şifre girmeniz gerekmeyecek.'}
                </Text>

                <View style={styles.avatarSelectionSection}>
                  <Text style={styles.avatarSelectLabel}>{language === 'en' ? 'Select Your Profile Avatar:' : 'Profil Avatarınızı Seçin:'}</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                    {AVATAR_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.avatarSelectorCard,
                          selectedAvatar === opt.id && { borderColor: opt.borderColor, backgroundColor: `${opt.borderColor}30` }
                        ]}
                        onPress={() => setSelectedAvatar(opt.id)}
                        activeOpacity={0.8}
                      >
                        <UserAvatar avatar={opt.id} size={46} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={styles.consentRow}
                  onPress={() => setMarketingConsent(!marketingConsent)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, marketingConsent && styles.checkboxChecked]}>
                    {marketingConsent && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                  <Text style={styles.consentText}>
                    Wordico gelişmelerinden ve özel fırsatlardan e-posta ile haberdar olmak istiyorum.
                  </Text>
                </TouchableOpacity>

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
                    <Text style={styles.authButtonText}>
                      {language === 'en' ? 'CREATE PROFILE' : 'PROFİL YARAT'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setAuthStep('login')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>
                    {language === 'en' ? 'Already have an account on another device? Recover it' : 'Başka bir cihazda hesabın mı var? Kurtar'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              // RECOVER VIEW — primary path is email recovery, since new
              // accounts never see their auto-generated password. But
              // accounts that DO know a password (pre-hidden-password
              // accounts, or anyone who wrote theirs down) can skip the
              // email round trip entirely via the toggle below.
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>
                  {language === 'en' ? 'Recover Your Account' : 'Hesabını Kurtar'}
                </Text>
                <Text style={styles.authSubtitle}>
                  {language === 'en'
                    ? "If you added an email when you created your account, use it to recover your progress on this device."
                    : 'Hesabını oluştururken bir e-posta eklediysen, bu cihazda ilerlemeni geri getirmek için onu kullanabilirsin.'}
                </Text>

                {loading ? (
                  <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                ) : (
                  <TouchableOpacity style={styles.authButton} onPress={() => setAuthStep('forgot_request')}>
                    <Text style={styles.authButtonText}>
                      {language === 'en' ? 'RECOVER WITH EMAIL' : 'E-POSTA İLE KURTAR'}
                    </Text>
                  </TouchableOpacity>
                )}

                {!showPasswordLogin ? (
                  <TouchableOpacity onPress={() => setShowPasswordLogin(true)} style={styles.toggleLink}>
                    <Text style={styles.toggleLinkText}>
                      {language === 'en' ? 'Know your password? Sign in directly' : 'Şifreni biliyor musun? Doğrudan giriş yap'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: '100%', marginTop: 8 }}>
                    <TextInput
                      style={styles.input}
                      placeholder={language === 'en' ? 'Username or Email' : 'Kullanıcı Adı veya E-posta'}
                      placeholderTextColor="#888"
                      value={loginUsername}
                      onChangeText={setLoginUsername}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={styles.input}
                      placeholder={language === 'en' ? 'Password' : 'Şifre'}
                      placeholderTextColor="#888"
                      secureTextEntry
                      value={loginPassword}
                      onChangeText={setLoginPassword}
                      autoCapitalize="none"
                    />
                    {loading ? (
                      <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />
                    ) : (
                      <TouchableOpacity style={styles.authButton} onPress={handlePasswordLogin}>
                        <Text style={styles.authButtonText}>
                          {language === 'en' ? 'LOG IN' : 'GİRİŞ YAP'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                <TouchableOpacity onPress={() => setAuthStep('register')} style={styles.toggleLink}>
                  <Text style={styles.toggleLinkText}>
                    {language === 'en' ? "Don't have an account? Create Profile" : 'Henüz hesabın yok mu? Profil Yarat'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }
        </ScrollView>

        {/* AVATAR SELECTION MODAL */}
        <Modal
          visible={showAvatarModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowAvatarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="sparkles" size={20} color="#00FF88" style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>AVATAR SEÇ</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>Profilinizde gösterilecek avatar görselinizi seçin:</Text>

              <ScrollView contentContainerStyle={styles.avatarGridContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.avatarGrid}>
                  {AVATAR_OPTIONS.map((opt) => {
                    const isSelected = player?.avatar === opt.id || getAvatarOption(player?.avatar).id === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[
                          styles.avatarGridCard,
                          { borderColor: isSelected ? opt.borderColor : 'rgba(255,255,255,0.12)' },
                          isSelected && { backgroundColor: `${opt.borderColor}30` }
                        ]}
                        onPress={() => handleSelectAvatar(opt.id)}
                        activeOpacity={0.8}
                      >
                        <UserAvatar avatar={opt.id} size={54} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNavBar activeTab="profile" navigation={navigation} />
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
  emailHintText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255,255,255,0.55)',
    marginTop: -8,
    marginBottom: 15,
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
  addEmailPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  addEmailPromptText: {
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFD700',
  },
  addEmailForm: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    gap: 8,
  },
  addEmailInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,215,0,0.35)',
    width: '100%',
  },
  addEmailSaveBtn: {
    backgroundColor: 'rgba(0,255,136,0.15)',
    borderWidth: 1,
    borderColor: '#00FF88',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addEmailSaveBtnText: {
    color: '#00FF88',
    fontFamily: 'Poppins_700Bold',
    fontSize: 13,
  },
  addEmailCancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addEmailCancelBtnText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 13,
  },
  leagueCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 25,
    padding: 20,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,136,0.25)',
    marginBottom: 16,
  },
  categoryLeaguesGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 20,
  },
  categoryLeagueCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 3,
  },
  categoryLeagueEmoji: {
    fontSize: 22,
    marginBottom: 2,
  },
  categoryLeagueLabel: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  categoryLeagueIcon: {
    fontSize: 20,
    marginTop: 4,
  },
  categoryLeagueName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  categoryKpText: {
    fontFamily: 'Poppins_900Black',
    fontSize: 11,
    marginTop: 2,
  },
  categoryWinRateText: {
    color: 'rgba(255,255,255,0.45)',
    fontFamily: 'Poppins_400Regular',
    fontSize: 9,
    marginTop: 2,
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
  deleteAccountLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  deleteAccountLinkText: {
    color: 'rgba(255,80,80,0.85)',
    fontSize: 13,
    fontFamily: 'Poppins_600SemiBold',
    textDecorationLine: 'underline',
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
  changeAvatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#00FF88',
    backgroundColor: 'rgba(0, 255, 136, 0.12)',
    marginTop: 4,
  },
  changeAvatarText: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    letterSpacing: 0.5,
  },
  avatarSelectorCard: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(5, 11, 20, 0.75)',
    alignItems: 'center',
    width: 84,
  },
  avatarSelectorName: {
    fontSize: 10,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFF',
    marginTop: 4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_900Black',
    color: '#00FF88',
    letterSpacing: 1,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 16,
  },
  avatarGridContainer: {
    paddingBottom: 30,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  avatarGridCard: {
    width: '30%',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGridName: {
    fontSize: 11,
    fontFamily: 'Poppins_700Bold',
    marginTop: 8,
    textAlign: 'center',
  },
});
