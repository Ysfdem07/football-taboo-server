// App-wide listener for direct duel invites. Mounted once inside the
// NavigationContainer so an invite can pop up on whatever screen the player is
// on, and so a matched invite can take BOTH players into OnlineGame.
//
// Most screens get a centered card. During a tournament run the invite is a
// small non-blocking banner instead, so it doesn't interrupt the timed game;
// accepting it abandons the run (the score isn't saved) and starts the duel.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getSocket, withSocket } from '../services/socket';
import { announcePresence, activityForRoute, reloginIfAccount } from '../services/onlinePresence';
import { setLeavingForDuel } from '../services/duelInviteState';
import { useLanguage } from '../context/LanguageContext';
import { navigationRef } from '../navigation/navigationRef';
import { UserAvatar } from './UserAvatar';
import { CustomAlert } from './CustomAlert';

type Invite = {
  inviteId: string;
  from: { name: string; avatar?: string | null };
  category: string;
  mode: 'friendly' | 'ranked';
  deadline: number;
  inTournament: boolean;
};

const NEON = '#00FF88';

const currentRoute = () => (navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined);

export default function DuelInviteHost() {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inviteRef = useRef<Invite | null>(null);
  inviteRef.current = invite;

  // Keep the server informed of our language and what we're doing (idle /
  // tournament run / busy). Re-sent on navigation changes and periodically,
  // because other screens occasionally strip 'connect' listeners off the
  // shared socket.
  useEffect(() => {
    let lastActivity = '';
    const send = () => {
      lastActivity = activityForRoute(currentRoute());
      announcePresence(language, lastActivity as any);
    };
    const onConnect = () => { reloginIfAccount(); send(); };
    const unbind = withSocket((s) => {
      s.on('connect', onConnect);
      return () => s.off('connect', onConnect);
    });
    send();
    const periodic = setInterval(send, 20000);
    const watch = setInterval(() => { if (activityForRoute(currentRoute()) !== lastActivity) send(); }, 2000);
    return () => { clearInterval(periodic); clearInterval(watch); unbind(); };
  }, [language]);

  // Leaving a match or the lobby disconnects the shared socket on purpose, and
  // socket.io never reconnects after a manual disconnect(). Presence, the online
  // counter and invites all need a live connection, so bring it back once the
  // player is out of the game screens.
  useEffect(() => {
    const id = setInterval(() => {
      const route = currentRoute();
      if (route === 'OnlineGame' || route === 'RoomLobby') return;
      const cur = getSocket();
      if (!cur.connected && !cur.active) cur.connect();
    }, 2500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const s = { emit: (...a: any[]) => (getSocket().emit as any)(...a) }; // always the current socket

    const onReceived = (d: any) => {
      const activity = activityForRoute(currentRoute());
      // Busy (in a match, private lobby, onboarding) or already showing one:
      // the server normally won't send these, but decline if it slips through.
      if (!d?.inviteId || activity === 'busy' || inviteRef.current) {
        if (d?.inviteId) s.emit('respond_duel_invite', { inviteId: d.inviteId, accept: false });
        return;
      }
      setAccepted(false);
      setInvite({
        inviteId: d.inviteId,
        from: { name: String(d.from?.name || '?'), avatar: d.from?.avatar || null },
        category: String(d.category || 'football'),
        mode: d.mode === 'ranked' ? 'ranked' : 'friendly',
        deadline: Date.now() + (Number(d.ttlMs) || 30000),
        inTournament: activity === 'tournament',
      });
    };

    const onGone = (d: any) => {
      if (inviteRef.current && inviteRef.current.inviteId === d?.inviteId) setInvite(null);
    };

    const onMatched = (d: any) => {
      setInvite(null);
      if (!d?.roomId || !navigationRef.isReady()) return;
      // Leaving a tournament run on purpose: skip its "are you sure?" prompt.
      setLeavingForDuel(true);
      // Reset (rather than push) so a lobby the player was waiting in can't
      // fire its "no opponent found" alert on top of the match.
      navigationRef.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'OnlineGame', params: { roomId: d.roomId, categoryId: d.category, matchedPlayers: d.players } },
        ],
      });
      setTimeout(() => setLeavingForDuel(false), 1000);
    };

    const onError = () => {
      if (inviteRef.current) {
        setInvite(null);
        CustomAlert.show(t('duelInviteTitle'), t('inviteOffline'), [{ text: t('ok') }]);
      }
    };

    return withSocket((sock) => {
      sock.on('duel_invite_received', onReceived);
      sock.on('duel_invite_cancelled', onGone);
      sock.on('duel_invite_expired', onGone);
      sock.on('duel_invite_matched', onMatched);
      sock.on('duel_invite_error', onError);
      return () => {
        sock.off('duel_invite_received', onReceived);
        sock.off('duel_invite_cancelled', onGone);
        sock.off('duel_invite_expired', onGone);
        sock.off('duel_invite_matched', onMatched);
        sock.off('duel_invite_error', onError);
      };
    });
  }, [language]);

  // Countdown shown on the invite.
  useEffect(() => {
    if (!invite) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((invite.deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      // The server drops the invite at the same moment; if its 'expired' /
      // 'cancelled' event never reached us (reconnect), don't leave it up.
      if (left <= 0) setInvite(null);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [invite]);

  // After accepting, the match should start within moments; if it doesn't
  // (invite already gone, other side left) close it and say so.
  useEffect(() => {
    if (!accepted) return;
    const id = setTimeout(() => {
      if (!inviteRef.current) return;
      setInvite(null);
      CustomAlert.show(t('duelInviteTitle'), t('inviteOffline'), [{ text: t('ok') }]);
    }, 8000);
    return () => clearTimeout(id);
  }, [accepted]);

  const respond = (accept: boolean) => {
    if (!invite) return;
    getSocket().emit('respond_duel_invite', { inviteId: invite.inviteId, accept });
    if (accept) setAccepted(true); else setInvite(null);
  };

  const baseCategory = invite ? invite.category.replace(/_en$/, '') : 'football';
  const categoryName = t(baseCategory as 'football' | 'cinema' | 'music');
  const bodyText = invite ? t('duelInviteBody').replace('{name}', invite.from.name).replace('{category}', categoryName) : '';

  // Tournament run: slim banner at the top that leaves the game playable.
  if (invite && invite.inTournament) {
    return (
      <View pointerEvents="box-none" style={[styles.bannerWrap, { top: Math.max(insets.top, 8) + 6 }]}>
        <View style={styles.banner}>
          <UserAvatar avatar={invite.from.avatar || undefined} size={38} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.bannerBody} numberOfLines={2}>{bodyText}</Text>
            <Text style={styles.bannerNote} numberOfLines={2}>
              {invite.mode === 'ranked' ? t('modeRanked') + ' · ' : ''}{t('duelInviteTournamentNote')} · {secondsLeft}s
            </Text>
          </View>
          {accepted ? (
            <Text style={styles.waiting}>…</Text>
          ) : (
            <View style={styles.bannerBtns}>
              <TouchableOpacity style={[styles.bannerBtn, styles.decline]} onPress={() => respond(false)} activeOpacity={0.85}>
                <Text style={styles.declineText}>✕</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.bannerBtn, styles.accept]} onPress={() => respond(true)} activeOpacity={0.85}>
                <Text style={styles.acceptText}>{t('duelInviteAccept')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <Modal visible={!!invite} transparent animationType="fade" onRequestClose={() => respond(false)}>
      <View style={styles.backdrop}>
        {invite && (
          <View style={styles.card}>
            <Text style={styles.title}>⚔️ {t('duelInviteTitle')}</Text>
            <View style={{ marginVertical: 14 }}>
              <UserAvatar avatar={invite.from.avatar || undefined} size={64} />
            </View>
            <Text style={styles.body}>{bodyText}</Text>
            <Text style={styles.note}>{t(invite.mode === 'ranked' ? 'duelInviteRankedNote' : 'duelInviteFriendlyNote')}</Text>
            <Text style={styles.timer}>{secondsLeft}s</Text>
            {accepted ? (
              <Text style={styles.waiting}>{t('duelInviteStarting')}</Text>
            ) : (
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btn, styles.decline]} onPress={() => respond(false)} activeOpacity={0.85}>
                  <Text style={styles.declineText}>{t('duelInviteDecline')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.accept]} onPress={() => respond(true)} activeOpacity={0.85}>
                  <Text style={styles.acceptText}>{t('duelInviteAccept')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#0b1220', borderRadius: 22, borderWidth: 2, borderColor: NEON, padding: 22, alignItems: 'center' },
  title: { color: NEON, fontFamily: 'Poppins_900Black', fontSize: 20, letterSpacing: 0.5 },
  body: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 15, textAlign: 'center', lineHeight: 21 },
  note: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center', marginTop: 6 },
  timer: { color: '#FFD700', fontFamily: 'Poppins_700Bold', fontSize: 14, marginTop: 10 },
  waiting: { color: NEON, fontFamily: 'Poppins_700Bold', fontSize: 14, marginTop: 14 },
  row: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 14, alignItems: 'center' },
  accept: { backgroundColor: NEON },
  acceptText: { color: '#04140b', fontFamily: 'Poppins_900Black', fontSize: 14 },
  decline: { borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  declineText: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  // tournament banner
  bannerWrap: { position: 'absolute', left: 10, right: 10, zIndex: 9999, elevation: 30 },
  banner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(11,18,32,0.97)', borderRadius: 16, borderWidth: 1.5, borderColor: NEON, padding: 10 },
  bannerBody: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 12.5, lineHeight: 17 },
  bannerNote: { color: '#FFD700', fontFamily: 'Poppins_400Regular', fontSize: 10.5, marginTop: 2 },
  bannerBtns: { flexDirection: 'row', gap: 6 },
  bannerBtn: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
