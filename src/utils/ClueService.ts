import AsyncStorage from '@react-native-async-storage/async-storage';
import cardsData from '../../assets/data/cards.json';
import cluesData from '../../assets/data/clues.json';

// Types
export interface Card {
  entityId: string;
  answer: string;
  category: string;
  difficulty: string;
  difficultyScore: number; // 1 = Rookie, 2 = Easy, 3 = Medium, 4 = Hard, 5 = Expert
  wideCluePool: string[];
}

export interface Clue {
  clueId: string;
  entityId: string;
  text: string;
  type: string;
  strength: number; // 1 (weak) - 4 (strong)
  isTop5: boolean;
}

// History storage key
const HISTORY_KEY_PREFIX = '@clueHistory:'; // per entityId

/** Retrieve recent clue combinations for a card (up to last 5 rounds) */
export async function getRecentCombos(entityId: string): Promise<string[][]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY_PREFIX + entityId);
    if (!raw) return [];
    const combos: string[][] = JSON.parse(raw);
    return combos.slice(-5); // keep only last 5
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

/** Simple Levenshtein distance for similarity check */
function levenshtein(a: string, b: string): number {
  const matrix = [];
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;
  for (let i = 0; i <= bl; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= al; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= bl; i++) {
    for (let j = 1; j <= al; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }
  return matrix[bl][al];
}

/** Filter out clues that are too close to the answer */
function filterAnswerSimilarity(clues: Clue[], answer: string): Clue[] {
  return clues.filter((c) => levenshtein(c.text.toLowerCase(), answer.toLowerCase()) > 2);
}

/** Desired strength distribution based on difficultyScore */
function strengthDistribution(score: number): Record<number, number> {
  // Simple heuristic: easier cards get more weak clues
  switch (score) {
    case 1: // Rookie
      return { 1: 3, 2: 1, 3: 1, 4: 0 };
    case 2: // Easy
      return { 1: 2, 2: 2, 3: 1, 4: 0 };
    case 3: // Medium
      return { 1: 1, 2: 2, 3: 1, 4: 1 };
    case 4: // Hard
      return { 1: 0, 2: 1, 3: 2, 4: 2 };
    case 5: // Expert
      return { 1: 0, 2: 0, 3: 2, 4: 3 };
    default:
      return { 1: 2, 2: 2, 3: 1, 4: 0 };
  }
}

/** Select 5 clues for a given card respecting rules */
export async function selectClues(card: Card): Promise<Clue[]> {
  // 1️⃣ Gather all clues for the entity
  let pool = (cluesData as Clue[]).filter((c) => c.entityId === card.entityId);

  // 2️⃣ Remove duplicates (same text) – keep the strongest version
  const uniqMap = new Map<string, Clue>();
  pool.forEach((c) => {
    const key = c.text.trim().toLowerCase();
    const existing = uniqMap.get(key);
    if (!existing || c.strength > existing.strength) {
      uniqMap.set(key, c);
    }
  });
  pool = Array.from(uniqMap.values());

  // 3️⃣ Filter out clues that are too similar to the answer
  pool = filterAnswerSimilarity(pool, card.answer);

  // 4️⃣ Ensure at least 3 distinct types (tip çeşitliliği)
  const typeCounts: Record<string, number> = {};
  pool.forEach((c) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  const distinctTypes = Object.keys(typeCounts).length;

  // If we have less than 3 types, we will supplement with wideCluePool strings
  if (distinctTypes < 3) {
    const needed = 3 - distinctTypes;
    const extraStrings = card.wideCluePool.slice(0, needed * 2); // grab a few
    extraStrings.forEach((txt) => {
      const genericClue: Clue = {
        clueId: `GEN-${txt.substring(0, 5).toUpperCase()}-${Date.now()}`,
        entityId: card.entityId,
        text: txt,
        type: 'Genel',
        strength: 1,
        isTop5: false,
      };
      pool.push(genericClue);
    });
  }

  // 5️⃣ Apply strength distribution
  const dist = strengthDistribution(card.difficultyScore);
  const selected: Clue[] = [];
  const remaining = [...pool];
  // Helper to pick a clue of a specific strength
  const pickOfStrength = (strength: number) => {
    const idx = remaining.findIndex((c) => c.strength === strength);
    if (idx !== -1) {
      const [c] = remaining.splice(idx, 1);
      selected.push(c);
      return true;
    }
    return false;
  };

  // Try to fulfill the distribution, fallback to any remaining clues
  for (const [strengthStr, count] of Object.entries(dist)) {
    const strength = Number(strengthStr);
    for (let i = 0; i < count; i++) {
      if (!pickOfStrength(strength)) {
        // fallback: pick any clue
        if (remaining.length > 0) {
          selected.push(remaining.shift() as Clue);
        }
      }
    }
  }

  // 6️⃣ Ensure we have exactly 5 clues (pad with generic from wide pool if needed)
  while (selected.length < 5) {
    const extra = card.wideCluePool.shift();
    if (!extra) break;
    selected.push({
      clueId: `GEN-${extra.substring(0, 5).toUpperCase()}-${Date.now()}`,
      entityId: card.entityId,
      text: extra,
      type: 'Genel',
      strength: 1,
      isTop5: false,
    });
  }

  // 7️⃣ Avoid recent duplicate combos (last 5 rounds)
  const recent = await getRecentCombos(card.entityId);
  const recentSets = recent.map((arr) => new Set(arr));
  const comboIds = selected.map((c) => c.clueId);
  let attempts = 0;
  const maxAttempts = 10;
  while (recentSets.some((s) => {
    // consider overlap >=3 as duplicate
    const overlap = comboIds.filter((id) => s.has(id)).length;
    return overlap >= 3;
  }) && attempts < maxAttempts) {
    // simple reshuffle: try to replace a random clue with another from pool
    const replaceIdx = Math.floor(Math.random() * selected.length);
    const replaceClue = selected[replaceIdx];
    // find alternative of same strength if possible
    const alternatives = pool.filter((c) => c.strength === replaceClue.strength && !selected.includes(c));
    if (alternatives.length > 0) {
      const newClue = alternatives[Math.floor(Math.random() * alternatives.length)];
      selected[replaceIdx] = newClue;
    }
    attempts++;
  }

  // 8️⃣ Persist this combo for future rounds
  await addCombo(card.entityId, comboIds);

  // 9️⃣ Sort clues by strength ascending (weak -> strong) for reveal order
  selected.sort((a, b) => a.strength - b.strength);

  return selected;
}
