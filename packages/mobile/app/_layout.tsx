import 'react-native-gesture-handler';
import React, { useEffect, Component } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Text, ScrollView } from 'react-native';
import { AuthProvider } from '@/lib/auth-context';
import { API_URL } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 60, backgroundColor: '#022C22', flexGrow: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Erreur de démarrage</Text>
          <Text style={{ color: '#fca5a5', fontSize: 12 }}>
            {(this.state.error as Error).message}{'\n\n'}{(this.state.error as Error).stack}
          </Text>
        </ScrollView>
      );
    }
    return this.props.children;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      // 5 min stale time: tab switches within a session don't trigger refetches
      staleTime: 5 * 60 * 1000,
      // Keep unused data in memory for 10 min
      gcTime: 10 * 60 * 1000,
    },
  },
});

// Persist the query cache to AsyncStorage so the next cold launch shows
// cached data instantly while fresh data loads in the background.
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'NENG_NOM_QUERY_CACHE',
  throttleTime: 1000,
});

export default function RootLayout() {
  useEffect(() => { SplashScreen.hideAsync(); }, []);

  // Keep-alive ping every 4 min so Railway's container doesn't sleep.
  // A cold-started container adds 3-5 s to the first request after inactivity.
  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`).catch(() => null);
    ping();
    const id = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaProvider>
          <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister: asyncStoragePersister }}
          >
            <AuthProvider>
              <StatusBar style="light" />
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="auth/login" />
                <Stack.Screen name="(farmer)" />
                <Stack.Screen name="(vet)" />
              </Stack>
            </AuthProvider>
          </PersistQueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
