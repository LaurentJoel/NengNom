import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadow } from '@/lib/theme';

const { width } = Dimensions.get('window');

const ICON_MAP: Record<string, { active: string; inactive: string }> = {
  index:                  { active: 'home',           inactive: 'home-outline' },
  'consultations/index':  { active: 'chatbubbles',    inactive: 'chatbubbles-outline' },
  consultations:          { active: 'chatbubbles',    inactive: 'chatbubbles-outline' },
  ai:                     { active: 'sparkles',        inactive: 'sparkles-outline' },
  farm:                   { active: 'leaf',            inactive: 'leaf-outline' },
  lab:                    { active: 'flask',           inactive: 'flask-outline' },
  community:              { active: 'people',          inactive: 'people-outline' },
  profile:                { active: 'person-circle',   inactive: 'person-circle-outline' },
};

const LABEL_MAP: Record<string, string> = {
  index:                  'Accueil',
  'consultations/index':  'Consultations',
  consultations:          'Consultations',
  ai:                     'Suggestions',
  farm:                   'Ma Ferme',
  lab:                    'Labo',
  community:              'Communauté',
  profile:                'Profil',
};

function isRouteVisible(route: { name: string }, options: Record<string, any>): boolean {
  // Dynamic-segment routes (consultations/[id]) are never tabs
  if (route.name.includes('[')) return false;
  // Explicitly hidden via custom tabBarVisible: false option
  if (options.tabBarVisible === false) return false;
  return true;
}

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  // Compute only visible routes
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return isRouteVisible(route, options as any);
  });

  const tabWidth = width / (visibleRoutes.length || 1);

  // Find visible index of the currently focused route
  const focusedRoute = state.routes[state.index];
  const activeVisibleIdx = visibleRoutes.findIndex((r) => r.key === focusedRoute?.key);

  const indicatorX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeVisibleIdx >= 0) {
      Animated.spring(indicatorX, {
        toValue: activeVisibleIdx * tabWidth,
        tension: 70,
        friction: 12,
        useNativeDriver: true,
      }).start();
    }
  }, [activeVisibleIdx, tabWidth]);

  return (
    <View style={styles.container}>
      {/* Sliding indicator — only shown when an actual tab is focused */}
      {activeVisibleIdx >= 0 && (
        <Animated.View
          style={[
            styles.indicator,
            { width: tabWidth, transform: [{ translateX: indicatorX }] },
          ]}
        >
          <View style={styles.indicatorPill} />
        </Animated.View>
      )}

      {visibleRoutes.map((route) => {
        const isFocused  = route.key === focusedRoute?.key;
        const iconSet    = ICON_MAP[route.name] ?? ICON_MAP.index;
        const label      = descriptors[route.key].options.tabBarLabel as string
                          ?? LABEL_MAP[route.name]
                          ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabItem
            key={route.key}
            label={label}
            icon={isFocused ? iconSet.active : iconSet.inactive}
            isFocused={isFocused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabItem({
  label,
  icon,
  isFocused,
  onPress,
}: {
  label: string;
  icon: string;
  isFocused: boolean;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tab}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons
          name={icon as any}
          size={22}
          color={isFocused ? colors.brand[700] : colors.neutral[400]}
        />
      </Animated.View>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.brand[700] : colors.neutral[400] },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    paddingTop: 8,
    ...shadow.md,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    alignItems: 'center',
    paddingTop: 2,
  },
  indicatorPill: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand[600],
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  tabLabelActive: {
    fontWeight: '700',
  },
});
