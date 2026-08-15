import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, TouchableOpacity, Text } from 'react-native';

/**
 * AssistantOrb Component
 * Premium Futuristic Glowing Siri / Google Assistant Holographic Orb.
 * States: 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING'
 */
export const AssistantOrb = ({ state = 'IDLE', onPress, disabled = false }) => {
  const scaleAnim1 = useRef(new Animated.Value(1)).current;
  const scaleAnim2 = useRef(new Animated.Value(1)).current;
  const scaleAnim3 = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animLoop = null;

    if (state === 'LISTENING') {
      // Energetic expanding sound waves
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim1, {
              toValue: 1.35,
              duration: 500,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim1, {
              toValue: 1,
              duration: 500,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim2, {
              toValue: 1.6,
              duration: 700,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim2, {
              toValue: 1,
              duration: 700,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else if (state === 'THINKING') {
      // Fast neon spin and breathing pulse
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim1, {
              toValue: 1.18,
              duration: 350,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim1, {
              toValue: 0.92,
              duration: 350,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else if (state === 'SPEAKING') {
      // Audio frequency wave pulse
      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim1, {
            toValue: 1.25,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim1, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim1, {
            toValue: 1.2,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim1, {
            toValue: 1.0,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    } else {
      // IDLE: Calm breathing floating aura
      animLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim1, {
              toValue: 1.08,
              duration: 1800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim1, {
              toValue: 1.0,
              duration: 1800,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(scaleAnim2, {
              toValue: 1.15,
              duration: 2200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim2, {
              toValue: 1.0,
              duration: 2200,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animLoop.start();
    }

    return () => {
      if (animLoop) animLoop.stop();
    };
  }, [state, scaleAnim1, scaleAnim2, scaleAnim3, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getOrbTheme = () => {
    switch (state) {
      case 'LISTENING':
        return {
          coreBg: '#EF4444',
          shadowColor: '#EF4444',
          ring1: 'rgba(239, 68, 68, 0.4)',
          ring2: 'rgba(244, 63, 94, 0.2)',
          icon: '🎙️',
          glow: '#F87171',
        };
      case 'THINKING':
        return {
          coreBg: '#8B5CF6',
          shadowColor: '#8B5CF6',
          ring1: 'rgba(139, 92, 246, 0.4)',
          ring2: 'rgba(99, 102, 241, 0.2)',
          icon: '⚡',
          glow: '#A78BFA',
        };
      case 'SPEAKING':
        return {
          coreBg: '#10B981',
          shadowColor: '#10B981',
          ring1: 'rgba(16, 185, 129, 0.4)',
          ring2: 'rgba(6, 182, 212, 0.2)',
          icon: '🔊',
          glow: '#34D399',
        };
      default:
        return {
          coreBg: '#3B82F6',
          shadowColor: '#60A5FA',
          ring1: 'rgba(59, 130, 246, 0.35)',
          ring2: 'rgba(99, 102, 241, 0.18)',
          icon: '✨',
          glow: '#93C5FD',
        };
    }
  };

  const theme = getOrbTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
      style={styles.container}
    >
      {/* Outer Holographic Glow Ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            backgroundColor: theme.ring2,
            borderColor: theme.glow,
            transform: [{ scale: state === 'LISTENING' ? scaleAnim2 : scaleAnim1 }],
          },
        ]}
      />

      {/* Middle Rotating Aura Ring */}
      <Animated.View
        style={[
          styles.middleRing,
          {
            backgroundColor: theme.ring1,
            transform: [{ scale: scaleAnim1 }, { rotate: spin }],
          },
        ]}
      />

      {/* Core Glowing Orb */}
      <Animated.View
        style={[
          styles.coreOrb,
          {
            backgroundColor: theme.coreBg,
            shadowColor: theme.shadowColor,
            transform: [{ scale: scaleAnim1 }],
          },
        ]}
      >
        <Text style={styles.icon}>{theme.icon}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  outerRing: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 1,
  },
  middleRing: {
    position: 'absolute',
    width: 115,
    height: 115,
    borderRadius: 57.5,
  },
  coreOrb: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 18,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  icon: {
    fontSize: 28,
  },
});

export default AssistantOrb;
