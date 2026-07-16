import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ConsultationCard } from '@/components/ui/ConsultationCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { colors, radius, spacing } from '@/lib/theme';

const STATUS_TABS = [
  { key: '',         label: 'Toutes' },
  { key: 'PENDING',  label: 'En attente' },
  { key: 'ACTIVE',   label: 'Actives' },
  { key: 'CLOSED',   label: 'Terminées' },
];

export default function VetConsultationsScreen() {
  const [activeTab, setActiveTab] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vet-consultations-list', activeTab],
    queryFn: async () => {
      const params = activeTab ? `?status=${activeTab}&limit=50` : '?limit=50';
      const res = await api.get(`/consultations${params}`);
      if (!res.success) return [];
      const raw = res.data;
      return raw?.consultations ?? raw ?? [];
    },
  });

  const consultations: any[] = data ?? [];

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#011C12', '#022C22', '#047857']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>File de consultations</Text>
              <Text style={styles.headerSub}>
                {consultations.length} dossier{consultations.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {STATUS_TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  onPress={() => setActiveTab(tab.key)}
                  style={[styles.tab, active && styles.tabActive]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
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
        {isLoading ? (
          <ActivityIndicator color={colors.brand[600]} size="large" style={{ marginTop: 60 }} />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon="medical-outline"
            title="Aucun dossier"
            subtitle="Les consultations qui vous sont assignées apparaîtront ici."
          />
        ) : (
          consultations.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              viewAs="VET"
              onPress={() => router.push(`/(vet)/consultations/${c.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {},
  headerInner: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  tabsContent: { paddingHorizontal: spacing[5], gap: spacing[2], paddingBottom: spacing[3] },
  tab: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  tabActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: colors.brand[800] },
  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  list: { flex: 1 },
  listContent: { padding: spacing[5], paddingTop: spacing[3] },
});
