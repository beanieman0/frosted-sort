import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface GameState {
  level: number;
  coins: number;
  streak: number;
  lastPlayDate: string | null;
  starsByLevel: Record<number, number>;
}

const DEFAULT_STATE: GameState = {
  level: 1,
  coins: 0,
  streak: 0,
  lastPlayDate: null,
  starsByLevel: {},
};

interface GameContextType {
  gameState: GameState;
  isLoaded: boolean;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  recordStars: (level: number, stars: number) => void;
  advanceLevel: () => void;
  updateStreak: () => { isNewDay: boolean; newStreak: number; bonusCoins: number } | null;
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
