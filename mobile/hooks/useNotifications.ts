/**
 * useNotifications
 *
 * Architecture:
 *
 *  FOREGROUND  — socket `entry:new` → IncomingVisitorAlert call modal via context
 *  BACKGROUND  — backend sends server-side Expo push → OS delivers heads-up banner
 *  KILLED      — backend push wakes phone → user taps banner → app opens →
 *                NotificationResponseListener fires → shows call modal
 *
 * Lazy-loads expo-notifications to avoid Expo Go module-level import crashes (SDK 53+).
 * useLastNotificationResponse is called inside a wrapper component so it always runs
 * unconditionally (never violates React rules of hooks).
 */
import { useEffect, useRef } from 'react';
import { Platform, AppState } from 'react-native';
import Constants from 'expo-constants';
import api from '../lib/api';
import { useSocket } from './useSocket';
import { useIncomingVisitor } from '../context/IncomingVisitorContext';

const IN_EXPO_GO = Constants.executionEnvironment === 'storeClient';

// ─── Lazy module cache ────────────────────────────────────────────────────────
type Ntf = typeof import('expo-notifications');
let _ntf: Ntf | null = null;
export function getNtf(): Ntf | null {
  if (_ntf) return _ntf;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    _ntf = require('expo-notifications') as Ntf;
    return _ntf;
  } catch {
    return null;
  }
}

// ─── One-time channel + handler setup ────────────────────────────────────────
let setupDone = false;

export async function setupNotifications() {
  if (setupDone) return;
  const N = getNtf();
  if (!N) return;
  setupDone = true;

  // Show banner + play sound even when app is foregrounded
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === 'android') {
    // MAX — visitor alerts: triggers Heads‑up & lock‑screen banner
    await N.setNotificationChannelAsync('visitor-alerts', {
      name: 'Visitor Alerts',
      importance: N.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 400, 200, 400],
      enableLights: true,
      lightColor: '#53FEC2',
      lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
      showBadge: true,
    });
    // DEFAULT — notices & status updates
    await N.setNotificationChannelAsync('default', {
      name: 'General',
      importance: N.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  // iOS: Approve/Deny buttons directly from the lock screen
  await N.setNotificationCategoryAsync('visitor-alert', [
    {
      identifier: 'APPROVE',
      buttonTitle: '✅ Allow Entry',
      options: { opensAppToForeground: true },
    },
    {
      identifier: 'DENY',
      buttonTitle: '❌ Deny',
      options: { opensAppToForeground: false, isDestructive: true },
    },
  ]).catch(() => {});
}

async function requestPermissions() {
  if (Platform.OS === 'web') return;
  const N = getNtf();
  if (!N) return;
  await N.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
      allowCriticalAlerts: true, // time-sensitive / break through DND
      provideAppNotificationSettings: true,
    },
  }).catch(() => {});
}

async function registerPushToken() {
  if (Platform.OS === 'web') return;
  const N = getNtf();
  if (!N) return;

  // SDK 53+ restriction: Remote notifications are blocked in Expo Go on Android.
  // We skip token registration to avoid throwing internal Expo errors.
  if (IN_EXPO_GO && Platform.OS === 'android') {
    console.log('[Notifications] Skipping push token registration in Expo Go (Android restriction)');
    return;
  }

  const { status } = await N.getPermissionsAsync();
  if (status !== 'granted') return;
  try {
    const { data: token } = await N.getExpoPushTokenAsync();
    if (token) {
      await api.post('/users/fcm-token', { token }).catch(() => {});
      console.log('[Notifications] Push token registered');
    }
  } catch (err) {
    console.warn('[Notifications] Failed to get push token:', err);
  }
}

// Fires a local MAX‑priority notification (for when socket fires but app is backgrounded)
export async function fireLocalVisitorAlert(title: string, body: string, data?: Record<string, unknown>) {
  const N = getNtf();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        categoryIdentifier: 'visitor-alert',
        data: data ?? { type: 'visitor-alert' },
        ...(Platform.OS === 'android'
          ? { android: { channelId: 'visitor-alerts', priority: 'max', vibrate: [0, 400, 200, 400], color: '#53FEC2' } }
          : {}),
      },
      trigger: null,
    });
  } catch { /* no‑op */ }
}

