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
import { isPrivacyOptionsRequired, showPrivacyOptions } from '../services/ads';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'About'>;
};

export default function AboutScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  const isEn = language === 'en';
  // Only shown where Google's consent platform says the region (EEA/UK/CH) requires a way to revisit ad consent.
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);
  useEffect(() => { isPrivacyOptionsRequired().then(setPrivacyOptionsRequired); }, []);

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
Son Güncelleme: Ekim 2026

Wordicoo ("Uygulama"), kullanıcılarımızın gizliliğine ve veri güvenliğine büyük önem vermektedir. Bu Gizlilik Politikası, Wordicoo mobil uygulamasını kullandığınızda hangi verilerin toplandığını, nasıl kullanıldığını ve haklarınızı açıklamak amacıyla hazırlanmıştır.

1. Toplanan Veriler ve Kullanım Amaçları

a. Kullanıcı Tarafından Sağlanan Bilgiler
Wordicoo profil kaydı (kullanıcı adı, e-posta adresi ve şifre) oluşturduğunuzda bilgileriniz güvenli veritabanımızda şifrelenerek saklanır. Bu bilgiler oyun içi profilinizi oluşturmak, skor ve KP (Kariyer Puanı) bilgilerinizi takip etmek için kullanılır.

b. Otomatik Olarak Toplanan Veriler (Google AdMob, Firebase ve Meta)
Uygulamamızın ücretsiz sunulabilmesi ve teknik kalitesinin korunması amacıyla güvenilir üçüncü taraf hizmetler kullanılmaktadır:
• Google AdMob: Kişiselleştirilmiş veya kişiselleştirilmemiş reklamlar sunmak amacıyla cihaz kimliği (Advertising ID) ve genel konum bilgisi işlenebilir. Avrupa Ekonomik Alanı, Birleşik Krallık ve İsviçre'de reklam sunulmadan önce rızanız istenir; tercihinizi "Hakkında > Reklam ve Gizlilik Tercihleri" bölümünden değiştirebilirsiniz.
• Firebase Analytics ve Crashlytics: Ekran görüntüleme ve oyun içi etkileşim istatistikleri ile teknik çökme raporlarını analiz etmek için kullanılır. Giriş yaptığınızda oyuncu kimliğiniz ve kullanıcı adınız bu analizlerle ilişkilendirilebilir.
• Meta (Facebook) SDK: Reklam ölçümü ve kurulum/kayıt gibi uygulama olaylarının atfı için cihaz tanımlayıcıları (Advertising ID dahil) ve uygulama olayları Meta ile paylaşılabilir. iOS'ta reklam kimliğine erişim yalnızca Uygulama İzleme Şeffaflığı (ATT) iznini vermeniz hâlinde yapılır.

c. Bildirimler
Bildirim izni verirseniz, haftalık turnuva hatırlatmaları gibi bildirimleri gönderebilmek için cihazınızın bildirim jetonu (push token) ve dil tercihiniz sunucumuzda saklanır. Bildirim iznini dilediğiniz zaman cihaz ayarlarından kapatabilirsiniz.

d. Oyun Verileri
Maç sonuçlarınız, skorlarınız, KP ve oyun içi jeton/joker bilgileriniz hesabınıza bağlı olarak sunucumuzda saklanır. Misafir olarak oynamak için hesap oluşturmanız gerekmez.

2. Veri Güvenliği ve Depolama
Verileriniz endüstri standardı TLS/SSL şifreleme protokolleri ile korunmaktadır. Hesap, skor ve KP verileriniz sunucumuzda; dil gibi yerel tercihleriniz ise cihazınızdaki yerel depolamada (AsyncStorage) tutulur.

3. Çocukların Gizliliği
Wordicoo genel kitleye (13 yaş ve üzeri) hitap eden eğlenceli bir kelime ve bilgi yarışması oyunudur. 13 yaşın altındaki çocuklardan bilerek hiçbir kişisel veri toplanmaz.

4. İletişim ve Hesabı Silme Talepleri
Uygulama içinden: Profil ekranındaki "Hesabımı Sil" seçeneğiyle hesabınızı anında silebilirsiniz. Bu işlem profilinizi (kullanıcı adı, e-posta, skor, KP, jeton ve jokerler) ve güncel haftalık turnuva sıralamalarındaki kaydınızı kalıcı olarak siler.
E-posta ile: Gizlilik politikamızla ilgili sorularınız veya hesabınızın/verilerinizin tamamen silinmesi talebi için bizimle iletişime geçebilirsiniz: info@wordico.net

