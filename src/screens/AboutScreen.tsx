import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ScrollView, Modal, StatusBar, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { BottomNavBar } from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Analytics } from '../services/analytics';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'About'>;
};

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  const isEn = language === 'en';

  useEffect(() => {
    Analytics.logScreenView('About');
  }, []);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');

  const openDocument = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalVisible(true);
  };

  const privacyText = `GİZLİLİK POLİTİKASI
Son Güncelleme: 26 Temmuz 2026

Wordico ("Uygulama"), kullanıcıların gizliliğine son derece önem vermektedir. Bu gizlilik politikası, uygulamamızı kullandığınızda toplanan veriler ve gizlilik haklarınız hakkında sizi bilgilendirmek amacıyla hazırlanmıştır.

Veri Toplama ve Kullanımı

• E-Posta Adresi ve Profil: Çevrimiçi "Dereceli" oyun modlarına katılabilmeniz ve Kariyer Puanı (KP) kazanabilmeniz için e-posta adresi, kullanıcı adı ve şifre belirleyerek kayıt olmanız gerekmektedir. E-posta adresiniz hesabınızın güvenliğini sağlamak, şifre sıfırlama işlemlerini gerçekleştirmek ve profil bütünlüğünü korumak amacıyla MongoDB veritabanında saklanır.
• Kullanıcı Onaylı Pazarlama Verileri: Kayıt esnasında onay vermeniz durumunda, e-posta adresiniz reklam mecralarında (Google Ads, Meta, TikTok vb.) benzer hedef kitleler oluşturmak ve pazarlama analizleri gerçekleştirmek amacıyla güvenli ve şifreli (hashing) olarak eşleştirilebilir.
• Analiz Verileri (Analytics): Uygulama performansını iyileştirmek, düello hatalarını tespit etmek ve oyun deneyimini optimize etmek amacıyla oturum başlangıcı, oyun başlatma ve kazanma gibi anonim oyun içi olaylar (events) yerel analiz adaptörümüz tarafından takip edilir.
• Yerel Depolama (AsyncStorage): Çevrimdışı oyun tercihleri, profil giriş bilgileri ve indirilen kelimeler cihazınızda saklanır.

Çocukların Gizliliği
Uygulamamız COPPA (Çocukların Çevrimiçi Gizliliğini Koruma Yasası) ve GDPR (Genel Veri Koruma Yönetmeliği) kurallarına tamamen uygundur. E-posta kaydı 13 yaş altı kullanıcılar için uygun değildir.`;

  const termsText = `KULLANIM KOŞULLARI\nSon Güncelleme: 26 Temmuz 2026\n\nWordico uygulamasını indirerek veya kullanarak bu koşulları kabul etmiş sayılırsınız.\n\nHizmetin Kullanımı\n\n• Wordico, bireysel ve eğlence amaçlı kullanım için sunulmuş ücretsiz bir mobil oyundur.\n• Uygulamanın kodlarını kopyalamak, değiştirmek veya tersine mühendislik işlemlerine tabi tutmak yasaktır.\n• Kelime listeleri veya oyun içeriği ticari amaçlarla kullanılamaz.\n\nSorumluluk Sınırlandırması\n\n• Uygulama "olduğu gibi" (as-is) sunulmaktadır. Kelime listelerindeki hatalardan, veri kayıplarından veya uygulamanın kullanımı sırasında oluşabilecek geçici kesintilerden geliştirici sorumlu tutulamaz.`;

  const englishPrivacyText = `PRIVACY POLICY
Last Updated: July 26, 2026

Wordico ("the App") is committed to protecting user privacy. This Privacy Policy explains our practices regarding data collection and your privacy rights.

Data Collection and Usage

• Email and Profile Data: To participate in online "Ranked" duels and earn Career Points (KP), you must register with a username, password, and valid email address. Your email address is stored securely in our MongoDB database to protect account security, facilitate password recovery, and verify profile integrity.
• User-Consented Marketing Data: If you opt-in during registration, your hashed email address may be matched on marketing platforms (such as Google Ads, Meta, TikTok) to create lookalike audiences and analyze ad campaign performance.
• Event Analytics: To optimize game stability and analyze usage metrics, the App tracks anonymous in-game events (such as session start, game start, and duel completions) using a built-in analytics adapter.
• Local Storage: Offline settings and login credentials are cached locally on your device for seamless access.

Children's Privacy
The App complies with COPPA and GDPR regulations. Registration is restricted for users under 13 years of age.`;

  const englishTermsText = `TERMS OF SERVICE\nLast Updated: July 25, 2026\n\nBy downloading or using the Wordico App, you agree to be bound by these terms.\n\nUse of Service\n\n• Wordico is a free mobile game provided for personal and entertainment purposes only.\n• You may not copy, modify, or attempt to reverse-engineer any part of the App's source code.\n• The word lists and game content cannot be extracted or used for commercial purposes.\n\nLimitation of Liability\n\n• The App is provided "as is" without warranty of any kind. The developer shall not be liable for any temporary service interruptions, data losses, or errors in the word database.`;

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.headerRow, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEn ? 'About / Info' : 'Hakkımızda / Bilgi'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.infoCard}>
            <Text style={styles.appName}>Wordico</Text>
            <Text style={styles.appVersion}>{isEn ? 'Version 1.0.0' : 'Versiyon 1.0.0'}</Text>
            <Text style={styles.appDescription}>
              {isEn
                ? 'Wordico is a fun and dynamic word guessing game featuring thousands of up-to-date words across Football, Cinema, Music, and popular culture categories.'
                : 'Wordico; Futbol, Sinema, Müzik, Tarih ve popüler kültür gibi birçok farklı kategoride binlerce güncel kelimeye sahip, eğlenceli ve dinamik bir kelime tahmin oyunudur.'}
            </Text>
          </View>

          <Text style={styles.sectionHeader}>{isEn ? 'Legal Documents & Info' : 'Yasal Metinler & Bilgilendirme'}</Text>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => openDocument(isEn ? 'Privacy Policy' : 'Gizlilik Politikası', isEn ? englishPrivacyText : privacyText)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>{isEn ? 'Privacy Policy' : 'Gizlilik Politikası'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem} 
            onPress={() => openDocument(isEn ? 'Terms of Service' : 'Kullanım Koşulları', isEn ? englishTermsText : termsText)}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="document-text" size={22} color={Colors.primary} />
              <Text style={styles.menuText}>{isEn ? 'Terms of Service' : 'Kullanım Koşulları'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          {/* App Permissions Section (Translated) */}
          <View style={styles.permissionCard}>
            <Text style={styles.permissionHeader}>{isEn ? 'App Permissions' : 'Uygulama İzinleri (Permissions)'}</Text>
            <View style={styles.permissionRow}>
              <Ionicons name="wifi" size={18} color={Colors.success} />
              <Text style={styles.permissionText}>
                {isEn 
                  ? 'Internet Access: Required for online duels, tournaments, and word syncing.' 
                  : 'İnternet Erişimi: Kelimelerin eşleşmesi ve online lobiler için kullanılır.'}
              </Text>
            </View>
            <View style={styles.permissionRow}>
              <Ionicons name="save" size={18} color={Colors.success} />
              <Text style={styles.permissionText}>
                {isEn 
                  ? 'Local Storage: Stores offline game preferences, profile session, and cached word lists.' 
                  : 'Yerel Depolama: İndirilen kelimeleri ve oyun skorlarını kaydeder.'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalTitle}</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color={Colors.white} />
                </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={styles.modalBody}>
                <Text style={styles.modalText}>{modalContent}</Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <BottomNavBar activeTab="none" navigation={navigation} />
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
  infoCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.2)',
  },
  appName: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
    marginBottom: 5,
    textShadowColor: 'rgba(0,255,136,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 15,
  },
  appDescription: {
    fontSize: 15,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionHeader: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textSecondary,
    marginBottom: 10,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.15)',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: Colors.white,
    marginLeft: 12,
    fontFamily: 'Poppins_400Regular',
  },
  permissionCard: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.18)',
  },
  permissionHeader: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  permissionText: {
    fontSize: 13,
    color: Colors.white,
    marginLeft: 10,
    flex: 1,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'rgba(0,8,20,0.98)',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '80%',
    padding: 20,
    borderTopWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#222',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#00FF88',
  },
  modalBody: {
    paddingBottom: 40,
  },
  modalText: {
    fontSize: 14,
    color: Colors.white,
    lineHeight: 22,
  },
});
