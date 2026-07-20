import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { api } from './api';

const PROJECT_ID = '952e4444-030c-4a57-906a-7b1792cba001';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerPushToken() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Neng-Nom',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#059669',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })).data;
  await api.patch('/users/push-token', { pushToken: token });
}
