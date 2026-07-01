import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  PENDING:    { label: 'En attente', bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  IN_PROGRESS:{ label: 'En cours',   bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  COMPLETED:  { label: 'Terminée',   bg: '#D1FAE5', text: '#065F46', dot: '#10B981' },
  CANCELLED:  { label: 'Annulée',    bg: '#FEE2E2', text: '#991B1B', dot: '#EF4444' },
};

export default function VetLabScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['lab-requests-vet'],
    queryFn: async () => {
      const res = await api.get('/lab-requests?limit=50');
      if (!res.success) return [];
      const d = res.data;
      return d?.requests ?? d?.labRequests ?? d ?? [];
    },
  });

  const labRequests: any[] = data ?? [];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A0533', '#2D0A5C', '#4A1080', '#6B21A8']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Demandes de labo</Text>
              <Text style={styles.headerSub}>
                {labRequests.length} demande{labRequests.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.headerIcon}>
              <Ionicons name="flask" size={24} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#6B21A8"
            colors={['#6B21A8']}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#6B21A8" size="large" style={{ marginTop: 60 }} />
        ) : labRequests.length === 0 ? (
          <EmptyState
            icon="flask-outline"
            title="Aucune demande de labo"
            subtitle="Les analyses demandées par vos patients apparaîtront ici."
          />
        ) : (
          labRequests.map((req: any, i: number) => {
            const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.PENDING;
            return (
              <TouchableOpacity
                key={req.id ?? i}
                style={[styles.card, shadow.sm]}
                activeOpacity={0.82}
              >
                <View style={styles.cardLeft}>
                  <View style={styles.flaskIcon}>
                    <Ionicons name="flask" size={18} color="#6B21A8" />
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={styles.testType} numberOfLines={1}>
                      {req.testType ?? req.type ?? 'Analyse'}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: cfg.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: cfg.dot }]} />
                      <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
                    </View>
                  </View>

                  <Text style={styles.farmerName}>
                    {req.consultation?.farmer?.user?.fullName ?? req.farmer?.fullName ?? 'Éleveur'}
                  </Text>

                  {req.notes && (
                    <Text style={styles.notes} numberOfLines={2}>{req.notes}</Text>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.date}>
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: 'short',
                          })
                        : ''}
                    </Text>
                    {req.status === 'PENDING' && (
                      <TouchableOpacity style={styles.startBtn}>
                        <Text style={styles.startBtnText}>Traiter</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[100] },
  header: {},
  headerInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[5],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  headerIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  wave: { height: 20, backgroundColor: colors.sand[100], borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5] },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    marginBottom: spacing[4],
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  cardLeft: {
    width: 56, alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: spacing[4], backgroundColor: '#F5F3FF',
  },
  flaskIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDE9FE',
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { flex: 1, padding: spacing[4] },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 6,
  },
  testType: { fontSize: 14, fontWeight: '700', color: colors.neutral[900], flex: 1, marginRight: 8 },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full,
  },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusText: { fontSize: 10, fontWeight: '700' },

  farmerName: { fontSize: 12, fontWeight: '600', color: colors.neutral[600], marginBottom: 4 },
  notes: { fontSize: 12, color: colors.neutral[500], lineHeight: 17, marginBottom: 10 },

  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  date: { fontSize: 11, color: colors.neutral[400] },
  startBtn: {
    backgroundColor: '#EDE9FE', borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#DDD6FE',
  },
  startBtnText: { fontSize: 11, fontWeight: '700', color: '#6B21A8' },
});
