import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, Easing } from 'react-native';

interface SplashScreenProps {
  onDone: () => void;
}

export function SplashScreen({ onDone }: SplashScreenProps) {
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const iconFloat = useRef(new Animated.Value(0)).current;
  
  // Create 3 dot animations
  const dotOpacities = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();

    // Floating icon animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconFloat, {
          toValue: -10,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(iconFloat, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Loading dots pulse
    const createDotAnim = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400, delay, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );
    };

    createDotAnim(dotOpacities[0], 0).start();
    createDotAnim(dotOpacities[1], 150).start();
    createDotAnim(dotOpacities[2], 300).start();

    // Auto advance
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={styles.container}>
      <Animated.Text 
        style={[styles.icon, { transform: [{ translateY: iconFloat }] }]}
      >
        🧊
      </Animated.Text>
      
      <Animated.Text 
        style={[styles.wordmark, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
      >
        FROSTED SORT
      </Animated.Text>
      
      <View style={styles.dotsRow}>
        {dotOpacities.map((op, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: op }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: '900',
    color: '#4ECDC4',
    letterSpacing: 3,
    textShadowColor: 'rgba(78, 205, 196, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ECDC4',
  },
});
