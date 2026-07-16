import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#EF4444', bg: '#FEE2E2', label: 'Haute priorité',    icon: 'alert-circle'        },
  MEDIUM: { color: '#F59E0B', bg: '#FEF3C7', label: 'Priorité moyenne',  icon: 'warning'             },
  LOW:    { color: '#10B981', bg: '#D1FAE5', label: 'Info',              icon: 'information-circle'  },
} as const;

type SuggestionItem = {
  id: string;
  title: string;
  description: string;
  priority: keyof typeof PRIORITY_CONFIG;
  category?: string;
  createdAt?: string;
};

/** Flatten DB suggestion records into individual display items */
function flattenSuggestions(records: any[]): SuggestionItem[] {
  const items: SuggestionItem[] = [];

  for (const record of records) {
    // `parsed` is set by the backend: JSON.parse(record.suggestion)
    let parsed: any[] = record.parsed ?? [];

    // Fallback: try to parse `suggestion` string directly
    if (parsed.length === 0 && typeof record.suggestion === 'string') {
      try { parsed = JSON.parse(record.suggestion); } catch {}
    }

    if (!Array.isArray(parsed)) continue;

    parsed.forEach((p, idx) => {
      if (!p?.title) return;
      items.push({
        id:          `${record.id}-${idx}`,
        title:       p.title,
        description: p.content ?? p.description ?? '',
        priority:    ((p.priority ?? 'low').toUpperCase()) as keyof typeof PRIORITY_CONFIG,
        category:    p.category,
        createdAt:   record.generatedAt ?? record.createdAt,
      });
    });
  }

  return items;
}

export default function AISuggestionsScreen() {
  const qc = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ai-suggestions'],
    queryFn: async () => {
      const res = await api.get('/ai/suggestions');
      if (!res.success) return [];
      const raw = res.data;
      // API returns an array of suggestion records (each with .parsed)
      if (Array.isArray(raw)) return flattenSuggestions(raw);
      // Or maybe wrapped
      if (Array.isArray(raw?.suggestions)) return flattenSuggestions(raw.suggestions);
      return [];
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const res = await api.post('/ai/suggestions/generate', {});
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ai-suggestions'] });
    },
  });

  const suggestions = (data ?? []) as SuggestionItem[];
  const isGenerating = generate.isPending;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#011C12', '#022C22', '#047857', '#059669']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Suggestions IA</Text>
              <Text style={styles.headerSub}>Recommandations personnalisées pour votre ferme</Text>
            </View>
            <TouchableOpacity
              style={styles.generateBtn}
              onPress={() => generate.mutate()}
              disabled={isGenerating}
              activeOpacity={0.8}
            >
              {isGenerating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ fontSize: 18 }}>✨</Text>
              }
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="sparkles" size={16} color={colors.brand[700]} />
        <Text style={styles.infoText}>
          Ces suggestions sont générées par l'IA à partir des données de votre ferme. Appuyez sur ✨ pour actualiser.
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
            tintColor={colors.brand[700]}
            colors={[colors.brand[700]]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.brand[700]} size="large" style={{ marginTop: 60 }} />
        ) : suggestions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>🤖</Text>
            <Text style={styles.emptyTitle}>Aucune suggestion pour le moment</Text>
            <Text style={styles.emptySub}>
              L'IA génère des conseils personnalisés à partir de vos données d'élevage.
            </Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => generate.mutate()}
              disabled={isGenerating}
            >
              {isGenerating
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.emptyBtnText}>Générer mes premiers conseils</Text>
              }
            </TouchableOpacity>
          </View>
        ) : (
          suggestions.map((s) => {
            const pcfg = PRIORITY_CONFIG[s.priority] ?? PRIORITY_CONFIG.LOW;

            return (
              <View key={s.id} style={[styles.card, shadow.sm]}>
                {/* Priority stripe */}
                <View style={[styles.stripe, { backgroundColor: pcfg.color }]} />

                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
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
                      <Text style={styles.suggTitle}>{s.title}</Text>
                    </View>
                  </View>

                  <Text style={styles.suggBody}>{s.description}</Text>

                  {s.createdAt && (
                    <Text style={styles.suggDate}>
                      {new Date(s.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long',
                      })}
                    </Text>
                  )}
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
  root: { flex: 1, backgroundColor: '#FFFFFF' },

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
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3, maxWidth: 240 },
  generateBtn: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    margin: spacing[4],
    marginTop: 0,
    backgroundColor: colors.brand[50],
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  infoText: { flex: 1, fontSize: 12, color: colors.brand[800], lineHeight: 18 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4] },

  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[800], marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, color: colors.neutral[500], textAlign: 'center', maxWidth: 280, lineHeight: 19, marginBottom: spacing[5] },
  emptyBtn: {
    backgroundColor: colors.brand[700],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    marginBottom: spacing[4],
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.neutral[100],
    overflow: 'hidden',
  },
  stripe:   { width: 4 },
  cardBody: { flex: 1, padding: spacing[4] },
  cardTop:  { flexDirection: 'row', gap: spacing[3], marginBottom: spacing[3], alignItems: 'flex-start' },
  catIcon: {
    width: 44, height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  priorityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.full },
  priorityTagText: { fontSize: 10, fontWeight: '700' },
  catTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
    backgroundColor: colors.neutral[100],
  },
  catTagText: { fontSize: 10, fontWeight: '600', color: colors.neutral[600] },

  suggTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral[900], lineHeight: 20 },
  suggBody:  { fontSize: 13, color: colors.neutral[600], lineHeight: 20, marginBottom: spacing[2] },
  suggDate:  { fontSize: 11, color: colors.neutral[400] },
});
