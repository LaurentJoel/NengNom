import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth-context';
import { colors, shadow, radius } from '@/lib/theme';

const { height, width } = Dimensions.get('window');

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passFocused, setPassFocused]   = useState(false);

  // Entrance animations
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const logoY        = useRef(new Animated.Value(-20)).current;
  const cardY        = useRef(new Animated.Value(height * 0.5)).current;
  // Floating blob animations
  const blob1Scale   = useRef(new Animated.Value(1)).current;
  const blob2Scale   = useRef(new Animated.Value(1)).current;
  const blob1Opacity = useRef(new Animated.Value(0.18)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(logoY, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();

    // Card slide up with spring
    Animated.spring(cardY, {
      toValue: 0,
      tension: 45,
      friction: 9,
      delay: 250,
      useNativeDriver: true,
    }).start();

    // Subtle blob pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(blob1Scale, { toValue: 1.12, duration: 4000, useNativeDriver: true }),
        Animated.timing(blob1Scale, { toValue: 1, duration: 4000, useNativeDriver: true }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(blob2Scale, { toValue: 0.9, duration: 3200, useNativeDriver: true }),
        Animated.timing(blob2Scale, { toValue: 1, duration: 3200, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const handleLogin = async () => {
    const trimmed = phone.trim().replace(/\s/g, '');
    if (!trimmed || !password) {
      Alert.alert('Champs requis', 'Veuillez remplir tous les champs.');
      return;
    }

    // Normalize: if user typed "6XXXXXXXX" prepend +237
    let normalized = trimmed;
    if (!normalized.startsWith('+')) {
      normalized = '+237' + normalized;
    }

    setLoading(true);
    try {
      const user = await login(normalized, password);
      if (user.role === 'FARMER') router.replace('/(farmer)/');
      else if (user.role === 'VET') router.replace('/(vet)/');
    } catch (err: any) {
      Alert.alert(
        'Connexion échouée',
        err.message || 'Numéro ou mot de passe incorrect.',
        [{ text: 'Réessayer' }],
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Deep gradient background */}
      <LinearGradient
        colors={['#011810', '#022C22', '#043D2E', '#065F46']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
      />

      {/* Decorative blobs */}
      <Animated.View style={[styles.blob, styles.blob1, { transform: [{ scale: blob1Scale }] }]} />
      <Animated.View style={[styles.blob, styles.blob2, { transform: [{ scale: blob2Scale }] }]} />
      <Animated.View style={[styles.blob, styles.blob3, { transform: [{ scale: blob1Scale }] }]} />

      {/* Dot grid overlay */}
      <View style={styles.dotGrid} pointerEvents="none">
        {Array.from({ length: 20 }).map((_, i) => (
          <View key={i} style={styles.dot} />
        ))}
      </View>

      {/* Logo */}
      <SafeAreaView style={styles.safeTop}>
        <Animated.View
          style={[
            styles.logoWrap,
            { opacity: logoOpacity, transform: [{ translateY: logoY }] },
          ]}
        >
          <View style={styles.logoRing}>
            <Image
              source={require('../../assets/logo-circle.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.brand}>Neng-Nom</Text>
          <Text style={styles.tagline}>La santé animale à portée de main</Text>

          {/* Decorative line */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <View style={styles.dividerDot} />
            <View style={styles.dividerLine} />
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* Login card */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.cardWrap, { transform: [{ translateY: cardY }] }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.card}>
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardPill} />
              </View>

              <Text style={styles.cardTitle}>Bienvenue 👋</Text>
              <Text style={styles.cardSubtitle}>Connectez-vous à votre compte</Text>

              {/* Phone field */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>NUMÉRO DE TÉLÉPHONE</Text>
                <View style={[styles.phoneRow, phoneFocused && styles.fieldFocused]}>
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
                    onFocus={() => setPhoneFocused(true)}
                    onBlur={() => setPhoneFocused(false)}
                    returnKeyType="next"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password field */}
              <View style={styles.fieldGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.fieldLabel}>MOT DE PASSE</Text>
                  <TouchableOpacity>
                    <Text style={styles.forgotLink}>Oublié ?</Text>
                  </TouchableOpacity>
                </View>
                <View style={[styles.passRow, passFocused && styles.fieldFocused]}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={18}
                    color={passFocused ? colors.brand[600] : colors.neutral[400]}
                    style={styles.passIcon}
                  />
                  <TextInput
                    style={styles.passInput}
                    placeholder="••••••••"
                    placeholderTextColor={colors.neutral[400]}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setPassFocused(true)}
                    onBlur={() => setPassFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={colors.neutral[400]}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Login button */}
              <TouchableOpacity
                onPress={handleLogin}
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
                      <Text style={styles.btnText}>SE CONNECTER</Text>
                      <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Credentials hint */}
              <View style={styles.hintBox}>
                <Ionicons name="information-circle-outline" size={14} color={colors.neutral[400]} />
                <Text style={styles.hintText}>Éleveur: 691234567 · Vétérinaire: 698765432 · MDP: Password123!</Text>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Pas encore de compte ? </Text>
                <TouchableOpacity onPress={() => router.push('/auth/register')}>
                  <Text style={styles.footerLink}>S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Blobs
  blob: { position: 'absolute', borderRadius: radius.full },
  blob1: {
    width: 280, height: 280,
    backgroundColor: 'rgba(16,185,129,0.12)',
    top: -60, left: -80,
  },
  blob2: {
    width: 220, height: 220,
    backgroundColor: 'rgba(52,211,153,0.08)',
    top: 100, right: -60,
  },
  blob3: {
    width: 160, height: 160,
    backgroundColor: 'rgba(4,120,87,0.15)',
    top: height * 0.28, left: width * 0.35,
  },

  // Dot grid
  dotGrid: {
    position: 'absolute',
    top: 40,
    right: 20,
    flexWrap: 'wrap',
    width: 80,
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 3, height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    margin: 5,
  },

  // Logo
  safeTop: { flex: 1, justifyContent: 'center', paddingBottom: 80 },
  logoWrap: { alignItems: 'center' },
  logoRing: {
    width: 118, height: 118, borderRadius: 59,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', marginBottom: 14, overflow: 'hidden',
  },
  logoImage: { width: 110, height: 110 },
  brand: { fontWeight: '800', fontSize: 32, color: '#FFFFFF', letterSpacing: 0.5, marginBottom: 4 },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 0.3,
    marginBottom: 16,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dividerLine: {
    width: 40, height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  dividerDot: {
    width: 5, height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },

  // Card
  kav: { flex: 1 },
  cardWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingBottom: 48,
    ...shadow.lg,
  },
  cardHeader: { alignItems: 'center', paddingVertical: 14 },
  cardPill: {
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[200],
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 28,
  },

  // Fields
  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[500],
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brand[600],
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[50],
    overflow: 'hidden',
  },
  fieldFocused: {
    borderColor: colors.brand[600],
    backgroundColor: colors.brand[50],
  },
  flagBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 6,
    backgroundColor: colors.neutral[100],
  },
  flag: { fontSize: 20 },
  dialCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  flagDivider: {
    width: 1, height: 20,
    backgroundColor: colors.neutral[200],
    marginLeft: 4,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.neutral[900],
  },

  passRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    backgroundColor: colors.neutral[50],
  },
  passIcon: { marginLeft: 14 },
  passInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 15,
    fontSize: 16,
    color: colors.neutral[900],
  },
  eyeBtn: { paddingHorizontal: 14 },

  // Button
  btnWrap: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginTop: 4,
    ...shadow.hero,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1.2,
  },

  // Hint
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 16,
    backgroundColor: colors.neutral[50],
    borderRadius: radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  hintText: {
    fontSize: 11,
    color: colors.neutral[400],
    flex: 1,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: { fontSize: 14, color: colors.neutral[500] },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand[700],
  },
});
