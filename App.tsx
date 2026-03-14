import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet, View, Text, StatusBar, SafeAreaView,
  TouchableOpacity, Modal, Platform
} from 'react-native';
import { Tube } from './src/components/Tube';
import { SettingsModal } from './src/components/SettingsModal';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { GameProvider, useGame } from './src/context/GameContext';
import { SplashScreen } from './src/screens/SplashScreen';
import { MainMenuScreen } from './src/screens/MainMenuScreen';
import { LeaderboardScreen } from './src/screens/LeaderboardScreen';
import { LevelMapScreen } from './src/screens/LevelMapScreen';
import { StoreScreen } from './src/screens/StoreScreen';
import { canPour, isWin, generateLevel } from './src/logic/engine';
import { getStarRating } from './src/logic/stars';
import { getTutorialHint } from './src/logic/tutorial';
import { TutorialArrow } from './src/components/TutorialArrow';
import { ConfettiOverlay } from './src/components/ConfettiOverlay';
import { hapticTap, hapticPour, hapticWin, hapticError } from './src/utils/feedback';
import {
  playPourSound, playTapSound, playWinSound, setSoundSystemVolume
} from './src/utils/sounds';

type AppScreen = 'splash' | 'menu' | 'game' | 'leaderboard' | 'levelmap' | 'store';

function getLevelConfig(level: number) {
  const filledCount = Math.min(14, 3 + Math.floor((level - 1) / 45));
  const emptyCount = (level % 10 === 0) ? 1 : 2; 
  const totalTubes = filledCount + emptyCount;
  const tubeVisibilities = new Array(totalTubes).fill(4);
  
  for (let i = 0; i < totalTubes; i++) {
    let minVis = 4, maxVis = 4;
    if (level < 10) { minVis = 3; maxVis = 4; }
    else if (level < 50) { minVis = 2; maxVis = 3; }
    else if (level < 150) { minVis = 1; maxVis = 3; }
    else { minVis = 1; maxVis = 2; }
    tubeVisibilities[i] = Math.floor(Math.random() * (maxVis - minVis + 1)) + minVis;
  }
  
  const maxTimeSeconds = Math.max(30, filledCount * 15 + Math.floor(level / 5) * 5);
  return { filledCount, emptyCount, tubeVisibilities, maxTimeSeconds };
}

const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

interface GameScreenProps {
  onOpenSettings: () => void;
  onBack: () => void;
  playLevelId?: number;
}

