import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, shadow, spacing } from '@/lib/theme';

interface Props {
  emoji: string;
  value: string | number;
  label: string;
  accent: string;
  accentLight: string;
}

export function StatCard({ emoji, value, label, accent, accentLight }: Props) {
  return (
    <View style={[styles.card, shadow.sm]}>
      <View style={[styles.iconWrap, { backgroundColor: accentLight }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.value, { color: accent }]}>
        {value ?? '—'}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    minWidth: 90,
  },
  iconWrap: {
    width: 44, height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emoji: { fontSize: 22 },
  value: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.neutral[500],
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
