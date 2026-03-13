import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { BlurView } from 'expo-blur';

interface TubeProps {
  colors: string[];        // All colors in tube, index 0 = bottom
  isSelected: boolean;
  visibleCount?: number;   // How many layers from the top are visible (rest hidden by frost)
  onPress: () => void;
}

export function Tube({ colors, isSelected, visibleCount = 2, onPress }: TubeProps) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: isSelected ? -20 : 0,
      useNativeDriver: true,
    }).start();
  }, [isSelected]);

  // Calculate the frosted area height:
  // If tube has 4 layers and visibleCount=2, bottom 2 are hidden (50%)
  // If tube is fully revealed (visibleCount=4), frosted area = 0%
  const totalSlots = 4;
  const hiddenCount = Math.max(0, totalSlots - visibleCount);
  const frostedHeightPercent = (hiddenCount / totalSlots) * 100;

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.tubeContainer, { transform: [{ translateY }] }]}>
        {/* The glass tube */}
        <View style={[styles.glassOutline, isSelected && styles.selectedGlow]}>
          <View style={styles.liquidContainer}>
            {/* 4 fixed slots from bottom (index 0) to top (index 3) */}
            {[0, 1, 2, 3].map((index) => {
              const color = colors[index];
              return (
                <View
                  key={index}
                  style={[
                    styles.liquidLayer,
                    { backgroundColor: color || 'transparent' },
                    index === 0 && { borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* Frosted Glass Overlay — covers the hidden bottom portion */}
        {frostedHeightPercent > 0 && (
          <View style={[styles.frostedWrapper, { height: `${frostedHeightPercent}%` }]}>
            <BlurView intensity={90} tint="light" style={StyleSheet.absoluteFill} />
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
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopWidth: 0,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  selectedGlow: {
    borderColor: '#4ECDC4',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  liquidContainer: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  liquidLayer: {
    flex: 1,
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
    borderColor: 'rgba(255,255,255,0.7)',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
});
