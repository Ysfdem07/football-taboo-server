import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useLanguage } from '../context/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { CustomAlert } from '../components/CustomAlert';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Tutorial'>;
};

const GREEN = '#00FF88';
const RED = '#ff5a5a';

type Round = { answer: string; hints: string[]; hintsEn: string[] };

// Five scripted rounds — no server, no real opponent. Just enough to teach
// the rhythm (hints reveal one by one, buzz in and type the word the moment
// you know it, fewer hints shown = more points) before dropping a
// first-time player into a real match. Mixed across the app's 3 categories
// (2 football, 2 cinema, 1 music) so the demo isn't misleadingly
// football-only — words/hints here are pulled from the same source sheet
// (CSV_URLS in backend/server.js) the real game uses, not invented.
const ROUNDS: Round[] = [
  { answer: 'PELE', hints: ['Brezilyalı', '3 kez Dünya Kupası kazandı', "'Kral' lakaplı", 'Santos efsanesi', '10 numara'], hintsEn: ['Brazilian', 'Won the World Cup 3 times', "Nicknamed 'The King'", 'Santos legend', 'Wore number 10'] },
  { answer: 'MESSI', hints: ['Arjantinli', 'Barcelona efsanesi', "8 Ballon d'Or", 'Sol ayak ustası', '2022 Dünya Kupası şampiyonu'], hintsEn: ['Argentinian', 'Barcelona legend', '8 Ballon d\'Ors', 'Left-footed magician', '2022 World Cup champion'] },
  { answer: 'INCEPTION', hints: ['Rüya', 'Topaç', 'Nolan', 'Labirent', 'Leonardo DiCaprio'], hintsEn: ['Action', 'Leonardo DiCaprio', 'Christopher Nolan', '2010', 'Tom Hardy'] },
  { answer: 'FIGHT CLUB', hints: ['Kural', 'Edward Norton', 'Sabun', 'Şizofren', 'Brad Pitt'], hintsEn: ['Drama', 'Brad Pitt', 'David Fincher', '1999', 'Meat Loaf'] },
  { answer: 'QUEEN', hints: ['Rock', 'Bıyık', 'Piyano', 'Bohemian Rhapsody', 'Freddie Mercury'], hintsEn: ['Smile (Band)', 'Live Aid 1985', 'We Will Rock You', 'Freddie Mercury', 'Bohemian Rhapsody'] },
];

const HINT_INTERVAL_MS = 2200;
const SCORE_PER_HINT_LEFT = 20;

const normalize = (s: string) =>
  s.toLocaleUpperCase('tr-TR').replace(/İ/g, 'I').replace(/[^A-ZÇĞÖŞÜ]/g, '');

