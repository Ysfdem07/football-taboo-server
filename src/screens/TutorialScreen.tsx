import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
};

const GREEN = '#00FF88';

type Round = { tiles: number; answer: string; hints: string[]; hintsEn: string[] };

// Five scripted rounds — no server, no real opponent. Just enough to teach
// the rhythm (hints reveal one by one, buzz in the moment you know it,
// fewer hints shown = more points) before dropping a first-time player into
// a real match.
const ROUNDS: Round[] = [
  { tiles: 4, answer: 'PELE', hints: ['Brezilyalı', '3 kez Dünya Kupası kazandı', "'Kral' lakaplı", 'Santos efsanesi', '10 numara'], hintsEn: ['Brazilian', 'Won the World Cup 3 times', "Nicknamed 'The King'", 'Santos legend', 'Wore number 10'] },
  { tiles: 8, answer: 'MESSİ', hints: ['Arjantinli', 'Barcelona efsanesi', '8 Ballon d\'Or', 'Sol ayak ustası', '2022 Dünya Kupası şampiyonu'], hintsEn: ['Argentinian', 'Barcelona legend', '8 Ballon d\'Ors', 'Left-footed magician', '2022 World Cup champion'] },
  { tiles: 8, answer: 'RONALDO', hints: ['Portekizli', 'Al Nassr forması giyiyor', 'CR7 lakaplı', 'Manchester United efsanesi', 'Kariyer gol rekortmeni'], hintsEn: ['Portuguese', 'Plays for Al Nassr', "Nicknamed 'CR7'", 'Manchester United legend', 'All-time top scorer'] },
  { tiles: 6, answer: 'NEYMAR', hints: ['Brezilyalı', 'PSG\'de oynadı', 'Santos\'tan yetişti', 'Numara 10', 'Şov futbolu ile bilinir'], hintsEn: ['Brazilian', 'Played for PSG', 'Came up through Santos', 'Wears number 10', 'Known for flair'] },
  { tiles: 9, answer: 'MBAPPE', hints: ['Fransız', 'Real Madrid\'de oynuyor', '2018 Dünya Kupası şampiyonu', 'Çok hızlı', 'PSG\'den transfer oldu'], hintsEn: ['French', 'Plays for Real Madrid', '2018 World Cup champion', 'Extremely fast', 'Transferred from PSG'] },
];

const HINT_INTERVAL_MS = 2200;
const SCORE_PER_HINT_LEFT = 20;

