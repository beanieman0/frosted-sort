import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

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
  background: '#F0F4FF',       // soft lavender-white
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

export interface Settings {
  theme: Theme;
  soundVolume: number;    // 0–1
  vibrationOn: boolean;
}

interface SettingsContextType {
  settings: Settings;
  colors: ThemeColors;
  setTheme: (t: Theme) => void;
  setSoundVolume: (v: number) => void;
  setVibration: (on: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    soundVolume: 0.6,
    vibrationOn: true,
  });

  const colors = settings.theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  return (
    <SettingsContext.Provider
      value={{
        settings,
        colors,
        setTheme: (theme) => setSettings(s => ({ ...s, theme })),
        setSoundVolume: (soundVolume) => setSettings(s => ({ ...s, soundVolume })),
        setVibration: (vibrationOn) => setSettings(s => ({ ...s, vibrationOn })),
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
