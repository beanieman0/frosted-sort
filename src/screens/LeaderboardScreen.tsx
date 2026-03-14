import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Image } from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface LeaderboardScreenProps {
  onBack: () => void;
}

const MOCK_LEADERBOARD = [
  { id: '1', name: 'FrostMaster', level: 342, streak: 45, stars: 1020, avatar: '🦊' },
  { id: '2', name: 'ColorKing', level: 289, streak: 12, stars: 855, avatar: '👑' },
  { id: '3', name: 'IceQueen', level: 256, streak: 8, stars: 760, avatar: '❄️' },
  { id: '4', name: 'You', level: 42, streak: 3, stars: 120, avatar: '👤', isMe: true },
  { id: '5', name: 'ChillDude', level: 12, streak: 1, stars: 35, avatar: '😎' },
];

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const { settings, colors } = useSettings();
  const isLight = settings.theme === 'light';

  // Sort by level strictly for the mock display
  const sorted = [...MOCK_LEADERBOARD].sort((a, b) => b.level - a.level);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={colors.background} />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Text style={{fontSize: 24, color: colors.title}}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.title }]}>Global Top</Text>
        </View>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {sorted.map((player, index) => (
          <View 
            key={player.id} 
            style={[
              styles.playerCard, 
              { backgroundColor: colors.surface },
              player.isMe && { borderColor: colors.accent, borderWidth: 2 }
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={[styles.rankText, { color: colors.subtitle }]}>#{index + 1}</Text>
            </View>
            
            <View style={styles.avatarBox}>
              <Text style={styles.avatar}>{player.avatar}</Text>
            </View>
            
            <View style={styles.playerInfo}>
              <Text style={[styles.playerName, { color: colors.title }]}>{player.name}</Text>
              <View style={styles.playerStats}>
                <Text style={[styles.statText, { color: colors.subtitle }]}>⭐⭐ {player.stars}</Text>
                <Text style={[styles.statText, { color: colors.subtitle }]}>🔥 {player.streak}</Text>
              </View>
            </View>

            <View style={[styles.levelBadge, { backgroundColor: colors.background }]}>
              <Text style={[styles.levelVal, { color: colors.title }]}>Lvl {player.level}</Text>
            </View>
          </View>
        ))}
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
    gap: 12,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  rankBadge: {
    width: 32,
    alignItems: 'flex-start',
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    fontSize: 24,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  playerStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelVal: {
    fontSize: 14,
    fontWeight: '800',
  },
});
