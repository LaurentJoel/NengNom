import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Linking } from 'react-native';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getSocket } from '@/lib/socket';
import { colors, radius, shadow, spacing, statusConfig } from '@/lib/theme';

interface Message {
  id: string;
  content: string;
  senderId: string;
  sentAt: string;
}

export default function VetChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, token } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const sendScale = useRef(new Animated.Value(1)).current;

  const { data: consultation } = useQuery({
    queryKey: ['consultation', id],
    queryFn: async () => {
      const res = await api.get(`/consultations/${id}`);
      return res.success ? res.data : null;
    },
  });

  const { data: messagesRaw, isLoading } = useQuery({
    queryKey: ['messages', id],
    queryFn: async () => {
      const res = await api.get(`/consultations/${id}/messages`);
      if (!res.success) return [];
      const d = res.data;
      return Array.isArray(d) ? d : (d?.messages ?? []);
    },
  });

  useEffect(() => {
    if (messagesRaw) setLocalMessages([...messagesRaw].reverse());
  }, [messagesRaw]);

  // Socket.io real-time
  useEffect(() => {
    if (!token || !id) return;
    const socket = getSocket(token);

    socket.emit('join-consultation', id);

    const onNewMessage = (msg: Message) => {
      setLocalMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [msg, ...prev];
      });
    };

    const onConsultationUpdated = () => {
      qc.invalidateQueries({ queryKey: ['consultation', id] });
    };

    const onVideoCallStarted = ({ callerUserId, callerName, roomName }: { callerUserId: string; callerName: string; roomName: string }) => {
      if (callerUserId === user?.id) return;
      Alert.alert(
        'Appel vidéo',
        `${callerName} a démarré un appel vidéo. Rejoindre maintenant ?`,
        [
          { text: 'Plus tard', style: 'cancel' },
          { text: 'Rejoindre', onPress: () => openVideoRoom(roomName) },
        ]
      );
    };

    socket.on('new-message', onNewMessage);
    socket.on('consultation-updated', onConsultationUpdated);
    socket.on('video-call-started', onVideoCallStarted);

    return () => {
      socket.off('new-message', onNewMessage);
      socket.off('consultation-updated', onConsultationUpdated);
      socket.off('video-call-started', onVideoCallStarted);
      socket.emit('leave-consultation', id);
    };
  }, [token, id]);

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.post(`/consultations/${id}/messages`, { content });
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
      return res.data;
    },
    onSuccess: (msg) => {
      setText('');
      setLocalMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [msg, ...prev];
      });
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/consultations/${id}`, { status: 'ACTIVE' });
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['consultation', id] }),
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch(`/consultations/${id}`, { status: 'CLOSED' });
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur');
      return res.data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['consultation', id] }); router.back(); },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || sendMutation.isPending) return;
    Animated.sequence([
      Animated.timing(sendScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
      Animated.spring(sendScale, { toValue: 1, tension: 150, useNativeDriver: true }),
    ]).start();
    sendMutation.mutate(msg);
  };

  const handleClose = () => {
    Alert.alert('Clôturer la consultation', 'Confirmez-vous la fin de cette consultation ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Clôturer', style: 'destructive', onPress: () => closeMutation.mutate() },
    ]);
  };

  const openVideoRoom = (roomName: string) => {
    const displayName = encodeURIComponent(user?.fullName ?? 'Vétérinaire');
    const url = `https://meet.jit.si/${roomName}#userInfo.displayName=${displayName}&config.prejoinPageEnabled=false&config.disableDeepLinking=true`;
    Linking.openURL(url);
  };

  const joinVideoCall = async () => {
    try {
      const res = await api.get(`/consultations/${id}/video-room`);
      if (!res.success) throw new Error(res.error?.message ?? 'Impossible de rejoindre la vidéo');
      if (!res.data?.roomName) throw new Error('Nom de salle introuvable');
      openVideoRoom(res.data.roomName);
    } catch (e: any) {
      Alert.alert('Erreur vidéo', e.message ?? 'Impossible de rejoindre la vidéo');
    }
  };

  const statusCfg  = statusConfig[(consultation?.status as keyof typeof statusConfig) ?? 'PENDING'];
  const farmerName = consultation?.farmer?.user?.fullName ?? 'Éleveur';
  const isPending  = consultation?.status === 'PENDING';
  const isActive   = consultation?.status === 'ACTIVE';
  const isVideo    = consultation?.type === 'VIDEO';

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.senderId === user?.id;
    const time   = new Date(item.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMine && (
          <View style={styles.otherAvatar}>
            <Text style={styles.otherAvatarText}>{farmerName.charAt(0)}</Text>
          </View>
        )}
        <View style={styles.bubbleWrap}>
          {isMine ? (
            <LinearGradient colors={['#047857', '#059669']} style={[styles.bubble, styles.bubbleMe]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.bubbleTextMe}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <View style={[styles.bubble, styles.bubbleOther]}>
              <Text style={styles.bubbleTextOther}>{item.content}</Text>
            </View>
          )}
          <Text style={[styles.time, isMine ? styles.timeMe : styles.timeOther]}>{time}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#011C12', '#022C22', '#047857']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View style={styles.farmerAvatar}>
                <Text style={styles.farmerAvatarText}>{farmerName.charAt(0)}</Text>
              </View>
              <View>
                <Text style={styles.farmerName} numberOfLines={1}>{farmerName}</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
                  <Text style={styles.statusLabel}>{statusCfg.label}</Text>
                </View>
              </View>
            </View>

            {isActive && (
              <TouchableOpacity onPress={joinVideoCall} style={styles.videoBtn}>
                <Ionicons name="videocam" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {isPending && (
              <TouchableOpacity
                style={styles.acceptBtn}
                onPress={() => acceptMutation.mutate()}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending
                  ? <ActivityIndicator color="#10B981" size="small" />
                  : <Text style={styles.acceptBtnText}>Accepter</Text>
                }
              </TouchableOpacity>
            )}
            {isActive && (
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                <Text style={styles.closeBtnText}>Clôturer</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      {/* Video banner for VIDEO type */}
      {isActive && isVideo && (
        <TouchableOpacity style={styles.videoBanner} onPress={joinVideoCall} activeOpacity={0.85}>
          <Ionicons name="videocam" size={18} color="#fff" />
          <Text style={styles.videoBannerText}>Rejoindre l'appel vidéo</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {consultation?.symptomsDescription && (
        <View style={styles.symptomsBanner}>
          <Ionicons name="document-text-outline" size={14} color={colors.brand[700]} />
          <Text style={styles.symptomsText} numberOfLines={3}>{consultation.symptomsDescription}</Text>
        </View>
      )}

      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? (
          <View style={styles.loadingWrap}><ActivityIndicator color={colors.brand[600]} size="large" /></View>
        ) : (
          <FlatList
            data={localMessages}
            renderItem={renderMessage}
            keyExtractor={(m) => m.id}
            inverted
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatIcon}>🩺</Text>
                <Text style={styles.emptyChatText}>Répondez à l'éleveur pour démarrer la consultation.</Text>
              </View>
            }
          />
        )}

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Votre réponse médicale..."
              placeholderTextColor={colors.neutral[400]}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
            />
          </View>
          {isActive && (
            <TouchableOpacity onPress={joinVideoCall} style={styles.videoCallBtn} activeOpacity={0.85}>
              <Ionicons name="videocam" size={20} color="#fff" />
            </TouchableOpacity>
          )}
          <Animated.View style={{ transform: [{ scale: sendScale }] }}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!text.trim() || sendMutation.isPending}
              style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
            >
              {sendMutation.isPending
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="send" size={18} color="#fff" />
              }
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {},
  headerInner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], gap: spacing[3],
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  farmerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  farmerAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  farmerName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontWeight: '500' },
  videoBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  acceptBtn: {
    backgroundColor: 'rgba(16,185,129,0.2)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.5)',
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  acceptBtnText: { fontSize: 12, fontWeight: '700', color: '#10B981' },
  closeBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  closeBtnText: { fontSize: 12, fontWeight: '700', color: '#FCA5A5' },
  wave: { height: 16, backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16 },

  videoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#7C3AED', paddingHorizontal: spacing[4], paddingVertical: 12,
  },
  videoBannerText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },

  symptomsBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    margin: spacing[4], marginTop: spacing[2],
    backgroundColor: colors.brand[50], borderRadius: radius.lg,
    padding: spacing[3], borderWidth: 1, borderColor: colors.brand[100],
  },
  symptomsText: { flex: 1, fontSize: 12, color: colors.neutral[700], lineHeight: 18 },

  kav: { flex: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: spacing[4] },

  msgRow: { flexDirection: 'row', marginBottom: spacing[3], alignItems: 'flex-end', gap: 8 },
  msgRowMe:    { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  otherAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.brand[100], alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  otherAvatarText: { fontSize: 13, fontWeight: '700', color: colors.brand[800] },
  bubbleWrap: { maxWidth: '75%' },
  bubble: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe:    { borderBottomRightRadius: 6, ...shadow.sm },
  bubbleOther: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 6, borderWidth: 1, borderColor: colors.neutral[100], ...shadow.sm },
  bubbleTextMe:    { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  bubbleTextOther: { fontSize: 14, color: colors.neutral[900], lineHeight: 20 },
  time: { fontSize: 10, marginTop: 4 },
  timeMe:    { color: colors.neutral[400], textAlign: 'right' },
  timeOther: { color: colors.neutral[400], textAlign: 'left' },

  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyChatIcon: { fontSize: 48, marginBottom: 12 },
  emptyChatText: { fontSize: 14, color: colors.neutral[500], textAlign: 'center', lineHeight: 21 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[3],
    backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: colors.neutral[100],
    gap: spacing[3], ...shadow.md,
  },
  inputWrap: {
    flex: 1, backgroundColor: colors.neutral[50], borderRadius: radius.xl,
    borderWidth: 1.5, borderColor: colors.neutral[200], paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120,
  },
  input: { fontSize: 15, color: colors.neutral[900], lineHeight: 20 },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand[700], alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  sendBtnDisabled: { backgroundColor: colors.neutral[300] },
  videoCallBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
});
