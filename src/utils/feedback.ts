import { Vibration, Platform } from 'react-native';

export function hapticTap() {
  if (Platform.OS !== 'web') Vibration.vibrate([0, 30]);
}

export function hapticPour() {
  if (Platform.OS !== 'web') Vibration.vibrate([0, 20, 10, 20]);
}

export function hapticWin() {
  if (Platform.OS !== 'web') Vibration.vibrate([0, 80, 60, 80, 60, 120]);
}

export function hapticError() {
  if (Platform.OS !== 'web') Vibration.vibrate([0, 50, 30, 50]);
}
