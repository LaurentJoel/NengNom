import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

export default function FindVetScreen() {
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [symptoms, setSymptoms] = useState('');
  const [consultType, setConsultType] = useState<'CHAT' | 'VIDEO'>('CHAT');
  const [modalVisible, setModalVisible] = useState(false);
  const qc = useQueryClient();

  // Fetch current user's location for proximity sorting
  const { data: myProfile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.success ? res.data : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const myRegion = myProfile?.region ?? '';
  const myCity   = myProfile?.city   ?? '';

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vets-list', myRegion, myCity],
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '50' });
      if (myRegion) params.append('region', myRegion);
      if (myCity)   params.append('city',   myCity);
      const res = await api.get(`/users/vets?${params}`);
      if (!res.success) return [];
      return res.data ?? [];
    },
  });

  const vets: any[] = data ?? [];

  const createConsultation = useMutation({
    mutationFn: async () => {
      const body: any = { type: consultType };
      if (selectedVet?.userId) body.vetId = selectedVet.userId;
      if (symptoms.trim())     body.symptomsDescription = symptoms.trim();

      const res = await api.post('/consultations', body);
      if (!res.success) throw new Error(res.error?.message ?? 'Impossible de créer la consultation.');
      return res.data;
    },
    onSuccess: (newConsult) => {
      qc.invalidateQueries({ queryKey: ['farmer-consultations'] });
      qc.invalidateQueries({ queryKey: ['farmer-consultations-list'] });
      setModalVisible(false);
      setSymptoms('');
      setSelectedVet(null);
      // Navigate to the new consultation chat
      router.push(`/(farmer)/consultations/${newConsult.id}` as any);
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const openModal = (vet: any) => {
    setSelectedVet(vet);
    setSymptoms('');
    setModalVisible(true);
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#011C12', '#022C22', '#047857', '#059669']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Trouver un Vétérinaire</Text>
              <Text style={styles.headerSub}>
                {vets.length > 0 ? `${vets.length} vétérinaire${vets.length > 1 ? 's' : ''} disponible${vets.length > 1 ? 's' : ''}` : 'Chargement…'}
              </Text>
            </View>
          </View>
        </SafeAreaView>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.8)" />
          <Text style={styles.infoBannerText}>
            Sélectionnez un vétérinaire et décrivez les symptômes de vos animaux pour démarrer une consultation par chat.
          </Text>
        </View>

        <View style={styles.wave} />
      </LinearGradient>

      {/* Also allow consultation without specific vet */}
      <TouchableOpacity
        style={styles.anyVetBanner}
        onPress={() => openModal(null)}
        activeOpacity={0.85}
      >
        <View style={styles.anyVetIcon}>
          <Text style={{ fontSize: 20 }}>🆘</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.anyVetTitle}>Consultation d'urgence</Text>
          <Text style={styles.anyVetSub}>Le premier vétérinaire disponible prendra en charge votre demande</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.brand[600]} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
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
        <Text style={styles.sectionLabel}>
          VÉTÉRINAIRES{myCity ? ` — PRÈS DE ${myCity.toUpperCase()}` : ''}
        </Text>

        {isLoading ? (
          <ActivityIndicator color={colors.brand[600]} size="large" style={{ marginTop: 40 }} />
        ) : vets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🩺</Text>
            <Text style={styles.emptyTitle}>Aucun vétérinaire disponible</Text>
            <Text style={styles.emptySub}>
              Revenez plus tard ou envoyez une consultation d'urgence ci-dessus.
            </Text>
          </View>
        ) : (
          vets.map((vet: any) => (
            <VetCard
              key={vet.id}
              vet={vet}
              myCity={myCity}
              myRegion={myRegion}
              onContact={() => openModal(vet)}
            />
          ))
        )}
      </ScrollView>

      {/* Consultation creation modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Nouvelle consultation</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Selected vet preview */}
            {selectedVet ? (
              <View style={styles.selectedVetCard}>
                <View style={styles.vetAvatarLg}>
                  <Text style={styles.vetAvatarTextLg}>
                    {(selectedVet.user?.fullName ?? 'V').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.selectedVetName}>
                    {selectedVet.user?.fullName ?? 'Vétérinaire'}
                  </Text>
                  {selectedVet.specialization && (
                    <Text style={styles.selectedVetSpec}>{selectedVet.specialization}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.selectedVetCard}>
                <View style={[styles.vetAvatarLg, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={{ fontSize: 24 }}>🆘</Text>
                </View>
                <View>
                  <Text style={styles.selectedVetName}>Consultation d'urgence</Text>
                  <Text style={styles.selectedVetSpec}>Le premier vétérinaire disponible répondra</Text>
                </View>
              </View>
            )}

            {/* Consultation type */}
            <Text style={styles.symptomsLabel}>TYPE DE CONSULTATION</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, consultType === 'CHAT' && styles.typeBtnActive]}
                onPress={() => setConsultType('CHAT')}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubbles" size={20} color={consultType === 'CHAT' ? colors.brand[700] : colors.neutral[400]} />
                <Text style={[styles.typeLabel, consultType === 'CHAT' && styles.typeLabelActive]}>Chat</Text>
                <Text style={styles.typeSub}>Échange par messages</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, consultType === 'VIDEO' && styles.typeBtnActive]}
                onPress={() => setConsultType('VIDEO')}
                activeOpacity={0.8}
              >
                <Ionicons name="videocam" size={20} color={consultType === 'VIDEO' ? '#7C3AED' : colors.neutral[400]} />
                <Text style={[styles.typeLabel, consultType === 'VIDEO' && { color: '#7C3AED' }]}>Vidéo</Text>
                <Text style={styles.typeSub}>Appel vidéo en direct</Text>
              </TouchableOpacity>
            </View>

            {/* Symptoms */}
            <Text style={styles.symptomsLabel}>DÉCRIVEZ LES SYMPTÔMES DE VOS ANIMAUX</Text>
            <TextInput
              style={styles.symptomsInput}
              value={symptoms}
              onChangeText={setSymptoms}
              placeholder="Ex: Plusieurs poulets ont des difficultés respiratoires depuis 2 jours, avec des pertes d'appétit…"
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />

            {/* Tips */}
            <View style={styles.tipBox}>
              <Text style={styles.tipTitle}>💡 Pour une meilleure consultation</Text>
              <Text style={styles.tipItem}>• Mentionnez le nombre d'animaux affectés</Text>
              <Text style={styles.tipItem}>• Indiquez depuis combien de temps</Text>
              <Text style={styles.tipItem}>• Décrivez les symptômes visibles</Text>
              <Text style={styles.tipItem}>• Mentionnez les vaccins récents</Text>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, createConsultation.isPending && { opacity: 0.6 }]}
              onPress={() => createConsultation.mutate()}
              disabled={createConsultation.isPending}
              activeOpacity={0.88}
            >
              {createConsultation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Ionicons name={consultType === 'VIDEO' ? 'videocam' : 'chatbubbles'} size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>
                    {consultType === 'VIDEO' ? 'Démarrer la vidéo' : 'Démarrer le chat'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ─── VetCard ────────────────────────────────────────────────────────────────

function VetCard({ vet, myCity, myRegion, onContact }: {
  vet: any; myCity?: string; myRegion?: string; onContact: () => void
}) {
  const name  = vet.user?.fullName ?? 'Vétérinaire';
  const spec  = vet.specialization ?? 'Médecine vétérinaire générale';
  const rate  = vet.hourlyRate;
  const avail = vet.isAvailable !== false;
  const vetCity    = vet.user?.city    ?? '';
  const vetRegion  = vet.user?.region  ?? '';
  const vetQuarter = vet.user?.quarter ?? '';
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const isNearCity   = myCity   && vetCity   && vetCity.toLowerCase()   === myCity.toLowerCase();
  const isNearRegion = myRegion && vetRegion && vetRegion.toLowerCase() === myRegion.toLowerCase();
  const locationStr  = [vetQuarter, vetCity, vetRegion].filter(Boolean).join(', ');

  return (
    <View style={[styles.vetCard, shadow.sm]}>
      {isNearCity && (
        <View style={styles.nearBanner}>
          <Ionicons name="locate" size={12} color={colors.brand[700]} />
          <Text style={styles.nearText}>Près de vous — {vetCity}</Text>
        </View>
      )}
      {!isNearCity && isNearRegion && (
        <View style={[styles.nearBanner, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
          <Ionicons name="map-outline" size={12} color="#92400E" />
          <Text style={[styles.nearText, { color: '#92400E' }]}>Même région — {vetRegion}</Text>
        </View>
      )}

      <View style={styles.vetCardTop}>
        {/* Avatar */}
        <View style={[styles.vetAvatar, { backgroundColor: avail ? colors.brand[100] : colors.neutral[100] }]}>
          <Text style={[styles.vetAvatarText, { color: avail ? colors.brand[700] : colors.neutral[500] }]}>
            {initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.vetNameRow}>
            <Text style={styles.vetName}>{name}</Text>
            <View style={[styles.availBadge, { backgroundColor: avail ? '#D1FAE5' : '#FEE2E2' }]}>
              <View style={[styles.availDot, { backgroundColor: avail ? '#059669' : '#EF4444' }]} />
              <Text style={[styles.availText, { color: avail ? '#065F46' : '#991B1B' }]}>
                {avail ? 'Disponible' : 'Occupé'}
              </Text>
            </View>
          </View>
          <Text style={styles.vetSpec}>{spec}</Text>
          {locationStr ? (
            <View style={styles.vetLocationRow}>
              <Ionicons name="location-outline" size={11} color={colors.neutral[400]} />
              <Text style={styles.vetLocation}>{locationStr}</Text>
            </View>
          ) : null}
          {rate != null && (
            <Text style={styles.vetRate}>
              <Ionicons name="cash-outline" size={12} color={colors.neutral[400]} /> {Number(rate).toLocaleString('fr-FR')} FCFA/h
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.contactBtn, !avail && styles.contactBtnDisabled]}
        onPress={onContact}
        disabled={!avail}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubbles-outline" size={16} color={avail ? '#fff' : colors.neutral[400]} />
        <Text style={[styles.contactBtnText, !avail && { color: colors.neutral[400] }]}>
          {avail ? 'Contacter ce vétérinaire' : 'Indisponible'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {},
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.lg,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  infoBannerText: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 17 },
  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  anyVetBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: spacing[4],
    marginBottom: 0,
    padding: spacing[4],
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.brand[200],
  },
  anyVetIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  anyVetTitle: { fontSize: 14, fontWeight: '700', color: colors.brand[800] },
  anyVetSub:   { fontSize: 11, color: colors.brand[600], marginTop: 2, lineHeight: 15 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[4], paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[400], letterSpacing: 1,
    marginBottom: spacing[3], marginTop: spacing[2],
  },

  emptyState: { alignItems: 'center', paddingTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.neutral[800], marginBottom: 8 },
  emptySub:   { fontSize: 13, color: colors.neutral[500], textAlign: 'center', lineHeight: 19 },

  // Vet card
  vetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  vetCardTop: { flexDirection: 'row', gap: 12, marginBottom: spacing[3] },
  vetAvatar: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  vetAvatarText: { fontSize: 18, fontWeight: '800' },
  vetNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  vetName:    { fontSize: 15, fontWeight: '700', color: colors.neutral[900] },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: radius.full,
  },
  availDot:  { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 10, fontWeight: '700' },
  vetSpec: { fontSize: 12, color: colors.neutral[500], marginBottom: 3 },
  vetLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 3 },
  vetLocation: { fontSize: 11, color: colors.neutral[400] },
  vetRate: { fontSize: 12, color: colors.neutral[400] },

  nearBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.brand[50],
    borderWidth: 1, borderColor: colors.brand[100],
    borderRadius: radius.lg,
    paddingHorizontal: 10, paddingVertical: 5,
    marginBottom: spacing[3],
    alignSelf: 'flex-start',
  },
  nearText: { fontSize: 11, fontWeight: '700', color: colors.brand[700] },

  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand[700],
    borderRadius: radius.lg,
    paddingVertical: 11,
  },
  contactBtnDisabled: { backgroundColor: colors.neutral[100] },
  contactBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },

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
  modalBody:  { padding: spacing[5], paddingBottom: spacing[10] },

  selectedVetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  vetAvatarLg: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.brand[100],
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  vetAvatarTextLg: { fontSize: 20, fontWeight: '800', color: colors.brand[700] },
  selectedVetName: { fontSize: 15, fontWeight: '700', color: colors.neutral[900] },
  selectedVetSpec: { fontSize: 12, color: colors.neutral[500], marginTop: 2 },

  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.neutral[200], backgroundColor: colors.neutral[50], gap: 4,
  },
  typeBtnActive: { borderColor: colors.brand[500], backgroundColor: colors.brand[50] },
  typeLabel: { fontSize: 13, fontWeight: '700', color: colors.neutral[500] },
  typeLabelActive: { color: colors.brand[700] },
  typeSub: { fontSize: 10, color: colors.neutral[400], textAlign: 'center' },

  symptomsLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9,
    marginBottom: 10,
  },
  symptomsInput: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.xl,
    padding: 14,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
    minHeight: 130,
    marginBottom: spacing[4],
  },
  tipBox: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[5],
    borderWidth: 1,
    borderColor: colors.brand[100],
    gap: 4,
  },
  tipTitle: { fontSize: 12, fontWeight: '700', color: colors.brand[800], marginBottom: 6 },
  tipItem:  { fontSize: 12, color: colors.brand[700], lineHeight: 18 },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.brand[700],
    borderRadius: radius.xl,
    paddingVertical: 15,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
