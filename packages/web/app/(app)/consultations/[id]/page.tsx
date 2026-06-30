'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Paperclip, Star, Loader2 } from 'lucide-react';
import { consultationsService } from '@/lib/consultations-service';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';

interface MsgShape {
  id: string;
  senderId: string;
  content?: string;
  sentAt: string;
  sender?: { id: string; fullName: string };
}

interface ConsultationShape {
  id: string;
  status: string;
  type: string;
  fee?: number;
  symptomsDescription?: string;
  vet?: {
    id: string;
    specialization?: string;
    hourlyRate?: number;
    user?: { id: string; fullName: string };
  };
  farmer?: { user?: { id: string; fullName: string } };
  messages: MsgShape[];
  createdAt: string;
}

export default function ConsultationDetailPage({ params }: { params: { id: string } }) {
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const [consult, setConsult] = useState<ConsultationShape | null>(null);
  const [messages, setMessages] = useState<MsgShape[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMsgCountRef = useRef(0);

  const fetchMessages = async (consultId: string) => {
    const res = await consultationsService.getMessages(consultId);
    if (res.success && res.data) {
      const data = res.data as any;
      const msgs = (Array.isArray(data) ? data : data.messages ?? []) as MsgShape[];
      if (msgs.length !== lastMsgCountRef.current) {
        lastMsgCountRef.current = msgs.length;
        setMessages(msgs);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    consultationsService.getConsultation(params.id).then((res) => {
      if (cancelled) return;
      if (res.success && res.data) {
        const c = res.data as unknown as ConsultationShape;
        setConsult(c);
        const msgs = c.messages || [];
        setMessages(msgs);
        lastMsgCountRef.current = msgs.length;

        if (c.status === 'ACTIVE') {
          pollingRef.current = setInterval(() => fetchMessages(params.id), 4000);
        }
      }
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });

    return () => {
      cancelled = true;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [params.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    const content = message;
    setMessage('');
    const res = await consultationsService.sendMessage(params.id, content);
    if (res.success && res.data) {
      setMessages((prev) => [...prev, res.data as unknown as MsgShape]);
    } else {
      // Optimistic fallback
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), senderId: (user as any)?.id || '', content, sentAt: new Date().toISOString() },
      ]);
    }
    setSending(false);
  };

  const myUserId = (user as any)?.id;
  const isMine = (msg: MsgShape) => msg.senderId === myUserId || msg.sender?.id === myUserId;

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!consult) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Consultation introuvable.</p>
        <Link href="/consultations" className="text-brand-700 text-sm mt-2 inline-block hover:underline">← Retour</Link>
      </div>
    );
  }

  const vetName = consult.vet?.user?.fullName || 'Vétérinaire';
  const vetInitial = vetName.split(' ').slice(-1)[0]?.[0] || '?';
  const isActive = consult.status === 'ACTIVE';

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-6">
      {/* Chat */}
      <div className="flex-1 flex flex-col bg-white border border-sand-200 rounded-xl overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-sand-200">
          <Link href="/consultations" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-100 transition-colors text-neutral-600">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center text-brand-800 font-semibold text-sm flex-shrink-0">
            {vetInitial}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm text-neutral-900">{vetName}</p>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-neutral-300'}`} />
              <p className="text-xs text-neutral-500">{isActive ? t.consultDetail.online : consult.status}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${
            isActive ? 'bg-green-100 text-green-700' : consult.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-sand-200 text-neutral-600'
          }`}>
            {consult.status === 'ACTIVE' ? t.consultations.activeStatus : consult.status === 'PENDING' ? 'En attente' : t.consultations.completed}
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-12 text-neutral-400 text-sm">
              {consult.symptomsDescription && (
                <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 text-left mb-4 max-w-sm mx-auto">
                  <p className="text-xs text-neutral-500 font-medium mb-1">Description des symptômes</p>
                  <p className="text-sm text-neutral-700">{consult.symptomsDescription}</p>
                </div>
              )}
              <p>Aucun message pour le moment. Commencez la conversation.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                isMine(msg)
                  ? 'bg-brand-50 border border-brand-100 rounded-tr-sm'
                  : 'bg-white border border-sand-200 rounded-tl-sm'
              }`}>
                <p className="text-sm text-neutral-800 leading-relaxed">{msg.content}</p>
                <p className="text-xs text-neutral-400 mt-1.5 text-right">
                  {new Date(msg.sentAt).toLocaleTimeString(locale === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        {isActive && (
          <form onSubmit={handleSend} className="p-4 border-t border-sand-200">
            <div className="flex items-center gap-2 bg-sand-100 border border-sand-200 rounded-xl px-3 py-2">
              <button type="button" className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <Paperclip className="w-4 h-4" />
              </button>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t.consultations.yourMessage}
                className="flex-1 bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="w-8 h-8 icon-gradient-bg text-white rounded-lg flex items-center justify-center disabled:opacity-50 hover:scale-105 transition-all duration-200"
              >
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Right panel */}
      <div className="hidden xl:flex w-72 flex-col gap-4 flex-shrink-0">
        {/* Vet card */}
        {consult.vet && (
          <div className="bg-white border border-sand-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-800 font-bold text-base">
                {vetInitial}
              </div>
              <div>
                <p className="font-semibold text-sm text-neutral-900">{vetName}</p>
                <p className="text-xs text-neutral-500">{consult.vet.specialization}</p>
              </div>
            </div>
            <div className="text-xs text-neutral-600 space-y-1">
              <div className="flex justify-between">
                <span>{t.consultDetail.type}</span>
                <span className="font-medium text-neutral-900">{consult.type === 'EMERGENCY' ? t.newConsult.urgency : t.newConsult.normal}</span>
              </div>
              {consult.vet.hourlyRate && (
                <div className="flex justify-between">
                  <span>{t.consultDetail.rate}</span>
                  <span className="font-medium text-neutral-900">{Number(consult.vet.hourlyRate).toLocaleString('fr-FR')} FCFA</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Date</span>
                <span className="font-medium text-neutral-900">{new Date(consult.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms */}
        {consult.symptomsDescription && (
          <div className="bg-white border border-sand-200 rounded-xl p-5">
            <p className="font-semibold text-xs text-neutral-600 uppercase tracking-wide mb-3">Symptômes</p>
            <p className="text-sm text-neutral-700 leading-relaxed">{consult.symptomsDescription}</p>
          </div>
        )}

        {/* Notes */}
        <div className="bg-white border border-sand-200 rounded-xl p-5 flex-1">
          <p className="font-semibold text-xs text-neutral-600 uppercase tracking-wide mb-3">{t.consultations.caseNotes}</p>
          <textarea
            rows={5}
            placeholder={t.consultations.notesPlaceholder}
            className="w-full bg-sand-100 border border-sand-200 rounded-lg px-3 py-2 text-xs text-neutral-700 placeholder:text-neutral-400 focus:outline-none focus:border-brand-600 transition-colors resize-none"
          />
        </div>

        {isActive && (
          <button
            onClick={async () => {
              await consultationsService.updateConsultation(consult.id, { status: 'CLOSED' as any });
              if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
              }
              setConsult((prev) => prev ? { ...prev, status: 'CLOSED' } : prev);
            }}
            className="w-full bg-red-50 border border-red-200 text-red-600 font-medium text-sm py-3 rounded-lg hover:bg-red-100 transition-colors"
          >
            {t.consultations.endConsultation}
          </button>
        )}
      </div>
    </div>
  );
}
