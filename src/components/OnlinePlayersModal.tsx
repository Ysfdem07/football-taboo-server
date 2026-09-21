// "Players online" sheet opened from the Home counter: pick a category and
// send a direct duel invite to someone who is online right now — no need to
// open the matchmaking screen and wait in the queue.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSocket } from '../services/socket';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';

type OnlinePlayer = { targetId: string; name: string; avatar?: string | null; kp: number; registered: boolean; searching: boolean };

const NEON = '#00FF88';
const CATS = [
  { base: 'football', color: '#39ff14' },
  { base: 'cinema', color: '#b026ff' },
  { base: 'music', color: '#ff1493' },
] as const;

export default function OnlinePlayersModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, t } = useLanguage();
  const [players, setPlayers] = useState<OnlinePlayer[] | null>(null);
  const [base, setBase] = useState<'football' | 'cinema' | 'music'>('football');
  const [pending, setPending] = useState<{ inviteId?: string; name: string } | null>(null);
  const [message, setMessage] = useState('');
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const categoryId = language === 'en' ? `${base}_en` : base;

  useEffect(() => {
    if (!visible) return;
    const s = getSocket();
    setPlayers(null);
    setPending(null);
    setMessage('');

    const onPlayers = (d: any) => setPlayers(Array.isArray(d?.players) ? d.players : []);
    const onSent = (d: any) => setPending(p => (p ? { ...p, inviteId: d?.inviteId } : p));
    const finish = (msgKey: string, name?: string) => {
      const who = name || pendingRef.current?.name || '';
      setPending(null);
      setMessage(t(msgKey as any).replace('{name}', who));
    };
    const onDeclined = () => finish('inviteDeclined');
    const onExpired = () => finish('inviteExpired');
    const onCancelled = () => finish('inviteOffline');
    const onMatched = () => { setPending(null); onClose(); };
    const onError = (d: any) => {
      const map: Record<string, string> = { busy: 'inviteBusy', offline: 'inviteOffline', too_fast: 'inviteTooFast', self_busy: 'inviteBusy' };
      finish(map[d?.reason] || 'inviteGenericError');
    };

    s.on('online_players', onPlayers);
    s.on('duel_invite_sent', onSent);
    s.on('duel_invite_declined', onDeclined);
    s.on('duel_invite_expired', onExpired);
    s.on('duel_invite_cancelled', onCancelled);
    s.on('duel_invite_matched', onMatched);
    s.on('duel_invite_error', onError);

    const poll = () => { if (s.connected && !pendingRef.current) s.emit('get_online_players'); };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      clearInterval(id);
      s.off('online_players', onPlayers);
      s.off('duel_invite_sent', onSent);
      s.off('duel_invite_declined', onDeclined);
      s.off('duel_invite_expired', onExpired);
      s.off('duel_invite_cancelled', onCancelled);
      s.off('duel_invite_matched', onMatched);
      s.off('duel_invite_error', onError);
      // Closing the sheet withdraws an invite that is still waiting.
      if (pendingRef.current?.inviteId) s.emit('cancel_duel_invite', { inviteId: pendingRef.current.inviteId });
    };
  }, [visible, language]);

  const invite = (p: OnlinePlayer) => {
    if (pending) return;
    setMessage('');
    setPending({ name: p.name });
    getSocket().emit('send_duel_invite', { targetId: p.targetId, category: categoryId });
  };

  const cancelPending = () => {
    if (pending?.inviteId) getSocket().emit('cancel_duel_invite', { inviteId: pending.inviteId });
    setPending(null);
  };

  const renderItem = ({ item }: { item: OnlinePlayer }) => (
    <View style={styles.row}>
      <UserAvatar avatar={item.avatar || undefined} size={42} />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.registered ? `${item.kp} KP` : t('inviteGuest')}{item.searching ? `  ·  ${t('inviteSearchingTag')}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={[styles.inviteBtn, pending && { opacity: 0.4 }]} disabled={!!pending} onPress={() => invite(item)} activeOpacity={0.85}>
        <Text style={styles.inviteBtnText}>{t('inviteButton')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>🟢 {t('onlinePlayersTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t('onlinePlayersHint')}</Text>

          <View style={styles.chips}>
            {CATS.map(c => (
              <TouchableOpacity
                key={c.base}
                style={[styles.chip, { borderColor: base === c.base ? c.color : 'rgba(255,255,255,0.2)', backgroundColor: base === c.base ? `${c.color}22` : 'transparent' }]}
                onPress={() => setBase(c.base)}
                disabled={!!pending}
                activeOpacity={0.85}
              >
                <Text style={[styles.chipText, { color: base === c.base ? c.color : 'rgba(255,255,255,0.6)' }]}>{t(c.base)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {pending ? (
            <View style={styles.pendingBox}>
              <ActivityIndicator color={NEON} />
              <Text style={styles.pendingText}>{t('inviteWaiting').replace('{name}', pending.name)}</Text>
              <TouchableOpacity style={styles.cancelBtn} onPress={cancelPending} activeOpacity={0.85}>
                <Text style={styles.cancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {players === null ? (
            <ActivityIndicator color={NEON} style={{ marginTop: 30 }} />
          ) : players.length === 0 ? (
            <Text style={styles.empty}>{t('onlinePlayersEmpty')}</Text>
          ) : (
            <FlatList data={players} keyExtractor={p => p.targetId} renderItem={renderItem} style={{ marginTop: 6 }} />
          )}
          <Text style={styles.footNote}>{t('duelInviteFriendlyNote')}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0b1220', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderColor: 'rgba(0,255,136,0.5)', padding: 18, paddingBottom: 28, maxHeight: '78%', minHeight: 320 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontFamily: 'Poppins_900Black', fontSize: 18 },
  hint: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  chipText: { fontFamily: 'Poppins_700Bold', fontSize: 12 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)' },
  name: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  sub: { color: 'rgba(255,255,255,0.55)', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  inviteBtn: { backgroundColor: NEON, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  inviteBtnText: { color: '#04140b', fontFamily: 'Poppins_900Black', fontSize: 12 },
  empty: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', marginTop: 30, lineHeight: 19 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,255,136,0.08)' },
  pendingText: { flex: 1, color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  cancelText: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 11 },
  message: { color: '#FFD700', fontFamily: 'Poppins_700Bold', fontSize: 12, marginTop: 10 },
  footNote: { color: 'rgba(255,255,255,0.45)', fontFamily: 'Poppins_400Regular', fontSize: 11, textAlign: 'center', marginTop: 12 },
});
