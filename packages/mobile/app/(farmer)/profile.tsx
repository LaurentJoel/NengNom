import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, shadow, spacing } from '@/lib/theme';

interface MenuItem {
  icon: string;
  label: string;
  sub?: string;
  onPress: () => void;
  danger?: boolean;
}

export default function FarmerProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/auth/login');
          },
        },
      ],
    );
  };

  const initials = user?.fullName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'NN';

  const menuGroups: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Mon compte',
      items: [
        {
          icon: 'person-outline',
          label: 'Informations personnelles',
          sub: user?.fullName ?? '',
          onPress: () => {},
        },
        {
          icon: 'call-outline',
          label: 'Téléphone',
          sub: user?.phone ?? '',
          onPress: () => {},
        },
        {
          icon: 'location-outline',
          label: 'Région',
          sub: user?.region ?? user?.country ?? '—',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Ma ferme',
      items: [
        {
          icon: 'leaf-outline',
          label: 'Informations de la ferme',
          onPress: () => {},
        },
        {
          icon: 'bar-chart-outline',
          label: 'Historique des données',
          onPress: () => {},
        },
        {
          icon: 'document-text-outline',
          label: 'Rapports de santé',
          onPress: () => {},
        },
      ],
    },
    {
      title: 'Application',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Notifications',
          onPress: () => {},
        },
        {
          icon: 'language-outline',
          label: 'Langue',
          sub: 'Français',
          onPress: () => {},
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Confidentialité & Sécurité',
          onPress: () => {},
        },
        {
          icon: 'information-circle-outline',
          label: 'À propos de Neng-Nom',
          sub: 'Version 1.0.0',
          onPress: () => {},
        },
      ],
    },
    {
      title: '',
      items: [
        {
          icon: 'log-out-outline',
          label: 'Se déconnecter',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#011C12', '#022C22', '#047857']}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
            {/* Avatar */}
            <View style={styles.avatarRing}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.name}>{user?.fullName ?? 'Éleveur'}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>🌾 Éleveur</Text>
            </View>
            <Text style={styles.phone}>{user?.phone}</Text>

            {/* Verified badge */}
            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.verifiedText}>Compte vérifié</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
        <View style={styles.wave} />
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {menuGroups.map((group, gi) => (
          <View key={gi} style={styles.group}>
            {group.title ? (
              <Text style={styles.groupTitle}>{group.title}</Text>
            ) : null}
            <View style={[styles.groupCard, shadow.sm]}>
              {group.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  onPress={item.onPress}
                  activeOpacity={0.75}
                  style={[
                    styles.menuItem,
                    ii < group.items.length - 1 && styles.menuItemBorder,
                  ]}
                >
                  <View style={[
                    styles.menuIcon,
                    item.danger ? styles.menuIconDanger : styles.menuIconNormal,
                  ]}>
                    <Ionicons
                      name={item.icon as any}
                      size={18}
                      color={item.danger ? colors.red[500] : colors.brand[700]}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.menuLabel, item.danger && styles.menuLabelDanger]}>
                      {item.label}
                    </Text>
                    {item.sub ? (
                      <Text style={styles.menuSub} numberOfLines={1}>{item.sub}</Text>
                    ) : null}
                  </View>
                  {!item.danger && (
                    <Ionicons name="chevron-forward" size={16} color={colors.neutral[300]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.footer}>Neng-Nom AgriTech © 2026</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.sand[100] },

  header: {},
  headerInner: {
    alignItems: 'center',
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
  },

  avatarRing: {
    width: 92, height: 92,
    borderRadius: 46,
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 76, height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },

  name: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
  },
  roleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  phone: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },

  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  verifiedText: { fontSize: 11, fontWeight: '600', color: '#10B981' },

  wave: { height: 24, backgroundColor: colors.sand[100], borderTopLeftRadius: 24, borderTopRightRadius: 24 },

  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5] },

  group: { marginBottom: spacing[5] },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.neutral[400],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing[3],
    marginLeft: 4,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[100],
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4],
    gap: spacing[3],
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[50],
  },
  menuIcon: {
    width: 38, height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconNormal: { backgroundColor: colors.brand[50] },
  menuIconDanger: { backgroundColor: colors.red[50] },
  menuLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  menuLabelDanger: { color: colors.red[600] },
  menuSub: { fontSize: 12, color: colors.neutral[400], marginTop: 1 },

  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: colors.neutral[300],
    paddingBottom: spacing[8],
    marginTop: spacing[2],
  },
});
