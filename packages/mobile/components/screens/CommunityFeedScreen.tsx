import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal,
  TextInput, ActivityIndicator, RefreshControl, Alert, Switch,
  KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { colors, radius, shadow, spacing } from '@/lib/theme';

// ── Types ──────────────────────────────────────────────────────────────────
type PostCategory = 'QUESTION' | 'ALERT' | 'TIP' | 'SALE';

interface Post {
  id: string;
  content: string;
  mediaUrls: string[];
  isAnonymous: boolean;
  category: PostCategory;
  tags: string[];
  likesCount: number;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
    role: string;
  };
}

// ── Config ─────────────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<PostCategory, { label: string; emoji: string; color: string; bg: string; border: string }> = {
  QUESTION: { label: 'Question',  emoji: '❓', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  ALERT:    { label: 'Alerte',    emoji: '⚠️', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  TIP:      { label: 'Conseil',   emoji: '💡', color: colors.brand[700], bg: colors.brand[50], border: colors.brand[200] },
  SALE:     { label: 'Vente',     emoji: '🛒', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
};

const FILTER_TABS = [
  { key: 'all',      label: 'Tout' },
  { key: 'QUESTION', label: 'Questions' },
  { key: 'ALERT',    label: 'Alertes' },
  { key: 'TIP',      label: 'Conseils' },
  { key: 'SALE',     label: 'Ventes' },
];

const ROLE_CONFIG: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
  FARMER:   { label: 'Éleveur',      emoji: '🌾', color: colors.brand[800], bg: colors.brand[50] },
  VET:      { label: 'Vétérinaire',  emoji: '🩺', color: '#1E40AF',        bg: '#EFF6FF' },
  LAB_TECH: { label: 'Technicien',   emoji: '🔬', color: '#7C3AED',        bg: '#F5F3FF' },
  ADMIN:    { label: 'Admin',         emoji: '⚙️', color: '#374151',        bg: '#F9FAFB' },
};

const MAX_MEDIA = 5;

// ── Helpers ────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function isVideo(url: string): boolean {
  return /\.(mp4|mov|webm|avi)(\?.*)?$/i.test(url);
}

