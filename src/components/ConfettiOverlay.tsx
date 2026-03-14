import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Dimensions } from 'react-native';

interface ConfettiOverlayProps {
  visible: boolean;
  colors?: string[];
}

const { width, height } = Dimensions.get('window');
const NUM_PARTICLES = 40;

const DEFAULT_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8C42', '#9D4EDD', '#F7FFF7'];

export function ConfettiOverlay({ visible, colors = DEFAULT_COLORS }: ConfettiOverlayProps) {
  const particles = useRef(
    Array.from({ length: NUM_PARTICLES }).map(() => ({
      x: new Animated.Value(width / 2),
      y: new Animated.Value(height / 2),
      spin: new Animated.Value(0),
      scale: new Animated.Value(0),
      opacity: new Animated.Value(1),
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 8,
      destX: (Math.random() - 0.5) * width * 1.5,
      destY: -height * 0.2 - Math.random() * height * 0.6,
      spinSpeed: (Math.random() - 0.5) * 4,
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // Setup initial state
      particles.forEach((p) => {
        p.x.setValue(width / 2);
        p.y.setValue(height * 0.6); // Start slightly below center
        p.scale.setValue(0);
        p.opacity.setValue(1);
        p.spin.setValue(0);
      });

      // Launch animations
      const anims = particles.map((p) => {
        return Animated.parallel([
          Animated.spring(p.x, {
            toValue: width / 2 + p.destX,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(p.y, {
            toValue: p.destY,
            duration: 1500 + Math.random() * 1000,
            useNativeDriver: true,
          }),
          Animated.timing(p.scale, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(p.spin, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: 2000,
            delay: 500,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(anims).start();
    }
  }, [visible, particles, width, height]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const spin = p.spin.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spinSpeed * 360}deg`],
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { scale: p.scale },
                  { rotate: spin },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 2,
  },
});
