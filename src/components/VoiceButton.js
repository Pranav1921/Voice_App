import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Vibration,
} from 'react-native';

/**
 * VoiceButton Component
 * Glowing Cyberpunk Neon Floating Microphone Trigger with Active Radar Rings.
 */
export const VoiceButton = ({
  isRecording = false,
  onPress,
  disabled = false,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ripple1 = useRef(new Animated.Value(1)).current;
  const ripple1Opacity = useRef(new Animated.Value(0.7)).current;
  const ripple2 = useRef(new Animated.Value(1)).current;
  const ripple2Opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    let pulseLoop = null;
    let rippleLoop = null;

    if (isRecording) {
      // Fast high-energy pulse
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Multi-layer radar ripple waves
      ripple1.setValue(1);
      ripple1Opacity.setValue(0.7);
      ripple2.setValue(1);
      ripple2Opacity.setValue(0.5);

      rippleLoop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ripple1, { toValue: 1.5, duration: 800, useNativeDriver: true }),
            Animated.timing(ripple1, { toValue: 1.0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple1Opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
            Animated.timing(ripple1Opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2, { toValue: 1.8, duration: 1100, useNativeDriver: true }),
            Animated.timing(ripple2, { toValue: 1.0, duration: 0, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(ripple2Opacity, { toValue: 0, duration: 1100, useNativeDriver: true }),
            Animated.timing(ripple2Opacity, { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      rippleLoop.start();
    } else {
      pulseAnim.setValue(1);
      ripple1.setValue(1);
      ripple1Opacity.setValue(0);
      ripple2.setValue(1);
      ripple2Opacity.setValue(0);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
      if (rippleLoop) rippleLoop.stop();
    };
  }, [isRecording, pulseAnim, ripple1, ripple1Opacity, ripple2, ripple2Opacity]);

  const handlePress = () => {
    try {
      Vibration.vibrate(isRecording ? 80 : 40);
    } catch (e) {}
    if (onPress) onPress();
  };

  return (
    <View style={styles.wrapper}>
      {/* Outer Radar Waves when Recording */}
      {isRecording && (
        <>
          <Animated.View
            style={[
              styles.radarRipple,
              {
                transform: [{ scale: ripple2 }],
                opacity: ripple2Opacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.radarRipple,
              {
                transform: [{ scale: ripple1 }],
                opacity: ripple1Opacity,
              },
            ]}
          />
        </>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={isRecording ? 'Listening. Tap to finish.' : 'Tap to speak'}
      >
        <Animated.View
          style={[
            styles.button,
            isRecording ? styles.recordingButton : styles.idleButton,
            disabled && styles.disabledButton,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={[styles.iconCircle, isRecording ? styles.iconCircleRecording : styles.iconCircleIdle]}>
            <Text style={styles.icon}>{isRecording ? '⏹️' : '🎙️'}</Text>
          </View>
          <View style={styles.labelContainer}>
            <Text style={[styles.label, isRecording ? styles.labelRecording : styles.labelIdle]}>
              {isRecording ? 'STOP & PROCESS' : 'TAP TO SPEAK'}
            </Text>
            <Text style={styles.subLabel}>
              {isRecording ? 'Listening to your voice...' : 'Speak commands or questions'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  radarRipple: {
    position: 'absolute',
    width: 250,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 40,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    minWidth: 260,
    borderWidth: 1.5,
  },
  idleButton: {
    backgroundColor: '#0B132B',
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
  },
  recordingButton: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  disabledButton: {
    backgroundColor: '#1E293B',
    borderColor: '#475569',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleIdle: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  iconCircleRecording: {
    backgroundColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  icon: {
    fontSize: 20,
  },
  labelContainer: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  labelIdle: {
    color: '#38BDF8',
  },
  labelRecording: {
    color: '#F87171',
  },
  subLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
});

export default VoiceButton;
