import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';

export function TutorialArrow() {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -15, duration: 500, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ])
    ).start();
  }, [bounceAnim]);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: bounceAnim }] }]}>
      <Text style={styles.arrowText}>👇</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -40,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    textShadowColor: 'rgba(255,230,109,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  arrowText: {
    fontSize: 32,
  },
});
