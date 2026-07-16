import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

type TestType =
  | 'DISEASE_DIAGNOSIS'
  | 'PARASITOLOGY'
  | 'HEMATOLOGY'
  | 'BACTERIOLOGY'
  | 'WATER_QUALITY'
  | 'BIOSECURITY_AUDIT'
  | 'FEED_QUALITY';

const TEST_TYPES: { value: TestType; label: string; emoji: string; desc: string }[] = [
  { value: 'DISEASE_DIAGNOSIS', label: 'Diagnostic de maladie',     emoji: '🦠', desc: 'Identification d\'une maladie spécifique' },
  { value: 'PARASITOLOGY',      label: 'Parasitologie',             emoji: '🔬', desc: 'Détection de parasites internes/externes' },
  { value: 'HEMATOLOGY',        label: 'Hématologie',               emoji: '🩸', desc: 'Analyse de sang complète' },
  { value: 'BACTERIOLOGY',      label: 'Bactériologie',             emoji: '🧫', desc: 'Identification des agents bactériens' },
  { value: 'WATER_QUALITY',     label: 'Qualité de l\'eau',         emoji: '💧', desc: 'Analyse de la qualité de l\'eau d\'abreuvement' },
  { value: 'BIOSECURITY_AUDIT', label: 'Audit biosécurité',         emoji: '🔐', desc: 'Évaluation des mesures sanitaires de l\'exploitation' },
  { value: 'FEED_QUALITY',      label: 'Qualité des aliments',      emoji: '🌾', desc: 'Analyse nutritionnelle des aliments' },
];

type LocationMode = 'none' | 'auto' | 'manual';

