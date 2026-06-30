'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand-200 transition-colors text-neutral-600"
            aria-label="Retour"
          >
            <ArrowLeft size={16} />
          </Link>
        )}
        <div>
          <h1 className="font-heading font-bold text-2xl text-brand-900">{title}</h1>
          {subtitle && <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-b from-white to-sand-100/50 border border-sand-200 rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-sand-200 to-sand-100 rounded-2xl flex items-center justify-center mx-auto mb-5 text-neutral-400 shadow-elevation-sm">
        {icon}
      </div>
      <p className="font-heading font-semibold text-neutral-800 text-base mb-2">{title}</p>
      <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle size={20} className="text-red-500" />
      </div>
      <p className="font-semibold text-red-800 text-sm mb-1">Une erreur est survenue</p>
      <p className="text-xs text-red-600 mb-4">{message ?? 'Impossible de charger les données. Veuillez réessayer.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-700 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
        >
          <RefreshCw size={14} />
          Réessayer
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-sand-200 rounded-lg ${className ?? ''}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-sand-200 rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-content mx-auto space-y-6 animate-pulse">
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export function SuccessToast({ message }: { message: string }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-brand-800 text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
      <span className="w-4 h-4 bg-brand-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M2 6l3 3 5-5" />
        </svg>
      </span>
      {message}
    </div>
  );
}
