// src/utils/jokerGate.ts
//
// Shown right before any "start a duel" action (real-opponent search, direct
// invite, or a bot match) unless the player already has at least one of
// EVERY joker type — nudges them toward the Market otherwise instead of
// finding out mid-match that they're missing one. Not a hook/component, so
// it can't use useLanguage(); reads the persisted language directly the
// same way LanguageContext itself does.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../components/CustomAlert';
import { translations, Language } from '../constants/translations';
import { navigationRef } from '../navigation/navigationRef';

const JOKER_TYPES = ['revealLetters', 'extraTime', 'instantHints', 'shield'] as const;

const hasFullJokerSet = (jokers: any): boolean => {
  if (!jokers || typeof jokers !== 'object') return false;
  return JOKER_TYPES.every(key => typeof jokers[key] === 'number' && jokers[key] > 0);
};

type GateStrings = typeof translations['tr'];
const t = (lang: Language, key: keyof GateStrings) => (translations as any)[lang][key];

// Always call this instead of starting the duel action directly. Calls
// `proceed()` immediately if the player already has a joker of some kind,
// or as soon as they pick "start anyway" from the prompt. Never blocks the
// duel over a storage read failing.
export async function gateOnJokers(proceed: () => void): Promise<void> {
  try {
    const [profileRaw, langRaw] = await Promise.all([
      AsyncStorage.getItem('@logged_in_profile'),
      AsyncStorage.getItem('@app_language'),
    ]);
    const profile = profileRaw ? JSON.parse(profileRaw) : null;
    const lang: Language = langRaw === 'en' ? 'en' : 'tr';

    if (hasFullJokerSet(profile?.jokers)) {
      proceed();
      return;
    }

    CustomAlert.show(
      t(lang, 'jokerGateTitle'),
      t(lang, 'jokerGateMsg'),
      [
        { text: t(lang, 'jokerGateStartAnyway'), style: 'cancel', onPress: proceed },
        {
          text: t(lang, 'jokerGateGoToMarket'),
          onPress: () => {
            if (navigationRef.isReady()) (navigationRef.navigate as (name: string) => void)('Market');
          },
        },
      ],
      'neutral'
    );
  } catch (e) {
    proceed();
  }
}
