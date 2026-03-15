import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

export interface TubeProps {
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
  // Skin-specific overrides
  skin?: 'default' | 'neon' | 'icy' | 'golden' | 'pastel' | 'crystal' | 'lava' | 'ocean' | 'forest' | 'space';
  // Liquid skin to apply to the liquid colors
  liquidSkin?: string;
  // Responsive sizing from parent
  tubeWidth?: number;
  tubeHeight?: number;
}

// Skin-specific overrides for tube appearance
const TUBE_SKIN_OVERRIDES: Record<NonNullable<TubeProps['skin']>, {
  glassColor?: string;
  borderColor?: string;
  frostedTint?: 'light' | 'dark';
}> = {
  default: {},
  neon: { glassColor: 'rgba(255,0,255,0.06)', borderColor: '#ff00ff' },
  icy: { glassColor: 'rgba(200,240,255,0.2)', borderColor: '#c8f0ff', frostedTint: 'light' },
  golden: { glassColor: 'rgba(255,215,0,0.1)', borderColor: '#ffd700' },
  pastel: { glassColor: 'rgba(255,228,225,0.2)', borderColor: '#ffb6c1', frostedTint: 'light' },
  crystal: { glassColor: 'rgba(200,255,255,0.1)', borderColor: '#c8ffff', frostedTint: 'light' },
  lava: { glassColor: 'rgba(255,100,0,0.1)', borderColor: '#ff6400' },
  ocean: { glassColor: 'rgba(0,100,255,0.1)', borderColor: '#0064ff', frostedTint: 'light' },
  forest: { glassColor: 'rgba(0,150,0,0.1)', borderColor: '#009600', frostedTint: 'dark' },
  space: { glassColor: 'rgba(50,0,100,0.1)', borderColor: '#320064', frostedTint: 'light' },
};

// Liquid skin mappings - maps skin names to color transformations
const LIQUID_SKINS: Record<string, (color: string) => string> = {
  standard: (color) => color, // No change
  glitter: (color) => color, // In a real implementation, this would add glitter effect
  metallic: (color) => color, // In a real implementation, this would add metallic effect
  neon: (color) => {
    // Make colors more vibrant/neon-like
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + 40);
    const g = Math.min(255, ((num >> 8) & 0xFF) + 40);
    const b = Math.min(255, (num & 0xFF) + 40);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },
  pastel: (color) => {
    // Make colors more pastel-like
    const num = parseInt(color.slice(1), 16);
    const r = Math.min(255, ((num >> 16) & 0xFF) + 80);
    const g = Math.min(255, ((num >> 8) & 0xFF) + 80);
    const b = Math.min(255, (num & 0xFF) + 80);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  },
  rainbow: (color) => {
    // Cycle through rainbow colors based on original color hue
    // For simplicity, we'll just return some predefined rainbow colors
    const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#8F00FF'];
    const num = parseInt(color.slice(1), 16);
    return rainbowColors[num % rainbowColors.length];
  }
};

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
  skin = 'default',
  liquidSkin = 'standard',
  tubeWidth,
  tubeHeight,
}: TubeProps) {
  // Apply skin overrides
  const skinOverrides = TUBE_SKIN_OVERRIDES[skin] || {};
  const finalGlassColor = skinOverrides.glassColor ?? glassColor;
  const finalBorderColor = skinOverrides.borderColor ?? borderColor;
  const finalFrostedTint = skinOverrides.frostedTint ?? frostedTint;
  
  // Apply liquid skin to colors
  const liquidTransform = LIQUID_SKINS[liquidSkin] ?? LIQUID_SKINS.standard;
  const finalColors = colors.map(color => liquidTransform(color));

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isSelected ? -20 : 0,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  const [localColors, setLocalColors] = useState<Array<string | undefined>>([
    finalColors[0], finalColors[1], finalColors[2], finalColors[3]
  ]);
  const localColorsRef = useRef(localColors);

  const fillAnims = useRef([
    new Animated.Value(finalColors[0] ? 1 : 0),
    new Animated.Value(finalColors[1] ? 1 : 0),
    new Animated.Value(finalColors[2] ? 1 : 0),
    new Animated.Value(finalColors[3] ? 1 : 0),
  ]).current;

  useEffect(() => {
    const isLevelRestart = Math.abs(finalColors.filter(c => c).length - localColorsRef.current.filter(c => c).length) > 1;

    [0, 1, 2, 3].forEach(i => {
      const newColor = finalColors[i];
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
          if (!finalColors[i]) {
            const newLocal = [...localColorsRef.current];
            newLocal[i] = undefined;
            localColorsRef.current = newLocal;
            setLocalColors(newLocal);
          }
        });
      }
    });
  }, [finalColors, fillAnims]);

  const totalSlots = 4;
  const hiddenCount = Math.max(0, totalSlots - visibleCount);
  const frostedHeightPercent = (hiddenCount / totalSlots) * 100;

  const sizeOverride = tubeWidth && tubeHeight
    ? { width: tubeWidth, height: tubeHeight }
    : {};

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.tubeContainer, sizeOverride, { transform: [{ translateY }] }]}>
        <View
          style={[
            styles.glassOutline,
            { backgroundColor: finalGlassColor, borderColor: isSelected ? accentColor : finalBorderColor },
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
            <BlurView intensity={100} tint={finalFrostedTint} style={StyleSheet.absoluteFill} />
            <View style={styles.frostedHighlight} />
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  tubeContainer: {
    width: 58,   // default; overridden by tubeWidth/tubeHeight props
    height: 180, // default; overridden by tubeWidth/tubeHeight props
    marginHorizontal: 0, // margin controlled by parent TubeGrid
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
