import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ConsultationCard } from '@/components/ui/ConsultationCard';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, radius, spacing } from '@/lib/theme';

const GREET = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

export default function VetDashboard() {
  const { user } = useAuth();

  const fadeAnims  = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2].map(() => new Animated.Value(24))).current;

  useEffect(() => {
    Animated.stagger(
      100,
      fadeAnims.map((f, i) =>
        Animated.parallel([
          Animated.timing(f, { toValue: 1, duration: 450, delay: i * 80, useNativeDriver: true }),
          Animated.timing(slideAnims[i], { toValue: 0, duration: 450, delay: i * 80, useNativeDriver: true }),
        ]),
      ),
    ).start();
  }, []);

  const { data: consultData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vet-consultations'],
    queryFn: async () => {
      const res = await api.get('/consultations?limit=20');
      if (!res.success) return { consultations: [], total: 0 };
      const raw = res.data;
      return {
        consultations: raw?.consultations ?? raw ?? [],
        total: raw?.total ?? 0,
      };
    },
  });

  const consultations: any[] = consultData?.consultations ?? [];
  const pending  = consultations.filter((c) => c.status === 'PENDING').length;
  const active   = consultations.filter((c) => c.status === 'ACTIVE').length;
  const closed   = consultations.filter((c) => c.status === 'CLOSED').length;

  const displayName = user?.fullName?.replace(/^Dr\.\s*/i, '').split(' ')[0] ?? 'Docteur';

  return (
    <View style={styles.root}>
      {/* Vet header - deep teal/blue-green */}
      <LinearGradient
        colors={['#011C12', '#022C22', '#047857', '#059669']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decoration */}
        <View style={styles.decCircle1} />
        <View style={styles.decCircle2} />

        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View style={{ flex: 1 }}>
              <View style={styles.stethRow}>
                <Ionicons name="medical" size={14} color="rgba(255,255,255,0.6)" />
                <Text style={styles.vetLabel}>VÉTÉRINAIRE</Text>
              </View>
              <Text style={styles.greeting}>{GREET()}, Dr. {displayName} 👋</Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.bellBtn}>
                <Ionicons name="notifications-outline" size={21} color="rgba(255,255,255,0.9)" />
                {pending > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{pending}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Priority alert if pending */}
          {pending > 0 && (
            <TouchableOpacity
              style={styles.alertBanner}
              onPress={() => router.push('/(vet)/consultations')}
              activeOpacity={0.85}
            >
              <View style={styles.alertDot} />
              <Text style={styles.alertText}>
                {pending} cas en attente de votre prise en charge
              </Text>
              <Ionicons name="chevron-forward" size={14} color="#FFF" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand[600]}
            colors={[colors.brand[600]]}
          />
        }
      >
        {/* Stats */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] },
          ]}
        >
          <Text style={styles.sectionTitle}>Tableau de bord clinique</Text>
          <View style={styles.statsRow}>
            <StatCard
              emoji="⏳"
              value={pending}
              label="En attente"
              accent="#F59E0B"
              accentLight="#FEF3C7"
            />
            <StatCard
              emoji="💬"
              value={active}
              label="Actives"
              accent="#10B981"
              accentLight="#D1FAE5"
            />
            <StatCard
              emoji="✅"
              value={closed}
              label="Terminées"
              accent="#6B7280"
              accentLight="#F3F4F6"
            />
          </View>
        </Animated.View>

        {/* Pending cases — priority queue */}
        {pending > 0 && (
          <Animated.View
            style={[
              styles.section,
              { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
            ]}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.urgentTitleRow}>
                <View style={styles.urgentDot} />
                <Text style={styles.sectionTitle}>Cas urgents</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(vet)/consultations')}>
                <Text style={styles.seeAll}>Voir tout →</Text>
              </TouchableOpacity>
            </View>

            {consultations
              .filter((c) => c.status === 'PENDING')
              .slice(0, 3)
              .map((c) => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  viewAs="VET"
                  onPress={() => router.push(`/(vet)/consultations/${c.id}` as any)}
                />
              ))}
          </Animated.View>
        )}

        {/* Active consultations */}
        <Animated.View
          style={[
            styles.section,
            styles.lastSection,
            { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consultations actives</Text>
            <TouchableOpacity onPress={() => router.push('/(vet)/consultations')}>
              <Text style={styles.seeAll}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 20 }} />
          ) : consultations.filter((c) => c.status === 'ACTIVE').length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>🩺</Text>
              <Text style={styles.emptyTitle}>Aucune consultation active</Text>
              <Text style={styles.emptySub}>
                Les nouvelles consultations apparaîtront ici.
              </Text>
            </View>
          ) : (
            consultations
              .filter((c) => c.status === 'ACTIVE')
              .slice(0, 5)
              .map((c) => (
                <ConsultationCard
                  key={c.id}
                  consultation={c}
                  viewAs="VET"
                  onPress={() => router.push(`/(vet)/consultations/${c.id}` as any)}
                />
              ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: { overflow: 'hidden' },
  decCircle1: {
    position: 'absolute', width: 250, height: 250,
    borderRadius: 125, top: -80, right: -60,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  decCircle2: {
    position: 'absolute', width: 150, height: 150,
    borderRadius: 75, bottom: 20, left: -30,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  stethRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  vetLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 1.5 },
  greeting: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.3 },
  date: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  bellBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 8, minWidth: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: '#011C12',
  },
  notifBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: spacing[5],
    marginBottom: spacing[4],
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  alertDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  alertText: { flex: 1, fontSize: 12, fontWeight: '600', color: '#fff' },

  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  scroll: { flex: 1 },
  section: { paddingHorizontal: spacing[5], paddingTop: spacing[5] },
  lastSection: { paddingBottom: spacing[8] },
  sectionTitle: {
    fontSize: 17, fontWeight: '700', color: colors.neutral[900],
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing[4],
  },
  urgentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urgentDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.brand[700] },

  statsRow: { flexDirection: 'row', gap: spacing[3], marginTop: spacing[3], marginBottom: spacing[2] },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.neutral[700], marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.neutral[400], textAlign: 'center' },
});
