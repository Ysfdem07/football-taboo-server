import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  TextInput,
  ImageBackground,
  Modal,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import WordCardComponent from '../components/WordCardComponent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Analytics } from '../services/analytics';
import Papa from 'papaparse';

const GOLD_NEON = '#FFD700';
const DARK_BG = '#0B0C10';

const CSV_URLS: Record<string, string> = {
  football: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0",
  cinema: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=927039923",
  music: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=648666227"
};

const THEMES: Record<string, any> = {
  football: require('../../assets/images/football_bg.jpg'),
  cinema: require('../../assets/images/cinema_bg.jpg'),
  music: require('../../assets/images/music_bg.jpg'),
};

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CardAlbum'>;
  route: RouteProp<RootStackParamList, 'CardAlbum'>;
};

export default function CardAlbumScreen({ navigation, route }: Props) {
  const [category] = useState<string>('football');
  const [cards, setCards] = useState<any[]>([]);
  const [unlockedWords, setUnlockedWords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<any | null>(null);

  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - 32 - 20) / 3);

  useEffect(() => {
    Analytics.logScreenView('CardAlbum');
    loadUnlockedCards();
  }, []);

  useEffect(() => {
    loadCategoryCards(category);
  }, [category]);

  const loadUnlockedCards = async () => {
    try {
      const stored = await AsyncStorage.getItem('@unlocked_cards');
      if (stored) {
        setUnlockedWords(JSON.parse(stored));
      } else {
        // Default unlock first 20 iconic words for initial demo
        const defaultUnlocked = ['Lionel Messi', 'Cristiano Ronaldo', 'Diego Maradona', 'Pele', 'Zinedine Zidane', 'Pulp Fiction', 'The Godfather', 'Queen'];
        setUnlockedWords(defaultUnlocked);
        await AsyncStorage.setItem('@unlocked_cards', JSON.stringify(defaultUnlocked));
      }
    } catch (e) {}
  };

  const loadCategoryCards = async (cat: string) => {
    setLoading(true);
    try {
      const url = CSV_URLS[cat] || CSV_URLS.football;
      const res = await fetch(url);
      const csvText = await res.text();
      Papa.parse(csvText, {
        complete: (results: any) => {
          const parsedCards: any[] = [];
          const rows = results.data;
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0] || !row[0].trim()) continue;
            const word = row[0].trim();
            const forbidden: string[] = [];
            for (let col = 1; col <= 5; col++) {
              if (row[col] && row[col].trim()) forbidden.push(row[col].trim());
            }
            parsedCards.push({ id: `card_${i}`, word, forbidden });
          }
          setCards(parsedCards);
          setLoading(false);
        }
      });
    } catch (e) {
      setLoading(false);
    }
  };

  const filteredCards = cards.filter(c => 
    c.word.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const unlockedCount = cards.filter(c => unlockedWords.includes(c.word)).length;
  const progressPercent = cards.length > 0 ? Math.round((unlockedCount / cards.length) * 100) : 0;

  return (
    <ImageBackground source={THEMES.football} style={styles.bgImage}>
      <View style={styles.darkOverlay} />
      <SafeAreaView style={styles.container}>
        
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={GOLD_NEON} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FUTBOL KART ALBÜMÜ</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Progress Bar & Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statsTitle}>Koleksiyon Tamamlama</Text>
            <Text style={styles.statsValue}>{unlockedCount} / {cards.length} Kart (%{progressPercent})</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, progressPercent)}%` }]} />
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#aaa" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kart veya kelime ara..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#aaa" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Cards Grid */}
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color={GOLD_NEON} />
            <Text style={styles.loadingText}>Koleksiyon Yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredCards}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.gridContainer}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={5}
            renderItem={({ item }) => {
              const isUnlocked = unlockedWords.includes(item.word);
              return (
                <WordCardComponent
                  word={item.word}
                  forbidden={item.forbidden}
                  category={category}
                  isUnlocked={isUnlocked}
                  width={cardWidth}
                  onPress={() => setSelectedCard({ ...item, isUnlocked })}
                />
              );
            }}
          />
        )}

        {/* Card Detail Modal */}
        <Modal
          visible={selectedCard !== null}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedCard(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCardWrapper}>
              {selectedCard && (
                <>
                  <WordCardComponent
                    word={selectedCard.word}
                    forbidden={selectedCard.forbidden}
                    category={category}
                    isUnlocked={selectedCard.isUnlocked}
                    width={width * 0.72}
                    compact={false}
                  />

                  <TouchableOpacity
                    style={styles.closeModalButton}
                    onPress={() => setSelectedCard(null)}
                  >
                    <Text style={styles.closeModalButtonText}>KAPAT</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 12, 16, 0.88)',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GOLD_NEON,
    letterSpacing: 1.5,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderWidth: 1,
    borderColor: GOLD_NEON,
  },
  tabText: {
    color: '#888',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: GOLD_NEON,
  },
  statsCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(20, 20, 30, 0.75)',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsTitle: {
    color: '#ccc',
    fontSize: 12,
  },
  statsValue: {
    color: GOLD_NEON,
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: GOLD_NEON,
    borderRadius: 4,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
  },
  gridContainer: {
    paddingHorizontal: 11,
    paddingBottom: 20,
  },
  gridRow: {
    justifyContent: 'flex-start',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: GOLD_NEON,
    marginTop: 12,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCardWrapper: {
    alignItems: 'center',
  },
  closeModalButton: {
    marginTop: 20,
    backgroundColor: GOLD_NEON,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  closeModalButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
