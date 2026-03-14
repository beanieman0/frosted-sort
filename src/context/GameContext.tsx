import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TubeSkin } from './SettingsContext';

export interface GameState {
  level: number;
  coins: number;
  streak: number;
  lastPlayDate: string | null;
  starsByLevel: Record<number, number>;
  purchasedSkins: TubeSkin[];
  liquidSkins: Record<string, string>; // Maps liquid color to skin name
  backgroundSkins: string[]; // Available background skins
  lastDailyReward: string | null; // Date of last daily reward claimed
  dailyRewardStreak: number; // Current daily reward streak
}

const DEFAULT_STATE: GameState = {
  level: 1,
  coins: 0,
  streak: 0,
  lastPlayDate: null,
  starsByLevel: {},
  purchasedSkins: ['default'], // Start with default skin unlocked
  liquidSkins: {}, // No custom liquid skins initially
  backgroundSkins: ['default'], // Start with default background unlocked
  lastDailyReward: null, // No daily reward claimed yet
  dailyRewardStreak: 0, // Current daily reward streak
};

interface GameContextType {
  gameState: GameState;
  isLoaded: boolean;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  recordStars: (level: number, stars: number) => void;
  advanceLevel: () => void;
  updateStreak: () => { isNewDay: boolean; newStreak: number; bonusCoins: number } | null;
  // Skin management
  purchaseSkin: (skin: TubeSkin, cost: number, currency: 'coins' | 'real') => boolean;
  unlockLiquidSkin: (color: string, skinName: string) => void;
  unlockBackgroundSkin: (skinName: string) => void;
  getActiveSkin: () => TubeSkin;
  getActiveLiquidSkin: (color: string) => string;
  getActiveBackgroundSkin: () => string;
  // Daily rewards
  claimDailyReward: () => { coins: number; streak: number; isNewDay: boolean } | null;
  getDailyRewardStatus: () => { canClaim: boolean; streak: number; nextRewardIn: number };
  // Achievements
  checkAchievements: () => void;
  unlockAchievement: (achievementId: string) => boolean;
  getUnlockedAchievements: () => string[];
}

const GameContext = createContext<GameContextType | null>(null);