export default function TutorialScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [roundIndex, setRoundIndex] = useState(0);
  const [hintsShown, setHintsShown] = useState(1);
  const [phase, setPhase] = useState<'revealing' | 'answered'>('revealing');
  const [totalScore, setTotalScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const round = ROUNDS[roundIndex];
  const hints = language === 'en' ? round.hintsEn : round.hints;

  useEffect(() => {
    if (phase !== 'revealing') return;
    timerRef.current = setInterval(() => {
      setHintsShown(prev => {
        if (prev >= hints.length) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, HINT_INTERVAL_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, roundIndex]);

  const handleBuzz = () => {
    if (phase !== 'revealing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    const score = Math.max(10, (hints.length - hintsShown + 1) * SCORE_PER_HINT_LEFT);
    setLastScore(score);
    setTotalScore(s => s + score);
    setPhase('answered');
  };

  const handleNext = () => {
    if (roundIndex + 1 >= ROUNDS.length) {
      setDone(true);
      return;
    }
    setRoundIndex(i => i + 1);
    setHintsShown(1);
    setPhase('revealing');
  };

  const finishTutorial = () => {
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  if (done) {
    return (
      <SafeAreaView style={styles.doneScreen}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>
          {language === 'en' ? 'You\'re ready!' : 'Artık hazırsın!'}
        </Text>
        <Text style={styles.doneSubtitle}>
          {language === 'en'
            ? 'Read the clues, buzz in fast, score big. Time to play for real.'
            : 'İpuçlarını oku, hızlı tahmin et, çok puan kazan. Şimdi gerçek oyuna geç.'}
        </Text>
        <Text style={styles.doneScore}>
          {language === 'en' ? `Demo score: ${totalScore}` : `Demo puanın: ${totalScore}`}
        </Text>
        <TouchableOpacity style={styles.ctaBtn} onPress={finishTutorial} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>{language === 'en' ? "LET'S PLAY!" : 'HADİ OYNAYALIM!'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.topBar}>
        <Text style={styles.roundLabel}>
          {language === 'en' ? `DEMO ${roundIndex + 1} / ${ROUNDS.length}` : `DENEME ${roundIndex + 1} / ${ROUNDS.length}`}
        </Text>
        <TouchableOpacity onPress={finishTutorial}>
          <Text style={styles.skip}>{language === 'en' ? 'Skip' : 'Atla'}</Text>
        </TouchableOpacity>
      </View>

      {roundIndex === 0 && phase === 'revealing' && (
        <View style={styles.coachBubble}>
          <Text style={styles.coachText}>
            {language === 'en'
              ? 'Clues appear one by one. The moment you know the word, tap BUZZ IN — fewer clues shown means more points!'
              : 'İpuçları sırayla açılır. Kelimeyi tahmin ettiğin an TAHMİN ET\'e bas — ne kadar az ipucuyla bilirsen o kadar çok puan kazanırsın!'}
          </Text>
        </View>
      )}

      <View style={styles.tiles}>
        {Array.from({ length: round.tiles }).map((_, i) => (
          <View key={i} style={styles.tile} />
        ))}
      </View>

      {phase === 'answered' ? (
        <View style={styles.answerCard}>
          <Ionicons name="checkmark-circle" size={48} color={GREEN} />
          <Text style={styles.answerWord}>{round.answer}</Text>
          <Text style={styles.answerScore}>+{lastScore} {language === 'en' ? 'points' : 'puan'}</Text>
        </View>
      ) : (
        <View style={styles.hintCard}>
          {hints.slice(0, hintsShown).map((h, i) => (
            <View key={i} style={styles.hintRow}>
              <Ionicons name="eye" size={16} color={GREEN} />
              <Text style={styles.hintText}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.bottom}>
        {phase === 'revealing' ? (
          <TouchableOpacity style={styles.buzzBtn} onPress={handleBuzz} activeOpacity={0.85}>
            <Text style={styles.buzzBtnText}>⚡ {language === 'en' ? 'BUZZ IN!' : 'TAHMİN ET!'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.buzzBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={styles.buzzBtnText}>
              {roundIndex + 1 >= ROUNDS.length
                ? (language === 'en' ? 'FINISH' : 'BİTİR')
                : (language === 'en' ? 'NEXT →' : 'SIRADAKİ →')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#060b08', padding: 20 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roundLabel: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  skip: { color: '#8898aa', fontWeight: '700', fontSize: 14 },
  coachBubble: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  coachText: { color: '#eafff2', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 22 },
  tile: { width: 28, height: 34, borderWidth: 2, borderColor: '#1f6b3f', borderRadius: 6, backgroundColor: 'rgba(20,45,28,0.5)' },
  hintCard: {
    flex: 1,
    backgroundColor: 'rgba(9,20,14,0.9)',
    borderWidth: 1.5,
    borderColor: '#1f6b3f',
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  hintText: { color: '#fff', fontWeight: '800', fontSize: 17, flex: 1 },
  answerCard: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  answerWord: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 1 },
  answerScore: { color: GREEN, fontSize: 18, fontWeight: '800' },
  bottom: { marginTop: 16 },
  buzzBtn: {
    backgroundColor: '#ffd54a',
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
  },
  buzzBtnText: { color: '#3a2600', fontWeight: '900', fontSize: 17 },
  doneScreen: { flex: 1, backgroundColor: '#060b08', alignItems: 'center', justifyContent: 'center', padding: 30 },
  doneEmoji: { fontSize: 64, marginBottom: 10 },
  doneTitle: { color: '#fff', fontSize: 26, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  doneSubtitle: { color: '#cbd5e1', fontSize: 15, textAlign: 'center', lineHeight: 21, marginBottom: 18 },
  doneScore: { color: GREEN, fontSize: 16, fontWeight: '800', marginBottom: 28 },
  ctaBtn: { backgroundColor: GREEN, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center' },
  ctaBtnText: { color: '#031007', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});
