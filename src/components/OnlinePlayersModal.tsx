// Duel sheet opened from the Home screen: pick a category and a mode (friendly
// or ranked), then either play one of the practice bots (friendly only) or
// challenge someone who is online right now with a direct invite — no
// matchmaking screen to sit in first.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket, withSocket } from '../services/socket';
import { useLanguage } from '../context/LanguageContext';
import { UserAvatar } from './UserAvatar';
import { needsJokerGate } from '../utils/jokerGate';
import { navigationRef } from '../navigation/navigationRef';

type OnlinePlayer = { targetId: string; name: string; avatar?: string | null; kp: number; registered: boolean; searching: boolean; inTournament?: boolean; tournamentCategory?: string | null; busy?: boolean; busyCategory?: string | null };
type BotInfo = { botId: string; name: string; avatar?: string | null; level: 'easy' | 'medium' | 'hard' };
type Row =
  | { kind: 'player'; p: OnlinePlayer }
  | { kind: 'bot'; b: BotInfo }
  | { kind: 'header'; title: string; sub: string }
  | { kind: 'note'; text: string };
type Mode = 'friendly' | 'ranked';

const NEON = '#00FF88';
const CATS = [
  { base: 'football', color: '#39ff14' },
  { base: 'cinema', color: '#b026ff' },
  { base: 'music', color: '#ff1493' },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function OnlinePlayersModal({ visible, onClose }: Props) {
  const { language, t } = useLanguage();
  const [players, setPlayers] = useState<OnlinePlayer[] | null>(null);
  const [bots, setBots] = useState<BotInfo[]>([]);
  const [base, setBase] = useState<'football' | 'cinema' | 'music'>('football');
  const [mode, setMode] = useState<Mode>('friendly');
  const [isRegistered, setIsRegistered] = useState(false);
  const [pending, setPending] = useState<{ inviteId?: string; name: string } | null>(null);
  const [message, setMessage] = useState('');
  // Nested RN <Modal>s can fail to receive touches on iOS, so the joker
  // nudge renders inline in this sheet instead of going through the
  // CustomAlert popup (a separate <Modal>) other screens use.
  const [jokerPrompt, setJokerPrompt] = useState<{ proceed: () => void } | null>(null);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  const categoryId = language === 'en' ? `${base}_en` : base;
  const rankedBlocked = mode === 'ranked' && !isRegistered;
  // Ranked is only playable against real people: with nobody else online it is off.
  const rankedUnavailable = players !== null && players.length === 0;

  useEffect(() => {
    if (mode === 'ranked' && rankedUnavailable) setMode('friendly');
  }, [rankedUnavailable]);

  useEffect(() => {
    if (!visible) return;
    setPlayers(null);
    setPending(null);
    setMessage('');
    setJokerPrompt(null);
    AsyncStorage.getItem('@logged_in_profile')
      .then(raw => { const p = raw ? JSON.parse(raw) : null; setIsRegistered(!!(p && p.id && p.id !== 'guest')); })
      .catch(() => setIsRegistered(false));

    const onPlayers = (d: any) => {
      setPlayers(Array.isArray(d?.players) ? d.players : []);
      setBots(Array.isArray(d?.bots) ? d.bots : []);
    };
    const onSent = (d: any) => setPending(p => (p ? { ...p, inviteId: d?.inviteId } : p));
    const finish = (msgKey: string) => {
      const who = pendingRef.current?.name || '';
      setPending(null);
      setMessage(t(msgKey as any).replace('{name}', who));
    };
    const onDeclined = () => finish('inviteDeclined');
    const onExpired = () => finish('inviteExpired');
    const onCancelled = () => finish('inviteOffline');
    const onMatched = () => { setPending(null); onClose(); };
    const onError = (d: any) => {
      const map: Record<string, string> = { busy: 'inviteBusy', offline: 'inviteOffline', too_fast: 'inviteTooFast', self_busy: 'inviteBusy', ranked_guest: 'inviteRankedGuest', ranked_bot: 'inviteGenericError' };
      finish(map[d?.reason] || 'inviteGenericError');
    };

    const unbind = withSocket((s) => {
      s.on('online_players', onPlayers);
      s.on('duel_invite_sent', onSent);
      s.on('duel_invite_declined', onDeclined);
      s.on('duel_invite_expired', onExpired);
      s.on('duel_invite_cancelled', onCancelled);
      s.on('duel_invite_matched', onMatched);
      s.on('duel_invite_error', onError);
      return () => {
        s.off('online_players', onPlayers);
        s.off('duel_invite_sent', onSent);
        s.off('duel_invite_declined', onDeclined);
        s.off('duel_invite_expired', onExpired);
        s.off('duel_invite_cancelled', onCancelled);
        s.off('duel_invite_matched', onMatched);
        s.off('duel_invite_error', onError);
      };
    });

    const poll = () => { const cur = getSocket(); if (cur.connected && !pendingRef.current) cur.emit('get_online_players'); };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      clearInterval(id);
      unbind();
      // Closing the sheet withdraws an invite that is still waiting.
      if (pendingRef.current?.inviteId) getSocket().emit('cancel_duel_invite', { inviteId: pendingRef.current.inviteId });
    };
  }, [visible, language]);

  const runOrGateOnJokers = (proceed: () => void) => {
    needsJokerGate().then(needed => {
      if (needed) setJokerPrompt({ proceed });
      else proceed();
    });
  };

  const invite = (p: OnlinePlayer) => {
    if (pending || rankedBlocked) return;
    runOrGateOnJokers(() => {
      setMessage('');
      setPending({ name: p.name });
      getSocket().emit('send_duel_invite', { targetId: p.targetId, category: categoryId, mode });
    });
  };

  // Bots "accept" instantly: there is no invite to wait for, the match just starts.
  const inviteBot = (b: BotInfo) => {
    if (pending) return;
    runOrGateOnJokers(() => {
      setMessage('');
      setPending({ name: b.name });
      getSocket().emit('send_duel_invite', { targetId: b.botId, category: categoryId, mode: 'friendly' });
      setTimeout(() => {
        if (pendingRef.current && !pendingRef.current.inviteId) {
          setPending(null);
          setMessage(t('inviteGenericError'));
        }
      }, 8000);
    });
  };

  const jokerPromptStartAnyway = () => {
    const proceed = jokerPrompt?.proceed;
    setJokerPrompt(null);
    if (proceed) proceed();
  };

  const jokerPromptGoToMarket = () => {
    setJokerPrompt(null);
    onClose();
    if (navigationRef.isReady()) (navigationRef.navigate as (name: string) => void)('Market');
  };

  const cancelPending = () => {
    if (pending?.inviteId) getSocket().emit('cancel_duel_invite', { inviteId: pending.inviteId });
    setPending(null);
  };

  const canInvite = (p: OnlinePlayer) => !pending && !p.busy && !rankedBlocked && !(mode === 'ranked' && !p.registered);

  const levelLabel = (l: BotInfo['level']) => t(l === 'easy' ? 'botLevelEasy' : l === 'medium' ? 'botLevelMedium' : 'botLevelHard');

  // Real players are listed in both modes; the practice bots only under Friendly.
  const rows: Row[] = [];
  if (players) {
    players.forEach(p => rows.push({ kind: 'player', p }));
    if (mode === 'friendly') {
      if (players.length === 0) rows.push({ kind: 'note', text: t('noRealPlayersNow') });
      if (bots.length) {
        rows.push({ kind: 'header', title: t('botsSectionTitle'), sub: t('botsSectionHint') });
        bots.forEach(b => rows.push({ kind: 'bot', b }));
      }
    } else if (players.length === 0) {
      rows.push({ kind: 'note', text: t('rankedNeedPlayers') });
    }
  }

  const categoryLabel = (cat?: string | null) => {
    const base = (cat || '').replace(/_en$/, '');
    if (base === 'football') return t('football');
    if (base === 'cinema') return t('cinema');
    if (base === 'music') return t('music');
    return null;
  };

  const statusTag = (item: OnlinePlayer) => {
    if (item.busy) {
      const cat = categoryLabel(item.busyCategory);
      return cat ? `${t('inviteTagDuel')} - ${cat}` : t('inviteTagBusy');
    }
    if (item.inTournament) {
      const cat = categoryLabel(item.tournamentCategory);
      return cat ? `${t('inviteTagTournament')} - ${cat}` : t('inviteTagTournament');
    }
    if (item.searching) return t('inviteSearchingTag');
    return t('inviteTagLobby'); // online, not in a match/tournament — still invitable
  };

  const renderPlayer = (item: OnlinePlayer) => (
    <View style={styles.row}>
      <UserAvatar avatar={item.avatar || undefined} size={42} />
      <View style={{ flex: 1, marginHorizontal: 10 }}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {item.registered ? `${item.kp} KP` : t('inviteGuest')}
          {statusTag(item) ? `  ·  ${statusTag(item)}` : ''}
        </Text>
      </View>
      <TouchableOpacity style={[styles.inviteBtn, !canInvite(item) && { opacity: 0.4 }]} disabled={!canInvite(item)} onPress={() => invite(item)} activeOpacity={0.85}>
        <Text style={styles.inviteBtnText}>
          {item.busy ? t('inviteButtonBusy') : (mode === 'ranked' && !item.registered) ? t('inviteFriendlyOnly') : t('inviteButton')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'header') {
      return (
        <View style={{ marginTop: 16 }}>
          <Text style={styles.sectionLabel}>🤖 {item.title}</Text>
          <Text style={styles.sectionSub}>{item.sub}</Text>
        </View>
      );
    }
    if (item.kind === 'note') return <Text style={styles.empty}>{item.text}</Text>;
    if (item.kind === 'bot') {
      const b = item.b;
      return (
        <View style={styles.row}>
          <UserAvatar avatar={b.avatar || undefined} size={42} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
            <Text style={styles.sub} numberOfLines={1}>🤖 {levelLabel(b.level)}</Text>
          </View>
          <TouchableOpacity style={[styles.inviteBtn, !!pending && { opacity: 0.4 }]} disabled={!!pending} onPress={() => inviteBot(b)} activeOpacity={0.85}>
            <Text style={styles.inviteBtnText}>{t('botPlayButton')}</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return renderPlayer(item.p);
  };

  const header = (
    <View>
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

      <View style={styles.chips}>
        {(['friendly', 'ranked'] as Mode[]).map(m => (
          <TouchableOpacity
            key={m}
            style={[styles.modeChip, mode === m && styles.modeChipActive, m === 'ranked' && rankedUnavailable && { opacity: 0.4 }]}
            onPress={() => { setMode(m); setMessage(''); }}
            disabled={!!pending || (m === 'ranked' && rankedUnavailable)}
            activeOpacity={0.85}
          >
            <Ionicons name={m === 'ranked' ? 'trophy' : 'happy'} size={15} color={mode === m ? '#04140b' : 'rgba(255,255,255,0.7)'} />
            <Text style={[styles.modeText, mode === m && { color: '#04140b' }]}>{t(m === 'ranked' ? 'modeRanked' : 'modeFriendly')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.modeDesc}>{rankedBlocked ? t('rankedNeedLogin') : t(mode === 'ranked' ? 'modeRankedDesc' : 'modeFriendlyDesc')}</Text>
      {rankedUnavailable ? <Text style={styles.modeDesc}>{t('rankedNeedPlayers')}</Text> : null}

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

      <Text style={styles.sectionLabel}>{t('challengeOnline')}{players ? ` (${players.length})` : ''}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>⚔️ {t('duelHubTitle')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t('onlinePlayersHint')}</Text>

          <FlatList
            data={rows}
            keyExtractor={(r, i) => (r.kind === 'player' ? r.p.targetId : r.kind === 'bot' ? r.b.botId : r.kind + i)}
            renderItem={renderRow}
            ListHeaderComponent={header}
            ListEmptyComponent={players === null ? <ActivityIndicator color={NEON} style={{ marginTop: 20 }} /> : null}
            style={{ marginTop: 4 }}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {jokerPrompt && (
          <View style={styles.jokerOverlay}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.jokerCard}>
              <View style={styles.jokerCardHeaderBar} />
              <View style={styles.jokerIconWrap}>
                <Ionicons name="pricetags" size={50} color="#FFD700" />
              </View>
              <Text style={styles.jokerCardTitle}>{t('jokerGateTitle')}</Text>
              <Text style={styles.jokerCardMsg}>{t('jokerGateMsg')}</Text>
              <View style={styles.jokerCardButtonRow}>
                <TouchableOpacity style={styles.jokerCardCancelBtn} onPress={jokerPromptStartAnyway} activeOpacity={0.85}>
                  <Text style={styles.jokerCardCancelText}>{t('jokerGateStartAnyway').toUpperCase()}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.jokerCardGoBtn} onPress={jokerPromptGoToMarket} activeOpacity={0.85}>
                  <Text style={styles.jokerCardGoText}>{t('jokerGateGoToMarket').toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0b1220', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1.5, borderColor: 'rgba(0,255,136,0.5)', padding: 18, paddingBottom: 28, maxHeight: '88%', minHeight: 360 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: '#FFF', fontFamily: 'Poppins_900Black', fontSize: 18 },
  hint: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Poppins_400Regular', fontSize: 12, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  chipText: { fontFamily: 'Poppins_700Bold', fontSize: 12 },
  modeChip: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  modeChipActive: { backgroundColor: NEON, borderColor: NEON },
  modeText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_700Bold', fontSize: 12.5 },
  modeDesc: { color: '#FFD700', fontFamily: 'Poppins_400Regular', fontSize: 11.5, marginTop: 6 },
  sectionLabel: { color: 'rgba(255,255,255,0.75)', fontFamily: 'Poppins_700Bold', fontSize: 12.5, marginTop: 18, marginBottom: 2 },
  sectionSub: { color: 'rgba(255,255,255,0.5)', fontFamily: 'Poppins_400Regular', fontSize: 11, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.12)' },
  name: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 14 },
  sub: { color: 'rgba(255,255,255,0.55)', fontFamily: 'Poppins_400Regular', fontSize: 11 },
  inviteBtn: { backgroundColor: NEON, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 },
  inviteBtnText: { color: '#04140b', fontFamily: 'Poppins_900Black', fontSize: 12 },
  empty: { color: 'rgba(255,255,255,0.7)', fontFamily: 'Poppins_400Regular', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },
  pendingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12, padding: 10, borderRadius: 12, backgroundColor: 'rgba(0,255,136,0.08)' },
  // Centered card overlay, styled to match CustomAlert — rendered inline in
  // this same <Modal> rather than a second stacked one (see jokerGate.ts).
  jokerOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 24 },
  jokerCard: {
    width: '100%', maxWidth: 360, backgroundColor: '#0F172A', borderRadius: 20,
    padding: 24, paddingTop: 32, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    shadowColor: '#FFD700', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
  },
  jokerCardHeaderBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 6, backgroundColor: '#FFD700' },
  jokerIconWrap: { marginBottom: 16, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 50, padding: 8 },
  jokerCardTitle: { fontFamily: 'Poppins_700Bold', fontSize: 20, color: '#FFF', textAlign: 'center', marginBottom: 8 },
  jokerCardMsg: { fontFamily: 'Poppins_400Regular', fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  jokerCardButtonRow: { flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 12 },
  jokerCardCancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  jokerCardCancelText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#FFF', textAlign: 'center' },
  jokerCardGoBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFD700' },
  jokerCardGoText: { fontFamily: 'Poppins_700Bold', fontSize: 13, color: '#000', textAlign: 'center' },
  pendingText: { flex: 1, color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 12 },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)' },
  cancelText: { color: '#FFF', fontFamily: 'Poppins_700Bold', fontSize: 11 },
  message: { color: '#FFD700', fontFamily: 'Poppins_700Bold', fontSize: 12, marginTop: 10 },
});