// ── Media upload ────────────────────────────────────────────────────────────
async function uploadMediaAssets(assets: ImagePicker.ImagePickerAsset[]): Promise<string[]> {
  if (assets.length === 0) return [];

  const formData = new FormData();
  for (const asset of assets) {
    const filename = asset.uri.split('/').pop() || 'media';
    const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType =
      asset.type === 'video'
        ? ext === 'mov' ? 'video/quicktime' : `video/${ext}`
        : `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    formData.append('files', { uri: asset.uri, name: filename, type: mimeType } as any);
  }

  const res = await api.uploadFormData<{ urls: string[] }>('/media/upload', formData);
  if (!res.success || !res.data) {
    throw new Error(res.error?.message ?? 'Échec de l\'upload des médias.');
  }
  return res.data.urls;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function CommunityFeedScreen() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [category, setCategory]     = useState('all');
  const [createOpen, setCreateOpen] = useState(false);

  // Create post form state
  const [postContent,   setPostContent]   = useState('');
  const [postCategory,  setPostCategory]  = useState<PostCategory>('QUESTION');
  const [isAnonymous,   setIsAnonymous]   = useState(false);
  const [tagInput,      setTagInput]      = useState('');
  const [tags,          setTags]          = useState<string[]>([]);
  const [mediaAssets,   setMediaAssets]   = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [uploading,     setUploading]     = useState(false);

  // Local like tracking (per session)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['community-posts', category],
    queryFn: async () => {
      const q = category !== 'all' ? `?category=${category}&limit=50` : '?limit=50';
      const res = await api.get(`/community/posts${q}`);
      return res.success ? res.data : { posts: [], total: 0 };
    },
  });

  const posts: Post[] = data?.posts ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────
  const createPost = useMutation({
    mutationFn: async () => {
      if (!postContent.trim()) throw new Error('Le contenu ne peut pas être vide.');

      setUploading(true);
      let mediaUrls: string[] = [];
      try {
        mediaUrls = await uploadMediaAssets(mediaAssets);
      } finally {
        setUploading(false);
      }

      const res = await api.post('/community/posts', {
        content:     postContent.trim(),
        category:    postCategory,
        isAnonymous,
        tags,
        mediaUrls,
      });
      if (!res.success) throw new Error(res.error?.message ?? 'Erreur lors de la publication.');
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['community-posts'] });
      setCreateOpen(false);
      resetForm();
    },
    onError: (e: any) => Alert.alert('Erreur', e.message),
  });

  const likePost = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const res = liked
        ? await api.delete(`/community/posts/${postId}/like`)
        : await api.post(`/community/posts/${postId}/like`, {});
      if (!res.success) throw new Error('Erreur');
      return { postId, liked };
    },
    onMutate: ({ postId, liked }) => {
      setLikedIds(prev => {
        const next = new Set(prev);
        liked ? next.delete(postId) : next.add(postId);
        return next;
      });
    },
    onError: (_e, { postId, liked }) => {
      setLikedIds(prev => {
        const next = new Set(prev);
        liked ? next.add(postId) : next.delete(postId);
        return next;
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['community-posts'] }),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────
  function resetForm() {
    setPostContent('');
    setPostCategory('QUESTION');
    setIsAnonymous(false);
    setTags([]);
    setTagInput('');
    setMediaAssets([]);
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags(prev => [...prev, t]);
    }
    setTagInput('');
  };

  const removeMedia = (index: number) => {
    setMediaAssets(prev => prev.filter((_, i) => i !== index));
  };

  // ── Media pickers ────────────────────────────────────────────────────────
  const pickFromGallery = async (mediaType: 'images' | 'videos') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la galerie dans les paramètres.');
      return;
    }
    const remaining = MAX_MEDIA - mediaAssets.length;
    if (remaining <= 0) {
      Alert.alert('Limite atteinte', `Vous pouvez joindre au maximum ${MAX_MEDIA} médias.`);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'images' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
      videoMaxDuration: 60,
    });

    if (!result.canceled) {
      setMediaAssets(prev => [...prev, ...result.assets].slice(0, MAX_MEDIA));
    }
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', 'Veuillez autoriser l\'accès à la caméra dans les paramètres.');
      return;
    }
    if (mediaAssets.length >= MAX_MEDIA) {
      Alert.alert('Limite atteinte', `Vous pouvez joindre au maximum ${MAX_MEDIA} médias.`);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMediaAssets(prev => [...prev, ...result.assets].slice(0, MAX_MEDIA));
    }
  };

  const isPublishing = uploading || createPost.isPending;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#011C12', '#022C22', '#047857', '#059669']} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            <View>
              <Text style={styles.headerTitle}>Communauté</Text>
              <Text style={styles.headerSub}>{data?.total ?? 0} publication{(data?.total ?? 0) !== 1 ? 's' : ''}</Text>
            </View>
            <TouchableOpacity style={styles.newBtn} onPress={() => setCreateOpen(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Category filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterContent}
          >
            {FILTER_TABS.map(tab => {
              const active = category === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setCategory(tab.key)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        contentContainerStyle={styles.feedContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand[600]}
            colors={[colors.brand[600]]}
          />
        }
      >
        {isLoading ? (
          <ActivityIndicator color={colors.brand[600]} size="large" style={{ marginTop: 60 }} />
        ) : posts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 44, marginBottom: 12 }}>🌱</Text>
            <Text style={styles.emptyTitle}>La communauté vous attend !</Text>
            <Text style={styles.emptySub}>
              Soyez le premier à partager une question, un conseil ou une alerte avec la communauté.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateOpen(true)}>
              <Text style={styles.emptyBtnText}>Publier quelque chose</Text>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
              isLiked={likedIds.has(post.id)}
              onLike={() => likePost.mutate({ postId: post.id, liked: likedIds.has(post.id) })}
            />
          ))
        )}
      </ScrollView>

      {/* Floating create button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.88} onPress={() => setCreateOpen(true)}>
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={createOpen} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setCreateOpen(false); resetForm(); }}>
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Nouvelle publication</Text>
              <TouchableOpacity
                style={[styles.postBtn, (!postContent.trim() || isPublishing) && { opacity: 0.5 }]}
                onPress={() => createPost.mutate()}
                disabled={!postContent.trim() || isPublishing}
              >
                {isPublishing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.postBtnText}>Publier</Text>
                }
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Author row */}
              <View style={styles.authorRow}>
                <View style={styles.authorAvatar}>
                  <Text style={styles.authorAvatarText}>
                    {isAnonymous ? '?' : initials(user?.fullName ?? 'NN')}
                  </Text>
                </View>
                <View>
                  <Text style={styles.authorName}>{isAnonymous ? 'Anonyme' : user?.fullName}</Text>
                  <Text style={styles.authorSub}>Visible par tous les membres</Text>
                </View>
              </View>

              {/* Category picker */}
              <Text style={styles.fieldLabel}>CATÉGORIE</Text>
              <View style={styles.categoryGrid}>
                {(Object.entries(CATEGORY_CONFIG) as [PostCategory, typeof CATEGORY_CONFIG.QUESTION][]).map(([key, cfg]) => (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.categoryBtn,
                      { borderColor: postCategory === key ? cfg.color : colors.neutral[200] },
                      postCategory === key && { backgroundColor: cfg.bg },
                    ]}
                    onPress={() => setPostCategory(key)}
                    activeOpacity={0.8}
                  >
                    <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                    <Text style={[styles.categoryLabel, postCategory === key && { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Content */}
              <Text style={styles.fieldLabel}>CONTENU</Text>
              <TextInput
                style={styles.contentInput}
                value={postContent}
                onChangeText={setPostContent}
                placeholder={
                  postCategory === 'QUESTION' ? 'Quelle est votre question pour la communauté ?' :
                  postCategory === 'ALERT'    ? 'Décrivez l\'alerte sanitaire ou le danger observé...' :
                  postCategory === 'TIP'      ? 'Partagez votre conseil ou bonne pratique...' :
                                                'Décrivez ce que vous souhaitez vendre ou échanger...'
                }
                placeholderTextColor={colors.neutral[400]}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={2000}
              />
              <Text style={styles.charCount}>{postContent.length}/2000</Text>

              {/* Media section */}
              <Text style={styles.fieldLabel}>PHOTOS & VIDÉOS (optionnel)</Text>
              <View style={styles.mediaPickerRow}>
                <TouchableOpacity style={styles.mediaPickerBtn} onPress={() => pickFromGallery('images')}>
                  <Ionicons name="image-outline" size={20} color={colors.brand[700]} />
                  <Text style={styles.mediaPickerLabel}>Photos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaPickerBtn} onPress={() => pickFromGallery('videos')}>
                  <Ionicons name="videocam-outline" size={20} color={colors.brand[700]} />
                  <Text style={styles.mediaPickerLabel}>Vidéos</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mediaPickerBtn} onPress={pickFromCamera}>
                  <Ionicons name="camera-outline" size={20} color={colors.brand[700]} />
                  <Text style={styles.mediaPickerLabel}>Caméra</Text>
                </TouchableOpacity>
                <Text style={styles.mediaCount}>{mediaAssets.length}/{MAX_MEDIA}</Text>
              </View>

              {mediaAssets.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreviews}>
                  {mediaAssets.map((asset, index) => (
                    <View key={`${asset.uri}-${index}`} style={styles.mediaThumbWrap}>
                      <Image source={{ uri: asset.uri }} style={styles.mediaThumb} />
                      {asset.type === 'video' && (
                        <View style={styles.videoOverlay}>
                          <Ionicons name="play" size={20} color="#fff" />
                        </View>
                      )}
                      <TouchableOpacity style={styles.removeMediaBtn} onPress={() => removeMedia(index)}>
                        <Ionicons name="close-circle" size={20} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {/* Tags */}
              <Text style={[styles.fieldLabel, { marginTop: spacing[4] }]}>MOTS-CLÉS (optionnel)</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Ex: poulet, maladie..."
                  placeholderTextColor={colors.neutral[400]}
                  onSubmitEditing={addTag}
                  returnKeyType="done"
                  maxLength={30}
                />
                <TouchableOpacity style={styles.tagAddBtn} onPress={addTag}>
                  <Ionicons name="add" size={20} color={colors.brand[700]} />
                </TouchableOpacity>
              </View>
              {tags.length > 0 && (
                <View style={styles.tagsList}>
                  {tags.map(t => (
                    <TouchableOpacity
                      key={t}
                      style={styles.tagChip}
                      onPress={() => setTags(prev => prev.filter(x => x !== t))}
                    >
                      <Text style={styles.tagChipText}>#{t}</Text>
                      <Ionicons name="close" size={12} color={colors.brand[700]} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Anonymous toggle */}
              <View style={styles.anonRow}>
                <View>
                  <Text style={styles.anonLabel}>Publier anonymement</Text>
                  <Text style={styles.anonSub}>Votre nom ne sera pas affiché</Text>
                </View>
                <Switch
                  value={isAnonymous}
                  onValueChange={setIsAnonymous}
                  trackColor={{ true: colors.brand[600], false: colors.neutral[200] }}
                  thumbColor="#fff"
                />
              </View>

              {uploading && (
                <View style={styles.uploadingBanner}>
                  <ActivityIndicator color={colors.brand[600]} size="small" />
                  <Text style={styles.uploadingText}>Envoi des médias en cours…</Text>
                </View>
              )}

              <View style={{ height: 60 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────
function PostCard({
  post,
  currentUserId,
  isLiked,
  onLike,
}: {
  post: Post;
  currentUserId?: string;
  isLiked: boolean;
  onLike: () => void;
}) {
  const catCfg  = CATEGORY_CONFIG[post.category] ?? CATEGORY_CONFIG.QUESTION;
  const roleCfg = ROLE_CONFIG[post.author?.role] ?? ROLE_CONFIG.FARMER;
  const authorName = post.isAnonymous ? 'Anonyme' : (post.author?.fullName ?? 'Utilisateur');
  const avatarInitials = post.isAnonymous ? '?' : initials(post.author?.fullName ?? 'NN');

  const displayCount = isLiked ? post.likesCount + 1 : post.likesCount;

  return (
    <View style={[styles.card, shadow.sm]}>
      {/* Card top: author + time + category badge */}
      <View style={styles.cardHeader}>
        <View style={[styles.cardAvatar, { backgroundColor: post.isAnonymous ? colors.neutral[200] : colors.brand[100] }]}>
          <Text style={[styles.cardAvatarText, { color: post.isAnonymous ? colors.neutral[500] : colors.brand[800] }]}>
            {avatarInitials}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.cardAuthorRow}>
            <Text style={styles.cardAuthorName}>{authorName}</Text>
            {!post.isAnonymous && (
              <View style={[styles.roleBadge, { backgroundColor: roleCfg.bg }]}>
                <Text style={{ fontSize: 10 }}>{roleCfg.emoji}</Text>
                <Text style={[styles.roleLabel, { color: roleCfg.color }]}>{roleCfg.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardTime}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={[styles.catBadge, { backgroundColor: catCfg.bg, borderColor: catCfg.border }]}>
          <Text style={{ fontSize: 12 }}>{catCfg.emoji}</Text>
          <Text style={[styles.catLabel, { color: catCfg.color }]}>{catCfg.label}</Text>
        </View>
      </View>

      {/* Content */}
      <Text style={styles.cardContent}>{post.content}</Text>

      {/* Media */}
      {post.mediaUrls.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.mediaScroll}
          contentContainerStyle={styles.mediaScrollContent}
        >
          {post.mediaUrls.map((url, i) => (
            <View key={`${url}-${i}`} style={styles.mediaItem}>
              {isVideo(url) ? (
                <View style={styles.videoPlaceholder}>
                  <Ionicons name="play-circle" size={40} color="#fff" />
                  <Text style={styles.videoLabel}>Vidéo</Text>
                </View>
              ) : (
                <Image
                  source={{ uri: url }}
                  style={styles.mediaItemImg}
                  resizeMode="cover"
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {post.tags.map(t => (
            <View key={t} style={styles.tagPill}>
              <Text style={styles.tagPillText}>#{t}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={styles.cardDivider} />

      {/* Actions */}
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike} activeOpacity={0.7}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={isLiked ? '#EF4444' : colors.neutral[400]}
          />
          <Text style={[styles.actionCount, isLiked && { color: '#EF4444' }]}>
            {displayCount > 0 ? displayCount : 'J\'aime'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert('Commentaires', 'Les commentaires arrivent bientôt ! Pour l\'instant, utilisez les consultations pour une réponse directe d\'un vétérinaire.')}
          activeOpacity={0.7}
        >
          <Ionicons name="chatbubble-outline" size={20} color={colors.neutral[400]} />
          <Text style={styles.actionCount}>Commenter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert('Partager', 'Fonctionnalité de partage bientôt disponible.')}
          activeOpacity={0.7}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.neutral[400]} />
          <Text style={styles.actionCount}>Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {},
  headerInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[3],
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub:   { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  newBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  filterScroll:  { marginBottom: 0 },
  filterContent: { paddingHorizontal: spacing[5], gap: 8, paddingBottom: spacing[3] },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  filterChipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  filterLabel:      { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.75)' },
  filterLabelActive: { color: colors.brand[800] },

  wave: { height: 20, backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },

  feed:        { flex: 1 },
  feedContent: { padding: spacing[4], paddingBottom: 100, gap: spacing[3] },

  // Empty state
  emptyBox: {
    marginTop: 40, alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    padding: spacing[6],
    borderWidth: 1, borderColor: colors.neutral[100], borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.neutral[900], marginBottom: 8 },
  emptySub:   { fontSize: 13, color: colors.neutral[500], textAlign: 'center', lineHeight: 20, marginBottom: spacing[5] },
  emptyBtn: {
    backgroundColor: colors.brand[700], borderRadius: radius.lg,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Post card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    borderWidth: 1, borderColor: colors.neutral[100],
    padding: spacing[4],
    overflow: 'hidden',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: spacing[3] },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardAvatarText: { fontSize: 14, fontWeight: '800' },
  cardAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  cardAuthorName: { fontSize: 14, fontWeight: '700', color: colors.neutral[900] },
  roleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    borderRadius: radius.full, paddingHorizontal: 7, paddingVertical: 2,
  },
  roleLabel: { fontSize: 10, fontWeight: '700' },
  cardTime: { fontSize: 11, color: colors.neutral[400], marginTop: 2 },
  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: 9, paddingVertical: 4,
    flexShrink: 0,
  },
  catLabel: { fontSize: 11, fontWeight: '700' },

  cardContent: {
    fontSize: 14, color: colors.neutral[800], lineHeight: 21,
    marginBottom: spacing[3],
  },

  // Media in feed card
  mediaScroll: { marginBottom: spacing[3], marginHorizontal: -spacing[4] },
  mediaScrollContent: { paddingHorizontal: spacing[4], gap: 8 },
  mediaItem: {
    width: 200, height: 150,
    borderRadius: radius.lg, overflow: 'hidden',
    backgroundColor: colors.neutral[100],
  },
  mediaItemImg: { width: '100%', height: '100%' },
  videoPlaceholder: {
    width: '100%', height: '100%',
    backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },
  videoLabel: { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '600' },

  tagsRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing[3] },
  tagPill: {
    backgroundColor: colors.brand[50], borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: colors.brand[100],
  },
  tagPillText: { fontSize: 11, fontWeight: '600', color: colors.brand[700] },

  cardDivider: { height: 1, backgroundColor: colors.neutral[100], marginBottom: spacing[3] },

  cardActions: { flexDirection: 'row', justifyContent: 'space-around' },
  actionBtn:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionCount: { fontSize: 13, fontWeight: '600', color: colors.neutral[500] },

  // Floating button
  fab: {
    position: 'absolute', bottom: 80, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.brand[700],
    alignItems: 'center', justifyContent: 'center',
    ...shadow.hero,
  },

  // Create modal
  modal: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.neutral[100],
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: colors.neutral[900] },
  postBtn: {
    backgroundColor: colors.brand[700],
    borderRadius: radius.lg,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  modalBody: { flex: 1, padding: spacing[5] },

  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: spacing[5],
  },
  authorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.brand[100], alignItems: 'center', justifyContent: 'center',
  },
  authorAvatarText: { fontSize: 16, fontWeight: '800', color: colors.brand[800] },
  authorName: { fontSize: 15, fontWeight: '700', color: colors.neutral[900] },
  authorSub:  { fontSize: 11, color: colors.neutral[400], marginTop: 2 },

  fieldLabel: {
    fontSize: 11, fontWeight: '700',
    color: colors.neutral[500], letterSpacing: 0.9,
    marginBottom: 10,
  },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: spacing[5] },
  categoryBtn: {
    width: '47%', flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.xl, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.neutral[50],
  },
  categoryLabel: { fontSize: 13, fontWeight: '700', color: colors.neutral[700] },

  contentInput: {
    borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.xl, backgroundColor: colors.neutral[50],
    padding: spacing[4], minHeight: 140,
    fontSize: 15, color: colors.neutral[900], lineHeight: 22,
    marginBottom: 4,
  },
  charCount: { fontSize: 11, color: colors.neutral[400], textAlign: 'right', marginBottom: spacing[5] },

  // Media picker
  mediaPickerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: spacing[3],
  },
  mediaPickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.brand[200],
    borderRadius: radius.lg, paddingVertical: 10,
    backgroundColor: colors.brand[50],
  },
  mediaPickerLabel: { fontSize: 12, fontWeight: '700', color: colors.brand[700] },
  mediaCount: { fontSize: 12, color: colors.neutral[400], minWidth: 32, textAlign: 'right' },

  mediaPreviews: { marginBottom: spacing[4] },
  mediaThumbWrap: {
    width: 90, height: 90, borderRadius: radius.lg, overflow: 'hidden',
    marginRight: 8, position: 'relative',
  },
  mediaThumb: { width: '100%', height: '100%' },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  removeMediaBtn: {
    position: 'absolute', top: 4, right: 4,
  },

  // Uploading banner
  uploadingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.brand[50], borderRadius: radius.lg,
    padding: spacing[3], borderWidth: 1, borderColor: colors.brand[100],
    marginBottom: spacing[3],
  },
  uploadingText: { fontSize: 13, color: colors.brand[700], fontWeight: '600' },

  tagInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1, borderWidth: 1.5, borderColor: colors.neutral[200],
    borderRadius: radius.lg, backgroundColor: colors.neutral[50],
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, color: colors.neutral[900],
  },
  tagAddBtn: {
    width: 42, height: 42, borderRadius: radius.lg,
    backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.brand[200],
  },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing[5] },
  tagChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.brand[50], borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.brand[200],
  },
  tagChipText: { fontSize: 12, fontWeight: '600', color: colors.brand[700] },

  anonRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.neutral[50], borderRadius: radius.xl,
    padding: spacing[4], borderWidth: 1, borderColor: colors.neutral[100],
    marginBottom: spacing[5],
  },
  anonLabel: { fontSize: 14, fontWeight: '600', color: colors.neutral[900] },
  anonSub:   { fontSize: 12, color: colors.neutral[400], marginTop: 2 },
});