function GameScreen({ onOpenSettings, onBack, playLevelId }: GameScreenProps) {
  const { settings, colors } = useSettings();
  const { gameState, advanceLevel, addCoins, recordStars, getActiveSkin, getActiveLiquidSkin, getActiveBackgroundSkin, claimDailyReward, getDailyRewardStatus, checkAchievements } = useGame();
  
  // Check for daily rewards and achievements on game start
  useEffect(() => {
    // Claim daily reward if available
    const dailyReward = claimDailyReward();
    if (dailyReward) {
      // Show a notification about the daily reward
      // In a real app, you might show a toast or modal
      console.log(`Daily reward claimed: ${dailyReward.coins} coins! Streak: ${dailyReward.streak}`);
    }
    
    // Check for achievements
    checkAchievements();
  }, [claimDailyReward, checkAchievements]);
  
  // Get background skin colors (simplified - in a real app you'd have more sophisticated skin handling)
  const backgroundSkin = getActiveBackgroundSkin();
  const isDarkTheme = settings.theme === 'dark';
  
  // Define background colors for different skins
  const backgroundSkins: Record<string, string> = {
    default: isDarkTheme ? '#1a1a2e' : '#F3F4F6',
    gradient: isDarkTheme ? '#16213e' : '#FFFFFF',
    stars: isDarkTheme ? '#0b0d17' : '#f0f8ff',
    aurora: isDarkTheme ? '#001428' : '#e6f3ff',
    galaxy: isDarkTheme ? '#0a0a0a' : '#f8f4ff',
    ocean: isDarkTheme ? '#001a33' : '#e6f3ff',
    forest: isDarkTheme ? '#001a00' : '#e6ffe6',
    mountain: isDarkTheme ? '#000814' : '#f0f8ff'
  };
  
  const backgroundColor = backgroundSkins[backgroundSkin] || (isDarkTheme ? '#1a1a2e' : '#F3F4F6');
  
  // If playing a past level via the map, use that. Otherwise play the max unlocked level.
  const level = playLevelId ?? gameState.level;

  const [levelConfig, setLevelConfig] = useState(() => getLevelConfig(level));
  const [tubes, setTubes] = useState<string[][]>([]);
  
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [hasWon, setHasWon] = useState(false);
  const [revealedTubes, setRevealedTubes] = useState<Set<number>>(new Set());
  const [showAdFor, setShowAdFor] = useState<number | null>(null);

  const [history, setHistory] = useState<string[][][]>([]);
  const [moveCount, setMoveCount] = useState(0);
  const [earnedStars, setEarnedStars] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isMultiplierApplied, setIsMultiplierApplied] = useState(false);

  const [timeLeft, setTimeLeft] = useState(levelConfig.maxTimeSeconds);
  const [isGameOver, setIsGameOver] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const initLevel = useCallback((lvl: number) => {
    const config = getLevelConfig(lvl);
    setLevelConfig(config);
    setTubes(generateLevel(config.filledCount, config.emptyCount, lvl));
    setHasWon(false);
    setIsGameOver(false);
    setSelectedIdx(null);
    setRevealedTubes(new Set());
    setHistory([]);
    setMoveCount(0);
    setTimeLeft(config.maxTimeSeconds);
  }, []);

  useEffect(() => {
    initLevel(level);
  }, [level, initLevel]);

  useEffect(() => {
    if (settings.timedModeEnabled && !hasWon && !isGameOver && tubes.length > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [settings.timedModeEnabled, hasWon, isGameOver, tubes.length]);

  useEffect(() => {
    setSoundSystemVolume(settings.soundVolume);
  }, [settings.soundVolume]);

  useEffect(() => {
    if (tubes.length === 0) return;
    
    if (isWin(tubes) && !hasWon) {
      setIsGameOver(false);
      setTimeout(() => {
        if (settings.soundVolume > 0) playWinSound();
        if (settings.vibrationOn) hapticWin();
        const stars = getStarRating(moveCount, levelConfig.filledCount);
        setEarnedStars(stars);
        
        // Calculate coins earned
        const timeBonus = settings.timedModeEnabled ? 15 : 0;
        const reward = 10 + stars * 5 + timeBonus;
        setCoinsEarned(reward);
        setIsMultiplierApplied(false);
        addCoins(reward); // Update header coins immediately
        
        // We only grant rewards and save progress if it's the current max level or we are improving a past score
        const pastStars = gameState.starsByLevel[level] || 0;
        if (stars > pastStars || level === gameState.level) {
           recordStars(level, stars);
        }
        
        setHasWon(true);
      }, 300);
    }
  }, [tubes, hasWon, settings, moveCount, levelConfig.filledCount, level, recordStars, gameState.level, gameState.starsByLevel]);

  const handleTubePress = useCallback((index: number) => {
    if (hasWon || isGameOver) return;

    if (selectedIdx === null) {
      if (tubes[index].length > 0) {
        if (settings.soundVolume > 0) playTapSound();
        if (settings.vibrationOn) hapticTap();
        setSelectedIdx(index);
      } else {
        if (settings.vibrationOn) hapticError();
      }
      return;
    }
    if (selectedIdx === index) { setSelectedIdx(null); return; }

    const src = tubes[selectedIdx];
    const tgt = tubes[index];

    if (canPour(src, tgt)) {
      if (settings.soundVolume > 0) playPourSound();
      if (settings.vibrationOn) hapticPour();
      
      setHistory(prev => {
        const h = [...prev, tubes.map(t => [...t])];
        if (h.length > 3) h.shift();
        return h;
      });

      const newTubes = tubes.map(t => [...t]);
      const color = newTubes[selectedIdx].pop() as string;
      newTubes[index].push(color);
      setTubes(newTubes);
      setMoveCount(c => c + 1);
      setSelectedIdx(null);
    } else {
      if (settings.vibrationOn) hapticError();
      if (tgt.length > 0) { setSelectedIdx(index); } else { setSelectedIdx(null); }
    }
  }, [hasWon, isGameOver, tubes, selectedIdx, settings]);

  const handleUndo = () => {
    if (history.length === 0 || hasWon || isGameOver) return;
    const h = [...history];
    const prevTubes = h.pop();
    if (prevTubes) {
      setTubes(prevTubes);
      setHistory(h);
      setMoveCount(c => Math.max(0, c - 1));
      setSelectedIdx(null);
    }
  };

  const nextLevel = () => {
    // Only give big coin rewards for new level progressions
    if (level === gameState.level) {
      advanceLevel(); 
    } else {
       // Replayed a past level, return to Level Map
       onBack();
    }
  };

  const handleTripleCoins = () => {
    if (isMultiplierApplied) return;
    const bonus = coinsEarned * 2;
    addCoins(bonus);
    setCoinsEarned(c => c * 3);
    setIsMultiplierApplied(true);
    if (settings.vibrationOn) hapticWin();
  };

  const restartLevel = () => {
    initLevel(level);
  };

  const handleWatchAd = () => {
    if (showAdFor === null) return;
    const next = new Set(revealedTubes);
    next.add(showAdFor);
    setRevealedTubes(next);
    setShowAdFor(null);
  };

  const hintIdx = level <= 3 && tubes.length > 0 ? getTutorialHint(tubes, selectedIdx) : null;
  const bg = colors.background;
  const isLight = settings.theme === 'light';

   return (
     <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}>
       <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={backgroundColor} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSide} onPress={onBack}>
          <Text style={{fontSize: 24, color: colors.title}}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: colors.title }]}>Level {level}</Text>
          <View style={styles.statsRow}>
             <Text style={[styles.levelText, { color: colors.accent }]}>💰 {gameState.coins}   🔥 {gameState.streak}</Text>
          </View>
        </View>
        
        <View style={styles.headerRightGroup}>
          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: isLight ? '#DDE6F5' : '#16213e', opacity: history.length > 0 ? 1 : 0.4 }]}
            onPress={handleUndo}
            disabled={history.length === 0}
          >
            <Text style={styles.settingsIcon}>↩️</Text>
            {history.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{history.length}</Text></View>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.settingsBtn, { backgroundColor: isLight ? '#DDE6F5' : '#16213e' }]}
            onPress={onOpenSettings}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 16, gap: 16 }}>
        <Text style={[styles.subtitle, { color: colors.subtitle, marginBottom: 0 }]}>
          Moves: {moveCount}
        </Text>
        {settings.timedModeEnabled && (
          <View style={{ backgroundColor: timeLeft < 10 ? '#FF6B6B' : 'transparent', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
            <Text style={[styles.subtitle, { color: timeLeft < 10 ? '#fff' : colors.accent, marginBottom: 0, fontWeight: '800' }]}>
              ⏱️ {formatTime(timeLeft)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.gameBoard}>
        {tubes.map((tubeColors, index) => {
          const isRevealed = revealedTubes.has(index);
          const showHint = hintIdx === index;
          return (
            <View key={index} style={styles.tubeWithButton}>
              {showHint && <TutorialArrow />}
               <Tube
                 colors={tubeColors}
                 visibleCount={isRevealed ? 4 : levelConfig.tubeVisibilities[index]}
                 isRevealed={isRevealed}
                 isSelected={selectedIdx === index}
                 onPress={() => handleTubePress(index)}
                 accentColor={colors.accent}
                 glassColor={colors.tubeGlass}
                 borderColor={colors.tubeBorder}
                 frostedTint={colors.frostedTint}
                 skin={getActiveSkin()}
                 liquidSkin={getActiveLiquidSkin(tubeColors[0] || '#FFFFFF')} // Use first color or white as fallback
               />
              {levelConfig.tubeVisibilities[index] < 4 && !isRevealed && (
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

      <ConfettiOverlay visible={hasWon} />

      <Modal visible={hasWon} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.winCard, { backgroundColor: colors.surface, borderColor: colors.accent }]}>
            <Text style={styles.winEmoji}>🎉</Text>
            <Text style={[styles.winTitle, { color: colors.title }]}>Sorted!</Text>
            
            <View style={styles.starsRow}>
              {[...Array(3)].map((_, i) => (
                <Text key={i} style={[styles.star, { opacity: i < earnedStars ? 1 : 0.2 }]}>⭐</Text>
              ))}
            </View>
            
            <Text style={[styles.winSub, { color: colors.subtitle }]}>
              Level {level} complete in {moveCount} moves
            </Text>

            <View style={[styles.rewardBox, { backgroundColor: colors.background, borderColor: colors.accent }]}>
              <Text style={[styles.rewardLabel, { color: colors.subtitle }]}>REWARD</Text>
              <Text style={[styles.rewardVal, { color: colors.accent }]}>💰 +{coinsEarned}</Text>
            </View>

            {!isMultiplierApplied && (
              <TouchableOpacity style={styles.tripleBtn} onPress={handleTripleCoins}>
                <Text style={styles.tripleBtnText}>📺 Watch Ad to 3x</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: colors.buttonBg, marginTop: 12 }]} onPress={nextLevel}>
              <Text style={[styles.nextBtnText, { color: colors.buttonText }]}>
                {level === gameState.level ? 'Next Level →' : 'Back to Map'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isGameOver} transparent animationType="slide">
        <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.winCard, { backgroundColor: colors.surface, borderColor: '#FF6B6B' }]}>
            <Text style={styles.winEmoji}>⏳</Text>
            <Text style={[styles.winTitle, { color: colors.title }]}>Time's Up!</Text>
            <Text style={[styles.winSub, { color: colors.subtitle }]}>You ran out of time.</Text>
            
            <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#FF6B6B' }]} onPress={restartLevel}>
              <Text style={[styles.nextBtnText, { color: '#fff' }]}>Retry Level</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ marginTop: 16 }} onPress={onBack}>
              <Text style={{ color: colors.subtitle, fontWeight: '600' }}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

function AppNavigator() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('splash');
  const [showSettings, setShowSettings] = useState(false);
  const [targetLevel, setTargetLevel] = useState<number | undefined>(undefined);
  const { isLoaded, updateStreak } = useGame();

  useEffect(() => {
    if (isLoaded && currentScreen === 'menu') {
      updateStreak();
    }
  }, [isLoaded, currentScreen]);

   if (!isLoaded) return null;

   return (
     <>
       {currentScreen === 'splash' && (
         <SplashScreen onDone={() => setCurrentScreen('menu')} />
       )}
       {currentScreen === 'menu' && (
         <MainMenuScreen 
           onPlay={() => { setTargetLevel(undefined); setCurrentScreen('game'); }} 
           onOpenSettings={() => setShowSettings(true)} 
           onLeaderboard={() => setCurrentScreen('leaderboard')}
           onLevelMap={() => setCurrentScreen('levelmap')}
           onOpenStore={() => setCurrentScreen('store')}
         />
       )}
       {currentScreen === 'game' && (
         <GameScreen 
           playLevelId={targetLevel}
           onOpenSettings={() => setShowSettings(true)} 
           onBack={() => setCurrentScreen('menu')} 
         />
       )}
       {currentScreen === 'leaderboard' && (
         <LeaderboardScreen 
           onBack={() => setCurrentScreen('menu')} 
         />
       )}
       {currentScreen === 'levelmap' && (
         <LevelMapScreen 
           onBack={() => setCurrentScreen('menu')} 
           onSelectLevel={(lvl) => {
             setTargetLevel(lvl);
             setCurrentScreen('game');
           }}
         />
       )}
       {currentScreen === 'store' && (
         <StoreScreen 
           onBack={() => setCurrentScreen('menu')} 
         />
       )}
       
       <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />
     </>
   );
}

export default function App() {
  return (
    <SettingsProvider>
      <GameProvider>
        <AppNavigator />
      </GameProvider>
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
  headerSide: { width: 44, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRightGroup: { flexDirection: 'row', gap: 8 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 1.5 },
  statsRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },
  levelText: { fontSize: 13, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  settingsBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  settingsIcon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: '#FF6B9D', borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', fontSize: 13, marginBottom: 16 },
  gameBoard: {
    flex: 1, flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 12,
  },
  tubeWithButton: { alignItems: 'center', marginHorizontal: 4 },
  revealBtn: {
    position: 'absolute', bottom: -35,
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12, borderWidth: 1, zIndex: 10,
  },
  revealBtnText: { fontSize: 11, fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  winCard: {
    borderRadius: 24, padding: 36, alignItems: 'center',
    width: '80%', borderWidth: 1,
  },
  winEmoji: { fontSize: 52, marginBottom: 12 },
  winTitle: { fontSize: 28, fontWeight: '800' },
  starsRow: { flexDirection: 'row', gap: 8, marginVertical: 12 },
  star: { fontSize: 32 },
  winSub: { fontSize: 16, marginTop: 4, marginBottom: 24 },
  nextBtn: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  nextBtnText: { fontWeight: '800', fontSize: 16 },
  rewardBox: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 16, borderStyle: 'dashed', borderWidth: 1,
    alignItems: 'center', marginBottom: 12, width: '100%'
  },
  rewardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  rewardVal: { fontSize: 24, fontWeight: '900' },
  tripleBtn: {
    backgroundColor: '#FFD700', paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 12, marginBottom: 8, width: '100%', alignItems: 'center'
  },
  tripleBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
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