// Fires a standard info notification
export async function fireLocalNotify(title: string, body: string) {
  const N = getNtf();
  if (!N) return;
  try {
    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        ...(Platform.OS === 'android' ? { android: { channelId: 'default', priority: 'default' } } : {}),
      },
      trigger: null,
    });
  } catch { /* no‑op */ }
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
export function useNotifications() {
  const socket = useSocket();
  const { setIncoming } = useIncomingVisitor();
  const init = useRef(false);
  const appState = useRef(AppState.currentState);

  // ── One-time initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (init.current) return;
    init.current = true;

    const appStateSub = AppState.addEventListener('change', nextAppState => {
      console.log(`[App] State changed to: ${nextAppState}`);
      appState.current = nextAppState;
    });

    void setupNotifications();
    void requestPermissions();
    void registerPushToken();

    // Listen for notification response (user TAPPED on banner when app was background/killed)
    const N = getNtf();
    if (!N) return;

    const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const body = response.notification.request.content.body ?? '';

      if (data?.type === 'WALK_IN_REQUEST' && typeof data.entryId === 'string') {
        // Tapped a visitor alert → show the in-app call modal
        setIncoming({
          entryId: data.entryId,
          visitorName: (data.visitorName as string) || 'Visitor',
          message: body,
        });
      }
    });

    return () => {
      sub.remove();
      appStateSub.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Socket events ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    /**
     * FOREGROUND path: guard triggers walk-in → socket fires immediately →
     * we show the in-app call modal. A redundant local notification is NOT
     * fired because the server-side push will handle the background case.
     */
    const onEntryNew = (p: {
      message?: string;
      entry?: { id?: string; visitorName?: string; visitorType?: string };
    }) => {
      const name = p?.entry?.visitorName ?? 'Someone';
      const entryId = p?.entry?.id;
      if (!entryId) return;

      // Update the "Call UI" state
      setIncoming({
        entryId,
        visitorName: name,
        visitorType: p?.entry?.visitorType,
        message: p?.message ?? `${name} is requesting entry to your flat`,
      });

      /**
       * If the app is in background or inactive (home screen),
       * fire a local High-Priority notification as a fallback.
       */
      if (appState.current !== 'active') {
        console.log(`[Notifications] App backgrounded. Firing local alert for: ${name}`);
        void fireLocalVisitorAlert(
          '🏠 Visitor at Gate',
          p?.message ?? `${name} is requesting entry`,
          { 
            entryId, 
            type: 'WALK_IN_REQUEST', 
            visitorName: name 
          }
        );
      }
    };

    /** Entry approved / denied → show a local heads-up to both guard and resident */
    const onEntryUpdated = (p: { entry?: { visitorName?: string; status?: string } }) => {
      const name = p?.entry?.visitorName ?? 'Visitor';
      if (p?.entry?.status === 'APPROVED')
        void fireLocalVisitorAlert('✅ Entry Approved', `${name} has been allowed entry`);
      else if (p?.entry?.status === 'DENIED')
        void fireLocalNotify('❌ Entry Denied', `Entry for ${name} was denied`);
    };

    /** New notice → standard notification */
    const onNoticeNew = (p: { title?: string; body?: string }) => {
      void fireLocalNotify(`📢 ${p?.title ?? 'New Notice'}`, p?.body ?? 'A new notice was posted');
    };

    socket.on('entry:new', onEntryNew);
    socket.on('entry:updated', onEntryUpdated);
    socket.on('notice:new', onNoticeNew);

    return () => {
      socket.off('entry:new', onEntryNew);
      socket.off('entry:updated', onEntryUpdated);
      socket.off('notice:new', onNoticeNew);
    };
  }, [socket, setIncoming]);
}
