import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface TubeProps {
  colors: string[];
  isSelected: boolean;
  onPress: () => void;
}

export function Tube({ colors, isSelected, onPress }: TubeProps) {
  // Translate the tube up by 20 pixels if selected
  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: withSpring(isSelected ? -20 : 0) }],
    };
  });

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <Animated.View style={[styles.tubeContainer, animatedStyles]}>
        {/* The glass tube outline */}
        <View style={styles.glassOutline}>
          {/* We render slots for up to 4 layers. 
              flexDirection: 'column-reverse' means the first item is at the very bottom.
              This aligns perfectly with array push/pop. */}
          <View style={styles.liquidContainer}>
            {/* Create 4 empty slots to maintain height, fill with colors if they exist */}
            {[0, 1, 2, 3].map((index) => {
              const color = colors[index];
              return (
                <View 
                  key={index} 
                  style={[
                    styles.liquidLayer, 
                    { backgroundColor: color || 'transparent' },
                    // Round the bottom layer
                    index === 0 && { borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }
                  ]} 
                />
              );
            })}
          </View>
        </View>

        {/* The Frosted Glass Overlay on the bottom half */}
        <View style={styles.frostedWrapper}>
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          {/* Subtle frosted border */}
          <View style={styles.frostedHighlight} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tubeContainer: {
    width: 60,
    height: 180,
    marginHorizontal: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glassOutline: {
    width: '100%',
    height: '100%',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderTopWidth: 0,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  liquidContainer: {
    flex: 1,
    flexDirection: 'column-reverse',
  },
  liquidLayer: {
    flex: 1, // each slot takes 1/4th height
    width: '100%',
  },
  frostedWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%', // Covres the bottom 2 layers exactly
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  frostedHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    backgroundColor: 'rgba(255,255,255,0.2)'
  }
});
