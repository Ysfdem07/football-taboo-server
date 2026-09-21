// "Solo mode" entry from the Home screen: asks which category the player wants
// and hands the choice back; Home then sends them straight to the weekly
// tournament for that category.
import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../context/LanguageContext';

const CATS = [
  { base: 'football', color: '#39ff14', icon: 'football-outline' },
  { base: 'cinema', color: '#b026ff', icon: 'film-outline' },
  { base: 'music', color: '#ff1493', icon: 'musical-notes-outline' },
] as const;

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (categoryId: string) => void;
};

export default function SoloModePicker({ visible, onClose, onPick }: Props) {
  const { language, t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card}>
          <Text style={styles.title}>🏆 {t('soloPickTitle')}</Text>
          <Text style={styles.sub}>{t('soloPickSub')}</Text>
          {CATS.map(c => (
            <TouchableOpacity
              key={c.base}
              style={[styles.option, { borderColor: c.color, backgroundColor: `${c.color}18` }]}
              onPress={() => onPick(language === 'en' ? `${c.base}_en` : c.base)}
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
  card: { width: '100%', maxWidth: 360, backgroundColor: '#0b1220', borderRadius: 22, borderWidth: 2, borderColor: '#FFD700', padding: 20 },
  title: { color: '#FFD700', fontFamily: 'Poppins_900Black', fontSize: 18, textAlign: 'center' },
  sub: { color: 'rgba(255,255,255,0.65)', fontFamily: 'Poppins_400Regular', fontSize: 12, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 16, paddingVertical: 13, paddingHorizontal: 16, marginTop: 8 },
  optionText: { fontFamily: 'Poppins_900Black', fontSize: 15 },
  cancel: { alignItems: 'center', paddingVertical: 12, marginTop: 6 },
  cancelText: { color: 'rgba(255,255,255,0.6)', fontFamily: 'Poppins_700Bold', fontSize: 13 },
});
