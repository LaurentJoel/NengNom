'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Stethoscope,
  Clock,
  CheckCircle,
  Users,
  ArrowRight,
  MessageSquare,
  Star,
  TrendingUp,
  Loader2,
  Calendar,
  FlaskConical,
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { consultationsService } from '@/lib/consultations-service';
import { useAuth } from '@/lib/auth-context';

interface StatCard {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  bg: string;
  link?: string;
}

interface ConsultShape {
  id: string;
  status: string;
  type: string;
  symptomsDescription?: string;
  farmer?: { user?: { fullName: string } };
  createdAt: string;
  fee?: number;
}

export default function VetDashboard() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultShape[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    active: 0,
    pending: 0,
    completed: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    consultationsService.listConsultations(1, 20).then((res) => {
      if (res.success && res.data) {
        const list = ((res.data as any).consultations || []) as ConsultShape[];
        setConsultations(list.slice(0, 5));
        setStats({
          active: list.filter((c) => c.status === 'ACTIVE').length,
          pending: list.filter((c) => c.status === 'PENDING').length,
          completed: list.filter((c) => c.status === 'COMPLETED' || c.status === 'CLOSED').length,
          totalEarnings: list
            .filter((c) => c.status === 'COMPLETED' || c.status === 'CLOSED')
            .reduce((sum, c) => sum + (c.fee || 0), 0),
        });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  const statCards: StatCard[] = [
    {
      label: 'Consultations actives',
      value: stats.active,
      icon: MessageSquare,
      color: 'text-green-700',
      bg: 'bg-green-50 border-green-200',
      link: '/consultations',
    },
    {
      label: 'En attente',
      value: stats.pending,
      icon: Clock,
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      link: '/consultations',
    },
    {
      label: 'Complétées',
      value: stats.completed,
      icon: CheckCircle,
      color: 'text-brand-700',
      bg: 'bg-brand-50 border-brand-200',
    },
    {
      label: 'Revenus (FCFA)',
      value: stats.totalEarnings > 0 ? stats.totalEarnings.toLocaleString('fr-FR') : '—',
      icon: TrendingUp,
      color: 'text-purple-700',
      bg: 'bg-purple-50 border-purple-200',
    },
  ];

  return (
    <div className="max-w-content mx-auto space-y-6">
      {/* Welcome header */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-900 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-600/30 rounded-full blur-xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-4 h-4 text-white" />
            </div>
            <span className="text-brand-300 text-xs font-medium uppercase tracking-wide">Espace Vétérinaire</span>
          </div>
          <h1 className="font-heading font-bold text-2xl text-white mb-1">
            {greeting()}, Dr. {user?.fullName?.replace(/^Dr\.\s*/, '').split(' ')[0] || 'Docteur'}
          </h1>
          <p className="text-brand-300 text-sm">
            {stats.active > 0
              ? `Vous avez ${stats.active} consultation${stats.active > 1 ? 's' : ''} active${stats.active > 1 ? 's' : ''} en cours.`
              : 'Aucune consultation active pour le moment.'}
            {stats.pending > 0 && ` ${stats.pending} demande${stats.pending > 1 ? 's' : ''} en attente.`}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          const inner = (
            <div className={`bg-white border ${card.bg.split(' ')[1]} rounded-xl p-4 h-full hover:shadow-md transition-all duration-200`}>
              <div className={`w-9 h-9 ${card.bg} border rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <p className="text-2xl font-bold text-neutral-900 mb-1">{card.value}</p>
              <p className="text-xs text-neutral-500">{card.label}</p>
            </div>
          );
          return card.link ? (
            <Link key={card.label} href={card.link}>{inner}</Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      {/* Recent consultations */}
      <div className="bg-white border border-sand-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-brand-700" />
            <h2 className="font-semibold text-sm text-neutral-900">Consultations récentes</h2>
          </div>
          <Link href="/consultations" className="group text-xs font-medium text-brand-700 hover:text-brand-900 flex items-center gap-1 transition-colors">
            Voir tout <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
          </div>
        ) : consultations.length === 0 ? (
          <div className="text-center py-12">
            <Stethoscope className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">Aucune consultation pour le moment.</p>
            <p className="text-xs text-neutral-400 mt-1">Les demandes des éleveurs apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-sand-100">
            {consultations.map((c) => {
              const farmerName = c.farmer?.user?.fullName || 'Éleveur';
              const initials = farmerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
              const isActive = c.status === 'ACTIVE';
              const isPending = c.status === 'PENDING';
              return (
                <Link
                  key={c.id}
                  href={`/consultations/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-sand-50 transition-colors group"
                >
                  <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center text-brand-800 font-semibold text-xs flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-neutral-900 truncate">{farmerName}</p>
                      {isActive && <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-neutral-500 truncate mt-0.5">
                      {c.symptomsDescription ? c.symptomsDescription.slice(0, 60) + (c.symptomsDescription.length > 60 ? '…' : '') : 'Aucune description'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-green-100 text-green-700' :
                      isPending ? 'bg-amber-100 text-amber-700' :
                      'bg-sand-200 text-neutral-600'
                    }`}>
                      {isActive ? 'Active' : isPending ? 'En attente' : 'Terminée'}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/consultations"
          className="flex items-center gap-3 bg-white border border-sand-200 rounded-xl p-4 hover:border-brand-400 hover:bg-brand-50 transition-all group"
        >
          <div className="w-9 h-9 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <MessageSquare className="w-4 h-4 text-brand-700" />
          </div>
          <div>
            <p className="font-medium text-sm text-neutral-900">Consultations</p>
            <p className="text-xs text-neutral-500">Gérer les demandes</p>
          </div>
        </Link>
        <Link
          href="/lab-requests"
          className="flex items-center gap-3 bg-white border border-sand-200 rounded-xl p-4 hover:border-brand-400 hover:bg-brand-50 transition-all group"
        >
          <div className="w-9 h-9 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <FlaskConical className="w-4 h-4 text-brand-700" />
          </div>
          <div>
            <p className="font-medium text-sm text-neutral-900">Demandes de labo</p>
            <p className="text-xs text-neutral-500">Résultats d'analyses</p>
          </div>
        </Link>
        <Link
          href="/community"
          className="flex items-center gap-3 bg-white border border-sand-200 rounded-xl p-4 hover:border-brand-400 hover:bg-brand-50 transition-all group"
        >
          <div className="w-9 h-9 bg-brand-50 border border-brand-200 rounded-lg flex items-center justify-center group-hover:bg-brand-100 transition-colors">
            <Users className="w-4 h-4 text-brand-700" />
          </div>
          <div>
            <p className="font-medium text-sm text-neutral-900">Communauté</p>
            <p className="text-xs text-neutral-500">Partager des conseils</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