Güncel ve tam metin: https://wordico.net/privacy`;

  const termsText = `KULLANIM KOŞULLARI\nSon Güncelleme: 26 Temmuz 2026\n\nWordicoo uygulamasını indirerek veya kullanarak bu koşulları kabul etmiş sayılırsınız.\n\nHizmetin Kullanımı\n\n• Wordicoo, bireysel ve eğlence amaçlı kullanım için sunulmuş ücretsiz bir mobil oyundur.\n• Uygulamanın kodlarını kopyalamak, değiştirmek veya tersine mühendislik işlemlerine tabi tutmak yasaktır.\n• Kelime listeleri veya oyun içeriği ticari amaçlarla kullanılamaz.\n\nSorumluluk Sınırlandırması\n\n• Uygulama "olduğu gibi" (as-is) sunulmaktadır. Kelime listelerindeki hatalardan, veri kayıplarından veya uygulamanın kullanımı sırasında oluşabilecek geçici kesintilerden geliştirici sorumlu tutulamaz.`;

  const englishPrivacyText = `PRIVACY POLICY
Last Updated: October 2026

Wordicoo ("the App") is committed to protecting user privacy and data security. This Privacy Policy explains what data is collected, how it is used, and your rights when using the Wordicoo mobile application.

1. Collected Data & Purpose of Use

a. User-Provided Information
When you create a Wordicoo profile (username, email address, password), your details are encrypted and stored in our secure database. This data is used solely to maintain your profile, scores, and KP (Career Points).

b. Automatically Collected Data (Google AdMob, Firebase & Meta)
To provide our app for free and maintain performance, we integrate industry-standard third-party services:
• Google AdMob: May process Device ID (Advertising ID) and coarse location to serve personalized or non-personalized ads. In the European Economic Area, the United Kingdom and Switzerland, your consent is requested before ads are served; you can change your choice under "About > Ad & Privacy Choices".
• Firebase Analytics & Crashlytics: Used to analyze screen views, in-game interaction statistics and technical crash reports. When you sign in, your player ID and username may be associated with these analytics.
• Meta (Facebook) SDK: Device identifiers (including the Advertising ID) and app events (such as installs and registrations) may be shared with Meta for ad measurement and attribution. On iOS, the Advertising ID is only accessed if you grant App Tracking Transparency (ATT) permission.

c. Notifications
If you allow notifications, your device's push notification token and language preference are stored on our server so we can send reminders such as weekly tournament alerts. You can turn notifications off at any time in your device settings.

d. Gameplay Data
Your match results, scores, KP and in-game coin/joker balances are stored on our server and linked to your account. You do not need an account to play as a guest.

2. Data Security & Storage
Your data is protected using TLS/SSL encryption standards. Your account, score and KP data are stored on our server; local preferences such as language are stored on your device (AsyncStorage).

3. Children's Privacy
Wordicoo is designed for a general audience aged 13 and above. We do not knowingly collect any personal information from children under 13.

4. Contact & Data Deletion Requests
In the app: Use "Delete Account" on the Profile screen to delete your account immediately. This permanently removes your profile (username, email, scores, KP, coins and jokers) and your entry on the current weekly tournament leaderboards.
By email: If you have any questions or wish to request full account/data deletion, contact us at: info@wordico.net

Latest full text: https://wordico.net/privacy`;

  const englishTermsText = `TERMS OF SERVICE\nLast Updated: July 25, 2026\n\nBy downloading or using the Wordicoo App, you agree to be bound by these terms.\n\nUse of Service\n\n• Wordicoo is a free mobile game provided for personal and entertainment purposes only.\n• You may not copy, modify, or attempt to reverse-engineer any part of the App's source code.\n• The word lists and game content cannot be extracted or used for commercial purposes.\n\nLimitation of Liability\n\n• The App is provided "as is" without warranty of any kind. The developer shall not be liable for any temporary service interruptions, data losses, or errors in the word database.`;

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
            <Text style={styles.appName}>Wordicoo</Text>
            <Text style={styles.appVersion}>{isEn ? 'Version 1.0.0' : 'Versiyon 1.0.0'}</Text>
            <Text style={styles.appDescription}>
              {isEn
                ? 'Wordicoo is a fun and dynamic word guessing game featuring thousands of up-to-date words across Football, Cinema, Music, and popular culture categories.'
                : 'Wordicoo; Futbol, Sinema, Müzik, Tarih ve popüler kültür gibi birçok farklı kategoride binlerce güncel kelimeye sahip, eğlenceli ve dinamik bir kelime tahmin oyunudur.'}
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

          {privacyOptionsRequired && (
            <TouchableOpacity style={styles.menuItem} onPress={() => showPrivacyOptions()}>
              <View style={styles.menuLeft}>
                <Ionicons name="options" size={22} color={Colors.primary} />
                <Text style={styles.menuText}>{isEn ? 'Ad & Privacy Choices' : 'Reklam ve Gizlilik Tercihleri'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}

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
