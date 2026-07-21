import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, shadow, spacing } from '@/lib/theme';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

const WELCOME = `Bonjour ! Je suis votre assistant IA vétérinaire. 🌿

Je peux vous aider avec :
• Des conseils sur la santé de votre troupeau
• Des recommandations nutritionnelles
• Des alertes sur les maladies courantes
• Des bonnes pratiques d'élevage

Comment puis-je vous aider aujourd'hui ?`;

export default function AIChatScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: WELCOME,
      timestamp: new Date(),
    },
  ]);
  const [inputText,  setInputText]  = useState('');
  const [isLoading,  setIsLoading]  = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const firstName = user?.fullName?.split(' ')[0] ?? 'Éleveur';

  useEffect(() => {
    // Load latest AI suggestions as a follow-up context message
    (async () => {
      const res = await api.get('/ai/suggestions/latest');
      if (!res.success || !res.data) return;

      let parsed: any[] = res.data.parsed ?? [];
      if (parsed.length === 0 && typeof res.data.suggestion === 'string') {
        try { parsed = JSON.parse(res.data.suggestion); } catch {}
      }

      if (parsed.length === 0) return;

      const bulletList = parsed
        .slice(0, 3)
        .map((s: any) => `• ${s.title ?? s.content?.slice(0, 60) ?? ''}`)
        .join('\n');

      const contextMsg: Message = {
        id: 'context',
        role: 'assistant',
        text: `Voici mes dernières recommandations pour votre ferme :\n\n${bulletList}\n\nPosez-moi des questions sur l'un de ces points ou sur n'importe quel autre sujet concernant votre élevage.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, contextMsg]);
    })();
  }, []);

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    setInputText('');

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Call the backend AI chat endpoint
      const res = await api.post('/ai/chat', { message: text });

      const reply: string = res.success
        ? (res.data?.reply ?? res.data?.message ?? res.data?.content ?? '')
        : '';

      if (!reply) throw new Error('empty');

      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', text: reply, timestamp: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: `Désolé, je n'ai pas pu vous répondre. Vérifiez votre connexion et réessayez.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Scroll to end when messages change
  useEffect(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={{ fontSize: 16 }}>🤖</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.text}
          </Text>
          <Text style={[styles.bubbleTime, isUser && { color: 'rgba(255,255,255,0.6)' }]}>
            {item.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
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
            <View style={styles.botInfo}>
              <View style={styles.botAvatarLarge}>
                <Text style={{ fontSize: 20 }}>🤖</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Assistant IA</Text>
                <View style={styles.onlineRow}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.onlineText}>En ligne · Neng-Nom AI</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => router.push('/(farmer)/ai')}
            >
              <Ionicons name="sparkles-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Typing indicator */}
        {isLoading && (
          <View style={styles.typingRow}>
            <View style={styles.botAvatar}>
              <Text style={{ fontSize: 14 }}>🤖</Text>
            </View>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={colors.brand[600]} />
              <Text style={styles.typingText}>En train de réfléchir...</Text>
            </View>
          </View>
        )}

        {/* Quick suggestions */}
        {messages.length <= 2 && !isLoading && (
          <View style={styles.quickSuggestions}>
            {[
              'Mes poules sont malades 🐔',
              'Comment trouver un vétérinaire ?',
              'Prochaine vaccination ?',
              'Comment voir mes analyses ?',
            ].map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickChip}
                onPress={() => { setInputText(q); }}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Posez votre question..."
            placeholderTextColor={colors.neutral[400]}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAF9' },

  header: {},
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  botInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  botAvatarLarge: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80' },
  onlineText: { fontSize: 11, color: 'rgba(255,255,255,0.65)' },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  messageList: { padding: spacing[4], paddingBottom: spacing[3] },

  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 12,
  },
  msgRowUser: { flexDirection: 'row-reverse' },

  botAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.brand[100],
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.brand[700],
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  userAvatarText: { fontSize: 13, fontWeight: '800', color: '#fff' },

  bubble: {
    maxWidth: '78%',
    borderRadius: radius['2xl'],
    padding: spacing[3],
    paddingHorizontal: 14,
  },
  bubbleBot: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.neutral[100],
    ...shadow.sm,
  },
  bubbleUser: {
    backgroundColor: colors.brand[700],
    borderBottomRightRadius: 4,
  },
  bubbleText: { fontSize: 14, color: colors.neutral[800], lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTime: { fontSize: 10, color: colors.neutral[400], marginTop: 4, textAlign: 'right' },

  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  typingText: { fontSize: 13, color: colors.neutral[500] },

  quickSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  quickChip: {
    backgroundColor: colors.brand[50],
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.brand[100],
  },
  quickChipText: { fontSize: 12, fontWeight: '600', color: colors.brand[700] },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.neutral[900],
    backgroundColor: colors.neutral[50],
  },
  sendBtn: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand[700],
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  sendBtnDisabled: { backgroundColor: colors.neutral[300] },
});
