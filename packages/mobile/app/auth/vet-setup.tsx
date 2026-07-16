import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const SPECIALIZATIONS = [
  'Aviculture',
  'Bovins & Ruminants',
  'Porcins',
  'Petits animaux',
  'Santé publique vétérinaire',
  'Médecine générale',
];

const REGIONS = [
  'Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest',
  'Sud', 'Est', 'Adamaoua', 'Nord', 'Extrême-Nord',
];

export default function VetSetupScreen() {
  const [licenseNumber,   setLicenseNumber]   = useState('');
  const [specialization,  setSpecialization]  = useState('');
  const [hourlyRate,      setHourlyRate]      = useState('');
  const [region,          setRegion]          = useState('');
  const [city,            setCity]            = useState('');
  const [quarter,         setQuarter]         = useState('');
  const [loading,         setLoading]         = useState(false);
  const [step,            setStep]            = useState(1); // 1 = pro info, 2 = location

  const goNext = () => {
    if (step === 1) {
      if (!licenseNumber.trim()) {
        Alert.alert('Numéro requis', 'Veuillez saisir votre numéro de licence vétérinaire.');
        return;
      }
      setStep(2);
    }
  };

  const handleSave = async () => {
    if (!region || !city.trim()) {
      Alert.alert('Localisation requise', 'Veuillez sélectionner votre région et indiquer votre ville.');
      return;
    }
    setLoading(true);
    try {
      // Update vet profile (license, specialization, rate)
      await api.put('/users/vet-profile', {
        licenseNumber: licenseNumber.trim() || undefined,
        specialization: specialization || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        isAvailable: true,
      });

      // Update location in general profile
      const profileBody: any = { region, city: city.trim() };
      if (quarter.trim()) profileBody.quarter = quarter.trim();
      await api.put('/users/profile', profileBody);

      router.replace('/(vet)/');
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? 'Une erreur est survenue. Vous pouvez compléter votre profil plus tard.');
      router.replace('/(vet)/');
    } finally {
      setLoading(false);
    }
  };

  const skip = () => router.replace('/(vet)/');

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#011810', '#022C22', '#043D2E', '#065F46']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      <SafeAreaView style={styles.safe}>
        {/* Progress */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>
        <Text style={styles.progressLabel}>Étape {step} sur 2</Text>
      </SafeAreaView>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.cardWrap}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardPill} />
              </View>

              {step === 1 ? (
                <>
                  <View style={styles.welcomeBlock}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🩺</Text>
                    <Text style={styles.welcomeTitle}>Votre profil vétérinaire</Text>
                    <Text style={styles.welcomeSub}>
                      Ces informations permettent aux éleveurs de vous trouver et de vous faire confiance.
                    </Text>
                  </View>

                  {/* License number */}
                  <Field label="NUMÉRO DE LICENCE *">
                    <View style={styles.inputRow}>
                      <Ionicons name="card-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={licenseNumber}
                        onChangeText={setLicenseNumber}
                        placeholder="Ex: VET-CM-2024-001"
                        placeholderTextColor={colors.neutral[400]}
                        autoCapitalize="characters"
                      />
                    </View>
                  </Field>

                  {/* Specialization */}
                  <Field label="SPÉCIALISATION">
                    <View style={styles.specGrid}>
                      {SPECIALIZATIONS.map((s) => (
                        <TouchableOpacity
                          key={s}
                          style={[styles.specBtn, specialization === s && styles.specBtnActive]}
                          onPress={() => setSpecialization(specialization === s ? '' : s)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.specLabel, specialization === s && styles.specLabelActive]}>
                            {s}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Field>

                  {/* Hourly rate */}
                  <Field label="TARIF HORAIRE (FCFA — optionnel)">
                    <View style={styles.inputRow}>
                      <Ionicons name="cash-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={hourlyRate}
                        onChangeText={setHourlyRate}
                        placeholder="Ex: 5000"
                        placeholderTextColor={colors.neutral[400]}
                        keyboardType="number-pad"
                      />
                      <Text style={styles.rateSuffix}>FCFA/h</Text>
                    </View>
                  </Field>

                  <TouchableOpacity style={styles.btnWrap} onPress={goNext} activeOpacity={0.88}>
                    <LinearGradient
                      colors={['#047857', '#059669', '#10B981']}
                      style={styles.btn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Text style={styles.btnText}>CONTINUER</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.welcomeBlock}>
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>📍</Text>
                    <Text style={styles.welcomeTitle}>Où exercez-vous ?</Text>
                    <Text style={styles.welcomeSub}>
                      Les éleveurs de votre zone vous seront présentés en priorité pour les consultations.
                    </Text>
                  </View>

                  {/* Region */}
                  <Field label="RÉGION *">
                    <View style={styles.regionGrid}>
                      {REGIONS.map((r) => (
                        <TouchableOpacity
                          key={r}
                          style={[styles.regionChip, region === r && styles.regionChipActive]}
                          onPress={() => setRegion(r)}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.regionLabel, region === r && styles.regionLabelActive]}>
                            {r}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Field>

                  {/* City */}
                  <Field label="VILLE / LOCALITÉ *">
                    <View style={styles.inputRow}>
                      <Ionicons name="business-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Ex: Douala, Yaoundé, Bafoussam..."
                        placeholderTextColor={colors.neutral[400]}
                        autoCapitalize="words"
                      />
                    </View>
                  </Field>

                  {/* Quarter */}
                  <Field label="QUARTIER / ZONE D'INTERVENTION">
                    <View style={styles.inputRow}>
                      <Ionicons name="map-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={quarter}
                        onChangeText={setQuarter}
                        placeholder="Ex: Akwa, Biyem-Assi, Mfoundi..."
                        placeholderTextColor={colors.neutral[400]}
                        autoCapitalize="words"
                      />
                    </View>
                    <Text style={styles.locationHint}>
                      💡 Vous pouvez exercer hors de cette zone, c'est juste votre zone principale
                    </Text>
                  </Field>

                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Récapitulatif</Text>
                    <SummaryRow icon="card-outline"      label="Licence"        value={licenseNumber || '—'} />
                    <SummaryRow icon="medical-outline"   label="Spécialité"     value={specialization || 'Généraliste'} />
                    <SummaryRow icon="cash-outline"      label="Tarif"          value={hourlyRate ? `${hourlyRate} FCFA/h` : 'Non renseigné'} />
                    <SummaryRow icon="location-outline"  label="Région"         value={region || '—'} />
                    <SummaryRow icon="business-outline"  label="Ville"          value={city || '—'} />
                  </View>

                  <TouchableOpacity
                    style={[styles.btnWrap, loading && { opacity: 0.6 }]}
                    onPress={handleSave}
                    disabled={loading}
                    activeOpacity={0.88}
                  >
                    <LinearGradient
                      colors={['#047857', '#059669', '#10B981']}
                      style={styles.btn}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" size="small" />
                        : (
                          <>
                            <Text style={styles.btnText}>ACCÉDER À MON ESPACE</Text>
                            <Ionicons name="checkmark" size={18} color="#fff" style={{ marginLeft: 8 }} />
                          </>
                        )
                      }
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={() => setStep(1)} style={styles.backLink}>
                    <Ionicons name="arrow-back" size={14} color={colors.neutral[500]} />
                    <Text style={styles.backLinkText}>Retour</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity onPress={skip} style={styles.skipLink}>
                <Text style={styles.skipText}>Passer pour l'instant →</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Ionicons name={icon as any} size={15} color={colors.brand[600]} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { paddingHorizontal: 24, paddingTop: 8 },

  progressBar: {
    height: 4, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2, marginTop: 12, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#10B981', borderRadius: 2 },
  progressLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 6, textAlign: 'right' },

  cardWrap: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    paddingHorizontal: 24, paddingBottom: 48, ...shadow.lg,
  },
  cardHeader: { alignItems: 'center', paddingVertical: 14 },
  cardPill: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.neutral[200] },

  welcomeBlock: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  welcomeTitle: { fontSize: 20, fontWeight: '800', color: colors.neutral[900], textAlign: 'center', marginBottom: 8 },
  welcomeSub:   { fontSize: 13, color: colors.neutral[500], textAlign: 'center', lineHeight: 19, maxWidth: 300 },

  fieldGroup: { marginBottom: 20 },
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
  rateSuffix: { paddingRight: 14, fontSize: 12, color: colors.neutral[400], fontWeight: '600' },

  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  specBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  specBtnActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  specLabel:     { fontSize: 12, fontWeight: '600', color: colors.neutral[600] },
  specLabelActive: { color: colors.brand[700] },

  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  regionChipActive: { borderColor: colors.brand[600], backgroundColor: colors.brand[50] },
  regionLabel:      { fontSize: 12, fontWeight: '600', color: colors.neutral[600] },
  regionLabelActive: { color: colors.brand[700] },

  locationHint: { fontSize: 11, color: colors.neutral[400], marginTop: 6, lineHeight: 16 },

  summaryCard: {
    backgroundColor: colors.brand[50], borderRadius: radius.xl,
    padding: spacing[4], marginBottom: spacing[4],
    borderWidth: 1, borderColor: colors.brand[100], gap: 10,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.brand[800], marginBottom: 4 },
  summaryRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[500], width: 70 },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.neutral[800], flex: 1 },

  btnWrap: { borderRadius: radius.lg, overflow: 'hidden', marginTop: 8, ...shadow.hero },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1.2 },

  backLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, marginTop: 14,
  },
  backLinkText: { fontSize: 13, color: colors.neutral[500] },

  skipLink: { alignItems: 'center', paddingTop: 18 },
  skipText: { fontSize: 13, color: colors.neutral[400] },
});
