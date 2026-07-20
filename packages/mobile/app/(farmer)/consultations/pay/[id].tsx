import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { colors, radius, shadow, spacing } from '@/lib/theme';

const TYPE_LABELS: Record<string, string> = {
  CHAT: 'Consultation par chat',
  VIDEO: 'Consultation vidéo',
  VOICE: 'Consultation vocale',
  EMERGENCY: 'Consultation d\'urgence',
};

const TYPE_ICONS: Record<string, string> = {
  CHAT: 'chatbubbles',
  VIDEO: 'videocam',
  VOICE: 'call',
  EMERGENCY: 'alert-circle',
};

export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const [paid, setPaid] = useState(false);

  const { data: consultation, isLoading } = useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      const res = await api.get(`/consultations/${id}`);
      return res.success ? res.data : null;
    },
  });

  // Listen for payment-confirmed in case it comes from another device/tab
  useEffect(() => {
    if (!token || !id) return;
    const socket = getSocket(token);
    socket.emit('join-consultation', id);

    const onConfirmed = () => {
      setPaid(true);
      setTimeout(() => router.replace(`/(farmer)/consultations/${id}` as any), 500);
    };
    socket.on('payment-confirmed', onConfirmed);
    return () => {
      socket.off('payment-confirmed', onConfirmed);
    };
  }, [token, id]);

  const payMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/consultations/${id}/pay`);
      if (!res.success) throw new Error(res.error?.message ?? 'Paiement échoué');
      return res.data;
    },
    onSuccess: () => {
      setPaid(true);
      setTimeout(() => router.replace(`/(farmer)/consultations/${id}` as any), 600);
    },
    onError: (e: any) => Alert.alert('Erreur de paiement', e.message),
  });

  if (isLoading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
      </View>
    );
  }

  const type = consultation?.type ?? 'CHAT';
  const fee = consultation?.fee ? Number(consultation.fee) : 2000;
  const vetName = consultation?.vet?.user?.fullName ?? 'Vétérinaire disponible';
  const iconName = TYPE_ICONS[type] ?? 'chatbubbles';

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#011C12', '#022C22', '#047857']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Paiement requis</Text>
            <View style={{ width: 38 }} />
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <View style={styles.body}>
        {/* Consultation summary card */}
        <View style={[styles.summaryCard, shadow.md]}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName as any} size={28} color={type === 'VIDEO' ? '#7C3AED' : colors.brand[600]} />
          </View>
          <Text style={styles.typeLabel}>{TYPE_LABELS[type] ?? type}</Text>
          <Text style={styles.vetLabel}>avec {vetName}</Text>

          <View style={styles.divider} />

          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Montant à régler</Text>
            <Text style={styles.amountValue}>{fee.toLocaleString('fr-FR')} FCFA</Text>
          </View>
        </View>

        {/* Info box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.brand[600]} />
          <Text style={styles.infoText}>
            Votre paiement donne accès immédiat au chat et aux appels vidéo pour cette consultation.
          </Text>
        </View>

        {/* Payment method placeholder */}
        <View style={styles.methodCard}>
          <Ionicons name="phone-portrait-outline" size={22} color={colors.neutral[600]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Mobile Money</Text>
            <Text style={styles.methodSub}>Orange Money · MTN MoMo · Wave</Text>
          </View>
          <Ionicons name="checkmark-circle" size={22} color={colors.brand[600]} />
        </View>
      </View>

      {/* Pay button */}
      <SafeAreaView edges={['bottom']} style={styles.footer}>
        {paid ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={22} color="#059669" />
            <Text style={styles.successText}>Paiement confirmé — redirection…</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.payBtn, payMutation.isPending && { opacity: 0.6 }]}
            onPress={() => payMutation.mutate()}
            disabled={payMutation.isPending}
            activeOpacity={0.88}
          >
            {payMutation.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="lock-closed" size={18} color="#fff" />
                <Text style={styles.payBtnText}>Confirmer le paiement — {fee.toLocaleString('fr-FR')} FCFA</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F9FAFB' },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {},
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4],
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  wave: { height: 16, backgroundColor: '#F9FAFB', borderTopLeftRadius: 16, borderTopRightRadius: 16 },

  body: { flex: 1, padding: spacing[5], gap: spacing[4] },

  summaryCard: {
    backgroundColor: '#fff', borderRadius: radius['2xl'],
    padding: spacing[6], alignItems: 'center',
    borderWidth: 1, borderColor: colors.neutral[100],
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[3],
  },
  typeLabel: { fontSize: 18, fontWeight: '800', color: colors.neutral[900], marginBottom: 4 },
  vetLabel: { fontSize: 13, color: colors.neutral[500] },
  divider: { height: 1, backgroundColor: colors.neutral[100], alignSelf: 'stretch', marginVertical: spacing[4] },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch' },
  amountLabel: { fontSize: 14, color: colors.neutral[600] },
  amountValue: { fontSize: 22, fontWeight: '900', color: colors.brand[700] },

  infoBox: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: colors.brand[50], borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.brand[100],
  },
  infoText: { flex: 1, fontSize: 13, color: colors.brand[800], lineHeight: 19 },

  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[200],
  },
  methodTitle: { fontSize: 14, fontWeight: '700', color: colors.neutral[900] },
  methodSub: { fontSize: 11, color: colors.neutral[500], marginTop: 2 },

  footer: {
    paddingHorizontal: spacing[5], paddingBottom: spacing[4], paddingTop: spacing[3],
    backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: colors.neutral[100],
  },
  payBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.brand[700], borderRadius: radius.xl, paddingVertical: 16,
  },
  payBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  successRow: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center', paddingVertical: 16 },
  successText: { fontSize: 15, fontWeight: '700', color: '#059669' },
});
