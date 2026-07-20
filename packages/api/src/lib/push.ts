const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

export async function sendPushNotification(
  token: string | null | undefined,
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  if (!token) return
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
    })
  } catch {
    // push is best-effort — never throw
  }
}
