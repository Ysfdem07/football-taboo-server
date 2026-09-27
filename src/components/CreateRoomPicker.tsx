// "Create room" entry from the Home screen: pick Friendly or Ranked, then a
// category, and hand both back — Home then sends the player straight to the
// matching room-settings screen (rounds + "Create & Start").
import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const CATS = [
  { base: 'football', color: '#39ff14', icon: 'football-outline' },
  { base: 'cinema', color: '#b026ff', icon: 'film-outline' },
  { base: 'music', color: '#ff1493', icon: 'musical-notes-outline' },
] as const;

const NEON = '#00FF88';
type Mode = 'friendly' | 'ranked';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (categoryId: string, mode: Mode) => void;
};

export default function CreateRoomPicker({ visible, onClose, onPick }: Props) {
  const { language, t } = useLanguage();
  const [mode, setMode] = useState<Mode>('friendly');

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>👥 {t('createRoomPickTitle')}</Text>
          <Text style={styles.sub}>{t('createRoomPickSub')}</Text>

          <View style={styles.chips}>
            {(['friendly', 'ranked'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.modeChip, mode === m && styles.modeChipActive]}
                onPress={() => setMode(m)}
                activeOpacity={0.85}
              >
                <Ionicons name={m === 'ranked' ? 'trophy' : 'happy'} size={15} color={mode === m ? '#04140b' : 'rgba(255,255,255,0.7)'} />
                <Text style={[styles.modeText, mode === m && { color: '#04140b' }]}>{t(m === 'ranked' ? 'modeRanked' : 'modeFriendly')}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.modeDesc}>{t(mode === 'ranked' ? 'modeRankedDesc' : 'modeFriendlyDesc')}</Text>

          {CATS.map(c => (
            <TouchableOpacity
              key={c.base}
              style={[styles.option, { borderColor: c.color, backgroundColor: `${c.color}18` }]}
              onPress={() => onPick(language === 'en' ? `${c.base}_en` : c.base, mode)}
              activeOpacity={0.85}
            >
              <Ionicons name={c.icon as any} size={22} color={c.color} />
              <Text style={[styles.optionText, { color: c.color }]}>{t(c.base)}</Text>
              <Ionicons name="chevron-forward" size={18} color={c.color} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.cancel} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelText}>{t('cancel')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#0b1220', borderRadius: 22, borderWidth: 2, borderColor: '#00BFFF', padding: 20 },
  title: { color: '#00BFFF', fontFamily: 'Poppins_900Black', fontSize: 18, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  chips: { flexDirection: 'row', gap: 8 },
  modeChip: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 9, borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  modeChipActive: { backgroundColor: NEON, borderColor: NEON },
  modeText: { color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_700Bold', fontSize: 12.5 },
  modeDesc: { color: '#FFD700', fontFamily: 'Poppins_400Regular', fontSize: 11.5, marginTop: 6, marginBottom: 10, textAlign: 'center' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, marginTop: 8 },
  optionText: { fontFamily: 'Poppins_900Black', fontSize: 15 },
  cancel: { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_700Bold', fontSize: 13 },
});
