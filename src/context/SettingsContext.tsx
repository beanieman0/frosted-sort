import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';
export type TubeSkin = 'default' | 'neon' | 'icy' | 'golden' | 'pastel' | 'crystal' | 'lava' | 'ocean' | 'forest' | 'space';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceBorder: string;
  title: string;
  subtitle: string;
  accent: string;
  tubeGlass: string;
  tubeBorder: string;
  buttonBg: string;
  buttonText: string;
  modalOverlay: string;
  frostedTint: 'light' | 'dark';
}

const DARK_COLORS: ThemeColors = {
  background: '#1a1a2e',
  surface: '#16213e',
  surfaceBorder: '#4ECDC4',
  title: '#E8F4FD',
  subtitle: '#6b7db3',
  accent: '#4ECDC4',
  tubeGlass: 'rgba(255,255,255,0.06)',
  tubeBorder: 'rgba(255,255,255,0.3)',
  buttonBg: '#4ECDC4',
  buttonText: '#1a1a2e',
  modalOverlay: 'rgba(0,0,0,0.75)',
  frostedTint: 'dark',
};

const LIGHT_COLORS: ThemeColors = {
  background: '#F3F4F6', 
  surface: '#FFFFFF',
  surfaceBorder: '#A8DADC',
  title: '#2D3561',
  subtitle: '#7986AD',
  accent: '#A8DADC',
  tubeGlass: 'rgba(168,218,220,0.08)',
  tubeBorder: 'rgba(45,53,97,0.18)',
  buttonBg: '#457B9D',
  buttonText: '#FFFFFF',
  modalOverlay: 'rgba(45,53,97,0.5)',
  frostedTint: 'light',
};

// Skin overrides map
const SKIN_OVERRIDES: Record<TubeSkin, Partial<ThemeColors>> = {
  default: {},
  neon: { tubeGlass: 'rgba(255,0,255,0.06)', tubeBorder: '#ff00ff', frostedTint: 'dark' },
  icy: { tubeGlass: 'rgba(200,240,255,0.2)', tubeBorder: '#c8f0ff', frostedTint: 'light' },
  golden: { tubeGlass: 'rgba(255,215,0,0.1)', tubeBorder: '#ffd700', frostedTint: 'dark' },
  pastel: { tubeGlass: 'rgba(255,228,225,0.2)', tubeBorder: '#ffb6c1', frostedTint: 'light' },
  crystal: { tubeGlass: 'rgba(200,255,255,0.1)', tubeBorder: '#c8ffff', frostedTint: 'light' },
  lava: { tubeGlass: 'rgba(255,100,0,0.1)', tubeBorder: '#ff6400', frostedTint: 'dark' },
  ocean: { tubeGlass: 'rgba(0,100,255,0.1)', tubeBorder: '#0064ff', frostedTint: 'light' },
  forest: { tubeGlass: 'rgba(0,150,0,0.1)', tubeBorder: '#009600', frostedTint: 'dark' },
  space: { tubeGlass: 'rgba(50,0,100,0.1)', tubeBorder: '#320064', frostedTint: 'light' },
};

export interface Settings {
  theme: Theme;
  soundVolume: number;    
  vibrationOn: boolean;
  skin: TubeSkin;
  timedModeEnabled: boolean;
}

interface SettingsContextType {
  settings: Settings;
  colors: ThemeColors;
  setTheme: (t: Theme) => void;
  setSoundVolume: (v: number) => void;
  setVibration: (on: boolean) => void;
  setSkin: (skin: TubeSkin) => void;
  setTimedModeEnabled: (on: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    soundVolume: 0.6,
    vibrationOn: true,
    skin: 'default',
    timedModeEnabled: false,
  });

  const baseColors = settings.theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  
  // Apply skin overrides
  const skinOverrides = SKIN_OVERRIDES[settings.skin];
  const colors = { ...baseColors, ...skinOverrides };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        colors,
        setTheme: (theme) => setSettings(s => ({ ...s, theme })),
        setSoundVolume: (soundVolume) => setSettings(s => ({ ...s, soundVolume })),
        setVibration: (vibrationOn) => setSettings(s => ({ ...s, vibrationOn })),
        setSkin: (skin) => setSettings(s => ({ ...s, skin })),
        setTimedModeEnabled: (timedModeEnabled) => setSettings(s => ({ ...s, timedModeEnabled })),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
