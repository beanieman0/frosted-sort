import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Switch, Platform
} from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { settings, colors, setTheme, setSoundVolume, setVibration } = useSettings();
  const isLight = settings.theme === 'light';

  // Simple step-based volume buttons (sliders don't work well on all platforms without extra libs)
  const volumeSteps = [0, 0.25, 0.5, 0.75, 1.0];
  const currentStep = volumeSteps.reduce((prev, curr) =>
    Math.abs(curr - settings.soundVolume) < Math.abs(prev - settings.soundVolume) ? curr : prev
  );

  const volumeDown = () => {
    const idx = volumeSteps.indexOf(currentStep);
    if (idx > 0) setSoundVolume(volumeSteps[idx - 1]);
  };
  const volumeUp = () => {
    const idx = volumeSteps.indexOf(currentStep);
    if (idx < volumeSteps.length - 1) setSoundVolume(volumeSteps[idx + 1]);
  };

  const s = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: colors.modalOverlay,
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 36,
      borderTopWidth: 1,
      borderColor: colors.surfaceBorder,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: colors.subtitle,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 20,
      opacity: 0.4,
    },
    heading: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.title,
      marginBottom: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 22,
    },
    labelGroup: {
      flex: 1,
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.title,
    },
    sublabel: {
      fontSize: 12,
      color: colors.subtitle,
      marginTop: 2,
    },
    themeToggle: {
      flexDirection: 'row',
      backgroundColor: isLight ? '#E8EEF9' : '#0f3460',
      borderRadius: 20,
      padding: 3,
    },
    themeBtn: (active: boolean) => ({
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 17,
      backgroundColor: active ? colors.buttonBg : 'transparent',
    }),
    themeBtnText: (active: boolean) => ({
      fontSize: 13,
      fontWeight: '700',
      color: active ? colors.buttonText : colors.subtitle,
    }),
    volumeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    volBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: isLight ? '#E8EEF9' : '#0f3460',
      justifyContent: 'center',
      alignItems: 'center',
    },
    volBtnText: {
      fontSize: 20,
      color: colors.title,
      lineHeight: 24,
    },
    volBars: {
      flexDirection: 'row',
      gap: 4,
      alignItems: 'flex-end',
    },
    volBar: (filled: boolean, index: number) => ({
      width: 8,
      height: 6 + index * 4,
      backgroundColor: filled ? colors.accent : (isLight ? '#D5DCF0' : '#0f3460'),
      borderRadius: 2,
    }),
    closeBtn: {
      marginTop: 8,
      alignItems: 'center',
      padding: 14,
      backgroundColor: isLight ? '#E8EEF9' : '#0f3460',
      borderRadius: 16,
    },
    closeBtnText: {
      color: colors.title,
      fontWeight: '700',
      fontSize: 15,
    },
  });

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.heading}>⚙️ Settings</Text>

          {/* Theme Toggle */}
          <View style={s.row}>
            <View style={s.labelGroup}>
              <Text style={s.label}>Theme</Text>
              <Text style={s.sublabel}>Choose your preferred look</Text>
            </View>
            <View style={s.themeToggle}>
              <TouchableOpacity
                style={s.themeBtn(!isLight)}
                onPress={() => setTheme('dark')}
              >
                <Text style={s.themeBtnText(!isLight)}>🌙 Dark</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.themeBtn(isLight)}
                onPress={() => setTheme('light')}
              >
                <Text style={s.themeBtnText(isLight)}>☀️ Light</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sound Volume */}
          <View style={s.row}>
            <View style={s.labelGroup}>
              <Text style={s.label}>Sound Volume</Text>
              <Text style={s.sublabel}>Pour & win sounds</Text>
            </View>
            <View style={s.volumeRow}>
              <TouchableOpacity style={s.volBtn} onPress={volumeDown}>
                <Text style={s.volBtnText}>−</Text>
              </TouchableOpacity>
              {/* Visual bars like a phone volume widget */}
              <View style={s.volBars}>
                {volumeSteps.slice(1).map((step, i) => (
                  <View key={i} style={s.volBar(settings.soundVolume >= step, i)} />
                ))}
              </View>
              <TouchableOpacity style={s.volBtn} onPress={volumeUp}>
                <Text style={s.volBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vibration */}
          <View style={s.row}>
            <View style={s.labelGroup}>
              <Text style={s.label}>Vibration</Text>
              <Text style={s.sublabel}>Haptic feedback on moves</Text>
            </View>
            <Switch
              value={settings.vibrationOn}
              onValueChange={setVibration}
              trackColor={{ false: isLight ? '#D5DCF0' : '#0f3460', true: colors.accent }}
              thumbColor={settings.vibrationOn ? colors.buttonBg : '#aaa'}
            />
          </View>

          <TouchableOpacity style={s.closeBtn} onPress={onClose}>
            <Text style={s.closeBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
