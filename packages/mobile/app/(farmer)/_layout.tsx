import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function FarmerLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"         options={{ title: 'Accueil' }} />
      <Tabs.Screen name="consultations" options={{ title: 'Consultations' }} />
      <Tabs.Screen name="ai"            options={{ title: 'Suggestions' }} />
      <Tabs.Screen name="profile"       options={{ title: 'Profil' }} />
    </Tabs>
  );
}
