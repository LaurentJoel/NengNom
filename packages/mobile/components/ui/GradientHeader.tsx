import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/lib/theme';

interface Props {
  greeting: string;
  name: string;
  subtitle?: string;
  notificationCount?: number;
  onNotificationPress?: () => void;
  children?: React.ReactNode;
}

const { width } = Dimensions.get('window');

export function GradientHeader({
  greeting,
  name,
  subtitle,
  notificationCount = 0,
  onNotificationPress,
  children,
}: Props) {
  return (
    <LinearGradient
      colors={['#011C12', '#022C22', '#065F46', '#059669']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Decorative circles */}
      <View style={styles.circleTopRight} />
      <View style={styles.circleBottomLeft} />

      <SafeAreaView edges={['top']}>
        <View style={styles.inner}>
          {/* Top row */}
          <View style={styles.topRow}>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.name}>{name} 👋</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>

            <View style={styles.actions}>
              {/* Notification bell */}
              <TouchableOpacity
                onPress={onNotificationPress}
                style={styles.bellBtn}
                activeOpacity={0.8}
              >
                <Ionicons name="notifications-outline" size={22} color="rgba(255,255,255,0.9)" />
                {notificationCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {name.charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Optional children (e.g. stat chips) */}
          {children}
        </View>
      </SafeAreaView>

      {/* Wave bottom */}
      <View style={styles.wave} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    position: 'relative',
    overflow: 'hidden',
  },

  // Decorative circles
  circleTopRight: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
    top: -60, right: -40,
  },
  circleBottomLeft: {
    position: 'absolute',
    width: 150, height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30, left: -30,
  },

  inner: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  greetingBlock: { flex: 1 },
  greeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 3,
  },

  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },

  bellBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2, right: -2,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#022C22',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  avatar: {
    width: 42, height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  wave: {
    height: 24,
    backgroundColor: colors.sand[100],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
});
