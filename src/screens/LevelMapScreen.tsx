import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';

interface LevelMapScreenProps {
  onBack: () => void;
  onSelectLevel: (level: number) => void;
}

export function LevelMapScreen({ onBack, onSelectLevel }: LevelMapScreenProps) {
  const { settings, colors } = useSettings();
  const { gameState } = useGame();
  const isLight = settings.theme === 'light';

  // We show up to max unlocked level + 1 (the current one)
  const maxView = gameState.level; 
  const levels = Array.from({ length: maxView }, (_, i) => i + 1);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Text style={{fontSize: 24, color: colors.title}}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.title }]}>Level Map</Text>
        </View>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        <View style={styles.grid}>
          {levels.map(lvl => {
            const stars = gameState.starsByLevel[lvl] || 0;
            const isCurrent = lvl === gameState.level;
            
            return (
              <TouchableOpacity 
                key={lvl}
                style={[
                  styles.levelBtn,
                  { backgroundColor: isCurrent ? colors.accent : colors.surface },
                  isCurrent && { shadowColor: colors.accent, elevation: 8, shadowOpacity: 0.6, shadowRadius: 10 }
                ]}
                onPress={() => onSelectLevel(lvl)}
              >
                <Text style={[
                  styles.lvlText, 
                  { color: isCurrent ? '#1a1a2e' : colors.title }
                ]}>
                  {lvl}
                </Text>
                
                <View style={styles.starsRow}>
                  {lvl < gameState.level ? (
                    [...Array(3)].map((_, i) => (
                      <Text key={i} style={[styles.star, { opacity: i < stars ? 1 : 0.2 }]}>⭐</Text>
                    ))
                  ) : (
                    <Text style={{ fontSize: 16 }}>🔒</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
  },
  headerSide: { width: 44, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: 1.5 },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  levelBtn: {
    width: 80,
    height: 90,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lvlText: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  star: {
    fontSize: 10,
  },
});
