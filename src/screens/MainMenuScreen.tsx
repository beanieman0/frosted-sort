import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { useSettings } from '../context/SettingsContext';
import { useGame } from '../context/GameContext';

interface MainMenuScreenProps {
  onPlay: () => void;
  onOpenSettings: () => void;
  onLeaderboard?: () => void;
  onLevelMap?: () => void;
  onOpenStore: () => void;
}

const { width, height } = Dimensions.get('window');

function FloatingBackground() {
  const anims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;
  
  useEffect(() => {
    anims.forEach((anim) => {
      const duration = 12000 + Math.random() * 8000;
      const delay = Math.random() * 5000;
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          })
        ])
      ).start();
    });
  }, [anims]);

  return (
    <View style={StyleSheet.absoluteFill}>
      {anims.map((anim, i) => {
        const left = (10 + i * 11) * width / 100;
        const size = 30 + Math.random() * 30;
        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [height + 100, -100]
        });
        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        });
        return (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left,
              fontSize: size,
              opacity: 0.15,
              transform: [{ translateY }, { rotate }]
            }}
          >
            🧪
          </Animated.Text>
        );
      })}
    </View>
  );
}

export function MainMenuScreen({ onPlay, onOpenSettings, onLeaderboard, onLevelMap, onOpenStore }: MainMenuScreenProps) {
  const { colors } = useSettings();
  const { gameState, claimDailyReward, getDailyRewardStatus } = useGame();
  
  const [dailyRewardStatus, setDailyRewardStatus] = useState(() => getDailyRewardStatus());
  const [dailyRewardAvailable, setDailyRewardAvailable] = useState(false);
  
  // Check daily reward status on mount and periodically
  useEffect(() => {
    const status = getDailyRewardStatus();
    setDailyRewardStatus(status);
    setDailyRewardAvailable(status.canClaim);
    
    // Set up interval to check for new day (every minute)
    const interval = setInterval(() => {
      const status = getDailyRewardStatus();
      setDailyRewardStatus(status);
      setDailyRewardAvailable(status.canClaim);
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [getDailyRewardStatus]);
  
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslate = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(contentTranslate, {
        toValue: 0,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FloatingBackground />

      <TouchableOpacity 
        style={[styles.settingsBtn, { backgroundColor: colors.surface }]}
        onPress={onOpenSettings}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      <Animated.View style={[
        styles.content, 
        { opacity: contentOpacity, transform: [{ translateY: contentTranslate }] }
      ]}>
        <Text style={[styles.title, { color: colors.title }]}>FROSTED SORT</Text>
        <Animated.Text style={[styles.subtitle, { color: colors.subtitle, transform: [{ scale: pulseAnim }] }]}>
          Level {gameState.level}
        </Animated.Text>

        <TouchableOpacity 
          style={[styles.playBtn, { shadowColor: colors.accent }]}
          onPress={onPlay}
        >
          <Text style={styles.playBtnText}>
            {gameState.level > 1 ? '▶ CONTINUE' : '▶ PLAY'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.playBtn, { shadowColor: colors.accent, marginTop: 16, backgroundColor: colors.buttonBg }]}
          onPress={onLevelMap}
        >
          <Text style={[styles.playBtnText, { fontSize: 16 }]}>🗺️ LEVEL MAP</Text>
        </TouchableOpacity>

         <TouchableOpacity 
           style={[styles.playBtn, { shadowColor: colors.accent, marginTop: 16, backgroundColor: colors.buttonBg }]}
           onPress={onLeaderboard}
         >
           <Text style={[styles.playBtnText, { fontSize: 16 }]}>🏆 LEADERBOARD</Text>
         </TouchableOpacity>

         {/* Store button will be handled in AppNavigator - for now we'll keep the alert until we integrate it properly */}
         <TouchableOpacity 
           style={[styles.playBtn, { shadowColor: colors.accent, marginTop: 16, backgroundColor: colors.buttonBg }]}
           onPress={onOpenStore}
         >
           <Text style={[styles.playBtnText, { fontSize: 16 }]}>🛒 STORE</Text>
         </TouchableOpacity>
        
         <View style={styles.statsRow}>
           <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
             <Text style={styles.statIcon}>💰</Text>
             <Text style={[styles.statValue, { color: colors.title }]}>{gameState.coins}</Text>
           </View>
           <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
             <Text style={styles.statIcon}>🔥</Text>
             <Text style={[styles.statValue, { color: colors.title }]}>{gameState.streak}</Text>
           </View>
           {dailyRewardAvailable && (
             <TouchableOpacity 
               style={[styles.statBox, { backgroundColor: '#4ECDC4' }]}
               onPress={() => {
                 const reward = claimDailyReward();
                 if (reward) {
                   setDailyRewardAvailable(false);
                   setDailyRewardStatus(getDailyRewardStatus());
                   // Show some feedback - in a real app you'd use a toast or modal
                   alert(`Daily reward claimed! +${reward.coins} coins (${reward.streak} day streak)`);
                 }
               }}
             >
               <Text style={styles.statIcon}>🎁</Text>
               <Text style={[styles.statValue, { color: '#1a1a2e', fontWeight: '700' }]}>CLAIM</Text>
             </TouchableOpacity>
           )}
           {!dailyRewardAvailable && (
             <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
               <Text style={styles.statIcon}>🎁</Text>
               <Text style={[styles.statValue, { color: colors.title }]}>{dailyRewardStatus.streak} day streak</Text>
             </View>
           )}
         </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bgDecor: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  settingsIcon: {
    fontSize: 22,
  },
  content: {
    alignItems: 'center',
    padding: 30,
    width: '100%',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 40,
  },
  playBtn: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 48,
    paddingVertical: 18,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  playBtnText: {
    color: '#1a1a2e',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 40,
    gap: 16,
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
});
