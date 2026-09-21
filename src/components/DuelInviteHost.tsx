// App-wide listener for direct duel invites. Mounted once inside the
// NavigationContainer so an invite can pop up on whatever screen the player is
// on, and so a matched invite can take BOTH players into OnlineGame.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { getSocket } from '../services/socket';
import { announcePresence } from '../services/onlinePresence';
import { useLanguage } from '../context/LanguageContext';
import { navigationRef } from '../navigation/navigationRef';
import { UserAvatar } from './UserAvatar';
import { CustomAlert } from './CustomAlert';

// Screens where an invite must not interrupt (mid-game, onboarding...).
const NO_INVITE_ROUTES = ['OnlineGame', 'RoomLobby', 'TournamentGame', 'Game', 'Onboarding', 'Tutorial'];

type Invite = { inviteId: string; from: { name: string; avatar?: string | null }; category: string; deadline: number };

const NEON = '#00FF88';

export default function DuelInviteHost() {
  const { language, t } = useLanguage();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inviteRef = useRef<Invite | null>(null);
  inviteRef.current = invite;

  // Keep the server informed of our language / that this build can take
  // invites. Re-announced periodically because other screens occasionally
  // strip 'connect' listeners off the shared socket.
  useEffect(() => {
    const s = getSocket();
    const send = () => { announcePresence(language); };
    send();
    s.on('connect', send);
    const id = setInterval(send, 20000);
    return () => { clearInterval(id); s.off('connect', send); };
  }, [language]);

  useEffect(() => {
    const s = getSocket();

    const onReceived = (d: any) => {
      const route = navigationRef.isReady() ? navigationRef.getCurrentRoute()?.name : undefined;
      if (!d?.inviteId || (route && NO_INVITE_ROUTES.includes(route)) || inviteRef.current) {
        if (d?.inviteId) s.emit('respond_duel_invite', { inviteId: d.inviteId, accept: false });
        return;
      }
      setAccepted(false);
      setInvite({
        inviteId: d.inviteId,
        from: { name: String(d.from?.name || '?'), avatar: d.from?.avatar || null },
        category: String(d.category || 'football'),
        deadline: Date.now() + (Number(d.ttlMs) || 30000),
      });
    };

    const onGone = (d: any) => {
      if (inviteRef.current && inviteRef.current.inviteId === d?.inviteId) setInvite(null);
    };

    const onMatched = (d: any) => {
      setInvite(null);
      if (!d?.roomId || !navigationRef.isReady()) return;
      // Reset (rather than push) so a lobby the player was waiting in can't
      // fire its "no opponent found" alert on top of the match.
      navigationRef.reset({
        index: 1,
        routes: [
          { name: 'Home' },
          { name: 'OnlineGame', params: { roomId: d.roomId, categoryId: d.category, matchedPlayers: d.players } },
        ],
      });
    };

    const onError = (d: any) => {
      if (inviteRef.current) {
        setInvite(null);
        CustomAlert.show(t('duelInviteTitle'), t('inviteOffline'), [{ text: t('ok') }]);
      }
    };

    s.on('duel_invite_received', onReceived);
    s.on('duel_invite_cancelled', onGone);
    s.on('duel_invite_expired', onGone);
    s.on('duel_invite_matched', onMatched);
    s.on('duel_invite_error', onError);
    return () => {
      s.off('duel_invite_received', onReceived);
      s.off('duel_invite_cancelled', onGone);
      s.off('duel_invite_expired', onGone);
      s.off('duel_invite_matched', onMatched);
      s.off('duel_invite_error', onError);
    };
  }, [language]);

  // Countdown shown on the invite card.
  useEffect(() => {
    if (!invite) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((invite.deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      // The server drops the invite at the same moment; if its 'expired' /
      // 'cancelled' event never reached us (reconnect), don't leave the card up.
      if (left <= 0) setInvite(null);
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [invite]);

  // After accepting, the match should start within moments; if it doesn't
  // (invite already gone, other side left) close the card and say so.
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

  return (
    <Modal visible={!!invite} transparent animationType="fade" onRequestClose={() => respond(false)}>
      <View style={styles.backdrop}>
        {invite && (
          <View style={styles.card}>
            <Text style={styles.title}>⚔️ {t('duelInviteTitle')}</Text>
            <View style={{ marginVertical: 14 }}>
              <UserAvatar avatar={invite.from.avatar || undefined} size={64} />
            </View>
            <Text style={styles.body}>
              {t('duelInviteBody').replace('{name}', invite.from.name).replace('{category}', categoryName)}
            </Text>
            <Text style={styles.note}>{t('duelInviteFriendlyNote')}</Text>
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
});
