import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function FarmerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {/* ── Visible tabs (in order) ── */}
      <Tabs.Screen name="index"               options={{ title: 'Accueil' }} />
      <Tabs.Screen name="consultations/index" options={{ title: 'Consultations' }} />
      <Tabs.Screen name="farm"                options={{ title: 'Ma Ferme' }} />
      <Tabs.Screen name="community"           options={{ title: 'Communauté' }} />
      <Tabs.Screen name="profile"             options={{ title: 'Profil' }} />

      {/* ── Hidden routes (navigable but not shown in tab bar) ── */}
      <Tabs.Screen name="ai"                  options={{ tabBarVisible: false } as any} />
      <Tabs.Screen name="ai-chat"             options={{ tabBarVisible: false } as any} />
      <Tabs.Screen name="lab-order"           options={{ tabBarVisible: false } as any} />
      <Tabs.Screen name="consultations/[id]"  options={{ tabBarVisible: false } as any} />
      <Tabs.Screen name="find-vet"            options={{ tabBarVisible: false } as any} />
    </Tabs>
  );
}