export default function TutorialScreen({ navigation }: Props) {
  const { language } = useLanguage();
  const [roundIndex, setRoundIndex] = useState(0);
  const [hintsShown, setHintsShown] = useState(1);
  const [hintsAtBuzz, setHintsAtBuzz] = useState(1);
  const [phase, setPhase] = useState<'revealing' | 'guessing' | 'answered'>('revealing');
  const [guessInput, setGuessInput] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [lastScore, setLastScore] = useState(0);
  const [done, setDone] = useState(false);
  const [introStarted, setIntroStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Frames the demo as a deliberate practice round rather than the real
  // game, before round 1's hints start revealing.
  useEffect(() => {
    CustomAlert.show(
      language === 'en' ? 'Quick practice round!' : 'Kısa bir deneme turu!',
      language === 'en'
        ? 'Before jumping into real matches, let\'s play a short trial round so you get the hang of it.'
        : 'Gerçek maçlara geçmeden önce, alışman için kısa bir deneme turu oynayalım.',
      [{ text: language === 'en' ? "Let's go" : 'Başlayalım', onPress: () => setIntroStarted(true) }],
      'info'
    );
  }, []);

  const round = ROUNDS[roundIndex];
  const hints = language === 'en' ? round.hintsEn : round.hints;
  const answerLength = normalize(round.answer).length;

  useEffect(() => {
    if (phase !== 'revealing' || !introStarted) return;
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
  }, [phase, roundIndex, introStarted]);

  const handleBuzz = () => {
    if (phase !== 'revealing') return;
    if (timerRef.current) clearInterval(timerRef.current);
    setHintsAtBuzz(hintsShown);
    setGuessInput('');
    setPhase('guessing');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmitGuess = () => {
    if (phase !== 'guessing') return;
    const correct = normalize(guessInput) === normalize(round.answer) && guessInput.trim().length > 0;
    const score = correct ? Math.max(10, (hints.length - hintsAtBuzz + 1) * SCORE_PER_HINT_LEFT) : 0;
    setWasCorrect(correct);
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
    setGuessInput('');
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
            ? 'Read the clues, buzz in fast, type the word, score big. Time to play for real.'
            : 'İpuçlarını oku, hızlı tahmin et, kelimeyi yaz, çok puan kazan. Şimdi gerçek oyuna geç.'}
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

  const normalizedInput = normalize(guessInput);

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                ? 'Clues appear one by one. The moment you know the word, tap BUZZ IN, then type it — fewer clues shown means more points!'
                : 'İpuçları sırayla açılır. Kelimeyi tahmin ettiğin an TAHMİN ET\'e bas, sonra yaz — ne kadar az ipucuyla bilirsen o kadar çok puan kazanırsın!'}
            </Text>
          </View>
        )}

        <View style={styles.tiles}>
          {Array.from({ length: answerLength }).map((_, i) => (
            <View key={i} style={[styles.tile, phase === 'answered' && (wasCorrect ? styles.tileCorrect : styles.tileWrong)]}>
              <Text style={styles.tileLetter}>
                {phase === 'answered' ? normalize(round.answer)[i] : (normalizedInput[i] || '')}
              </Text>
            </View>
          ))}
        </View>

        {phase === 'answered' ? (
          <View style={styles.answerCard}>
            <Ionicons
              name={wasCorrect ? 'checkmark-circle' : 'close-circle'}
              size={48}
              color={wasCorrect ? GREEN : RED}
            />
            <Text style={styles.answerWord}>{round.answer}</Text>
            <Text style={[styles.answerScore, !wasCorrect && { color: RED }]}>
              {wasCorrect
                ? `+${lastScore} ${language === 'en' ? 'points' : 'puan'}`
                : (language === 'en' ? 'Not quite — here\'s the word' : 'Tam olmadı — kelime buydu')}
            </Text>
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

        {phase === 'guessing' && (
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={guessInput}
            onChangeText={setGuessInput}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={handleSubmitGuess}
            maxLength={answerLength + 5}
          />
        )}

        <View style={styles.bottom}>
          {phase === 'revealing' && (
            <TouchableOpacity style={styles.buzzBtn} onPress={handleBuzz} activeOpacity={0.85}>
              <Text style={styles.buzzBtnText}>⚡ {language === 'en' ? 'BUZZ IN!' : 'TAHMİN ET!'}</Text>
            </TouchableOpacity>
          )}
          {phase === 'guessing' && (
            <TouchableOpacity style={styles.buzzBtn} onPress={handleSubmitGuess} activeOpacity={0.85}>
              <Text style={styles.buzzBtnText}>{language === 'en' ? 'SUBMIT →' : 'GÖNDER →'}</Text>
            </TouchableOpacity>
          )}
          {phase === 'answered' && (
            <TouchableOpacity style={styles.buzzBtn} onPress={handleNext} activeOpacity={0.85}>
              <Text style={styles.buzzBtnText}>
                {roundIndex + 1 >= ROUNDS.length
                  ? (language === 'en' ? 'FINISH' : 'BİTİR')
                  : (language === 'en' ? 'NEXT →' : 'SIRADAKİ →')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
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
  tile: { width: 30, height: 36, borderWidth: 2, borderColor: '#1f6b3f', borderRadius: 6, backgroundColor: 'rgba(20,45,28,0.5)', alignItems: 'center', justifyContent: 'center' },
  tileCorrect: { borderColor: GREEN, backgroundColor: 'rgba(0,255,136,0.15)' },
  tileWrong: { borderColor: RED, backgroundColor: 'rgba(255,90,90,0.12)' },
  tileLetter: { color: '#fff', fontWeight: '900', fontSize: 16 },
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
  hiddenInput: {
    height: 0,
    width: 0,
    opacity: 0,
    position: 'absolute',
  },
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