export default function LabOrderScreen() {
  const [selectedType, setSelectedType]       = useState<TestType | null>(null);
  const [locationMode, setLocationMode]       = useState<LocationMode>('none');
  const [gpsCoords,    setGpsCoords]          = useState('');       // lat,lng
  const [locationLabel, setLocationLabel]     = useState('');       // friendly name
  const [manualAddress, setManualAddress]     = useState('');       // text address
  const [instructions, setInstructions]       = useState('');
  const [locating,     setLocating]           = useState(false);
  const [showManual,   setShowManual]         = useState(false);

  const qc = useQueryClient();

  // ── Auto-detect GPS ────────────────────────────────────────────────────
  const autoDetect = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Activez la localisation dans les paramètres de votre téléphone pour que nous puissions localiser votre ferme automatiquement.',
        );
        setLocating(false);
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setGpsCoords(`${lat.toFixed(6)},${lng.toFixed(6)}`);

      // Reverse geocode for friendly name
      try {
        const [place] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const parts = [place.subregion, place.city, place.region].filter(Boolean);
        setLocationLabel(parts.join(', ') || 'Localisation obtenue');
      } catch {
        setLocationLabel(`${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`);
      }

      setLocationMode('auto');
      setShowManual(false);
    } catch (e: any) {
      Alert.alert('Erreur de localisation', 'Impossible d\'obtenir votre position. Vérifiez que le GPS est activé.');
    } finally {
      setLocating(false);
    }
  };

  // ── Effective GPS value sent to API ───────────────────────────────────
  const effectiveGps = locationMode === 'auto'
    ? gpsCoords
    : (manualAddress.trim() || '');

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedType)    throw new Error('Sélectionnez un type d\'analyse.');
      if (!effectiveGps)    throw new Error('Veuillez localiser votre ferme ou saisir l\'adresse.');

      const body: any = {
        testType:    selectedType,
        gpsLocation: effectiveGps,
      };
      if (instructions.trim()) body.instructions = instructions.trim();

      const res = await api.post('/lab-requests', body);
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur lors de l\'envoi.');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lab-requests'] });
      Alert.alert(
        'Demande envoyée ! ✅',
        'Votre demande d\'analyse a été soumise. Un technicien vous contactera sous peu pour planifier la visite à votre ferme.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

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
              <Text style={styles.headerTitle}>Commander un Labo</Text>
              <Text style={styles.headerSub}>Analyse vétérinaire à domicile</Text>
            </View>
            <View style={styles.labIcon}>
              <Text style={{ fontSize: 22 }}>🧪</Text>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Advisory banner ─────────────────────────────────────────── */}
        <View style={styles.advisoryBanner}>
          <Text style={{ fontSize: 22 }}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.advisoryTitle}>Restez sur votre ferme !</Text>
            <Text style={styles.advisoryText}>
              Avant de réserver, assurez-vous d'être physiquement sur le site de votre élevage.
              Votre position sera enregistrée automatiquement pour guider le technicien.
            </Text>
          </View>
        </View>

        {/* ── Step 1 — Test type ───────────────────────────────────────── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
            <Text style={styles.stepTitle}>Type d'analyse</Text>
          </View>
          <Text style={styles.stepSub}>Sélectionnez le type de test dont votre ferme a besoin</Text>

          {TEST_TYPES.map((t) => (
            <TouchableOpacity
              key={t.value}
              style={[styles.typeOption, selectedType === t.value && styles.typeOptionSelected]}
              onPress={() => setSelectedType(t.value)}
              activeOpacity={0.8}
            >
              <View style={[styles.typeEmoji, selectedType === t.value && styles.typeEmojiSelected]}>
                <Text style={{ fontSize: 20 }}>{t.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeLabel, selectedType === t.value && styles.typeLabelSelected]}>
                  {t.label}
                </Text>
                <Text style={styles.typeDesc}>{t.desc}</Text>
              </View>
              {selectedType === t.value && (
                <Ionicons name="checkmark-circle" size={22} color={colors.brand[600]} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Step 2 — Location ────────────────────────────────────────── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
            <Text style={styles.stepTitle}>Localisation de la ferme</Text>
          </View>
          <Text style={styles.stepSub}>Le technicien utilisera cette information pour vous trouver</Text>

          {/* Auto-detect button — primary */}
          {locationMode !== 'auto' && (
            <TouchableOpacity
              style={styles.autoLocBtn}
              onPress={autoDetect}
              disabled={locating}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={['#047857', '#059669']}
                style={styles.autoLocGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {locating ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.autoLocText}>Localisation en cours...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="locate" size={20} color="#fff" />
                    <Text style={styles.autoLocText}>📍 Localiser ma ferme automatiquement</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Location confirmed */}
          {locationMode === 'auto' && (
            <View style={styles.locConfirmed}>
              <View style={styles.locConfirmedIcon}>
                <Ionicons name="checkmark-circle" size={24} color={colors.brand[600]} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locConfirmedTitle}>Ferme localisée ✓</Text>
                <Text style={styles.locConfirmedAddr}>{locationLabel}</Text>
                <Text style={styles.locCoordsText}>{gpsCoords}</Text>
              </View>
              <TouchableOpacity onPress={autoDetect} style={styles.relocBtn}>
                <Ionicons name="refresh" size={16} color={colors.brand[700]} />
              </TouchableOpacity>
            </View>
          )}

          {/* Manual address toggle */}
          <TouchableOpacity
            style={styles.manualToggle}
            onPress={() => setShowManual(!showManual)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showManual ? 'chevron-up-outline' : 'pencil-outline'}
              size={15}
              color={colors.neutral[500]}
            />
            <Text style={styles.manualToggleText}>
              {showManual ? 'Masquer la saisie manuelle' : 'Saisir l\'adresse manuellement'}
            </Text>
          </TouchableOpacity>

          {showManual && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.manualHint}>
                Saisissez votre adresse la plus précise possible (région, ville, quartier, lieu-dit)
              </Text>
              <TextInput
                style={styles.manualInput}
                value={manualAddress}
                onChangeText={v => { setManualAddress(v); setLocationMode('manual'); }}
                placeholder={`Ex: Quartier Akwa, Douala, Littoral\nPrès du marché central, après l'église...`}
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              <Text style={styles.manualNote}>
                💡 Plus vous précisez, plus vite le technicien vous trouvera
              </Text>
            </View>
          )}
        </View>

        {/* ── Step 3 — Instructions ────────────────────────────────────── */}
        <View style={styles.stepCard}>
          <View style={styles.stepHeader}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
            <Text style={styles.stepTitle}>Informations supplémentaires (optionnel)</Text>
          </View>
          <Text style={styles.stepSub}>Décrivez les symptômes ou précisez les besoins spécifiques</Text>

          <TextInput
            style={[styles.gpsRow, styles.textArea]}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Ex: Plusieurs poules ont des difficultés respiratoires depuis 3 jours, mortalité de 10 bêtes..."
            placeholderTextColor={colors.neutral[400]}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={colors.brand[700]} />
          <Text style={styles.infoText}>
            Après votre demande, un technicien de laboratoire vous appellera pour confirmer le rendez-vous et vous communiquer le tarif.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, (mutation.isPending || !effectiveGps || !selectedType) && { opacity: 0.5 }]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending || !effectiveGps || !selectedType}
          activeOpacity={0.88}
        >
          {mutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="flask-outline" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>Envoyer la demande</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {},
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[5],
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  labIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5], paddingBottom: 60 },

  // Advisory
  advisoryBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5, borderColor: '#FDE68A',
    borderRadius: radius['2xl'],
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  advisoryTitle: { fontSize: 14, fontWeight: '800', color: '#92400E', marginBottom: 4 },
  advisoryText:  { fontSize: 12, color: '#78350F', lineHeight: 17 },

  // Step cards
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[5],
    marginBottom: spacing[4],
    borderWidth: 1, borderColor: colors.neutral[100],
    ...shadow.sm,
  },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.brand[700],
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.neutral[900] },
  stepSub:   { fontSize: 12, color: colors.neutral[500], marginBottom: spacing[4], lineHeight: 17 },

  // Auto-locate
  autoLocBtn: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: 10 },
  autoLocGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16,
  },
  autoLocText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  // Location confirmed
  locConfirmed: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.brand[200],
    padding: spacing[3],
    marginBottom: 10,
  },
  locConfirmedIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.brand[100],
    alignItems: 'center', justifyContent: 'center',
  },
  locConfirmedTitle: { fontSize: 13, fontWeight: '800', color: colors.brand[800] },
  locConfirmedAddr:  { fontSize: 12, color: colors.brand[700], marginTop: 2 },
  locCoordsText:     { fontSize: 10, color: colors.neutral[400], marginTop: 2, fontFamily: 'monospace' },
  relocBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.brand[100],
    alignItems: 'center', justifyContent: 'center',
  },

  // Manual toggle
  manualToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingTop: 4, paddingBottom: 2,
  },
  manualToggleText: { fontSize: 12, color: colors.neutral[500], fontWeight: '600' },
  manualHint: { fontSize: 11, color: colors.neutral[500], marginBottom: 8, lineHeight: 16 },
  manualInput: {
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.lg, backgroundColor: colors.neutral[50],
    padding: 12, minHeight: 80, fontSize: 14,
    color: colors.neutral[900], lineHeight: 20,
  },
  manualNote: { fontSize: 11, color: colors.brand[700], marginTop: 6, fontWeight: '600' },

  // GPS input (kept for textArea)
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[50],
  },
  textArea: {
    padding: 14, height: 120,
    fontSize: 14, color: colors.neutral[900],
    alignItems: 'flex-start',
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: colors.brand[50], borderRadius: radius.xl,
    padding: spacing[4], marginBottom: spacing[5],
    borderWidth: 1, borderColor: colors.brand[100],
  },
  infoText: { flex: 1, fontSize: 12, color: colors.brand[800], lineHeight: 18 },

  // Submit
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.brand[700],
    borderRadius: radius.xl, paddingVertical: 16, ...shadow.hero,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
});
