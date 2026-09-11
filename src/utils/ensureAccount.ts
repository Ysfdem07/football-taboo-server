import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '../services/socket';

const generateHiddenPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 24; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
  return out;
};

const randomGuestUsername = () => `Guest_${Math.floor(1000 + Math.random() * 9000)}`;

const attemptRegister = (username: string, avatar: string, password: string): Promise<any> =>
  new Promise((resolve) => {
    const socket = getSocket();
    if (!socket) return resolve({ success: false });
    let settled = false;
    const finish = (res: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.off('register_response', onResponse);
      resolve(res);
    };
    const timeout = setTimeout(() => finish({ success: false }), 8000);
    const onResponse = (res: any) => finish(res);
    socket.on('register_response', onResponse);
    const emit = () => socket.emit('register_profile', { username, password, avatar });
    if (socket.connected) emit(); else socket.once('connect', emit);
  });

// A "guest" profile (id:'guest') is purely local AsyncStorage state — the
// server has no account for it, so nothing server-side (SSV-verified ad
// rewards, tournaments, ranked play) can be granted against it. Onboarding
// already registers a real account by default and only falls back to a
// local guest when the server is unreachable at that moment (see
// OnboardingScreen.tsx); this silently retries that promotion later, once
// there's connectivity, right before a still-guest profile needs a real
// account — e.g. to claim an SSV-verified ad reward. Concurrent callers
// (ads.tsx preloads 3 rewarded ad slots in parallel at startup) share the
// same in-flight attempt instead of racing 3 registrations.
let inFlight: Promise<any | null> | null = null;

export async function ensureRealAccount(currentProfile: any): Promise<any | null> {
  if (currentProfile?.id && currentProfile.id !== 'guest') return currentProfile;
  if (inFlight) return inFlight;

  const upgrade = async (): Promise<any | null> => {
    const password = generateHiddenPassword();
    const avatar = currentProfile?.avatar || 'avatar_1';
    const baseUsername = currentProfile?.username && currentProfile.username.startsWith('Guest_')
      ? currentProfile.username
      : randomGuestUsername();

    let res = await attemptRegister(baseUsername, avatar, password);
    if (!res?.success) {
      // Rare username collision on Guest_XXXX — one retry with a fresh suffix.
      res = await attemptRegister(randomGuestUsername(), avatar, password);
    }
    if (!res?.success) return null;

    const sessionData = { ...res.player, password };
    await AsyncStorage.setItem('@logged_in_profile', JSON.stringify(sessionData));
    return sessionData;
  };

  inFlight = upgrade().finally(() => { inFlight = null; });
  return inFlight;
}
