'use client';

import { useEffect, useState } from 'react';
import { Heart, AlertTriangle, Plus, Loader2 } from 'lucide-react';
import { communityService } from '@/lib/community-service';
import { useLanguage } from '@/lib/i18n';
import { useAuth } from '@/lib/auth-context';

type Filter = 'all' | 'QUESTION' | 'ALERT' | 'TIP' | 'SALE';

const CATEGORY_CONFIG: Record<string, { label: string; cls: string }> = {
  QUESTION: { label: 'Questions', cls: 'bg-blue-100 text-blue-700' },
  ALERT: { label: 'Alertes', cls: 'bg-red-100 text-red-700' },
  TIP: { label: 'Conseils', cls: 'bg-brand-100 text-brand-700' },
  SALE: { label: 'Ventes', cls: 'bg-amber-100 text-amber-700' },
};

interface Post {
  id: string;
  content: string;
  category: string;
  tags: string[];
  likesCount: number;
  createdAt: string;
  isAnonymous: boolean;
  author?: { fullName?: string; role?: string };
}

export default function CommunityPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<'QUESTION' | 'ALERT' | 'TIP' | 'SALE'>('QUESTION');
  const [submitting, setSubmitting] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const loadPosts = () => {
    setLoading(true);
    communityService.listPosts(filter === 'all' ? undefined : filter).then((res) => {
      if (res.success && res.data) {
        const list = (res.data as any).posts || res.data as any;
        setPosts(Array.isArray(list) ? list : []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPosts();
  }, [filter]);

  const hasAlert = posts.some((p) => p.category === 'ALERT');

  const handlePost = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    await communityService.createPost({ content: newContent, category: newCategory, isAnonymous: false, tags: [] });
    setNewContent('');
    setShowModal(false);
    setSubmitting(false);
    loadPosts();
  };

  const handleLike = async (postId: string) => {
    if (likedIds.has(postId)) {
      await communityService.unlikePost(postId);
      setLikedIds((s) => { const n = new Set(s); n.delete(postId); return n; });
      setPosts((ps) => ps.map((p) => p.id === postId ? { ...p, likesCount: p.likesCount - 1 } : p));
    } else {
      await communityService.likePost(postId);
      setLikedIds((s) => new Set(s).add(postId));
      setPosts((ps) => ps.map((p) => p.id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 relative">
      {hasAlert && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">{t.community.diseaseAlert}</p>
            <p className="text-xs text-red-700 mt-0.5">Maladie signalée dans votre région</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading font-bold text-2xl text-brand-900">{t.community.title}</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-gradient"
        >
          <Plus className="w-4 h-4" />
          {t.community.newPost}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'all', label: t.community.all },
          { id: 'QUESTION', label: t.community.questions },
          { id: 'ALERT', label: t.community.alerts },
          { id: 'TIP', label: t.community.tips },
          { id: 'SALE', label: t.community.sale },
        ] as const).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as Filter)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-150 ${
              filter === f.id
                ? 'bg-brand-800 text-white border-brand-800'
                : 'bg-white text-neutral-600 border-sand-200 hover:border-brand-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-neutral-400 text-sm">
            Aucune publication dans cette catégorie.
          </div>
        ) : posts.map((post) => (
          <div key={post.id} className="bg-white border border-sand-200 rounded-2xl p-4 shadow-elevation-sm hover:shadow-elevation-md transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                  {post.isAnonymous ? '?' : (post.author?.fullName?.[0] || '?')}
                </div>
                <div>
                  <p className="text-xs font-semibold text-neutral-900">
                    {post.isAnonymous ? 'Anonyme' : (post.author?.fullName || 'Utilisateur')}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {new Date(post.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
              {post.category && CATEGORY_CONFIG[post.category] && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_CONFIG[post.category].cls}`}>
                  {CATEGORY_CONFIG[post.category].label}
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-800 leading-relaxed">{post.content}</p>
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {post.tags.map((tag) => (
                  <span key={tag} className="text-xs text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">#{tag}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-sand-100">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  likedIds.has(post.id) ? 'text-red-500' : 'text-neutral-400 hover:text-red-400'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${likedIds.has(post.id) ? 'fill-current' : ''}`} />
                {post.likesCount}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New post modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h2 className="font-heading font-bold text-lg text-brand-900 mb-4">{t.community.newPost}</h2>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="w-full border border-sand-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-brand-600"
            >
              <option value="QUESTION">Question</option>
              <option value="ALERT">Alerte</option>
              <option value="TIP">Conseil</option>
              <option value="SALE">Vente</option>
            </select>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Partagez votre expérience, posez une question..."
              rows={4}
              className="w-full border border-sand-300 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:border-brand-600"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-white border border-sand-200 text-neutral-700 font-medium text-sm py-2.5 rounded-xl hover:bg-sand-100 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handlePost}
                disabled={!newContent.trim() || submitting}
                className="flex-1 btn-gradient disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publier'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
