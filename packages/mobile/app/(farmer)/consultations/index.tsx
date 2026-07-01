import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { ConsultationCard } from '@/components/ui/ConsultationCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const STATUS_TABS = [
  { key: '',         label: 'Toutes' },
  { key: 'PENDING',  label: 'En attente' },
  { key: 'ACTIVE',   label: 'Actives' },
  { key: 'CLOSED',   label: 'Terminées' },
];

export default function FarmerConsultationsScreen() {
  const [activeTab, setActiveTab] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['farmer-consultations-list', activeTab],
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
      {/* Header */}
      <LinearGradient
        colors={['#011C12', '#022C22', '#047857']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Consultations</Text>
              <Text style={styles.headerSub}>
                {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={() => {}}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Status tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabsScroll}
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

      {/* List */}
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
          <ActivityIndicator
            color={colors.brand[600]}
            size="large"
            style={{ marginTop: 60 }}
          />
        ) : consultations.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="Aucune consultation"
            subtitle="Commencez par consulter un vétérinaire pour vos animaux."
            actionLabel="Nouvelle consultation"
            onAction={() => {}}
          />
        ) : (
          consultations.map((c) => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              viewAs="FARMER"
              onPress={() => router.push(`/(farmer)/consultations/${c.id}` as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[100] },

  header: { paddingBottom: 0 },
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  newBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabsScroll: { marginBottom: 0 },
  tabsContent: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    paddingBottom: spacing[3],
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: colors.brand[800] },

  wave: { height: 20, backgroundColor: colors.sand[100], borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  list: { flex: 1 },
  listContent: { padding: spacing[5], paddingTop: spacing[3] },
});
