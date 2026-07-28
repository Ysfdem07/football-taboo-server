import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY_PREFIX = '@clueHistory:';

/** Retrieve recent clue combinations for a card (last up to 5 rounds) */
export async function getRecentCombos(entityId: string): Promise<string[][]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + entityId);
    if (!raw) return [];
    const combos: string[][] = JSON.parse(raw);
    return combos.slice(-5);
  } catch (e) {
    console.error('ClueHistory read error', e);
    return [];
  }
}

/** Save a new combination (array of clueIds) for a card */
export async function addCombo(entityId: string, combo: string[]): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + entityId);
    const combos: string[][] = existing ? JSON.parse(existing) : [];
    combos.push(combo);
    // keep only last 5
    const trimmed = combos.slice(-5);
    await AsyncStorage.setItem(HISTORY_KEY_PREFIX + entityId, JSON.stringify(trimmed));
  } catch (e) {
    console.error('ClueHistory write error', e);
  }
}
