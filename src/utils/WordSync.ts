import AsyncStorage from '@react-native-async-storage/async-storage';
import Papa from 'papaparse';
import fallbackWords from '../../assets/data/words.json';

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1i5Xz3CVZtqC5uf7Fgu8FX-CCmaw6acAHv5mooEFs5A4/export?format=csv&gid=0";
const WORDS_STORAGE_KEY = '@taboo_words_v3';

export interface Word {
  word: string;
  forbidden: string[];
}

export const syncWords = async (): Promise<boolean> => {
  try {
    console.log("Fetching new words from Google Sheets...");
    const response = await fetch(GOOGLE_SHEET_CSV_URL);
    if (!response.ok) {
       console.log("Network error or invalid URL");
       return false;
    }
    const csvText = await response.text();
    
    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: async (results) => {
          const newWords: Word[] = [];
          const rows = results.data as string[][];
          
          if (!rows || rows.length < 5) {
            console.log("Validation failed: Too few rows in parsed CSV.");
            resolve(false);
            return;
          }

          // Validate header row to prevent HTML redirect/consent wall parsing
          const headerWord = rows[0][0] ? rows[0][0].trim() : '';
          if (headerWord !== 'Ana Kelime') {
            console.log("Validation failed: CSV header is incorrect. Found:", headerWord);
            resolve(false);
            return;
          }
          
          for (let i = 1; i < rows.length; i++) { // Skip header row
            const row = rows[i];
            if (!row[0] || row[0].trim() === '') continue; // skip empty main word
            
            const word = row[0].trim();
            const forbidden: string[] = [];
            
            // Parse all available columns as forbidden words dynamically
            for (let col = 1; col < row.length; col++) {
               if (row[col] && row[col].trim() !== '') {
                  forbidden.push(row[col].trim());
               }
            }
            
            newWords.push({ word, forbidden });
          }
          
          // Verify that we actually got taboo words (they must have forbidden items)
          const validWordsCount = newWords.filter(w => w.forbidden.length > 0).length;
          if (newWords.length > 50 && validWordsCount > newWords.length * 0.8) {
            await AsyncStorage.setItem(WORDS_STORAGE_KEY, JSON.stringify(newWords));
            console.log(`Successfully validated and synced ${newWords.length} words from cloud.`);
            resolve(true);
          } else {
            console.log(`Validation failed: parsed ${newWords.length} words, but only ${validWordsCount} had forbidden items.`);
            resolve(false);
          }
        },
        error: (err: any) => {
          console.error("Error parsing CSV:", err);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error("Failed to sync words:", error);
    return false;
  }
};

export const getWords = async (): Promise<Word[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(WORDS_STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Word[];
      }
    }
  } catch (e) {
    console.error("Error reading words from storage", e);
  }
  
  // Fallback to local
  console.log("Using local fallback words.json");
  return fallbackWords as Word[];
};
