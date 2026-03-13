import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Switch,
} from 'react-native';
import { useSettings } from '../context/SettingsContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const { settings, colors, setTheme, setSoundVolume, setVibration } = useSettings();
  const isLight = settings.theme === 'light';

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

  // Dynamic colors that depend on theme — used as inline styles, NOT in StyleSheet.create()
  const bgColor = isLight ? '#E8EEF9' : '#0f3460';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={[styles.handle, { backgroundColor: colors.subtitle }]} />
          <Text style={[styles.heading, { color: colors.title }]}>⚙️ Settings</Text>

          {/* Theme Toggle */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: colors.title }]}>Theme</Text>
              <Text style={[styles.sublabel, { color: colors.subtitle }]}>Choose your preferred look</Text>
            </View>
            <View style={[styles.themeToggle, { backgroundColor: bgColor }]}>
              <TouchableOpacity
                style={[styles.themeBtn, !isLight && { backgroundColor: colors.buttonBg }]}
                onPress={() => setTheme('dark')}
              >
                <Text style={[styles.themeBtnText, { color: !isLight ? colors.buttonText : colors.subtitle }]}>
                  🌙 Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, isLight && { backgroundColor: colors.buttonBg }]}
                onPress={() => setTheme('light')}
              >
                <Text style={[styles.themeBtnText, { color: isLight ? colors.buttonText : colors.subtitle }]}>
                  ☀️ Light
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Sound Volume */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: colors.title }]}>Sound Volume</Text>
              <Text style={[styles.sublabel, { color: colors.subtitle }]}>Pour & win sounds</Text>
            </View>
            <View style={styles.volumeRow}>
              <TouchableOpacity style={[styles.volBtn, { backgroundColor: bgColor }]} onPress={volumeDown}>
                <Text style={[styles.volBtnText, { color: colors.title }]}>−</Text>
              </TouchableOpacity>
              <View style={styles.volBars}>
                {volumeSteps.slice(1).map((step, i) => (
                  <View
                    key={i}
                    style={[
                      styles.volBarBase,
                      { height: 6 + i * 4 },
                      { backgroundColor: settings.soundVolume >= step ? colors.accent : bgColor },
                    ]}
                  />
                ))}
              </View>
              <TouchableOpacity style={[styles.volBtn, { backgroundColor: bgColor }]} onPress={volumeUp}>
                <Text style={[styles.volBtnText, { color: colors.title }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Vibration */}
          <View style={styles.row}>
            <View style={styles.labelGroup}>
              <Text style={[styles.label, { color: colors.title }]}>Vibration</Text>
              <Text style={[styles.sublabel, { color: colors.subtitle }]}>Haptic feedback on moves</Text>
            </View>
            <Switch
              value={settings.vibrationOn}
              onValueChange={setVibration}
              trackColor={{ false: bgColor, true: colors.accent }}
              thumbColor={settings.vibrationOn ? colors.buttonBg : '#aaa'}
            />
          </View>

          <TouchableOpacity style={[styles.closeBtn, { backgroundColor: bgColor }]} onPress={onClose}>
            <Text style={[styles.closeBtnText, { color: colors.title }]}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Only static styles here — dynamic/theme-based values are applied as inline style arrays above
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 36,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
    opacity: 0.4,
  },
  heading: {
    fontSize: 20,
    fontWeight: '800',
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
  },
  sublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  themeToggle: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 3,
  },
  themeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 17,
  },
  themeBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  volBtnText: {
    fontSize: 20,
    lineHeight: 24,
  },
  volBars: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'flex-end',
  },
  volBarBase: {
    width: 8,
    borderRadius: 2,
  },
  closeBtn: {
    marginTop: 8,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  closeBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});
