import { Tabs } from 'expo-router';
import { CustomTabBar } from '@/components/ui/CustomTabBar';

export default function VetLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"               options={{ title: 'Accueil' }} />
      <Tabs.Screen name="consultations/index" options={{ title: 'Consultations' }} />
      <Tabs.Screen name="lab"                 options={{ title: 'Labo' }} />
      <Tabs.Screen name="community"           options={{ title: 'Communauté' }} />
      <Tabs.Screen name="profile"             options={{ title: 'Profil' }} />
    </Tabs>
  );
}
