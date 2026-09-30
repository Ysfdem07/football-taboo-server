// src/utils/jokerGate.ts
//
// Shown right before any "start a duel" action (real-opponent search, direct
// invite, or a bot match) when the player has zero jokers of every kind —
// nudges them toward the Market instead of finding out jokers exist only
// mid-match. Not a hook/component, so it can't use useLanguage(); reads the
// persisted language directly the same way LanguageContext itself does.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomAlert } from '../components/CustomAlert';
import { translations, Language } from '../constants/translations';
import { navigationRef } from '../navigation/navigationRef';

const hasAnyJoker = (jokers: any): boolean => {
  if (!jokers || typeof jokers !== 'object') return false;
  return Object.values(jokers).some(v => typeof v === 'number' && v > 0);
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

    if (hasAnyJoker(profile?.jokers)) {
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
