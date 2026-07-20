import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, spacing, statusConfig, typeConfig } from '@/lib/theme';

interface Consultation {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  type: 'CHAT' | 'VOICE' | 'VIDEO' | 'EMERGENCY';
  paymentStatus?: 'UNPAID' | 'PAID' | 'FAILED';
  fee?: number | string | null;
  symptomsDescription?: string;
  createdAt: string;
  vet?: { user?: { fullName?: string } };
  farmer?: { user?: { fullName?: string } };
  _count?: { messages?: number };
}

interface Props {
  consultation: Consultation;
  viewAs: 'FARMER' | 'VET';
  onPress: () => void;
}

export function ConsultationCard({ consultation, viewAs, onPress }: Props) {
  const cfg    = statusConfig[consultation.status] ?? statusConfig.PENDING;
  const tcfg   = typeConfig[consultation.type]    ?? typeConfig.CHAT;

  const counterpart =
    viewAs === 'FARMER'
      ? (consultation.vet?.user?.fullName ?? 'Vétérinaire non assigné')
      : (consultation.farmer?.user?.fullName ?? 'Éleveur');

  const preview = consultation.symptomsDescription?.slice(0, 70) ?? 'Aucune description';
  const date    = new Date(consultation.createdAt).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short',
  });

  const isActive   = consultation.status === 'ACTIVE';
  const isPending  = consultation.status === 'PENDING';
  const isUnpaid   = consultation.paymentStatus === 'UNPAID' || consultation.paymentStatus == null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[styles.card, shadow.sm, isActive && styles.cardActive]}
    >
      {/* Active left border */}
      {isActive && <View style={styles.activeBorder} />}

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          {/* Type icon */}
          <View style={[styles.typeIcon, { backgroundColor: tcfg.color + '18' }]}>
            <Ionicons name={tcfg.icon as any} size={16} color={tcfg.color} />
          </View>

          <View style={styles.mid}>
            <Text style={styles.name} numberOfLines={1}>{counterpart}</Text>
            <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
          </View>

          <View style={styles.right}>
            <Text style={styles.date}>{date}</Text>
            {(consultation._count?.messages ?? 0) > 0 && (
              <View style={styles.msgBadge}>
                <Text style={styles.msgCount}>
                  {consultation._count!.messages}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          {isUnpaid && viewAs === 'FARMER' ? (
            <View style={styles.payPill}>
              <Ionicons name="lock-closed" size={10} color="#92400E" />
              <Text style={styles.payPillText}>Paiement requis</Text>
            </View>
          ) : (
            <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
              <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
              <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={14} color={colors.neutral[300]} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: colors.brand[200],
  },
  activeBorder: {
    width: 4,
    backgroundColor: colors.brand[600],
  },
  content: {
    flex: 1,
    padding: spacing[4],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  typeIcon: {
    width: 36, height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  mid: { flex: 1 },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  preview: {
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 17,
  },
  right: { alignItems: 'flex-end', gap: 4 },
  date: {
    fontSize: 11,
    color: colors.neutral[400],
    fontWeight: '500',
  },
  msgBadge: {
    backgroundColor: colors.brand[600],
    borderRadius: 8,
    minWidth: 18, height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  msgCount: { fontSize: 10, fontWeight: '700', color: '#fff' },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  payPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    backgroundColor: '#FEF3C7',
  },
  payPillText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
});
