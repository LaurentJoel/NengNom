import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#EF4444', bg: '#FEE2E2', label: 'Haute priorité', icon: 'alert-circle' },
  MEDIUM: { color: '#F59E0B', bg: '#FEF3C7', label: 'Priorité moyenne', icon: 'warning' },
  LOW:    { color: '#10B981', bg: '#D1FAE5', label: 'Info', icon: 'information-circle' },
} as const;

export default function AISuggestionsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const res = await api.get('/ai/suggestions');
      if (!res.success) return [];
      const d = res.data;
      return d?.suggestions ?? d ?? [];
    },
  });

  const suggestions: any[] = data ?? [];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#2E1065', '#4C1D95', '#6D28D9', '#7C3AED']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Suggestions IA</Text>
              <Text style={styles.headerSub}>Recommandations personnalisées pour votre ferme</Text>
            </View>
            <View style={styles.aiBadge}>
              <Text style={{ fontSize: 20 }}>✨</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="sparkles" size={16} color="#7C3AED" />
        <Text style={styles.infoText}>
          Ces suggestions sont générées par notre IA agricole à partir des données de votre ferme.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#7C3AED"
            colors={['#7C3AED']}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color="#7C3AED" size="large" style={{ marginTop: 60 }} />
        ) : suggestions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
            <Text style={styles.emptyTitle}>Aucune suggestion pour le moment</Text>
            <Text style={styles.emptySub}>
              L'IA analyse vos données. Revenez dans quelques instants.
            </Text>
          </View>
        ) : (
          suggestions.map((s: any, i: number) => {
            const priority = (s.priority ?? 'LOW') as keyof typeof PRIORITY_CONFIG;
            const pcfg     = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.LOW;

            return (
              <View key={s.id ?? i} style={[styles.card, shadow.sm]}>
                {/* Priority stripe */}
                <View style={[styles.stripe, { backgroundColor: pcfg.color }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    {/* Category icon */}
                    <View style={[styles.catIcon, { backgroundColor: pcfg.bg }]}>
                      <Ionicons name={pcfg.icon as any} size={20} color={pcfg.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={styles.tagRow}>
                        <View style={[styles.priorityTag, { backgroundColor: pcfg.bg }]}>
                          <Text style={[styles.priorityTagText, { color: pcfg.color }]}>
                            {pcfg.label}
                          </Text>
                        </View>
                        {s.category && (
                          <View style={styles.catTag}>
                            <Text style={styles.catTagText}>{s.category}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.suggTitle} numberOfLines={2}>
                        {s.title ?? s.suggestion?.slice(0, 60) ?? 'Suggestion'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.suggBody}>
                    {s.description ?? s.suggestion ?? ''}
                  </Text>

                  {s.actionable && (
                    <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85}>
                      <Text style={styles.actionBtnText}>Appliquer cette recommandation</Text>
                      <Ionicons name="arrow-forward" size={14} color="#7C3AED" />
                    </TouchableOpacity>
                  )}

                  <Text style={styles.suggDate}>
                    {s.createdAt
                      ? new Date(s.createdAt).toLocaleDateString('fr-FR')
                      : ''}
                  </Text>
                </View>
              </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, maxWidth: 220 },
  aiBadge: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wave: { height: 20, backgroundColor: colors.sand[100], borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: spacing[4],
    marginTop: 0,
    backgroundColor: '#F5F3FF',
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  infoText: { flex: 1, fontSize: 12, color: '#4C1D95', lineHeight: 18 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4] },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[800], marginBottom: 8 },
  emptySub: { fontSize: 13, color: colors.neutral[500], textAlign: 'center', maxWidth: 260, lineHeight: 19 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    marginBottom: spacing[4],
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: spacing[4] },
  cardTop: { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[3], alignItems: 'flex-start' },
  catIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  priorityTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  priorityTagText: { fontSize: 10, fontWeight: '700' },
  catTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  catTagText: { fontSize: 10, fontWeight: '600', color: colors.neutral[600] },

  suggTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral[900] },
  suggBody:  { fontSize: 13, color: colors.neutral[600], lineHeight: 20, marginBottom: spacing[3] },
  suggDate:  { fontSize: 11, color: colors.neutral[400] },

  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.lg,
    backgroundColor: '#F5F3FF',
    alignSelf: 'flex-start',
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700', color: '#7C3AED' },
});
