import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ScrollView, StatusBar, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { BottomNavBar } from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Analytics } from '../services/analytics';
import { useLanguage } from '../context/LanguageContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;
};

export default function HowToPlayScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const topPadding = Platform.OS === 'android' ? Math.max(insets.top, (StatusBar.currentHeight || 24) + 8) : 10;
  const isEn = language === 'en';

  useEffect(() => {
    Analytics.logScreenView('HowToPlay');
  }, []);

  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={[styles.headerRow, { paddingTop: topPadding }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEn ? 'How to Play?' : 'Nasıl Oynanır?'}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Friendly Match */}
          <View style={[styles.modeCard, { borderColor: '#3498DB' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={28} color="#3498DB" />
              <Text style={[styles.cardTitle, { color: '#3498DB' }]}>
                {isEn ? 'Friendly Match' : 'Dostluk Maçı'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'No rank, no pressure — play with a random opponent or invite friends with a room code. Guest accounts can play too.'
                : 'Rütbe yok, baskı yok — rastgele biriyle ya da oda kodu ile davet ettiğin arkadaşlarınla oyna. Misafir hesapla bile oynayabilirsin.'}
            </Text>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#3498DB' }]}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Quick Match: The system pairs you with a random opponent for a standard 10-round match.'
                  : 'Hızlı Eşleşme: Sistem seni rastgele bir rakiple eşleştirir, standart 10 round oynanır.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#3498DB' }]}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Private Room: Create a room and pick the round count (10 / 20 / 30 / 50), then share the code with friends.'
                  : 'Özel Oda: Bir oda kurup round sayısını (10 / 20 / 30 / 50) sen seç, kodu arkadaşlarınla paylaş.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#3498DB' }]}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Reward: No KP in this mode — coins only. Match winner earns +25 coins, every other player earns +5 coins.'
                  : 'Kazanım: Bu modda KP yok, sadece jeton var — maçı kazanan +25 jeton, diğer tüm oyuncular +5 jeton kazanır.'}
              </Text>
            </View>
          </View>

          {/* Ranked Duel */}
          <View style={[styles.modeCard, { borderColor: '#8E44AD' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="podium" size={28} color="#8E44AD" />
              <Text style={[styles.cardTitle, { color: '#8E44AD' }]}>
                {isEn ? 'Ranked Duel' : 'Dereceli Düello'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'Requires a real account (not a guest). Earn KP and climb the league ladder.'
                : 'Gerçek hesapla (misafir değil) giriş yapman gerekir. KP kazanıp ligde yükselirsin.'}
            </Text>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? '1v1 Quick Match: Auto-paired with an opponent, always 10 rounds.'
                  : '1v1 Hızlı Eşleşme: Sistem seni bir rakiple otomatik eşleştirir, her zaman 10 round sürer.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Group Ranked: Create/join a private room with 3+ friends and play ranked together (also 10 rounds).'
                  : 'Grup Ranked: 3+ arkadaşınla özel bir oda kurup/katılıp birlikte dereceli oynayabilirsin (o da 10 round).'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'KP Rewards: 1v1 win +50 KP / loss -25 KP / draw +10 KP each. Group Ranked: 1st +125 KP, 2nd +50 KP, rest -25 KP.'
                  : 'KP Kazanımı: 1v1 galibiyet +50 KP / mağlubiyet -25 KP / beraberlik +10 KP. Grup Ranked: 1. +125 KP, 2. +50 KP, diğerleri -25 KP.'}
              </Text>
            </View>
          </View>

          {/* Weekly Tournament Mode */}
          <View style={[styles.modeCard, { borderColor: '#FFD700' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <Text style={[styles.cardTitle, { color: '#FFD700' }]}>
                {isEn ? 'Weekly Tournament' : 'Haftalık Turnuva'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'A solo leaderboard race held Monday to Sunday in every category (Football, Cinema, Music). Requires a real account.'
                : 'Pazartesi – Pazar arası her kategoride (Futbol, Sinema, Müzik) süren, solo oynanan bir liderlik yarışması. Gerçek hesap gerektirir.'}
            </Text>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>1</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Pick a category and enter — words appear one after another, each against the clock.'
                  : 'Bir kategori seç ve gir — kelimeler sırayla gelir, her biri kendi süresiyle yarışır.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>2</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Scoring uses the same system as every other mode (see below) — guessing early with fewer clues scores highest. No jokers in this mode.'
                  : 'Puanlama diğer tüm modlarla aynı sistemi kullanır (aşağıya bakın) — az ipucuyla erken bilmek en yüksek puanı verir. Bu modda joker kullanılamaz.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>3</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Sunday night rewards: 1st +400 KP & 500 coins, 2nd +200 KP & 250 coins, 3rd +100 KP & 100 coins. Everyone else who played that week gets +15 KP.'
                  : 'Pazar gecesi ödülleri: 1. +400 KP ve 500 jeton, 2. +200 KP ve 250 jeton, 3. +100 KP ve 100 jeton. O hafta katılan herkese +15 KP.'}
              </Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>4</Text></View>
              <Text style={styles.stepText}>
                {isEn
                  ? 'Tournament KP is added to the same league total as Ranked Duel — it counts toward climbing leagues too.'
                  : 'Turnuva KP\'si, Dereceli Düello ile aynı lig toplamına ekleniyor — ligde yükselmenin bir parçası.'}
              </Text>
            </View>
          </View>

          {/* Round Scoring */}
          <View style={[styles.modeCard, { borderColor: '#E67E22' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calculator" size={26} color="#E67E22" />
              <Text style={[styles.cardTitle, { color: '#F5B041' }]}>
                {isEn ? 'Round Scoring' : 'Round İçi Puanlama'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'The same formula applies in every mode — Friendly, Ranked, Group, and Tournament alike.'
                : 'Aynı formül tüm modlarda geçerli — Dostluk, Dereceli, Grup ve Turnuva fark etmez.'}
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="add-circle" size={16} color={Colors.success} style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Correct guess starts at 100 points.' : 'Doğru tahmin 100 puandan başlar.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Each extra clue shown or letter revealed: -10 points (minimum 10 points guaranteed).' : 'Açılan her ek ipucu veya harf: -10 puan (en az 10 puan garanti).'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Wrong guess: -10 point penalty (cancelled once if your Shield joker is active).' : 'Yanlış tahmin: -10 puan ceza (Kalkan jokeri aktifse bir kere iptal olur).'}</Text>
            </View>
          </View>

          {/* Jokers */}
          <View style={[styles.modeCard, { borderColor: '#16A085' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="flash" size={26} color="#16A085" />
              <Text style={[styles.cardTitle, { color: '#16A085' }]}>
                {isEn ? 'Jokers' : 'Jokerler'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'Bought in the Market for 50 coins each. Usable only in online matches (Friendly / Ranked / Group) — not in the Tournament.'
                : 'Markette 50 jetona satın alınır. Sadece online maçlarda (Dostluk / Dereceli / Grup) kullanılabilir — Turnuva\'da joker yoktur.'}
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="text" size={16} color="#16A085" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Reveal Letters: shows the word\'s first and last letter, just to you.' : 'Harf Aç: kelimenin ilk ve son harfini sadece sana açar.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="time" size={16} color="#16A085" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Extra Time: instantly adds +5 seconds to your guessing time.' : 'Ekstra Süre: tahmin sürene anında +5 saniye ekler.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="bulb" size={16} color="#16A085" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Quick Hint: instantly reveals 2 forbidden words as extra clues.' : 'Hızlı İpucu: 2 yasaklı kelimeyi anında ipucu olarak açar.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="shield-checkmark" size={16} color="#16A085" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Shield: cancels the point penalty the next time you guess wrong.' : 'Kalkan: bir sonraki yanlış tahmininde puan cezasını iptal eder.'}</Text>
            </View>
            <Text style={[styles.subSectionTitle, { marginTop: 12 }]}>{isEn ? 'Per-match limit' : 'Maç başına limit'}</Text>
            <View style={styles.bulletRow}>
              <Ionicons name="lock-closed" size={16} color="#aaa" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>
                {isEn
                  ? 'At most 3 joker uses (any type combined) per match. Longer private-room modes get more: 20 rounds → 6, 30 rounds → 9, 50 rounds → 15.'
                  : 'Maç başına en fazla 3 joker kullanımı (tür fark etmez). Özel odalarda round arttıkça bu hak da artar: 20 round → 6, 30 round → 9, 50 round → 15.'}
              </Text>
            </View>
          </View>

          {/* KP & Leagues */}
          <View style={[styles.modeCard, { borderColor: '#F1C40F' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="ribbon" size={26} color="#F1C40F" />
              <Text style={[styles.cardTitle, { color: '#F1C40F' }]}>
                {isEn ? 'KP & Leagues' : 'KP ve Lig Sistemi'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn
                ? 'KP (Career Points) comes from Ranked Duel and Weekly Tournament, and determines your league.'
                : 'KP (Kariyer Puanı), Dereceli Düello ve Haftalık Turnuva\'dan gelir ve hangi ligde olduğunu belirler.'}
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="shield-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Amateur League: 0 - 500 KP' : 'Amatör Küme: 0 - 500 KP'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="shield" size={16} color="#CD7F32" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'League 3 (Bronze): 501 - 1500 KP' : '3. Lig (Bronz): 501 - 1500 KP'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="ribbon-outline" size={16} color="#38BDF8" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'League 2 (Silver): 1501 - 3000 KP' : '2. Lig (Gümüş): 1501 - 3000 KP'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="medal-outline" size={16} color="#F59E0B" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'League 1 (Gold): 3001 - 5000 KP' : '1. Lig (Altın): 3001 - 5000 KP'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="trophy" size={16} color="#EC4899" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Champions League: 5001+ KP' : 'Şampiyonlar Ligi: 5001+ KP'}</Text>
            </View>
          </View>

          {/* Coin earning */}
          <View style={[styles.modeCard, { borderColor: '#F5B041' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="logo-bitcoin" size={26} color="#F5B041" />
              <Text style={[styles.cardTitle, { color: '#F5B041' }]}>
                {isEn ? 'Ways to Earn Coins' : 'Jeton Kazanma Yolları'}
              </Text>
            </View>
            <Text style={styles.cardSubtitle}>
              {isEn ? 'Coins are spent on jokers in the Market (50 coins each).' : 'Jetonlar Markette jokerlere harcanır (her biri 50 jeton).'}
            </Text>
            <View style={styles.bulletRow}>
              <Ionicons name="people" size={16} color="#3498DB" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Friendly Match: winner +25, everyone else +5 coins.' : 'Dostluk Maçı: kazanan +25, diğer herkes +5 jeton.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="videocam" size={16} color="#F5B041" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'End-of-match bonus ad: the winner of any online match can double their coins once (+50) by watching an ad.' : 'Maç sonu bonus reklam: herhangi bir online maçı kazanan, reklam izleyerek maç başına 1 kez +50 jeton kazanabilir.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="play-circle" size={16} color="#F5B041" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Market "Watch Ad & Earn": +50 coins per watch, up to 5 times a day.' : 'Marketteki "İzle ve Kazan": izleme başına +50 jeton, günde en fazla 5 kez.'}</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="trophy" size={16} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>{isEn ? 'Weekly Tournament top 3: 500 / 250 / 100 coins.' : 'Haftalık Turnuva ilk 3\'ü: 500 / 250 / 100 jeton.'}</Text>
            </View>
          </View>

        </ScrollView>
        <BottomNavBar activeTab="howToPlay" navigation={navigation} />
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
  modeCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#00FF88',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.success,
    marginLeft: 10,
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  stepNumber: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: 'Poppins_700Bold',
  },
  stepText: {
    fontSize: 14,
    color: Colors.white,
    flex: 1,
    lineHeight: 20,
  },
  subSectionTitle: {
    fontSize: 15,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginTop: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  bulletText: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
});
