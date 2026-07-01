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
import { QuickAction } from '@/components/ui/QuickAction';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, spacing, radius, shadow } from '@/lib/theme';

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

  // Stagger animation
  const fadeAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const slideAnims = useRef([0, 1, 2, 3].map(() => new Animated.Value(30))).current;

  useEffect(() => {
    const anims = fadeAnims.map((fade, i) =>
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 500, delay: i * 100, useNativeDriver: true }),
        Animated.timing(slideAnims[i], { toValue: 0, duration: 500, delay: i * 100, useNativeDriver: true }),
      ]),
    );
    Animated.stagger(80, anims).start();
  }, []);

  // Data
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

  const isRefreshing = statsLoading || consultLoading;

  const onRefresh = () => {
    refetchStats();
    refetchConsult();
  };

  const firstName = user?.fullName?.split(' ')[0] ?? 'Éleveur';

  return (
    <View style={styles.root}>
      <GradientHeader
        greeting={GREET()}
        name={firstName}
        subtitle={DATE_LABEL()}
        notificationCount={activeCount}
      >
        {/* Inline stat chips inside header */}
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand[600]}
            colors={[colors.brand[600]]}
          />
        }
      >
        {/* Quick actions */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[0], transform: [{ translateY: slideAnims[0] }] },
          ]}
        >
          <SectionTitle title="Actions rapides" />
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="chatbubbles-outline"
              label="Consulter un vét."
              colors={['#022C22', '#047857']}
              onPress={() => router.push('/(farmer)/consultations')}
            />
            <QuickAction
              icon="sparkles-outline"
              label="Suggestions IA"
              colors={['#4C1D95', '#7C3AED']}
              onPress={() => router.push('/(farmer)/ai')}
            />
            <QuickAction
              icon="flask-outline"
              label="Résultats labo"
              colors={['#1D4ED8', '#3B82F6']}
              onPress={() => router.push('/(farmer)/consultations')}
            />
            <QuickAction
              icon="bar-chart-outline"
              label="Ma ferme"
              colors={['#B45309', '#D97706']}
              onPress={() => {}}
            />
          </View>
        </Animated.View>

        {/* Stat cards */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[1], transform: [{ translateY: slideAnims[1] }] },
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
              accent={colors.blue[600]}
              accentLight={colors.blue[100]}
            />
            <StatCard
              emoji="🧪"
              value={0}
              label="Analyses en cours"
              accent={colors.purple[600]}
              accentLight={colors.purple[100]}
            />
          </View>
        </Animated.View>

        {/* Recent consultations */}
        <Animated.View
          style={[
            styles.section,
            { opacity: fadeAnims[2], transform: [{ translateY: slideAnims[2] }] },
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
                onPress={() => router.push(`/(farmer)/consultations/${c.id}` as any)}
              />
            ))
          )}
        </Animated.View>

        {/* Health tip card */}
        <Animated.View
          style={[
            styles.section,
            styles.lastSection,
            { opacity: fadeAnims[3], transform: [{ translateY: slideAnims[3] }] },
          ]}
        >
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Text style={{ fontSize: 22 }}>💡</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tipTitle}>Conseil du jour</Text>
              <Text style={styles.tipText}>
                Vérifiez quotidiennement la température corporelle de vos animaux.
                Une fièvre peut être le signe d'une infection débutante.
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[100] },
  scroll: { flex: 1 },

  // Header chips
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

  // Sections
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

  // Quick actions grid
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing[2],
    marginBottom: spacing[2],
  },

  // Stat cards
  statsRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  // Empty state
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

  // Tip card
  tipCard: {
    backgroundColor: colors.amber[50],
    borderRadius: radius['2xl'],
    borderWidth: 1,
    borderColor: colors.amber[100],
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  tipIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.amber[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle:   { fontSize: 13, fontWeight: '700', color: colors.amber[600], marginBottom: 4 },
  tipText:    { fontSize: 12, color: colors.neutral[700], lineHeight: 18 },
});
