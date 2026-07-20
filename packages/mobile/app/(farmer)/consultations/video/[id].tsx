import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebView from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/lib/theme';

export default function FarmerVideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [webViewLoading, setWebViewLoading] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ['video-room', id],
    queryFn: async () => {
      const res = await api.get(`/consultations/${id}/video-room`);
      if (!res.success) throw new Error(res.error?.message ?? 'Impossible d\'obtenir la salle vidéo');
      return res.data as { roomName: string };
    },
    retry: false,
  });

  const buildJitsiUrl = useCallback((roomName: string) => {
    const displayName = encodeURIComponent(user?.fullName ?? 'Éleveur');
    return (
      `https://meet.jit.si/${roomName}` +
      `#userInfo.displayName=${displayName}` +
      `&config.prejoinPageEnabled=false` +
      `&config.disableDeepLinking=true` +
      `&config.startWithAudioMuted=false` +
      `&config.startWithVideoMuted=false` +
      `&config.enableNoisyMicDetection=false` +
      `&config.disableInviteFunctions=true`
    );
  }, [user?.fullName]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.brand[600]} size="large" />
        <Text style={styles.loadingText}>Connexion à l'appel…</Text>
      </View>
    );
  }

  if (error || !data?.roomName) {
    return (
      <View style={styles.center}>
        <Ionicons name="videocam-off" size={48} color={colors.neutral[400]} />
        <Text style={styles.errorText}>{(error as any)?.message ?? 'Salle introuvable'}</Text>
        <TouchableOpacity style={styles.backFromError} onPress={() => router.back()}>
          <Text style={styles.backFromErrorText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.bar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.barTitle}>Appel vidéo</Text>
        <View style={{ width: 38 }} />
      </SafeAreaView>

      {webViewLoading && (
        <View style={styles.webViewLoader}>
          <ActivityIndicator color={colors.brand[600]} size="large" />
        </View>
      )}

      <WebView
        source={{ uri: buildJitsiUrl(data.roomName) }}
        style={styles.webView}
        javaScriptEnabled
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        onLoad={() => setWebViewLoading(false)}
        onPermissionRequest={(request) => request.grant(request.resources)}
        onError={(e) => {
          Alert.alert('Erreur vidéo', e.nativeEvent.description ?? 'Connexion impossible');
          router.back();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#fff' },
  loadingText: { fontSize: 14, color: colors.neutral[500], marginTop: 8 },
  errorText: { fontSize: 14, color: colors.neutral[600], textAlign: 'center', marginHorizontal: 32 },
  backFromError: {
    marginTop: 8, paddingHorizontal: 20, paddingVertical: 10,
    backgroundColor: colors.brand[600], borderRadius: 20,
  },
  backFromErrorText: { color: '#fff', fontWeight: '700' },

  bar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 10,
    backgroundColor: '#111',
  },
  closeBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  barTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },

  webView: { flex: 1 },
  webViewLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
