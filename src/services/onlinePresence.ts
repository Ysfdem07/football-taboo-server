// Online presence: tells the server which language this device plays in (so
// the online counter and the "invite a player" list only mix players who can
// actually duel each other) and exposes the live online count.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, withSocket } from './socket';

// Below this many players online (counting yourself) the Home counter stays
// hidden — "1 online" (just you) would put people off rather than encourage.
export const MIN_ONLINE_TO_SHOW = 2;

export type Activity = 'idle' | 'tournament' | 'busy';

// What the player is doing, as far as duel invites care: a tournament run can
// still receive an invite (shown as a banner), a private-room lobby or the
// first-run tutorial can't.
export function activityForRoute(route?: string): Activity {
  if (route === 'TournamentGame' || route === 'Game') return 'tournament';
  if (route && ['OnlineGame', 'RoomLobby', 'Onboarding', 'Tutorial'].includes(route)) return 'busy';
  return 'idle';
}

export async function announcePresence(language: string, activity: Activity = 'idle') {
  let name: string | undefined;
  let avatar: string | undefined;
  try {
    const raw = await AsyncStorage.getItem('@logged_in_profile');
    if (raw) {
      const p = JSON.parse(raw);
      name = p?.username;
      avatar = p?.avatar;
    }
  } catch (e) {
    // presence still works without a name (guests fall back to "Guest")
  }
  const s = getSocket();
  if (s.connected) s.emit('presence', { language, name, avatar, activity });
}

// A reconnected socket is a brand-new, anonymous session server-side. Sign a
// real account back in so matches credit the right player and the online list
// shows the real name (same login Home does on focus).
export async function reloginIfAccount() {
  try {
    const raw = await AsyncStorage.getItem('@logged_in_profile');
    if (!raw) return;
    const p = JSON.parse(raw);
    if (p?.id && p.id !== 'guest' && p.username && p.password) {
      getSocket().emit('login_profile', { username: p.username, password: p.password });
    }
  } catch (e) {
    // stay anonymous; nothing else depends on this
  }
}

export type OnlineStats = { online: number; searching: number };

export function useOnlineStats(active: boolean): OnlineStats | null {
  const [stats, setStats] = useState<OnlineStats | null>(null);

  useEffect(() => {
    if (!active) return;
    const onStats = (d: any) => setStats({ online: Number(d?.online) || 0, searching: Number(d?.searching) || 0 });
    // Poll through whatever socket is current (it can be replaced under us).
    const poll = () => { const cur = getSocket(); if (cur.connected) cur.emit('get_online_stats'); };
    const unbind = withSocket((s) => {
      s.on('online_stats', onStats);
      s.on('connect', poll);
      return () => { s.off('online_stats', onStats); s.off('connect', poll); };
    });
    poll();
    const id = setInterval(poll, 10000);
    return () => { clearInterval(id); unbind(); };
  }, [active]);

  return stats;
}
