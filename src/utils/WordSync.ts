import AsyncStorage from '@react-native-async-storage/async-storage';
import Papa from 'papaparse';
import fallbackWords from '../../assets/data/words.json';

const CSV_URLS: { [key: string]: string } = {
  football: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0",
  cinema: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=927039923",
  music: "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=648666227"
};

const WORDS_STORAGE_KEY_PREFIX = '@taboo_words_v4_';

export interface Word {
  word: string;
  forbidden: string[];
}

export const syncWords = async (): Promise<boolean> => {
  let overallSuccess = true;
  for (const category of Object.keys(CSV_URLS)) {
    try {
      console.log(`Fetching new words from Google Sheets for ${category}...`);
      const response = await fetch(CSV_URLS[category]);
      if (!response.ok) {
         console.log(`Network error or invalid URL for ${category}`);
         overallSuccess = false;
         continue;
      }
      const csvText = await response.text();
      
      const parsedSuccess = await new Promise<boolean>((resolve) => {
        Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true,
          complete: async (results) => {
            const newWords: Word[] = [];
            const rows = results.data as string[][];
            
            if (!rows || rows.length < 5) {
              console.log(`Validation failed: Too few rows in parsed CSV for ${category}.`);
              resolve(false);
              return;
            }

            // Validate header row to prevent HTML redirect/consent wall parsing
            const headerWord = rows[0][0] ? rows[0][0].trim() : '';
            if (headerWord.length > 50 || headerWord.toLowerCase().includes('<html')) {
              console.log(`Validation failed: CSV seems to be an HTML page for ${category}. Found: ${headerWord}`);
              resolve(false);
              return;
            }
            
            for (let i = 1; i < rows.length; i++) { // Skip header row
              const cols = rows[i];
              if (!cols || cols.length === 0 || !cols[0]?.trim()) {
                console.log(`WordSync: Ignoring empty/invalid row ${i}`);
                continue;
              }
              const word = cols[0].trim();
              const f1 = cols[1]?.trim() || '';
              const f2 = cols[2]?.trim() || '';
              const f3 = cols[3]?.trim() || '';
              const f4 = cols[4]?.trim() || '';
              const f5 = cols[5]?.trim() || '';
              
              if (word) {
                newWords.push({
                  word,
                  forbidden: [f1, f2, f3, f4, f5].filter(f => f.length > 0)
                });
              }
            }

            console.log(`Successfully parsed ${newWords.length} words for ${category}`);
            
            // Verify that we actually got taboo words (they must have forbidden items)
            const validWordsCount = newWords.filter(w => w.forbidden.length > 0).length;
            if (newWords.length > 30 && validWordsCount > newWords.length * 0.8) {
              await AsyncStorage.setItem(`${WORDS_STORAGE_KEY_PREFIX}${category}`, JSON.stringify(newWords));
              console.log(`Successfully validated and synced ${newWords.length} words from cloud for ${category}.`);
              resolve(true);
            } else {
              console.log(`Validation failed for ${category}: parsed ${newWords.length} words, but only ${validWordsCount} had forbidden items.`);
              resolve(false);
            }
          },
          error: (err: any) => {
            console.log(`PapaParse error for ${category}:`, err);
            resolve(false);
          }
        });
      });
      if (!parsedSuccess) overallSuccess = false;
    } catch (error) {
      console.error(`Failed to sync words for ${category}:`, error);
      overallSuccess = false;
    }
  }
  console.log(`Overall sync status: ${overallSuccess}`);
  return overallSuccess;
};

export const shuffleArray = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const getWords = async (category: string = 'football'): Promise<Word[]> => {
  let wordsToReturn: Word[] = [];
  try {
    const jsonValue = await AsyncStorage.getItem(`${WORDS_STORAGE_KEY_PREFIX}${category}`);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        wordsToReturn = parsed as Word[];
      }
    }
  } catch (e) {
    console.error(`Error reading words from storage for ${category}`, e);
  }
  
  // Fallback to local for football
  if (wordsToReturn.length === 0 && category === 'football') {
    console.log("Using local fallback words.json for football");
    wordsToReturn = fallbackWords as Word[];
  }
  
  // Return cards with randomized / rotated forbidden clues order to prevent memorization
  return wordsToReturn.map(w => ({
    ...w,
    forbidden: shuffleArray(w.forbidden || [])
  }));
};
