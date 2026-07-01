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
  index:          { active: 'home',             inactive: 'home-outline' },
  consultations:  { active: 'chatbubbles',      inactive: 'chatbubbles-outline' },
  ai:             { active: 'sparkles',          inactive: 'sparkles-outline' },
  lab:            { active: 'flask',             inactive: 'flask-outline' },
  profile:        { active: 'person-circle',     inactive: 'person-circle-outline' },
};

const LABEL_MAP: Record<string, string> = {
  index:         'Accueil',
  consultations: 'Consultations',
  ai:            'Suggestions',
  lab:           'Labo',
  profile:       'Profil',
};

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const indicatorX = useRef(new Animated.Value(0)).current;
  const tabWidth = width / state.routes.length;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: state.index * tabWidth,
      tension: 70,
      friction: 12,
      useNativeDriver: true,
    }).start();
  }, [state.index, tabWidth]);

  return (
    <View style={styles.container}>
      {/* Sliding indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: tabWidth,
            transform: [{ translateX: indicatorX }],
          },
        ]}
      >
        <View style={styles.indicatorPill} />
      </Animated.View>

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconSet   = ICON_MAP[route.name] ?? ICON_MAP.index;
        const label     = LABEL_MAP[route.name] ?? route.name;

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
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const colorAnim  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(colorAnim, {
      toValue: isFocused ? 1 : 0,
      tension: 80,
      friction: 12,
      useNativeDriver: false,
    }).start();

    if (isFocused) {
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.15, duration: 120, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
      ]).start();
    }
  }, [isFocused]);

  const iconColor = colorAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [colors.neutral[400], colors.brand[700]],
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={styles.tab}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Animated.Text>
          <Ionicons
            name={icon as any}
            size={22}
            color={isFocused ? colors.brand[700] : colors.neutral[400]}
          />
        </Animated.Text>
      </Animated.View>
      <Animated.Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.brand[700] : colors.neutral[400] },
          isFocused && styles.tabLabelActive,
        ]}
      >
        {label}
      </Animated.Text>
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
