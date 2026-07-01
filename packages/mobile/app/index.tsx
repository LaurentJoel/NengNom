import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/lib/auth-context';
import { colors } from '@/lib/theme';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/auth/login');
    } else if (user.role === 'FARMER') {
      router.replace('/(farmer)/');
    } else if (user.role === 'VET') {
      router.replace('/(vet)/');
    } else {
      router.replace('/auth/login');
    }
  }, [user, isLoading]);

  return <View style={styles.screen} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.brand[900] },
});
