import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, StatusBar, SafeAreaView, TouchableOpacity, Modal, Platform } from 'react-native';
import { Tube } from './src/components/Tube';
import { canPour, isWin, getVisibleLayers, generateLevel } from './src/logic/engine';
import { playPourSound, playTapSound, playWinSound } from './src/utils/sounds';

const TUBES_FILLED = 4;
const TUBES_EMPTY = 2;
// How many top layers are visible (the rest are hidden by frosted glass)
const VISIBLE_LAYERS = 2;

export default function App() {
  const [tubes, setTubes] = useState<string[][]>(() => generateLevel(TUBES_FILLED, TUBES_EMPTY));
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [level, setLevel] = useState(1);
  // revealedTubes: set of tube indices where the user paid to reveal all layers
  const [revealedTubes, setRevealedTubes] = useState<Set<number>>(new Set());
  const [showAdModal, setShowAdModal] = useState<number | null>(null); // which tube index the ad is for

  // Check for win after every move
  useEffect(() => {
    if (isWin(tubes)) {
      setTimeout(() => {
        playWinSound();
        setHasWon(true);
      }, 300);
    }
  }, [tubes]);

  const handleTubePress = useCallback((index: number) => {
    if (hasWon) return;

    if (selectedTubeIndex === null) {
      if (tubes[index].length > 0) {
        playTapSound();
        setSelectedTubeIndex(index);
      }
      return;
    }

    if (selectedTubeIndex === index) {
      setSelectedTubeIndex(null);
      return;
    }

    const sourceTube = tubes[selectedTubeIndex];
    const targetTube = tubes[index];

    if (canPour(sourceTube, targetTube)) {
      playPourSound();
      const newTubes = tubes.map(t => [...t]);
      const transferredColor = newTubes[selectedTubeIndex].pop() as string;
      newTubes[index].push(transferredColor);
      setTubes(newTubes);
      setSelectedTubeIndex(null);
    } else {
      if (targetTube.length > 0) {
        playTapSound();
        setSelectedTubeIndex(index);
      } else {
        setSelectedTubeIndex(null);
      }
    }
  }, [hasWon, tubes, selectedTubeIndex]);

  const handleNextLevel = () => {
    setTubes(generateLevel(TUBES_FILLED, TUBES_EMPTY));
    setSelectedTubeIndex(null);
    setHasWon(false);
    setRevealedTubes(new Set());
    setLevel(l => l + 1);
  };

  // Ad reveal: user taps the "👁 Reveal" button on a tube
  const handleRevealPress = (index: number) => {
    setShowAdModal(index);
  };

  // Simulate watching an ad — in production, show real rewarded ad here
  const handleWatchAd = () => {
    if (showAdModal === null) return;
    const newRevealed = new Set(revealedTubes);
    newRevealed.add(showAdModal);
    setRevealedTubes(newRevealed);
    setShowAdModal(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Frosted Sort</Text>
        <Text style={styles.levelText}>Level {level}</Text>
        <Text style={styles.subtitle}>Sort the colors. Reveal what's hidden.</Text>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        {tubes.map((tubeColors, index) => {
          const isRevealed = revealedTubes.has(index);
          // Decide which colors are visible
          const visibleColors = isRevealed
            ? tubeColors  // Show all layers if user revealed it
            : getVisibleLayers(tubeColors, VISIBLE_LAYERS).concat(
                // Pad from below with 'hidden' markers for rendering
                tubeColors.slice(0, Math.max(0, tubeColors.length - VISIBLE_LAYERS)).map(() => 'HIDDEN')
              );

          return (
            <View key={index} style={styles.tubeWithButton}>
              <Tube
                colors={tubeColors}
                visibleCount={isRevealed ? 4 : VISIBLE_LAYERS}
                isSelected={selectedTubeIndex === index}
                onPress={() => handleTubePress(index)}
              />
              {/* Only show reveal button if tube has hidden layers */}
              {tubeColors.length > VISIBLE_LAYERS && !isRevealed && (
                <TouchableOpacity
                  style={styles.revealButton}
                  onPress={() => handleRevealPress(index)}
                >
                  <Text style={styles.revealButtonText}>👁 Reveal</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Win Screen Modal */}
      <Modal visible={hasWon} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.winCard}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={styles.winTitle}>Sorted!</Text>
            <Text style={styles.winSubtitle}>Level {level} complete</Text>
            <TouchableOpacity style={styles.nextButton} onPress={handleNextLevel}>
              <Text style={styles.nextButtonText}>Next Level →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Ad Modal - Simulating a "Watch Ad to Reveal" flow */}
      <Modal visible={showAdModal !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.adCard}>
            <Text style={styles.adTitle}>🔍 Reveal Hidden Layers</Text>
            <Text style={styles.adBody}>
              Watch a short ad to reveal all hidden layers in this tube!
            </Text>
            {/* In production: show actual rewarded ad here, then call handleWatchAd in callback */}
            <View style={styles.adPlaceholder}>
              <Text style={styles.adPlaceholderText}>[ Ad Plays Here ]</Text>
            </View>
            <TouchableOpacity style={styles.watchAdButton} onPress={handleWatchAd}>
              <Text style={styles.watchAdButtonText}>✅ Claim Reveal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dismissButton} onPress={() => setShowAdModal(null)}>
              <Text style={styles.dismissButtonText}>No thanks</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingTop: 40,
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#E8F4FD',
    letterSpacing: 2,
  },
  levelText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7db3',
    marginTop: 6,
  },
  gameBoard: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  tubeWithButton: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  revealButton: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(78, 205, 196, 0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  revealButtonText: {
    color: '#4ECDC4',
    fontSize: 11,
    fontWeight: '600',
  },
  // Win Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winCard: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    width: '80%',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  winEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  winTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#E8F4FD',
  },
  winSubtitle: {
    fontSize: 16,
    color: '#6b7db3',
    marginTop: 4,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 16,
  },
  nextButtonText: {
    color: '#1a1a2e',
    fontWeight: '800',
    fontSize: 16,
  },
  // Ad Modal
  adCard: {
    backgroundColor: '#16213e',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '85%',
    borderWidth: 1,
    borderColor: '#FFE66D',
  },
  adTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#E8F4FD',
    marginBottom: 8,
  },
  adBody: {
    fontSize: 14,
    color: '#6b7db3',
    textAlign: 'center',
    marginBottom: 16,
  },
  adPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#0f3460',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  adPlaceholderText: {
    color: '#6b7db3',
    fontSize: 14,
  },
  watchAdButton: {
    backgroundColor: '#FFE66D',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  watchAdButtonText: {
    color: '#1a1a2e',
    fontWeight: '800',
    fontSize: 15,
  },
  dismissButton: {
    padding: 8,
  },
  dismissButtonText: {
    color: '#6b7db3',
    fontSize: 13,
  },
});
