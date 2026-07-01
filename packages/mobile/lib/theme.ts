export const colors = {
  // Brand greens
  brand: {
    950: '#011C12',
    900: '#022C22',
    800: '#065F46',
    700: '#047857',
    600: '#059669',
    500: '#10B981',
    400: '#34D399',
    300: '#6EE7B7',
    200: '#A7F3D0',
    100: '#D1FAE5',
    50:  '#ECFDF5',
  },
  // Neutrals
  neutral: {
    950: '#030712',
    900: '#111827',
    800: '#1F2937',
    700: '#374151',
    600: '#4B5563',
    500: '#6B7280',
    400: '#9CA3AF',
    300: '#D1D5DB',
    200: '#E5E7EB',
    100: '#F3F4F6',
    50:  '#F9FAFB',
  },
  // Warm sand
  sand: {
    100: '#F8F5F0',
    200: '#EDE8E0',
    300: '#D4C9B8',
  },
  // Amber
  amber: {
    600: '#D97706',
    500: '#F59E0B',
    400: '#FBBF24',
    100: '#FEF3C7',
    50:  '#FFFBEB',
  },
  // Blue
  blue: {
    600: '#2563EB',
    500: '#3B82F6',
    100: '#DBEAFE',
    50:  '#EFF6FF',
  },
  // Red
  red: {
    600: '#DC2626',
    500: '#EF4444',
    100: '#FEE2E2',
    50:  '#FFF1F2',
  },
  // Purple
  purple: {
    600: '#7C3AED',
    500: '#8B5CF6',
    100: '#EDE9FE',
    50:  '#F5F3FF',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
}

export const gradients = {
  hero:        ['#011C12', '#022C22', '#047857'] as const,
  heroMid:     ['#022C22', '#065F46', '#059669'] as const,
  button:      ['#047857', '#059669', '#10B981'] as const,
  buttonAmber: ['#D97706', '#F59E0B', '#FBBF24'] as const,
  buttonBlue:  ['#1D4ED8', '#2563EB', '#3B82F6'] as const,
  chat:        ['#047857', '#059669'] as const,
  card:        ['#FFFFFF', '#F8F5F0'] as const,
}

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
}

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
}

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 12,
  },
  hero: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 16,
  },
}

export const statusConfig = {
  PENDING: {
    label: 'En attente',
    bg:    '#FEF3C7',
    text:  '#92400E',
    dot:   '#F59E0B',
    icon:  'time-outline',
  },
  ACTIVE: {
    label: 'Active',
    bg:    '#D1FAE5',
    text:  '#065F46',
    dot:   '#10B981',
    icon:  'chatbubbles-outline',
  },
  CLOSED: {
    label: 'Terminée',
    bg:    '#F3F4F6',
    text:  '#374151',
    dot:   '#9CA3AF',
    icon:  'checkmark-circle-outline',
  },
  CANCELLED: {
    label: 'Annulée',
    bg:    '#FEE2E2',
    text:  '#991B1B',
    dot:   '#EF4444',
    icon:  'close-circle-outline',
  },
} as const

export const typeConfig = {
  CHAT:      { label: 'Chat',      icon: 'chatbubble-outline',   color: '#059669' },
  VOICE:     { label: 'Voix',      icon: 'call-outline',          color: '#2563EB' },
  VIDEO:     { label: 'Vidéo',     icon: 'videocam-outline',      color: '#7C3AED' },
  EMERGENCY: { label: 'Urgence',   icon: 'alert-circle-outline',  color: '#DC2626' },
} as const
