import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, StatusBar, SafeAreaView,
  TouchableOpacity, Modal, Platform, Vibration
} from 'react-native';
import { Tube } from './src/components/Tube';
import { SettingsModal } from './src/components/SettingsModal';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { canPour, isWin, getVisibleLayers, generateLevel } from './src/logic/engine';
import {
  playPourSound, playTapSound, playWinSound, setSoundSystemVolume
} from './src/utils/sounds';

const TUBES_FILLED = 4;
const TUBES_EMPTY = 2;
const VISIBLE_LAYERS = 2;

// ----- Inner game component (consumes SettingsContext) -----
function Game() {
  const { settings, colors } = useSettings();

  const [tubes, setTubes] = useState<string[][]>(() => generateLevel(TUBES_FILLED, TUBES_EMPTY));
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [level, setLevel] = useState(1);
  const [revealedTubes, setRevealedTubes] = useState<Set<number>>(new Set());
  const [showAdFor, setShowAdFor] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Sync sound volume whenever settings change
  useEffect(() => {
    setSoundSystemVolume(settings.soundVolume);
  }, [settings.soundVolume]);

  // Check win after every move
  useEffect(() => {
    if (isWin(tubes)) {
      setTimeout(() => {
        if (settings.soundVolume > 0) playWinSound();
        if (settings.vibrationOn && Platform.OS !== 'web') Vibration.vibrate([0, 100, 80, 100]);
        setHasWon(true);
      }, 300);
    }
  }, [tubes]);

  const handleTubePress = useCallback((index: number) => {
    if (hasWon) return;

    if (selectedIdx === null) {
      if (tubes[index].length > 0) {
        if (settings.soundVolume > 0) playTapSound();
        if (settings.vibrationOn && Platform.OS !== 'web') Vibration.vibrate(30);
        setSelectedIdx(index);
      }
      return;
    }
    if (selectedIdx === index) { setSelectedIdx(null); return; }

    const src = tubes[selectedIdx];
    const tgt = tubes[index];

    if (canPour(src, tgt)) {
      if (settings.soundVolume > 0) playPourSound();
      if (settings.vibrationOn && Platform.OS !== 'web') Vibration.vibrate(20);
      const newTubes = tubes.map(t => [...t]);
      const color = newTubes[selectedIdx].pop() as string;
      newTubes[index].push(color);
      setTubes(newTubes);
      setSelectedIdx(null);
    } else {
      if (tgt.length > 0) { setSelectedIdx(index); } else { setSelectedIdx(null); }
    }
  }, [hasWon, tubes, selectedIdx, settings]);

  const nextLevel = () => {
    setTubes(generateLevel(TUBES_FILLED, TUBES_EMPTY));
    setSelectedIdx(null);
    setHasWon(false);
    setRevealedTubes(new Set());
    setLevel(l => l + 1);
  };

  const handleWatchAd = () => {
    if (showAdFor === null) return;
    const next = new Set(revealedTubes);
    next.add(showAdFor);
    setRevealedTubes(next);
    setShowAdFor(null);
  };

  const bg = colors.background;
  const isLight = settings.theme === 'light';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: bg }]}>
      <StatusBar
        barStyle={isLight ? 'dark-content' : 'light-content'}
        backgroundColor={bg}
      />

      {/* ─── Header ─── */}
      <View style={styles.header}>
        <View style={styles.headerSide} />
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.title }]}>Frosted Sort</Text>
          <Text style={[styles.levelText, { color: colors.accent }]}>Level {level}</Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsBtn, { backgroundColor: isLight ? '#DDE6F5' : '#16213e' }]}
          onPress={() => setShowSettings(true)}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.subtitle }]}>
        Sort the colors. Reveal what's hidden.
      </Text>

      {/* ─── Game Board ─── */}
      <View style={styles.gameBoard}>
        {tubes.map((tubeColors, index) => {
          const isRevealed = revealedTubes.has(index);
          return (
            <View key={index} style={styles.tubeWithButton}>
              <Tube
                colors={tubeColors}
                visibleCount={isRevealed ? 4 : VISIBLE_LAYERS}
                isSelected={selectedIdx === index}
                onPress={() => handleTubePress(index)}
                accentColor={colors.accent}
                glassColor={colors.tubeGlass}
                borderColor={colors.tubeBorder}
                frostedTint={colors.frostedTint}
              />
              {tubeColors.length > VISIBLE_LAYERS && !isRevealed && (
                <TouchableOpacity
                  style={[styles.revealBtn, { borderColor: colors.accent }]}
                  onPress={() => setShowAdFor(index)}
                >
                  <Text style={[styles.revealBtnText, { color: colors.accent }]}>👁 Reveal</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* ─── Settings Modal ─── */}
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      {/* ─── Win Modal ─── */}
      <Modal visible={hasWon} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.winCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={[styles.winTitle, { color: colors.title }]}>Sorted!</Text>
            <Text style={[styles.winSub, { color: colors.subtitle }]}>Level {level} complete</Text>
            <TouchableOpacity
              style={[styles.nextBtn, { backgroundColor: colors.buttonBg }]}
              onPress={nextLevel}
            >
              <Text style={[styles.nextBtnText, { color: colors.buttonText }]}>Next Level →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ─── Reveal-Ad Modal ─── */}
      <Modal visible={showAdFor !== null} transparent animationType="slide">
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.adCard, { backgroundColor: colors.surface, borderColor: '#FFE66D' }]}>
            <Text style={[styles.adTitle, { color: colors.title }]}>🔍 Reveal Hidden Layers</Text>
            <Text style={[styles.adBody, { color: colors.subtitle }]}>
              Watch a short ad to reveal all hidden layers in this tube!
            </Text>
            <View style={[styles.adBox, { backgroundColor: isLight ? '#EFF3FF' : '#0f3460' }]}>
              <Text style={[styles.adBoxText, { color: colors.subtitle }]}>[ Ad Plays Here ]</Text>
            </View>
            <TouchableOpacity style={styles.watchAdBtn} onPress={handleWatchAd}>
              <Text style={styles.watchAdBtnText}>✅ Claim Reveal</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdFor(null)} style={styles.dismissBtn}>
              <Text style={[styles.dismissText, { color: colors.subtitle }]}>No thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ----- Root with Provider -----
export default function App() {
  return (
    <SettingsProvider>
      <Game />
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 4,
  },
  headerSide: { width: 44 },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: 1.5 },
  levelText: { fontSize: 13, fontWeight: '600', letterSpacing: 3, marginTop: 2, textTransform: 'uppercase' },
  settingsBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  settingsIcon: { fontSize: 22 },
  subtitle: { textAlign: 'center', fontSize: 13, marginBottom: 16 },
  gameBoard: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tubeWithButton: { alignItems: 'center', marginHorizontal: 4 },
  revealBtn: {
    marginTop: 8, paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'transparent',
    borderRadius: 12, borderWidth: 1,
  },
  revealBtnText: { fontSize: 11, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  winCard: {
    borderRadius: 24, padding: 36, alignItems: 'center',
    width: '80%', borderWidth: 1,
  },
  winEmoji: { fontSize: 52, marginBottom: 12 },
  winTitle: { fontSize: 28, fontWeight: '800' },
  winSub: { fontSize: 16, marginTop: 4, marginBottom: 24 },
  nextBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  nextBtnText: { fontWeight: '800', fontSize: 16 },
  adCard: {
    borderRadius: 24, padding: 24, alignItems: 'center',
    width: '85%', borderWidth: 1,
  },
  adTitle: { fontSize: 20, fontWeight: '800', marginBottom: 8 },
  adBody: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  adBox: {
    width: '100%', height: 110, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  adBoxText: { fontSize: 14 },
  watchAdBtn: {
    backgroundColor: '#FFE66D', paddingHorizontal: 28,
    paddingVertical: 12, borderRadius: 14, marginBottom: 10,
  },
  watchAdBtnText: { color: '#1a1a2e', fontWeight: '800', fontSize: 15 },
  dismissBtn: { padding: 8 },
  dismissText: { fontSize: 13 },
});
