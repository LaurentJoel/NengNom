import React, { useRef } from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { radius, shadow, spacing } from '@/lib/theme';

interface Props {
  icon: string;
  label: string;
  colors: readonly [string, string];
  onPress: () => void;
}

export function QuickAction({ icon, label, colors: gradColors, onPress }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 150 }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 150 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
        style={styles.wrap}
      >
        <LinearGradient
          colors={gradColors}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={icon as any} size={26} color="rgba(255,255,255,0.95)" />
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    ...shadow.md,
    margin: spacing[2],
  },
  card: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: spacing[4],
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
