import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getExpoProjectId(): string | undefined {
  // EAS-configured project ID (production builds)
  const easProjectId =
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  return easProjectId;
}

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  // Android requires a notification channel to display alerts reliably.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'RoomieMatch',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0284C7',
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[push] Notification permission not granted');
      return;
    }

    const projectId = getExpoProjectId();
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    if (!token) {
      console.warn('[push] No Expo push token returned');
      return;
    }

    await apiFetch('/notifications/register', userId, {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    console.log('[push] Registered push token');
  } catch (err) {
    // Non-critical in development (Expo Go without EAS project ID may not support push tokens)
    console.warn('[push] Push registration failed (non-fatal):', err instanceof Error ? err.message : err);
  }
}

export async function unregisterPushNotifications(userId: string, bearerToken: string): Promise<void> {
  if (Platform.OS === 'web') return;
  // Use raw fetch (not apiFetch) so that a 401 response does NOT trigger the
  // global unauthorised handler and cause a recursive logout loop.
  // The caller must supply the JWT token captured before clearing SecureStore.
  try {
    // Platform.OS is never 'web' here — we already returned early for web above.
    const domain = process.env.EXPO_PUBLIC_DOMAIN ?? process.env.EXPO_PUBLIC_REPLIT_DEV_DOMAIN;
    const base = domain ? `https://${domain}/api` : 'http://localhost/api';
    await fetch(`${base}/notifications/register`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${bearerToken}`,
        'x-user-id': userId,
      },
    });
  } catch (err) {
    console.warn('[push] Failed to unregister push token:', err instanceof Error ? err.message : err);
  }
}

export async function setNotificationsEnabled(userId: string, enabled: boolean): Promise<void> {
  // Do NOT swallow errors — callers (e.g. settings toggle) rely on thrown errors
  // to revert optimistic UI state.
  await apiFetch('/notifications/preferences', userId, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}
