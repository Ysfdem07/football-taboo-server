import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ImageBackground, SafeAreaView, ScrollView, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getSocket } from '../services/socket';
import { UserAvatar, AVATAR_OPTIONS } from '../components/UserAvatar';
import { useLanguage } from '../context/LanguageContext';
import { CustomAlert } from '../components/CustomAlert';
import { Analytics } from '../services/analytics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const NEON_GREEN = '#00FF88';

const generateHiddenPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 24; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
};

export default function OnboardingScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [loading, setLoading] = useState(false);

  const goToTutorial = () => {
    navigation.replace('Tutorial');
  };

  const createLocalGuest = async () => {
    const guest = {
      id: 'guest',
      username: username.trim(),
      avatar: selectedAvatar,
      coins: 0,
      jokers: { revealLetters: 0, extraTime: 0, instantHints: 0, shield: 0 },
    };
    await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(guest));
  };

  const handleContinue = async () => {
    const name = username.trim();
    if (name.length < 3 || name.length > 30) {
      CustomAlert.show(
        language === 'en' ? 'Error' : 'Hata',
        language === 'en' ? 'Username must be between 3 and 30 characters.' : 'Kullanıcı adı 3-30 karakter arasında olmalıdır.'
      );
      return;
    }
    const trimmedEmail = email.trim();
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        CustomAlert.show(
          language === 'en' ? 'Error' : 'Hata',
          language === 'en' ? 'Please enter a valid email address, or leave it blank.' : 'Lütfen geçerli bir e-posta adresi gir, ya da boş bırak.'
        );
        return;
      }
    }

    setLoading(true);

    // Always register a real, unique account — email was only ever meant to
    // be optional for account recovery, not a gate on having a real account
    // at all (features like the weekly tournament need a stable server-side
    // player id, which a shared local "guest" id can't provide). Matches
    // ProfileScreen's own register flow, which does the same regardless of
    // whether an email was given.
    const generatedPassword = generateHiddenPassword();
    const socket = getSocket();
    let settled = false;

    const finishWithGuestFallback = async () => {
      if (settled) return;
      settled = true;
      socket.off('register_response', onResponse);
      await createLocalGuest();
      setLoading(false);
      goToTutorial();
    };

    const onResponse = async (res: any) => {
      if (settled) return;
      settled = true;
      socket.off('register_response', onResponse);
      if (res.success) {
        Analytics.logUserRegister(res.player.id, res.player.username);
        const sessionData = { ...res.player, password: generatedPassword };
        await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(sessionData));
        setLoading(false);
        goToTutorial();
      } else {
        // Most likely a taken username — let them pick another rather than
        // silently downgrading to a guest they didn't ask for.
        setLoading(false);
        CustomAlert.show(
          language === 'en' ? 'Could not create profile' : 'Profil oluşturulamadı',
          res.error || (language === 'en' ? 'Please try a different username.' : 'Lütfen başka bir kullanıcı adı dene.')
        );
      }
    };

    socket.on('register_response', onResponse);
    const emit = () => socket.emit('register_profile', {
      username: name,
      password: generatedPassword,
      avatar: selectedAvatar,
      email: trimmedEmail,
    });
    if (socket.connected) emit(); else socket.once('connect', emit);

    // Flaky/offline network on a first launch shouldn't brick onboarding —
    // fall back to a local guest profile if the server never answers.
    setTimeout(finishWithGuestFallback, 8000);
  };

  return (
    <ImageBackground source={require('../../assets/images/home_bg.jpg')} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>WORDICOO</Text>
          <Text style={styles.welcome}>
            {language === 'en' ? 'Welcome! Let\'s set you up.' : 'Hoş geldin! Seni tanıyalım.'}
          </Text>

          <Text style={styles.label}>{language === 'en' ? 'Username' : 'Kullanıcı Adı'}</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder={language === 'en' ? 'e.g. FastGuesser' : 'örn. HızlıTahminci'}
            placeholderTextColor="#6b7280"
            maxLength={30}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>
            {language === 'en' ? 'Email (optional — for account recovery)' : 'E-posta (opsiyonel — hesabını kurtarmak için)'}
          </Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={language === 'en' ? 'you@example.com' : 'ornek@mail.com'}
            placeholderTextColor="#6b7280"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.legal}>
            {language === 'en'
              ? "By continuing, you agree to Wordicoo's Privacy Policy and Terms of Use."
              : 'Devam ederek Wordicoo\'nun Gizlilik Politikası ve Kullanım Koşulları\'nı kabul etmiş olursun.'}
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={NEON_GREEN} style={{ marginVertical: 20 }} />
          ) : (
            <TouchableOpacity style={styles.cta} onPress={handleContinue} activeOpacity={0.85}>
              <Text style={styles.ctaText}>{language === 'en' ? 'GET STARTED' : 'BAŞLA'}</Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.label, { marginTop: 26 }]}>{language === 'en' ? 'Choose an avatar' : 'Bir avatar seç'}</Text>
          <View style={styles.avatarGrid}>
            {AVATAR_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.id} onPress={() => setSelectedAvatar(opt.id)} activeOpacity={0.8}>
                <View style={[styles.avatarWrap, selectedAvatar === opt.id && styles.avatarWrapSelected]}>
                  <UserAvatar avatar={opt.id} size={52} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#050B14' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.82)' },
  container: { flex: 1 },
  scroll: { padding: 24, alignItems: 'center', paddingBottom: 40 },
  logo: { width: 64, height: 64, borderRadius: 16, marginTop: 12 },
  title: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: 1, marginTop: 10 },
  welcome: { color: '#cbd5e1', fontSize: 15, fontWeight: '600', marginTop: 6, marginBottom: 22, textAlign: 'center' },
  label: { color: NEON_GREEN, fontSize: 13, fontWeight: '800', alignSelf: 'flex-start', marginBottom: 8, marginTop: 8, letterSpacing: 0.5 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 10 },
  avatarWrap: { padding: 3, borderRadius: 32, borderWidth: 2, borderColor: 'transparent' },
  avatarWrapSelected: { borderColor: NEON_GREEN },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 15,
    marginBottom: 6,
  },
  legal: { color: '#8898aa', fontSize: 11, textAlign: 'center', marginTop: 16, marginBottom: 20, lineHeight: 16 },
  cta: {
    width: '100%',
    backgroundColor: NEON_GREEN,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: NEON_GREEN,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  ctaText: { color: '#031007', fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
});
