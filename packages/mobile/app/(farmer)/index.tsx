import React, { useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { GradientHeader } from '@/components/ui/GradientHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ConsultationCard } from '@/components/ui/ConsultationCard';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing, radius, shadow } from '@/lib/theme';

const FALLBACK_TIP = {
  title: 'Conseil du jour',
  text: 'Vérifiez quotidiennement la température corporelle de vos animaux. Une fièvre peut être le signe d\'une infection débutante.',
};

const GREET = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Bon après-midi';
  return 'Bonsoir';
};

const DATE_LABEL = () =>
  new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

export default function FarmerDashboard() {
  const { user } = useAuth();

  const fadeAnims  = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(30))).current;

  useEffect(() => {
    const anims = fadeAnims.map((fade, i) =>
      Animated.parallel([
        Animated.timing(fade,         { toValue: 1, duration: 500, delay: i * 100, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 500, delay: i * 100, useNativeDriver: true }),
      ]),
    );
    Animated.stagger(80, anims).start();
  }, []);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['farmer-stats'],
    queryFn: async () => {
      const now = new Date();
      const [monthRes, recentRes] = await Promise.all([
        api.get(`/farm-records/stats/${now.getFullYear()}/${now.getMonth() + 1}`),
        api.get('/farm-records?limit=1'),
      ]);
      const monthly = monthRes.success ? monthRes.data : null;
      const recent  = recentRes.success ? (recentRes.data?.records?.[0] ?? recentRes.data?.[0]) : null;
      return {
        animalCount: monthly?.avgAnimalCount || recent?.animalCount || 0,
      };
    },
  });

  const { data: aiTip, refetch: refetchAi } = useQuery({
    queryKey: ['conseil-du-jour'],
    queryFn: async () => {
      const res = await api.get('/ai/suggestions/latest');
      if (!res.success || !res.data) return null;
      const record = res.data;
      let parsed: any[] = record.parsed ?? [];
      if (parsed.length === 0 && typeof record.suggestion === 'string') {
        try { parsed = JSON.parse(record.suggestion); } catch {}
      }
      const first = Array.isArray(parsed) ? parsed.find((p: any) => p?.title) : null;
      if (!first) return null;
      return { title: first.title, text: first.content ?? first.description ?? '' };
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: consultData, isLoading: consultLoading, refetch: refetchConsult } = useQuery({
    queryKey: ['farmer-consultations'],
    queryFn: async () => {
      const res = await api.get('/consultations?limit=5');
      if (!res.success) return { consultations: [], total: 0 };
      const raw = res.data;
      return {
        consultations: raw?.consultations ?? raw ?? [],
        total: raw?.total ?? 0,
      };
    },
  });

  const activeCount = (consultData?.consultations ?? []).filter(
    (c: any) => c.status === 'ACTIVE',
  ).length;

  const tip = aiTip ?? FALLBACK_TIP;
  const isRefreshing = statsLoading || consultLoading;
  const firstName = user?.fullName?.split(' ')[0] ?? 'Éleveur';

  return (
    <View style={styles.root}>
      <GradientHeader
        greeting={GREET()}
        name={firstName}
        subtitle={DATE_LABEL()}
        notificationCount={activeCount}
        onNotificationPress={() => router.push('/(farmer)/consultations')}
      >
        <View style={styles.headerChips}>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{statsData?.animalCount ?? '—'}</Text>
            <Text style={styles.chipLabel}>🐄 Animaux</Text>
          </View>
          <View style={styles.chipDivider} />
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{activeCount}</Text>
            <Text style={styles.chipLabel}>💬 Actives</Text>
          </View>
          <View style={styles.chipDivider} />
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{consultData?.total ?? '—'}</Text>
            <Text style={styles.chipLabel}>📋 Total</Text>
          </View>
        </View>
      </GradientHeader>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { refetchStats(); refetchConsult(); refetchAi(); }}
            tintColor={colors.brand[600]}
            colors={[colors.brand[600]]}
          />
        }
      >
        {/* Conseil du jour — promoted to top */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] },
          ]}
        >
          <TouchableOpacity
            style={styles.tipCard}
            activeOpacity={0.85}
            onPress={() => router.push('/(farmer)/ai')}
          >
            <View style={styles.tipIcon}>
              <Text style={{ fontSize: 22 }}>✨</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.tipHeader}>
                <Text style={styles.tipTitle}>Conseil du jour</Text>
                {aiTip && (
                  <View style={styles.aiPill}>
                    <Text style={styles.aiPillText}>IA</Text>
                  </View>
                )}
              </View>
              <Text style={styles.tipText} numberOfLines={3}>{tip.text}</Text>
              <Text style={styles.tipSeeMore}>Voir tous les conseils →</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick actions — Lab + Community + Find Vet */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
          ]}
        >
          <SectionTitle title="Accès rapides" />
          <View style={styles.quickRow}>
            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#F0FDF4', borderColor: colors.brand[200] }]}
              onPress={() => router.push('/(farmer)/lab-order')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: colors.brand[100] }]}>
                <Text style={{ fontSize: 22 }}>🧪</Text>
              </View>
              <Text style={[styles.quickLabel, { color: colors.brand[800] }]}>Commander{'\n'}un Labo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
              onPress={() => router.push('/(farmer)/community')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text style={{ fontSize: 22 }}>👥</Text>
              </View>
              <Text style={[styles.quickLabel, { color: '#1E40AF' }]}>Communauté{'\n'}d'éleveurs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickBtn, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}
              onPress={() => router.push('/(farmer)/find-vet')}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIcon, { backgroundColor: '#FFEDD5' }]}>
                <Text style={{ fontSize: 22 }}>🩺</Text>
              </View>
              <Text style={[styles.quickLabel, { color: '#9A3412' }]}>Trouver{'\n'}un vétérinaire</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stat cards */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] },
          ]}
        >
          <SectionTitle title="Aperçu de l'exploitation" />
          <View style={styles.statsRow}>
            <StatCard
              emoji="🐄"
              value={statsData?.animalCount ?? '—'}
              label="Têtes de bétail"
              accent={colors.brand[700]}
              accentLight={colors.brand[100]}
            />
            <StatCard
              emoji="💬"
              value={activeCount}
              label="Consultations actives"
              accent={colors.brand[600]}
              accentLight={colors.brand[100]}
            />
            <StatCard
              emoji="🧪"
              value={0}
              label="Analyses en cours"
              accent={colors.brand[500]}
              accentLight={colors.brand[50]}
            />
          </View>
        </Animated.View>

        {/* Recent consultations */}
        <Animated.View
          style={[
            styles.section,
            styles.lastSection,
            { opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] },
          ]}
        >
          <View style={styles.sectionHeader}>
            <SectionTitle title="Consultations récentes" />
            <TouchableOpacity onPress={() => router.push('/(farmer)/consultations')}>
              <Text style={styles.seeAll}>Voir tout →</Text>
            </TouchableOpacity>
          </View>

          {consultLoading ? (
            <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 20 }} />
          ) : (consultData?.consultations ?? []).length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Aucune consultation</Text>
              <Text style={styles.emptySub}>Démarrez votre première consultation avec un vétérinaire</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(farmer)/consultations')}
              >
                <Text style={styles.emptyBtnText}>Commencer maintenant</Text>
              </TouchableOpacity>
            </View>
          ) : (
            (consultData!.consultations as any[]).slice(0, 4).map((c) => (
              <ConsultationCard
                key={c.id}
                consultation={c}
                viewAs="FARMER"
                onPress={() => {
                  const unpaid = (c as any).paymentStatus === 'UNPAID' || (c as any).paymentStatus == null;
                  if (unpaid) {
                    router.push(`/(farmer)/consultations/pay/${c.id}` as any);
                  } else {
                    router.push(`/(farmer)/consultations/${c.id}` as any);
                  }
                }}
              />
            ))
          )}
        </Animated.View>
      </ScrollView>

      {/* Floating AI chatbot button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.88}
        onPress={() => router.push('/(farmer)/ai-chat')}
      >
        <View style={styles.fabInner}>
          <Text style={{ fontSize: 22 }}>✨</Text>
        </View>
        <View style={styles.fabLabel}>
          <Text style={styles.fabLabelText}>IA Chat</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },

  headerChips: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    marginTop: spacing[4],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },
  chip: { flex: 1, alignItems: 'center', gap: 2 },
  chipValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  chipLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  chipDivider: {
    width: 1, height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
  },

  section: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
  },
  lastSection: { paddingBottom: spacing[8] },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: spacing[4],
    letterSpacing: -0.2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.brand[700],
  },

  quickRow: { flexDirection: 'row', gap: spacing[3] },
  quickBtn: {
    flex: 1,
    borderRadius: radius['2xl'],
    borderWidth: 1.5,
    padding: spacing[3],
    alignItems: 'center',
    gap: 8,
  },
  quickIcon: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11, fontWeight: '700',
    textAlign: 'center', lineHeight: 15,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    borderStyle: 'dashed',
  },
  emptyIcon:    { fontSize: 36, marginBottom: spacing[3] },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: colors.neutral[800], marginBottom: 6 },
  emptySub:     { fontSize: 13, color: colors.neutral[500], textAlign: 'center', lineHeight: 19, marginBottom: spacing[4] },
  emptyBtn: {
    backgroundColor: colors.brand[700],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  tipCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.brand[100],
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  tipIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.brand[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  tipTitle: { fontSize: 13, fontWeight: '700', color: colors.brand[800] },
  aiPill: {
    backgroundColor: colors.brand[600], borderRadius: radius.full,
    paddingHorizontal: 6, paddingVertical: 1,
  },
  aiPillText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  tipText:     { fontSize: 12, color: colors.neutral[700], lineHeight: 18 },
  tipSeeMore:  { fontSize: 11, fontWeight: '600', color: colors.brand[700], marginTop: 6 },

  // Floating AI button
  fab: {
    position: 'absolute',
    bottom: 76,
    right: 18,
    alignItems: 'center',
    ...shadow.hero,
  },
  fabInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand[700],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.brand[500],
  },
  fabLabel: {
    marginTop: 4,
    backgroundColor: colors.brand[800],
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fabLabelText: { fontSize: 10, fontWeight: '700', color: '#fff' },
});
