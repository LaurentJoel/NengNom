import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const FARM_TYPES = [
  { value: 'Poulets de chair', emoji: '🐔' },
  { value: 'Pondeuses',        emoji: '🥚' },
  { value: 'Bovins',           emoji: '🐄' },
  { value: 'Caprins',          emoji: '🐐' },
  { value: 'Porcins',          emoji: '🐷' },
  { value: 'Mixte',            emoji: '🌾' },
];

const REGIONS = [
  'Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest',
  'Sud', 'Est', 'Adamaoua', 'Nord', 'Extrême-Nord',
];

export default function FarmerProfileScreen() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();

  // ── Modal state ──────────────────────────────────────────────────────────
  const [editPersonalOpen, setEditPersonalOpen] = useState(false);
  const [editFarmOpen,     setEditFarmOpen]     = useState(false);

  // Personal info form
  const [fullName, setFullName] = useState('');
  const [region,   setRegion]   = useState('');

  // Farm info form
  const [farmName,    setFarmName]    = useState('');
  const [farmType,    setFarmType]    = useState('');
  const [animalCount, setAnimalCount] = useState('');

  // ── Fetch full profile (includes farmerProfile) ───────────────────────
  const { data: profile } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const res = await api.get('/users/me');
      return res.success ? res.data : null;
    },
  });

  const farmerProfile = profile?.farmerProfile;

  // ── Mutations ─────────────────────────────────────────────────────────
  const savePersonal = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (fullName.trim()) body.fullName = fullName.trim();
      if (region)          body.region   = region;
      const res = await api.put('/users/profile', body);
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      setEditPersonalOpen(false);
      Alert.alert('Succès', 'Profil mis à jour.');
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const saveFarm = useMutation({
    mutationFn: async () => {
      const body: any = {};
      if (farmName.trim())    body.farmName    = farmName.trim();
      if (farmType)           body.farmType    = farmType;
      if (animalCount.trim()) body.animalCount = parseInt(animalCount, 10) || 0;
      const res = await api.put('/users/farmer-profile', body);
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      qc.invalidateQueries({ queryKey: ['farmer-stats'] });
      setEditFarmOpen(false);
      Alert.alert('Succès', 'Informations de la ferme mises à jour.');
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  // ── Helpers ───────────────────────────────────────────────────────────
  const openEditPersonal = () => {
    setFullName(user?.fullName ?? '');
    setRegion(profile?.region ?? user?.region ?? '');
    setEditPersonalOpen(true);
  };

  const openEditFarm = () => {
    setFarmName(farmerProfile?.farmName ?? '');
    setFarmType(farmerProfile?.farmType ?? '');
    setAnimalCount(farmerProfile?.animalCount != null ? String(farmerProfile.animalCount) : '');
    setEditFarmOpen(true);
  };

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'NN';

  // ── Displayed sub-values (with live profile data) ─────────────────────
  const displayRegion = profile?.region ?? user?.region ?? user?.country ?? '—';
  const farmTypeEmoji = FARM_TYPES.find(t => t.value === farmerProfile?.farmType)?.emoji ?? '🌾';

  interface MenuItem {
    icon: string;
    label: string;
    sub?: string;
    onPress: () => void;
    danger?: boolean;
  }

  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Mon compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Informations personnelles',
          sub: user?.fullName ?? '',
          onPress: openEditPersonal,
        },
        {
          icon: 'call-outline',
          label: 'Téléphone',
          sub: user?.phone ?? '',
          onPress: () => Alert.alert('Téléphone', 'Pour modifier votre numéro, contactez le support : support@neng-nom.com'),
        },
        {
          icon: 'location-outline',
          label: 'Région',
          sub: displayRegion,
          onPress: openEditPersonal,
        },
      ],
    },
    {
      title: 'Ma ferme',
      items: [
        {
          icon: 'leaf-outline',
          label: 'Informations de la ferme',
          sub: farmerProfile?.farmName
            ? `${farmTypeEmoji} ${farmerProfile.farmName}`
            : farmerProfile?.farmType
            ? `${farmTypeEmoji} ${farmerProfile.farmType}`
            : 'Configurer ma ferme',
          onPress: openEditFarm,
        },
        {
          icon: 'bar-chart-outline',
          label: 'Journaux et données',
          sub: 'Voir l\'historique',
          onPress: () => router.push('/(farmer)/farm'),
        },
        {
          icon: 'medkit-outline',
          label: 'Santé animale',
          sub: 'Vaccinations & traitements',
          onPress: () => router.push('/(farmer)/farm'),
        },
        {
          icon: 'flask-outline',
          label: 'Commander un labo',
          sub: 'Analyse en laboratoire',
          onPress: () => router.push('/(farmer)/lab-order'),
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          sub: 'Activées',
          onPress: () => Alert.alert(
            'Notifications',
            'Vous recevez des notifications pour :\n• Les nouvelles consultations\n• Les réponses de vétérinaires\n• Les rappels de santé animale\n• Les résultats de laboratoire',
          ),
        },
        {
          icon: 'language-outline',
          label: 'Langue',
          sub: 'Français',
          onPress: () => Alert.alert('Langue', 'Neng-Nom est actuellement disponible en français. D\'autres langues (Anglais, Fulfulde) seront bientôt disponibles.'),
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Confidentialité & Sécurité',
          onPress: () => Alert.alert(
            'Confidentialité',
            'Vos données personnelles et celles de votre élevage sont protégées.\n\n• Chiffrement de bout en bout\n• Aucune vente de données à des tiers\n• Vous pouvez supprimer votre compte à tout moment\n\nContact : support@neng-nom.com',
          ),
        },
        {
          icon: 'information-circle-outline',
          label: 'À propos de Neng-Nom',
          sub: 'Version 1.0.0',
          onPress: () => Alert.alert(
            'Neng-Nom AgriTech',
            'Version 1.0.0\n\nPlateforme de télémédecine vétérinaire pour l\'élevage au Cameroun et en Afrique Centrale.\n\nContact : support@neng-nom.com',
          ),
        },
      ],
    },
    {
      title: '',
      items: [
        {
          icon: 'log-out-outline',
          label: 'Se déconnecter',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#011C12', '#022C22', '#047857']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={openEditPersonal} style={styles.avatarRing} activeOpacity={0.85}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={10} color="#fff" />
              </View>
            </TouchableOpacity>
            <Text style={styles.name}>{user?.fullName ?? 'Éleveur'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {farmerProfile?.farmType
                  ? `${farmTypeEmoji} ${farmerProfile.farmType}`
                  : '🌾 Éleveur'}
              </Text>
            </View>
            <Text style={styles.phone}>{user?.phone}</Text>

            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Compte vérifié</Text>
              </View>
            )}

            {/* Farm quick stats */}
            {farmerProfile?.animalCount != null && (
              <View style={styles.farmStats}>
                <View style={styles.farmStat}>
                  <Text style={styles.farmStatValue}>{farmerProfile.animalCount}</Text>
                  <Text style={styles.farmStatLabel}>Animaux</Text>
                </View>
                {displayRegion !== '—' && (
                  <>
                    <View style={styles.farmStatDivider} />
                    <View style={styles.farmStat}>
                      <Text style={styles.farmStatValue}>{displayRegion}</Text>
                      <Text style={styles.farmStatLabel}>Région</Text>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {menuGroups.map((group, gi) => (
          <View key={gi} style={styles.group}>
            {group.title ? <Text style={styles.groupTitle}>{group.title}</Text> : null}
            <View style={[styles.groupCard, shadow.sm]}>
              {group.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                  style={[styles.menuItem, ii < group.items.length - 1 && styles.menuItemBorder]}
                >
                  <View style={[styles.menuIcon, item.danger ? styles.menuIconDanger : styles.menuIconNormal]}>
                    <Ionicons name={item.icon as any} size={18} color={item.danger ? colors.red[500] : colors.brand[700]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>{item.label}</Text>
                    {item.sub ? <Text style={styles.menuSub} numberOfLines={1}>{item.sub}</Text> : null}
                  </View>
                  {!item.danger && <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        <Text style={styles.footer}>Neng-Nom AgriTech © 2026</Text>
      </ScrollView>

      {/* ── Edit Personal Info Modal ───────────────────────────────────── */}
      <Modal visible={editPersonalOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditPersonalOpen(false)}>
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Informations personnelles</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <ModalField label="NOM COMPLET">
              <View style={styles.inputRow}>
                <Ionicons name="person-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Jean Dupont"
                  placeholderTextColor={colors.neutral[400]}
                  autoCapitalize="words"
                />
              </View>
            </ModalField>

            <ModalField label="TÉLÉPHONE (non modifiable)">
              <View style={[styles.inputRow, { opacity: 0.5 }]}>
                <Ionicons name="call-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                <Text style={[styles.input, { paddingVertical: 14 }]}>{user?.phone ?? ''}</Text>
              </View>
            </ModalField>

            <ModalField label="RÉGION">
              <View style={styles.regionGrid}>
                {REGIONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.regionChip, region === r && styles.regionChipActive]}
                    onPress={() => setRegion(r)}
                  >
                    <Text style={[styles.regionLabel, region === r && styles.regionLabelActive]}>{r}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ModalField>

            <TouchableOpacity
              style={[styles.saveBtn, savePersonal.isPending && { opacity: 0.6 }]}
              onPress={() => savePersonal.mutate()}
              disabled={savePersonal.isPending}
            >
              {savePersonal.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Edit Farm Info Modal ───────────────────────────────────────── */}
      <Modal visible={editFarmOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditFarmOpen(false)}>
              <Ionicons name="close" size={24} color={colors.neutral[600]} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Informations de la ferme</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
            <ModalField label="NOM DE LA FERME">
              <View style={styles.inputRow}>
                <Ionicons name="home-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={farmName}
                  onChangeText={setFarmName}
                  placeholder="Ex: Ferme Moukam"
                  placeholderTextColor={colors.neutral[400]}
                  autoCapitalize="words"
                />
              </View>
            </ModalField>

            <ModalField label="TYPE D'ÉLEVAGE">
              <View style={styles.typeGrid}>
                {FARM_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.value}
                    style={[styles.typeBtn, farmType === t.value && styles.typeBtnActive]}
                    onPress={() => setFarmType(t.value)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 18 }}>{t.emoji}</Text>
                    <Text style={[styles.typeLabel, farmType === t.value && styles.typeLabelActive]}>{t.value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ModalField>

            <ModalField label="NOMBRE D'ANIMAUX">
              <View style={styles.inputRow}>
                <Ionicons name="pricetag-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={animalCount}
                  onChangeText={setAnimalCount}
                  placeholder="Ex: 500"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="number-pad"
                />
              </View>
            </ModalField>

            <TouchableOpacity
              style={[styles.saveBtn, saveFarm.isPending && { opacity: 0.6 }]}
              onPress={() => saveFarm.mutate()}
              disabled={saveFarm.isPending}
            >
              {saveFarm.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={styles.saveBtnText}>Enregistrer</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {},
  headerInner: { alignItems: 'center', paddingTop: spacing[5], paddingBottom: spacing[6] },

  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[3], position: 'relative',
  },
  avatar: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
  editBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.brand[600],
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#022C22',
  },

  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 6,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },

  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
    marginBottom: 12,
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#10B981' },

  farmStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: spacing[3], paddingHorizontal: spacing[4],
    gap: spacing[4],
  },
  farmStat: { alignItems: 'center' },
  farmStatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  farmStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  farmStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'stretch' },

  wave: { height: 24, backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5] },

  group: { marginBottom: spacing[5] },
  groupTitle: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: spacing[3], marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#FFFFFF', borderRadius: radius['2xl'],
    overflow: 'hidden', borderWidth: 1, borderColor: colors.neutral[100],
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingVertical: spacing[4], gap: spacing[3],
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.neutral[50] },
  menuIcon: {
    width: 38, height: 38, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  menuIconNormal: { backgroundColor: colors.brand[50] },
  menuIconDanger: { backgroundColor: colors.red[50] },
  menuLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[900] },
  menuLabelDanger: { color: colors.red[600] },
  menuSub: { fontSize: 12, color: colors.neutral[400], marginTop: 1 },

  footer: {
    textAlign: 'center', fontSize: 12,
    color: colors.neutral[300],
    paddingBottom: spacing[8], marginTop: spacing[2],
  },

  // Modals
  modal: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[900] },
  modalBody:  { padding: spacing[5], paddingBottom: spacing[10] },

  fieldGroup: { marginBottom: spacing[5] },
  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9, marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.lg, backgroundColor: colors.neutral[50],
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 13,
    fontSize: 15, color: colors.neutral[900],
  },

  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  regionChipActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  regionLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[600] },
  regionLabelActive: { color: colors.brand[700] },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.neutral[50],
  },
  typeBtnActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  typeLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[600], flex: 1 },
  typeLabelActive: { color: colors.brand[700] },

  saveBtn: {
    backgroundColor: colors.brand[700], borderRadius: radius.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: spacing[4],
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
