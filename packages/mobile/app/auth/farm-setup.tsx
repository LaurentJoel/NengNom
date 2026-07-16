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

type FarmType = {
  value: string;
  emoji: string;
  label: string;
};

const FARM_TYPES: FarmType[] = [
  { value: 'Poulets de chair', emoji: '🐔', label: 'Poulets de chair' },
  { value: 'Pondeuses',        emoji: '🥚', label: 'Pondeuses' },
  { value: 'Bovins',           emoji: '🐄', label: 'Bovins' },
  { value: 'Caprins',          emoji: '🐐', label: 'Caprins / Ovins' },
  { value: 'Porcins',          emoji: '🐷', label: 'Porcins' },
  { value: 'Mixte',            emoji: '🌾', label: 'Élevage mixte' },
];

const REGIONS = [
  'Centre', 'Littoral', 'Ouest', 'Nord-Ouest', 'Sud-Ouest',
  'Sud', 'Est', 'Adamaoua', 'Nord', 'Extrême-Nord',
];

export default function FarmSetupScreen() {
  const [farmName,    setFarmName]    = useState('');
  const [farmType,    setFarmType]    = useState('');
  const [animalCount, setAnimalCount] = useState('');
  const [region,      setRegion]      = useState('');
  const [city,        setCity]        = useState('');
  const [quarter,     setQuarter]     = useState('');
  const [loading,     setLoading]     = useState(false);
  const [step,        setStep]        = useState(1); // 1 = farm info, 2 = location

  const goNext = () => {
    if (step === 1) {
      if (!farmType) {
        Alert.alert('Type requis', 'Veuillez sélectionner le type d\'élevage.');
        return;
      }
      setStep(2);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const body: any = {};
      if (farmName.trim())   body.farmName    = farmName.trim();
      if (farmType)          body.farmType    = farmType;
      if (animalCount.trim()) body.animalCount = parseInt(animalCount, 10) || 0;

      await api.put('/users/farmer-profile', body);

      // Also save location to general profile
      const profileBody: any = {};
      if (region)          profileBody.region  = region;
      if (city.trim())     profileBody.city    = city.trim();
      if (quarter.trim())  profileBody.quarter = quarter.trim();
      if (Object.keys(profileBody).length > 0) {
        await api.put('/users/profile', profileBody);
      }
    } catch {
      // Non-blocking — profile can be completed later
    } finally {
      setLoading(false);
      router.replace('/(farmer)/');
    }
  };

  const skip = () => router.replace('/(farmer)/');

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
                    <Text style={{ fontSize: 36, marginBottom: 8 }}>🌾</Text>
                    <Text style={styles.welcomeTitle}>Configurons votre ferme</Text>
                    <Text style={styles.welcomeSub}>
                      Ces informations nous permettent de personnaliser les conseils IA et d'aider les vétérinaires à mieux vous servir.
                    </Text>
                  </View>

                  {/* Farm name */}
                  <Field label="NOM DE VOTRE FERME (optionnel)">
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
                  </Field>

                  {/* Farm type */}
                  <Field label="TYPE D'ÉLEVAGE *">
                    <View style={styles.typeGrid}>
                      {FARM_TYPES.map((t) => (
                        <TouchableOpacity
                          key={t.value}
                          style={[styles.typeBtn, farmType === t.value && styles.typeBtnActive]}
                          onPress={() => setFarmType(t.value)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.typeEmoji}>{t.emoji}</Text>
                          <Text style={[styles.typeLabel, farmType === t.value && styles.typeLabelActive]}>
                            {t.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Field>

                  {/* Animal count */}
                  <Field label="NOMBRE D'ANIMAUX (environ)">
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
                    <Text style={styles.welcomeTitle}>Où se trouve votre ferme ?</Text>
                    <Text style={styles.welcomeSub}>
                      Ces informations permettent aux vétérinaires de votre zone de vous contacter en priorité.
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
                  <Field label="QUARTIER / LIEU-DIT">
                    <View style={styles.inputRow}>
                      <Ionicons name="map-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={quarter}
                        onChangeText={setQuarter}
                        placeholder="Ex: Akwa, Biyem-Assi, Village Ngong..."
                        placeholderTextColor={colors.neutral[400]}
                        autoCapitalize="words"
                      />
                    </View>
                    <Text style={styles.locationHint}>
                      💡 Plus vous précisez, plus les vétérinaires proches vous trouveront facilement
                    </Text>
                  </Field>

                  {/* Summary card */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>Récapitulatif</Text>
                    <SummaryRow icon="home-outline"     label="Ferme"    value={farmName || 'Non renseigné'} />
                    <SummaryRow icon="leaf-outline"     label="Élevage"  value={farmType || 'Non renseigné'} />
                    <SummaryRow icon="pricetag-outline" label="Animaux"  value={animalCount ? `${animalCount} têtes` : 'Non renseigné'} />
                    <SummaryRow icon="location-outline" label="Région"   value={region || 'Non renseignée'} />
                    <SummaryRow icon="business-outline" label="Ville"    value={city || 'Non renseignée'} />
                    {quarter ? <SummaryRow icon="map-outline" label="Quartier" value={quarter} /> : null}
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
                            <Text style={styles.btnText}>ACCÉDER À MA FERME</Text>
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

              {/* Skip */}
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
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 6,
    textAlign: 'right',
  },

  cardWrap: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingBottom: 48,
    ...shadow.lg,
  },
  cardHeader: { alignItems: 'center', paddingVertical: 14 },
  cardPill: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.neutral[200],
  },

  welcomeBlock: { alignItems: 'center', paddingVertical: 8, marginBottom: 8 },
  welcomeTitle: {
    fontSize: 20, fontWeight: '800',
    color: colors.neutral[900], textAlign: 'center', marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 13, color: colors.neutral[500],
    textAlign: 'center', lineHeight: 19, maxWidth: 300,
  },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9,
    marginBottom: 10,
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

  typeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  typeBtn: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.xl,
    paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.neutral[50],
  },
  typeBtnActive: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  typeEmoji: { fontSize: 20 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[600], flex: 1 },
  typeLabelActive: { color: colors.brand[700] },

  regionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },
  regionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  regionChipActive: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  regionLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[600] },
  regionLabelActive: { color: colors.brand[700] },
  locationHint: { fontSize: 11, color: colors.neutral[400], marginTop: 6, lineHeight: 16 },

  summaryCard: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.xl,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.brand[100],
    gap: 10,
  },
  summaryTitle: { fontSize: 12, fontWeight: '700', color: colors.brand[800], marginBottom: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  summaryLabel: { fontSize: 12, fontWeight: '600', color: colors.neutral[500], width: 60 },
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
