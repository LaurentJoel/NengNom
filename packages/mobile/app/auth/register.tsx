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
import { useAuth } from '@/lib/auth-context';
import { colors, radius, shadow } from '@/lib/theme';

type Role = 'FARMER' | 'VET';

export default function RegisterScreen() {
  const { login } = useAuth();
  const [fullName, setFullName]         = useState('');
  const [phone, setPhone]               = useState('');
  const [password, setPassword]         = useState('');
  const [confirmPassword, setConfirm]   = useState('');
  const [role, setRole]                 = useState<Role>('FARMER');
  const [showPass, setShowPass]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading]           = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim() || !phone.trim() || !password || !confirmPassword) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs obligatoires.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    let normalized = phone.trim().replace(/\s/g, '');
    if (!normalized.startsWith('+')) normalized = '+237' + normalized;

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName: fullName.trim(),
        phone: normalized,
        password,
        confirmPassword,
        role,
        country: 'CM',
      });

      if (!res.success) {
        const msg = res.error?.message ?? 'Erreur lors de l\'inscription.';
        Alert.alert('Inscription échouée', msg);
        return;
      }

      // Auto-login after registration
      const user = await login(normalized, password);
      // Both farmers and vets go through onboarding to capture location
      if (user.role === 'FARMER') router.replace('/auth/farm-setup');
      else if (user.role === 'VET') router.replace('/auth/vet-setup');
    } catch (err: any) {
      Alert.alert('Inscription échouée', err.message ?? 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Créer un compte</Text>
            <Text style={styles.headerSub}>Rejoignez Neng-Nom</Text>
          </View>
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.cardWrap}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardPill} />
              </View>

              {/* Role selector */}
              <Text style={styles.sectionLabel}>JE SUIS UN</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'FARMER' && styles.roleBtnActive]}
                  onPress={() => setRole('FARMER')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>🌾</Text>
                  <Text style={[styles.roleLabel, role === 'FARMER' && styles.roleLabelActive]}>
                    Éleveur
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleBtn, role === 'VET' && styles.roleBtnActive]}
                  onPress={() => setRole('VET')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.roleEmoji}>🩺</Text>
                  <Text style={[styles.roleLabel, role === 'VET' && styles.roleLabelActive]}>
                    Vétérinaire
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Full name */}
              <Field label="NOM COMPLET">
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Jean Dupont"
                    placeholderTextColor={colors.neutral[400]}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </Field>

              {/* Phone */}
              <Field label="TÉLÉPHONE">
                <View style={styles.phoneRow}>
                  <View style={styles.flagBox}>
                    <Text style={styles.flag}>🇨🇲</Text>
                    <Text style={styles.dialCode}>+237</Text>
                    <View style={styles.flagDivider} />
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="6XX XXX XXX"
                    placeholderTextColor={colors.neutral[400]}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    returnKeyType="next"
                    autoCorrect={false}
                  />
                </View>
              </Field>

              {/* Password */}
              <Field label="MOT DE PASSE">
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Min. 8 car., majuscule et chiffre"
                    placeholderTextColor={colors.neutral[400]}
                    secureTextEntry={!showPass}
                    value={password}
                    onChangeText={setPassword}
                    returnKeyType="next"
                  />
                  <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                    <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>
              </Field>

              {/* Confirm password */}
              <Field label="CONFIRMER LE MOT DE PASSE">
                <View style={styles.inputRow}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.neutral[400]} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Répétez votre mot de passe"
                    placeholderTextColor={colors.neutral[400]}
                    secureTextEntry={!showConfirm}
                    value={confirmPassword}
                    onChangeText={setConfirm}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn}>
                    <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>
              </Field>

              {/* Submit */}
              <TouchableOpacity
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.88}
                style={styles.btnWrap}
              >
                <LinearGradient
                  colors={['#047857', '#059669', '#10B981']}
                  style={styles.btn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.btnText}>CRÉER MON COMPTE</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Back to login */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Déjà un compte ? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.footerLink}>Se connecter</Text>
                </TouchableOpacity>
              </View>
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

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerText: {},
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  kav: { flex: 1 },
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

  sectionLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9,
    marginBottom: 10,
  },

  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  roleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 14,
    borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
    gap: 6,
  },
  roleBtnActive: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  roleEmoji: { fontSize: 24 },
  roleLabel: { fontSize: 13, fontWeight: '600', color: colors.neutral[500] },
  roleLabelActive: { color: colors.brand[700] },

  fieldGroup: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9, marginBottom: 8,
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.lg, backgroundColor: colors.neutral[50],
  },
  inputIcon: { marginLeft: 14 },
  input: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 14,
    fontSize: 15, color: colors.neutral[900],
  },
  eyeBtn: { paddingHorizontal: 14 },

  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.lg, backgroundColor: colors.neutral[50],
    overflow: 'hidden',
  },
  flagBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 14, gap: 6,
    backgroundColor: colors.neutral[100],
  },
  flag: { fontSize: 18 },
  dialCode: { fontSize: 14, fontWeight: '600', color: colors.neutral[700] },
  flagDivider: { width: 1, height: 20, backgroundColor: colors.neutral[200], marginLeft: 4 },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: colors.neutral[900],
  },

  btnWrap: {
    borderRadius: radius.lg, overflow: 'hidden',
    marginTop: 8, ...shadow.hero,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 1.2 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { fontSize: 14, color: colors.neutral[500] },
  footerLink: { fontSize: 14, fontWeight: '700', color: colors.brand[700] },
});
