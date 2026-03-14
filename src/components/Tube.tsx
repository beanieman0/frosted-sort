import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

interface TubeProps {
  colors: string[];
  isSelected: boolean;
  visibleCount?: number;
  onPress: () => void;
  isRevealed?: boolean;
  // Theme-aware colors passed from parent
  accentColor?: string;
  glassColor?: string;
  borderColor?: string;
  frostedTint?: 'light' | 'dark';
}

export function Tube({
  colors,
  isSelected,
  visibleCount = 2,
  isRevealed = false,
  onPress,
  accentColor = '#4ECDC4',
  glassColor = 'rgba(255,255,255,0.06)',
  borderColor = 'rgba(255,255,255,0.3)',
  frostedTint = 'dark',
}: TubeProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isSelected ? -20 : 0,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const [localColors, setLocalColors] = useState<Array<string | undefined>>([
    colors[0], colors[1], colors[2], colors[3]
  ]);
  const localColorsRef = useRef(localColors);

  const fillAnims = useRef([
    new Animated.Value(colors[0] ? 1 : 0),
    new Animated.Value(colors[1] ? 1 : 0),
    new Animated.Value(colors[2] ? 1 : 0),
    new Animated.Value(colors[3] ? 1 : 0),
  ]).current;

  useEffect(() => {
    const isLevelRestart = Math.abs(colors.filter(c => c).length - localColorsRef.current.filter(c => c).length) > 1;

    [0, 1, 2, 3].forEach(i => {
      const newColor = colors[i];
      const oldColor = localColorsRef.current[i];

      if (isLevelRestart || (newColor && oldColor && newColor !== oldColor)) {
        // Instant update without animation when level changes drastically
        const newLocal = [...localColorsRef.current];
        newLocal[i] = newColor;
        localColorsRef.current = newLocal;
        setLocalColors(newLocal);
        fillAnims[i].setValue(newColor ? 1 : 0);
      } else if (newColor && !oldColor) {
        // Pouring IN
        const newLocal = [...localColorsRef.current];
        newLocal[i] = newColor;
        localColorsRef.current = newLocal;
        setLocalColors(newLocal);
        Animated.timing(fillAnims[i], {
          toValue: 1,
          duration: 300,
          useNativeDriver: false
        }).start();
      } else if (!newColor && oldColor) {
        // Pouring OUT
        Animated.timing(fillAnims[i], {
          toValue: 0,
          duration: 300,
          useNativeDriver: false
        }).start(() => {
          if (!colors[i]) {
            const newLocal = [...localColorsRef.current];
            newLocal[i] = undefined;
            localColorsRef.current = newLocal;
            setLocalColors(newLocal);
          }
        });
      }
    });
  }, [colors, fillAnims]);

  const totalSlots = 4;
  const hiddenCount = Math.max(0, totalSlots - visibleCount);
  const frostedHeightPercent = (hiddenCount / totalSlots) * 100;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.tubeContainer, { transform: [{ translateY }] }]}>
        <View
          style={[
            styles.glassOutline,
            { backgroundColor: glassColor, borderColor: isSelected ? accentColor : borderColor },
            isSelected && { shadowColor: accentColor },
          ]}
        >
          <View style={styles.liquidContainer}>
            {[0, 1, 2, 3].map((index) => {
              const displayColor = localColors[index];
              const isObscured = !isRevealed && index < hiddenCount && displayColor != null;
              const finalColor = isObscured ? 'rgba(0,0,0,0.15)' : displayColor;
              
              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.liquidLayer,
                    { 
                      backgroundColor: finalColor || 'transparent',
                      height: fillAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '25%']
                      })
                    },
                    index === 0 && { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
                  ]}
                />
              );
            })}
          </View>
        </View>

        {frostedHeightPercent > 0 && (
          <View style={[styles.frostedWrapper, { height: `${frostedHeightPercent}%` }]}>
            <BlurView intensity={100} tint={frostedTint} style={StyleSheet.absoluteFill} />
            <View style={styles.frostedHighlight} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tubeContainer: {
    width: 58,
    height: 180,
    marginHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glassOutline: {
    width: '100%',
    height: '100%',
    borderWidth: 2.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 6,
  },
  liquidContainer: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  liquidLayer: {
    width: '100%',
  },
  frostedWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    overflow: 'hidden',
  },
  frostedHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