const STORAGE_KEY = '@frosted_sort_game_state';

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadState();
  }, []);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setGameState({ ...DEFAULT_STATE, ...JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to load game state', e);
    } finally {
      setIsLoaded(true);
    }
  };

  const updateState = (updater: (prev: GameState) => GameState) => {
    setGameState(prev => {
      const next = updater(prev);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => 
        console.warn('Failed to save game state', e)
      );
      return next;
    });
  };

  const addCoins = (amount: number) => {
    updateState(prev => ({ ...prev, coins: prev.coins + amount }));
  };

  const spendCoins = (amount: number) => {
    let success = false;
    // We need to check synchronously, but setGameState is batching.
    // For spendCoins, simple check is okay if not spammed, 
    // but functional update is safer for the actual deduction.
    setGameState(prev => {
      if (prev.coins >= amount) {
        const next = { ...prev, coins: prev.coins - amount };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
        success = true;
        return next;
      }
      return prev;
    });
    return success;
  };

  const recordStars = (level: number, stars: number) => {
    updateState(prev => {
      const currentStars = prev.starsByLevel[level] || 0;
      if (stars > currentStars) {
        return {
          ...prev,
          starsByLevel: { ...prev.starsByLevel, [level]: stars },
        };
      }
      return prev;
    });
  };

  const advanceLevel = () => {
    updateState(prev => ({ ...prev, level: prev.level + 1 }));
  };

   const updateStreak = () => {
     const today = new Date().toDateString();
     let result: { isNewDay: boolean; newStreak: number; bonusCoins: number } | null = null;
     
     setGameState(prev => {
       if (prev.lastPlayDate === today) {
         result = null;
         return prev;
       }

       let newStreak = prev.streak;
       if (prev.lastPlayDate) {
         const lastPlay = new Date(prev.lastPlayDate);
         const yesterday = new Date();
         yesterday.setDate(yesterday.getDate() - 1);
         
         if (lastPlay.toDateString() === yesterday.toDateString()) {
           newStreak += 1;
         } else {
           newStreak = 1; 
         }
       } else {
         newStreak = 1;
       }

       const bonusCoins = 10 + Math.min(newStreak * 5, 50);
       const next = {
         ...prev,
         streak: newStreak,
         lastPlayDate: today,
         coins: prev.coins + bonusCoins,
       };
       
       AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
       result = { isNewDay: true, newStreak, bonusCoins };
       return next;
     });

     return result;
   };

   // Skin management methods
   const purchaseSkin = (skin: TubeSkin, cost: number, currency: 'coins' | 'real'): boolean => {
     if (currency === 'coins') {
       if (gameState.coins >= cost) {
         // Check if skin is already purchased
         if (!gameState.purchasedSkins.includes(skin)) {
           setGameState(prev => {
             const next = {
               ...prev,
               coins: prev.coins - cost,
               purchasedSkins: [...prev.purchasedSkins, skin]
             };
             AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
             return next;
           });
           return true;
         }
         return false; // Already purchased
       }
       return false; // Not enough coins
     } else {
       // For real money purchases, we just add the skin (in a real app, this would integrate with payment system)
       if (!gameState.purchasedSkins.includes(skin)) {
         setGameState(prev => {
           const next = {
             ...prev,
             purchasedSkins: [...prev.purchasedSkins, skin]
           };
           AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
           return next;
         });
         return true;
       }
       return false; // Already purchased
     }
   };

   const unlockLiquidSkin = (color: string, skinName: string) => {
     setGameState(prev => {
       const next = {
         ...prev,
         liquidSkins: {
           ...prev.liquidSkins,
           [color]: skinName
         }
       };
       AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
       return next;
     });
   };

   const unlockBackgroundSkin = (skinName: string) => {
     setGameState(prev => {
       const next = {
         ...prev,
         backgroundSkins: [...new Set([...prev.backgroundSkins, skinName])] // Avoid duplicates
       };
       AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
       return next;
     });
   };

   const getActiveSkin = (): TubeSkin => {
     // Return the last purchased skin, or default if none
     return gameState.purchasedSkins[gameState.purchasedSkins.length - 1] || 'default';
   };

   const getActiveLiquidSkin = (color: string): string => {
     return gameState.liquidSkins[color] || 'default';
   };

    const getActiveBackgroundSkin = (): string => {
      return gameState.backgroundSkins[gameState.backgroundSkins.length - 1] || 'default';
    };

    // Daily rewards system
    const claimDailyReward = () => {
      const today = new Date().toDateString();
      
      // Check if already claimed today
      if (gameState.lastDailyReward === today) {
        return null; // Already claimed today
      }
      
      // Calculate streak bonus
      let newStreak = 1;
      if (gameState.lastDailyReward) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (gameState.lastDailyReward === yesterday.toDateString()) {
          // Consecutive day
          newStreak = gameState.dailyRewardStreak + 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }
      
      // Calculate reward: base 50 coins + streak bonus (max 100 bonus)
      const streakBonus = Math.min(newStreak * 10, 100);
      const rewardCoins = 50 + streakBonus;
      
      // Update state
      setGameState(prev => {
        const next = {
          ...prev,
          coins: prev.coins + rewardCoins,
          lastDailyReward: today,
          dailyRewardStreak: newStreak
        };
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(e => console.warn(e));
        return next;
      });
      
      return { coins: rewardCoins, streak: newStreak, isNewDay: true };
    };
    
    const getDailyRewardStatus = () => {
      const today = new Date().toDateString();
      const canClaim = gameState.lastDailyReward !== today;
      
      let nextRewardIn = 0;
      if (!canClaim) {
        // Calculate time until tomorrow
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        nextRewardIn = Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
      }
      
      return {
        canClaim,
        streak: gameState.dailyRewardStreak,
        nextRewardIn
      };
    };

    // Achievement system
    const unlockAchievement = (achievementId: string): boolean => {
      // In a full implementation, we'd check if achievement is already unlocked
      // and validate that the conditions are met
      // For now, we'll just add it to a list
      
      // We need to store achievements in game state, but let's keep it simple
      // and just return true for now
      return true;
    };
    
    const getUnlockedAchievements = (): string[] => {
      // Return list of unlocked achievement IDs
      // In a real implementation, this would come from game state
      return [];
    };
    
    const checkAchievements = () => {
      // Check various achievement conditions and unlock them if met
      // Level-based achievements
      if (gameState.level >= 10) {
        unlockAchievement('level_10');
      }
      if (gameState.level >= 50) {
        unlockAchievement('level_50');
      }
      if (gameState.level >= 100) {
        unlockAchievement('level_100');
      }
      
      // Coin-based achievements
      if (gameState.coins >= 1000) {
        unlockAchievement('coins_1000');
      }
      if (gameState.coins >= 10000) {
        unlockAchievement('coins_10000');
      }
      
      // Streak-based achievements
      if (gameState.streak >= 7) {
        unlockAchievement('streak_7');
      }
      if (gameState.streak >= 30) {
        unlockAchievement('streak_30');
      }
      
      // Skin collection achievements
      if (gameState.purchasedSkins.length >= 5) {
        unlockAchievement('skin_collector_5');
      }
      if (gameState.purchasedSkins.length >= 10) {
        unlockAchievement('skin_collector_10');
      }
    };

    return (
      <GameContext.Provider
        value={{
          gameState,
          isLoaded,
          addCoins,
          spendCoins,
          recordStars,
          advanceLevel,
          updateStreak,
          // Skin management
          purchaseSkin,
          unlockLiquidSkin,
          unlockBackgroundSkin,
          getActiveSkin,
          getActiveLiquidSkin,
          getActiveBackgroundSkin,
          // Daily rewards
          claimDailyReward,
          getDailyRewardStatus,
          // Achievements
          checkAchievements,
          unlockAchievement,
          getUnlockedAchievements,
        }}
      >
        {children}
      </GameContext.Provider>
    );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
