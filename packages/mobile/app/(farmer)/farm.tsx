import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Modal, TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

type Tab = 'overview' | 'records' | 'health' | 'lab';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED:             'Demandé',
  SCHEDULED:             'Planifié',
  TECHNICIAN_DISPATCHED: 'Technicien envoyé',
  SAMPLES_COLLECTED:     'Échantillons collectés',
  ANALYZING:             'En analyse',
  RESULTS_READY:         'Résultats prêts',
  DELIVERED:             'Livré',
};

const STATUS_COLORS: Record<string, string> = {
  REQUESTED:             '#F59E0B',
  SCHEDULED:             '#3B82F6',
  TECHNICIAN_DISPATCHED: '#8B5CF6',
  SAMPLES_COLLECTED:     '#06B6D4',
  ANALYZING:             '#F97316',
  RESULTS_READY:         '#10B981',
  DELIVERED:             '#059669',
};

const HEALTH_TYPE_LABELS: Record<string, string> = {
  VACCINATION:       'Vaccination',
  DEWORMING:         'Déparasitage',
  TREATMENT:         'Traitement',
  ROUTINE_CHECKUP:   'Contrôle de routine',
};

export default function FarmScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [addRecordModal, setAddRecordModal] = useState(false);

  // Form state for new farm record
  const [animalCount,  setAnimalCount]  = useState('');
  const [mortality,    setMortality]    = useState('0');
  const [feedKg,       setFeedKg]       = useState('');
  const [expenses,     setExpenses]     = useState('');
  const [revenue,      setRevenue]      = useState('');
  const [notes,        setNotes]        = useState('');

  const qc = useQueryClient();

  // Fetch farm records
  const { data: recordsData, isLoading: recordsLoading, refetch: refetchRecords } = useQuery({
    queryKey: ['farm-records'],
    queryFn: async () => {
      const res = await api.get('/farm-records?limit=20');
      if (!res.success) return [];
      return res.data?.records ?? res.data ?? [];
    },
  });

  // Fetch health events
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-events'],
    queryFn: async () => {
      const res = await api.get('/health-events?limit=20');
      if (!res.success) return [];
      return res.data?.events ?? res.data ?? [];
    },
  });

  // Fetch health reminders
  const { data: reminders, refetch: refetchReminders } = useQuery({
    queryKey: ['health-reminders'],
    queryFn: async () => {
      const res = await api.get('/health-events/reminders');
      if (!res.success) return [];
      return res.data ?? [];
    },
  });

  // Fetch lab requests
  const { data: labData, isLoading: labLoading, refetch: refetchLab } = useQuery({
    queryKey: ['lab-requests'],
    queryFn: async () => {
      const res = await api.get('/lab-requests');
      if (!res.success) return [];
      return res.data?.requests ?? res.data ?? [];
    },
  });

  // Mutation: add farm record
  const addRecord = useMutation({
    mutationFn: async () => {
      const body: any = {
        recordDate:    new Date().toISOString(),
        animalCount:   parseInt(animalCount, 10),
        mortalityCount: parseInt(mortality, 10) || 0,
      };
      if (feedKg)    body.feedConsumedKg = parseFloat(feedKg);
      if (expenses)  body.expenses       = parseFloat(expenses);
      if (revenue)   body.revenue        = parseFloat(revenue);
      if (notes)     body.notes          = notes;

      const res = await api.post('/farm-records', body);
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farm-records'] });
      qc.invalidateQueries({ queryKey: ['farmer-stats'] });
      setAddRecordModal(false);
      setAnimalCount(''); setMortality('0'); setFeedKg('');
      setExpenses(''); setRevenue(''); setNotes('');
      Alert.alert('Succès', 'Enregistrement ajouté avec succès.');
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const records    = (recordsData ?? []) as any[];
  const health     = (healthData  ?? []) as any[];
  const labReqs    = (labData     ?? []) as any[];
  const latestRec  = records[0];

  const onRefresh = () => {
    refetchRecords(); refetchHealth(); refetchReminders(); refetchLab();
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#011C12', '#022C22', '#047857', '#059669']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Ma Ferme</Text>
              <Text style={styles.headerSub}>Gestion complète de votre exploitation</Text>
            </View>
            <TouchableOpacity style={styles.labBtn} onPress={() => router.push('/(farmer)/lab-order')}>
              <Ionicons name="flask-outline" size={16} color="#fff" />
              <Text style={styles.labBtnText}>Labo</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {([
          { key: 'overview', label: 'Aperçu',        icon: 'grid-outline' },
          { key: 'records',  label: 'Journaux',       icon: 'document-text-outline' },
          { key: 'health',   label: 'Santé',          icon: 'medkit-outline' },
          { key: 'lab',      label: 'Laboratoire',    icon: 'flask-outline' },
        ] as { key: Tab; label: string; icon: string }[]).map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Ionicons
              name={t.icon as any}
              size={16}
              color={activeTab === t.key ? colors.brand[700] : colors.neutral[400]}
            />
            <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.brand[600]} colors={[colors.brand[600]]} />
        }
      >
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <View>
            {/* Key stats */}
            <View style={styles.statsGrid}>
              <StatBox emoji="🐄" value={latestRec?.animalCount ?? '—'} label="Animaux" />
              <StatBox emoji="💀" value={latestRec?.mortalityCount ?? '—'} label="Mortalité" />
              <StatBox emoji="🌿" value={latestRec?.feedConsumedKg ? `${latestRec.feedConsumedKg}kg` : '—'} label="Aliments/j" />
              <StatBox emoji="🧪" value={labReqs.length} label="Demandes labo" />
            </View>

            {/* Quick actions */}
            <Text style={styles.sectionTitle}>Actions rapides</Text>
            <View style={styles.quickRow}>
              <QuickBtn
                icon="add-circle-outline"
                label="Nouveau journal"
                color={colors.brand[700]}
                onPress={() => setAddRecordModal(true)}
              />
              <QuickBtn
                icon="flask-outline"
                label="Commander labo"
                color="#3B82F6"
                onPress={() => router.push('/(farmer)/lab-order')}
              />
              <QuickBtn
                icon="medkit-outline"
                label="Santé animale"
                color="#F59E0B"
                onPress={() => setActiveTab('health')}
              />
            </View>

            {/* Upcoming health reminders */}
            {(reminders ?? []).length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing[5] }]}>Rappels à venir</Text>
                {(reminders as any[]).slice(0, 3).map((r: any, i: number) => (
                  <View key={r.id ?? i} style={styles.reminderRow}>
                    <View style={styles.reminderDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reminderTitle}>{r.title ?? HEALTH_TYPE_LABELS[r.eventType] ?? r.eventType}</Text>
                      <Text style={styles.reminderDate}>
                        {r.scheduledDate
                          ? new Date(r.scheduledDate).toLocaleDateString('fr-FR')
                          : '—'}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            {/* Latest farm record summary */}
            {latestRec && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: spacing[5] }]}>Dernier journal</Text>
                <View style={styles.recordCard}>
                  <Text style={styles.recordDate}>
                    {new Date(latestRec.recordDate).toLocaleDateString('fr-FR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </Text>
                  <View style={styles.recordRow}>
                    <RecordStat label="Animaux" value={latestRec.animalCount} />
                    <RecordStat label="Mortalité" value={latestRec.mortalityCount} />
                    {latestRec.feedConsumedKg != null && <RecordStat label="Aliments (kg)" value={latestRec.feedConsumedKg} />}
                    {latestRec.expenses       != null && <RecordStat label="Dépenses (FCFA)" value={latestRec.expenses.toLocaleString('fr-FR')} />}
                    {latestRec.revenue        != null && <RecordStat label="Revenus (FCFA)" value={latestRec.revenue.toLocaleString('fr-FR')} />}
                  </View>
                  {latestRec.notes && <Text style={styles.recordNotes}>{latestRec.notes}</Text>}
                </View>
              </>
            )}
          </View>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.sectionTitle}>Journaux d'exploitation</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddRecordModal(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {recordsLoading ? (
              <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
            ) : records.length === 0 ? (
              <EmptyState emoji="📋" title="Aucun journal" sub="Commencez à enregistrer les données de votre ferme" action="Ajouter un journal" onAction={() => setAddRecordModal(true)} />
            ) : (
              records.map((r: any) => (
                <View key={r.id} style={styles.recordCard}>
                  <Text style={styles.recordDate}>
                    {new Date(r.recordDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
                  <View style={styles.recordRow}>
                    <RecordStat label="Animaux" value={r.animalCount} />
                    <RecordStat label="Mortalité" value={r.mortalityCount} />
                    {r.feedConsumedKg != null && <RecordStat label="Aliments (kg)" value={r.feedConsumedKg} />}
                    {r.expenses       != null && <RecordStat label="Dépenses" value={`${r.expenses.toLocaleString('fr-FR')} F`} />}
                    {r.revenue        != null && <RecordStat label="Revenus" value={`${r.revenue.toLocaleString('fr-FR')} F`} />}
                  </View>
                  {r.notes && <Text style={styles.recordNotes}>{r.notes}</Text>}
                </View>
              ))
            )}
          </View>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <View>
            <Text style={styles.sectionTitle}>Événements de santé</Text>
            {healthLoading ? (
              <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
            ) : health.length === 0 ? (
              <EmptyState emoji="🩺" title="Aucun événement" sub="Enregistrez vaccinations, déparasitages et traitements" />
            ) : (
              health.map((h: any, i: number) => (
                <View key={h.id ?? i} style={styles.healthCard}>
                  <View style={[styles.healthBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="medkit" size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.healthTitle}>
                      {h.title ?? HEALTH_TYPE_LABELS[h.eventType] ?? h.eventType}
                    </Text>
                    <Text style={styles.healthMeta}>
                      {h.scheduledDate
                        ? new Date(h.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
                        : '—'}
                      {h.animalCount ? `  ·  ${h.animalCount} animaux` : ''}
                    </Text>
                    {h.notes && <Text style={styles.healthNotes}>{h.notes}</Text>}
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: h.completed ? '#D1FAE5' : '#FEF3C7' }]}>
                    <Text style={[styles.statusPillText, { color: h.completed ? '#059669' : '#D97706' }]}>
                      {h.completed ? 'Fait' : 'En attente'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* LAB TAB */}
        {activeTab === 'lab' && (
          <View>
            <View style={styles.tabHeader}>
              <Text style={styles.sectionTitle}>Demandes de laboratoire</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(farmer)/lab-order')}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addBtnText}>Commander</Text>
              </TouchableOpacity>
            </View>

            {labLoading ? (
              <ActivityIndicator color={colors.brand[600]} style={{ marginTop: 40 }} />
            ) : labReqs.length === 0 ? (
              <EmptyState
                emoji="🧪"
                title="Aucune demande"
                sub="Commandez une analyse de laboratoire pour votre ferme"
                action="Commander maintenant"
                onAction={() => router.push('/(farmer)/lab-order')}
              />
            ) : (
              labReqs.map((req: any) => (
                <View key={req.id} style={styles.labCard}>
                  <View style={styles.labCardTop}>
                    <View style={[styles.labIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="flask" size={20} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labType}>{req.testType?.replace(/_/g, ' ')}</Text>
                      <Text style={styles.labDate}>
                        {new Date(req.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLORS[req.status] ?? '#94A3B8'}20` }]}>
                      <Text style={[styles.statusPillText, { color: STATUS_COLORS[req.status] ?? '#64748B' }]}>
                        {STATUS_LABELS[req.status] ?? req.status}
                      </Text>
                    </View>
                  </View>
                  {req.priceQuoted != null && (
                    <Text style={styles.labPrice}>Tarif estimé : {req.priceQuoted.toLocaleString('fr-FR')} FCFA</Text>
                  )}
                  {req.scheduledAt && (
                    <Text style={styles.labSchedule}>
                      RDV : {new Date(req.scheduledAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </Text>
                  )}
                  {req.instructions && <Text style={styles.labNotes}>{req.instructions}</Text>}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Farm Record Modal */}
      <Modal visible={addRecordModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setAddRecordModal(false)}>
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouveau journal</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <ModalField label="Nombre d'animaux *">
              <TextInput
                style={styles.modalInput}
                value={animalCount}
                onChangeText={setAnimalCount}
                keyboardType="number-pad"
                placeholder="Ex: 50"
                placeholderTextColor={colors.neutral[400]}
              />
            </ModalField>

            <ModalField label="Mortalités">
              <TextInput
                style={styles.modalInput}
                value={mortality}
                onChangeText={setMortality}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor={colors.neutral[400]}
              />
            </ModalField>

            <ModalField label="Aliments consommés (kg)">
              <TextInput
                style={styles.modalInput}
                value={feedKg}
                onChangeText={setFeedKg}
                keyboardType="decimal-pad"
                placeholder="Ex: 120.5"
                placeholderTextColor={colors.neutral[400]}
              />
            </ModalField>

            <ModalField label="Dépenses (FCFA)">
              <TextInput
                style={styles.modalInput}
                value={expenses}
                onChangeText={setExpenses}
                keyboardType="decimal-pad"
                placeholder="Ex: 15000"
                placeholderTextColor={colors.neutral[400]}
              />
            </ModalField>

            <ModalField label="Revenus (FCFA)">
              <TextInput
                style={styles.modalInput}
                value={revenue}
                onChangeText={setRevenue}
                keyboardType="decimal-pad"
                placeholder="Ex: 25000"
                placeholderTextColor={colors.neutral[400]}
              />
            </ModalField>

            <ModalField label="Notes">
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Observations du jour..."
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={4}
              />
            </ModalField>

            <TouchableOpacity
              style={[styles.submitBtn, addRecord.isPending && { opacity: 0.6 }]}
              onPress={() => {
                if (!animalCount) {
                  Alert.alert('Champ requis', 'Veuillez saisir le nombre d\'animaux.');
                  return;
                }
                addRecord.mutate();
              }}
              disabled={addRecord.isPending}
            >
              {addRecord.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatBox({ emoji, value, label }: { emoji: string; value: any; label: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickBtn({ icon, label, color, onPress }: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.quickBtnIcon, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.quickBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function RecordStat({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.recordStat}>
      <Text style={styles.recordStatValue}>{value}</Text>
      <Text style={styles.recordStatLabel}>{label}</Text>
    </View>
  );
}

function EmptyState({ emoji, title, sub, action, onAction }: { emoji: string; title: string; sub: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
      {action && onAction && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onAction}>
          <Text style={styles.emptyBtnText}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.modalField}>
      <Text style={styles.modalFieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {},
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  labBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  labBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
    backgroundColor: '#FFFFFF',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: colors.brand[600] },
  tabLabel: { fontSize: 10, fontWeight: '500', color: colors.neutral[400] },
  tabLabelActive: { color: colors.brand[700], fontWeight: '700' },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5], paddingBottom: spacing[10] },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[900], marginBottom: spacing[3] },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginBottom: spacing[5],
  },
  statBox: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.brand[800] },
  statLabel: { fontSize: 11, color: colors.brand[700], fontWeight: '500' },

  // Quick action buttons
  quickRow: { flexDirection: 'row', gap: spacing[3] },
  quickBtn: { flex: 1, alignItems: 'center', gap: 8 },
  quickBtnIcon: {
    width: 52, height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBtnLabel: { fontSize: 11, fontWeight: '600', color: colors.neutral[700], textAlign: 'center' },

  // Reminders
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  reminderDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.brand[500],
  },
  reminderTitle: { fontSize: 13, fontWeight: '600', color: colors.neutral[800] },
  reminderDate:  { fontSize: 11, color: colors.neutral[400], marginTop: 2 },

  // Farm record card
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadow.sm,
  },
  recordDate: { fontSize: 12, fontWeight: '700', color: colors.brand[700], marginBottom: spacing[3] },
  recordRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[4] },
  recordStat: { alignItems: 'center', minWidth: 70 },
  recordStatValue: { fontSize: 18, fontWeight: '800', color: colors.neutral[900] },
  recordStatLabel: { fontSize: 10, color: colors.neutral[500], marginTop: 2 },
  recordNotes: { fontSize: 12, color: colors.neutral[500], marginTop: spacing[3], lineHeight: 18 },

  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand[700],
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  // Health card
  healthCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadow.sm,
  },
  healthBadge: {
    width: 40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  healthTitle: { fontSize: 13, fontWeight: '700', color: colors.neutral[800] },
  healthMeta:  { fontSize: 11, color: colors.neutral[400], marginTop: 2 },
  healthNotes: { fontSize: 12, color: colors.neutral[500], marginTop: 4, lineHeight: 17 },

  statusPill: {
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  // Lab card
  labCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadow.sm,
  },
  labCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], marginBottom: 8 },
  labIcon: {
    width: 40, height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  labType:     { fontSize: 13, fontWeight: '700', color: colors.neutral[800] },
  labDate:     { fontSize: 11, color: colors.neutral[400], marginTop: 2 },
  labPrice:    { fontSize: 12, color: colors.brand[700], fontWeight: '600', marginTop: 4 },
  labSchedule: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  labNotes:    { fontSize: 12, color: colors.neutral[500], marginTop: 4 },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800], marginBottom: 8 },
  emptySub:   { fontSize: 13, color: colors.neutral[500], textAlign: 'center', lineHeight: 19, marginBottom: spacing[4] },
  emptyBtn: {
    backgroundColor: colors.brand[700],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.lg,
    marginTop: 4,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  // Modal
  modal: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[900] },
  modalBody: { padding: spacing[5], paddingBottom: spacing[10] },
  modalField: { marginBottom: spacing[4] },
  modalFieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.8,
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  modalTextArea: { height: 100, textAlignVertical: 'top' },
  submitBtn: {
    backgroundColor: colors.brand[700],
    borderRadius: radius.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing[4],
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
