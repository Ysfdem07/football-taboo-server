import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, SafeAreaView, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Colors } from '../constants/Colors';
import { BottomNavBar } from '../components/BottomNavBar';
import { Ionicons } from '@expo/vector-icons';
import { Analytics } from '../services/analytics';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'HowToPlay'>;
};

export default function HowToPlayScreen({ navigation }: Props) {
  useEffect(() => {
    Analytics.logScreenView('HowToPlay');
  }, []);
  return (
    <ImageBackground source={require('../../assets/images/football_bg.jpg')} style={styles.bgImage}>
      <SafeAreaView style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nasıl Oynanır?</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Çevrimiçi Mod (İlk Sırada) */}
          <View style={[styles.modeCard, { borderColor: '#8E44AD' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="globe" size={28} color="#8E44AD" />
              <Text style={[styles.cardTitle, { color: '#8E44AD' }]}>Düello (Online)</Text>
            </View>
            <Text style={styles.cardSubtitle}>Uzaktaki arkadaşlarınızla lobi kurarak internet üzerinden eş zamanlı yarışabileceğiniz moddur.</Text>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>1</Text></View>
              <Text style={styles.stepText}>Bir oyuncu oda kurarak kodu paylaşır, diğerleri katılır. Odayı kuran dahil **tüm oyuncular** aynı anda yarışan birer tahmincidir.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>2</Text></View>
              <Text style={styles.stepText}>Sistem, seçilen kategorideki hedef kelimeyi tarif eden ipuçlarını **5'er saniye aralıklarla** otomatik olarak sırayla ekranda gösterir.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>3</Text></View>
              <Text style={styles.stepText}>**Değişken Puanlama:** İpucu harfleri açılmadan önce doğru bilirseniz **en yüksek puanı** alırsınız. Sistem harf yardımı verdikçe kazanılacak puan azalır.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#8E44AD' }]}><Text style={styles.stepNumberText}>4</Text></View>
              <Text style={styles.stepText}>**Hatalı Tahmin Cezası:** Rastgele yazmak cezalandırılır; yaptığınız her yanlış tahmin için hanenize **eksi puan** yazılır. En yüksek puanı toplayan kazanır!</Text>
            </View>
          </View>

          {/* Haftalık Turnuva Modu */}
          <View style={[styles.modeCard, { borderColor: '#FFD700' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="trophy" size={28} color="#FFD700" />
              <Text style={[styles.cardTitle, { color: '#FFD700' }]}>Haftalık Turnuva Modu</Text>
            </View>
            <Text style={styles.cardSubtitle}>Pazartesi – Pazar günleri arasında her kategoride (Futbol, Sinema, Müzik) düzenlenen haftalık liderlik yarışmasıdır.</Text>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>1</Text></View>
              <Text style={styles.stepText}>**Kategori Seçimi:** İstediğiniz kategoride (Futbol, Sinema, Müzik) Haftalık Turnuva moduna girin ve yarışmayı başlatın.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>2</Text></View>
              <Text style={styles.stepText}>**Süreyle Yarış:** Belirlenen süre içerisinde sıralı kelimeler ekrana gelir. İpuçlarını ve harf yardımlarını kullanarak doğru tahminde bulunun.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>3</Text></View>
              <Text style={styles.stepText}>**Seri Doğru & Erken Tahmin Bonusu:** Kelimeyi ne kadar az ipucu açarak doğru tahmin ederseniz tur sonu kazandığınız puan o kadar yüksek olur.</Text>
            </View>

            <View style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: '#FFD700' }]}><Text style={[styles.stepNumberText, { color: '#000' }]}>4</Text></View>
              <Text style={styles.stepText}>**Haftalık Sıralama & Kupa Ödülleri:** Hafta sonunda her kategoride ilk 3'e giren oyuncular Liderlik Tablosu'nda özel Şampiyonluk Kupa ve Rozetlerini kazanır!</Text>
            </View>
          </View>

          {/* Puanlama Sistemi */}
          <View style={[styles.modeCard, { borderColor: '#E67E22' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="calculator" size={26} color="#E67E22" />
              <Text style={[styles.cardTitle, { color: '#F5B041' }]}>Puanlama ve KP Mekanizmaları</Text>
            </View>
            <Text style={styles.cardSubtitle}>Farklı modlarda aldığınız skorlar ve Dereceli Lig KP (Kariyer Puanı) kazanımları aşağıdaki gibidir:</Text>

            <Text style={styles.subSectionTitle}>Haftalık Turnuva Modu</Text>
            <View style={styles.bulletRow}>
              <Ionicons name="add-circle" size={16} color={Colors.success} style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**Hızlı Doğru Tahmin:** +100 Yüksek Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="sparkles" size={16} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**Açılan İpucu / Harf İndirimi:** İpucu açıldıkça turun potansiyel puanı kademeli azalır.</Text>
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>Düello (Online) Modu</Text>
            <View style={styles.bulletRow}>
              <Ionicons name="flash" size={16} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**1. İpucunda Doğru Tahmin:** +100 Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="flash" size={16} color="#F39C12" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**2. İpucunda Doğru Tahmin:** +80 Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="flash" size={16} color="#E67E22" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**3. İpucunda Doğru Tahmin:** +60 Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="flash" size={16} color="#D35400" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**4. İpucunda Doğru Tahmin:** +40 Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="flash" size={16} color="#C0392B" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**5. İpucunda Doğru Tahmin:** +20 Skor Puanı</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="alert-circle" size={16} color={Colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**Her Yanlış Tahmin:** -10 Skor Puanı (Cezası)</Text>
            </View>

            <Text style={[styles.subSectionTitle, { marginTop: 15 }]}>Dereceli Maç Lig Puanı (KP) Dağılımı</Text>
            <View style={styles.bulletRow}>
              <Ionicons name="trophy" size={16} color="#FFD700" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**1v1 Galibiyet / Mağlubiyet:** +50 KP / -25 KP</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="git-commit" size={16} color="#aaa" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**1v1 Beraberlik:** Her iki oyuncuya +10 KP</Text>
            </View>
            <View style={styles.bulletRow}>
              <Ionicons name="ribbon" size={16} color="#3498DB" style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**Grup Modu (3+ Oyuncu) Sıralaması:**</Text>
            </View>
            <Text style={[styles.bulletText, { marginLeft: 24, fontSize: 13, color: '#aaa', marginTop: 2 }]}>
              • 1. Sıra (Şampiyon): +125 KP{"\n"}
              • 2. Sıra: +50 KP{"\n"}
              • Diğer Sıralar (Kaybedenler): -25 KP
            </Text>
            <View style={[styles.bulletRow, { marginTop: 8 }]}>
              <Ionicons name="heart-dislike" size={16} color={Colors.danger} style={{ marginRight: 8 }} />
              <Text style={styles.bulletText}>**Hükmen Çekilme (Rage Quit):**</Text>
            </View>
            <Text style={[styles.bulletText, { marginLeft: 24, fontSize: 13, color: '#aaa', marginTop: 2 }]}>
              • Oyundan Ayrılan: -35 KP Ceza Puanı{"\n"}
              • Oyunda Kalan: +50 KP Galibiyet Puanı
            </Text>
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
