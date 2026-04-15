/**
 * EntryRequestModal - a persistent resident-side gate approval alert.
 *
 * It opens as a MyGate-style incoming request, keeps a minimized
 * running banner alive across tabs, restores pending requests on
 * app resume, and lets the resident approve or deny without
 * hunting for the right screen.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  AppStateStatus,
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../utils/haptics';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';
import { getJsonItem, removeItem, setJsonItem } from '../lib/storage';

const { width, height } = Dimensions.get('window');

const FULL_ALERT_SECS = 60;
const MODAL_REMINDER_MS = 6000;
const BANNER_REMINDER_MS = 14000;
const PENDING_REQUEST_KEY = 'societyos-resident-pending-entry-request';

const VISITOR_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  DELIVERY: { icon: 'local_shipping', color: '#60a5fa', label: 'Delivery' },
  GUEST: { icon: 'person', color: '#a78bfa', label: 'Guest' },
  CAB: { icon: 'local_taxi', color: '#fbbf24', label: 'Cab / Taxi' },
  HOUSEHOLD_WORKER: {
    icon: 'cleaning_services',
    color: '#34d399',
    label: 'Household Staff',
  },
  SERVICE_PROFESSIONAL: {
    icon: 'handyman',
    color: '#fb923c',
    label: 'Service Professional',
  },
};

interface EntryRequest {
  id: string;
  visitorName: string;
  visitorPhone?: string | null;
  visitorType: string;
  flat?: { number: string } | null;
  entryTime: string;
  status?: string;
}

interface SyncOptions {
  ignoreId?: string;
  reopen?: boolean;
  shouldAlert?: boolean;
}

function normalizeEntry(entry: Partial<EntryRequest> | null | undefined): EntryRequest | null {
  if (!entry?.id || !entry.visitorName || !entry.entryTime) return null;

  return {
    id: entry.id,
    visitorName: entry.visitorName,
    visitorPhone: entry.visitorPhone ?? null,
    visitorType: entry.visitorType || 'GUEST',
    flat: entry.flat ?? null,
    entryTime: entry.entryTime,
    status: entry.status,
  };
}

export default function EntryRequestModal() {
  const socket = useSocket();

  const [request, setRequest] = useState<EntryRequest | null>(null);
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [countdown, setCountdown] = useState(FULL_ALERT_SECS);
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null);
  const [result, setResult] = useState<'approved' | 'denied' | null>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const bannerPulseAnim = useRef(new Animated.Value(1)).current;

  const requestRef = useRef<EntryRequest | null>(null);
  const visibleRef = useRef(false);
  const minimizedRef = useRef(false);
  const resultRef = useRef<'approved' | 'denied' | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reminderRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const responseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const ringLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const bannerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    requestRef.current = request;
  }, [request]);

  useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  useEffect(() => {
    resultRef.current = result;
  }, [result]);

  const clearCountdown = useCallback(() => {
    if (!countdownRef.current) return;
    clearInterval(countdownRef.current);
    countdownRef.current = null;
  }, []);

  const clearReminder = useCallback(() => {
    if (!reminderRef.current) return;
    clearInterval(reminderRef.current);
    reminderRef.current = null;
  }, []);

  const clearResponseTimeout = useCallback(() => {
    if (!responseTimeoutRef.current) return;
    clearTimeout(responseTimeoutRef.current);
    responseTimeoutRef.current = null;
  }, []);

  const stopModalLoops = useCallback(() => {
    pulseLoopRef.current?.stop();
    ringLoopRef.current?.stop();
    pulseLoopRef.current = null;
    ringLoopRef.current = null;
  }, []);

  const stopBannerLoop = useCallback(() => {
    bannerLoopRef.current?.stop();
    bannerLoopRef.current = null;
  }, []);

  const startModalLoops = useCallback(() => {
    stopModalLoops();

    pulseAnim.setValue(1);
    ringAnim.setValue(0);

    pulseLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.18,
          duration: 580,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 580,
          useNativeDriver: true,
        }),
      ])
    );

    ringLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(ringAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );

    pulseLoopRef.current.start();
    ringLoopRef.current.start();
  }, [pulseAnim, ringAnim, stopModalLoops]);

  const startBannerLoop = useCallback(() => {
    stopBannerLoop();

    bannerPulseAnim.setValue(1);
    bannerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(bannerPulseAnim, {
          toValue: 1.05,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(bannerPulseAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    bannerLoopRef.current.start();
  }, [bannerPulseAnim, stopBannerLoop]);

  const stopAllAttention = useCallback(() => {
    clearCountdown();
    clearReminder();
    clearResponseTimeout();
    stopModalLoops();
    stopBannerLoop();
    Vibration.cancel();
  }, [
    clearCountdown,
    clearReminder,
    clearResponseTimeout,
    stopBannerLoop,
    stopModalLoops,
  ]);

  const persistRequest = useCallback(async (entry: EntryRequest | null) => {
    if (!entry) {
      await removeItem(PENDING_REQUEST_KEY);
      return;
    }

    await setJsonItem(PENDING_REQUEST_KEY, entry);
  }, []);

  const triggerIncomingFeedback = useCallback((intense: boolean) => {
    triggerHaptic(intense ? 'warning' : 'medium');

    if (Platform.OS === 'web') return;

    const pattern = intense
      ? [0, 320, 150, 320, 150, 640]
      : [0, 180, 100, 220];

    Vibration.vibrate(pattern);
  }, []);

  const restartReminderLoop = useCallback((mode: 'modal' | 'banner' | 'off') => {
    clearReminder();

    if (mode === 'off') return;

    const intervalMs = mode === 'modal' ? MODAL_REMINDER_MS : BANNER_REMINDER_MS;
    const intense = mode === 'modal';

    reminderRef.current = setInterval(() => {
      if (!requestRef.current || appStateRef.current !== 'active') return;
      triggerIncomingFeedback(intense);
    }, intervalMs);
  }, [clearReminder, triggerIncomingFeedback]);

  const minimizeAlert = useCallback(() => {
    if (!requestRef.current) return;

    clearCountdown();
    stopModalLoops();
    Vibration.cancel();

    Animated.timing(slideAnim, {
      toValue: height,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setMinimized(true);
      startBannerLoop();
      restartReminderLoop('banner');
    });
  }, [clearCountdown, restartReminderLoop, slideAnim, startBannerLoop, stopModalLoops]);

  const openAlert = useCallback(async (entry: EntryRequest, shouldAlert = true) => {
    clearCountdown();
    clearResponseTimeout();
    stopBannerLoop();

    requestRef.current = entry;
    setRequest(entry);
    setVisible(true);
    setMinimized(false);
    setResult(null);
    setLoading(null);
    setCountdown(FULL_ALERT_SECS);

    await persistRequest(entry);

    slideAnim.setValue(height);
    progressAnim.setValue(1);
    startModalLoops();

    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    Animated.timing(progressAnim, {
      toValue: 0,
      duration: FULL_ALERT_SECS * 1000,
      useNativeDriver: false,
    }).start();

    countdownRef.current = setInterval(() => {
      setCountdown((previous) => {
        if (previous <= 1) {
          setTimeout(() => minimizeAlert(), 0);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    if (shouldAlert) {
      triggerIncomingFeedback(true);
    }

    restartReminderLoop('modal');
  }, [
    clearCountdown,
    clearResponseTimeout,
    minimizeAlert,
    persistRequest,
    progressAnim,
    restartReminderLoop,
    slideAnim,
    startModalLoops,
    stopBannerLoop,
    triggerIncomingFeedback,
  ]);

  const reopenAlert = useCallback(() => {
    if (!requestRef.current) return;
    void openAlert(requestRef.current, true);
  }, [openAlert]);

  const clearPendingState = useCallback(async () => {
    stopAllAttention();
    requestRef.current = null;
    setRequest(null);
    setVisible(false);
    setMinimized(false);
    setResult(null);
    setLoading(null);
    setCountdown(FULL_ALERT_SECS);
    await persistRequest(null);
  }, [persistRequest, stopAllAttention]);

  const collapseToBanner = useCallback((entry: EntryRequest) => {
    requestRef.current = entry;
    setRequest(entry);
    setVisible(false);
    setMinimized(true);
    setResult(null);
    setLoading(null);
    startBannerLoop();
    restartReminderLoop('banner');
  }, [restartReminderLoop, startBannerLoop]);

  const syncPendingRequest = useCallback(async ({
    ignoreId,
    reopen = true,
    shouldAlert = false,
  }: SyncOptions = {}) => {
    let storedEntry: EntryRequest | null = null;

    try {
      storedEntry = normalizeEntry(
        await getJsonItem<EntryRequest>(PENDING_REQUEST_KEY)
      );

      const response = await api.get('/entry/my-flat');
      const entries = Array.isArray(response.data?.data) ? response.data.data : [];

      const latestPending = entries
        .filter((entry: EntryRequest) => entry.status === 'PENDING' && entry.id !== ignoreId)
        .map((entry: EntryRequest) => normalizeEntry(entry))
        .filter((entry: EntryRequest | null): entry is EntryRequest => !!entry)
        .sort(
          (left: EntryRequest, right: EntryRequest) =>
            new Date(right.entryTime).getTime() - new Date(left.entryTime).getTime()
        )[0] ?? null;

      if (!latestPending) {
        await clearPendingState();
        return null;
      }

      await persistRequest(latestPending);
      const isNewRequest = requestRef.current?.id !== latestPending.id;

      requestRef.current = latestPending;
      setRequest(latestPending);

      if (!reopen) {
        collapseToBanner(latestPending);
        return latestPending;
      }

      if (
        isNewRequest ||
        !visibleRef.current ||
        minimizedRef.current ||
        resultRef.current !== null
      ) {
        await openAlert(latestPending, shouldAlert);
      }

      return latestPending;
    } catch (error) {
      console.error('[EntryRequestModal] sync failed:', error);

      if (!storedEntry) {
        storedEntry = normalizeEntry(
          await getJsonItem<EntryRequest>(PENDING_REQUEST_KEY)
        );
      }

      if (!storedEntry) return null;

      requestRef.current = storedEntry;
      setRequest(storedEntry);
      await persistRequest(storedEntry);

      if (reopen) {
        await openAlert(storedEntry, false);
      } else {
        collapseToBanner(storedEntry);
      }

      return storedEntry;
    }
  }, [clearPendingState, collapseToBanner, openAlert, persistRequest]);

  useEffect(() => {
    if (!socket) return;

    const handleNewEntry = ({ entry }: { entry: EntryRequest }) => {
      const normalized = normalizeEntry(entry);
      if (!normalized) return;
      void openAlert(normalized, true);
    };

    socket.on('entry:new', handleNewEntry);
    return () => {
      socket.off('entry:new', handleNewEntry);
    };
  }, [openAlert, socket]);

  useEffect(() => {
    void syncPendingRequest({ reopen: true, shouldAlert: false });
  }, [syncPendingRequest]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive =
        !!appStateRef.current.match(/inactive|background/) && nextState === 'active';

      appStateRef.current = nextState;

      if (becameActive) {
        void syncPendingRequest({ reopen: true, shouldAlert: true });
      }
    });

    return () => subscription.remove();
  }, [syncPendingRequest]);

  useEffect(() => {
    return () => {
      stopAllAttention();
    };
  }, [stopAllAttention]);

  const handleRespond = useCallback(async (action: 'approve' | 'deny') => {
    const activeRequest = requestRef.current;
    if (!activeRequest || loading) return;

    setLoading(action);
    setVisible(true);
    setMinimized(false);
    stopBannerLoop();
    restartReminderLoop('off');

    triggerHaptic(action === 'approve' ? 'success' : 'error');

    try {
      await api.patch(`/entry/${activeRequest.id}/${action}`);

      await persistRequest(null);
      clearCountdown();
      Vibration.cancel();
      setResult(action === 'approve' ? 'approved' : 'denied');

      responseTimeoutRef.current = setTimeout(() => {
        void clearPendingState().then(() => {
          void syncPendingRequest({
            ignoreId: activeRequest.id,
            reopen: true,
            shouldAlert: false,
          });
        });
      }, 1800);
    } catch (error: any) {
      console.error('[EntryRequestModal] respond error:', error?.response?.data || error);
      setLoading(null);

      if (requestRef.current) {
        setVisible(false);
        setMinimized(true);
        startBannerLoop();
        restartReminderLoop('banner');
      }
    }
  }, [
    clearCountdown,
    clearPendingState,
    loading,
    persistRequest,
    restartReminderLoop,
    startBannerLoop,
    stopBannerLoop,
    syncPendingRequest,
  ]);

  const typeCfg =
    VISITOR_TYPE_CONFIG[request?.visitorType || ''] ?? VISITOR_TYPE_CONFIG.GUEST;

  const ringScale = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.25],
  });

  const ringOpacity = ringAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.55, 0.18, 0],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const bannerStatusText =
    countdown > 0
      ? `${countdown}s left to respond`
      : 'Awaiting your approval at the gate';

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={minimizeAlert}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={minimizeAlert}
            activeOpacity={1}
          />

          <Animated.View
            style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
          >
            <LinearGradient
              colors={['#0d1526', '#060d1a']}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.progressTrack}>
              <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
            </View>

            <View style={styles.handle} />

            {result ? (
              <View style={styles.resultContainer}>
                <View
                  style={[
                    styles.resultIcon,
                    result === 'approved'
                      ? styles.resultIconGreen
                      : styles.resultIconRed,
                  ]}
                >
                  <MaterialIcons
                    name={result === 'approved' ? 'check-circle' : 'cancel'}
                    size={64}
                    color={result === 'approved' ? '#25E0A7' : '#EE7D77'}
                  />
                </View>

                <Text
                  style={[
                    styles.resultTitle,
                    { color: result === 'approved' ? '#25E0A7' : '#EE7D77' },
                  ]}
                >
                  {result === 'approved' ? 'Entry Approved' : 'Entry Denied'}
                </Text>

                <Text style={styles.resultSub}>
                  {result === 'approved'
                    ? `${request?.visitorName} has been cleared to enter.`
                    : `${request?.visitorName} has been turned away at the gate.`}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.iconSection}>
                  <Animated.View
                    style={[
                      styles.ring,
                      {
                        borderColor: typeCfg.color,
                        transform: [{ scale: ringScale }],
                        opacity: ringOpacity,
                      },
                    ]}
                  />

                  <Animated.View
                    style={[
                      styles.visitorIconBg,
                      {
                        backgroundColor: `${typeCfg.color}20`,
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <MaterialIcons
                      name={typeCfg.icon as keyof typeof MaterialIcons.glyphMap}
                      size={40}
                      color={typeCfg.color}
                    />
                  </Animated.View>
                </View>

                <View style={styles.headerSection}>
                  <View style={styles.typePill}>
                    <View style={[styles.typeDot, { backgroundColor: typeCfg.color }]} />
                    <Text style={[styles.typeLabel, { color: typeCfg.color }]}>
                      {typeCfg.label}
                    </Text>
                  </View>
                  <Text style={styles.atGateText}>SOMEONE IS WAITING AT THE GATE</Text>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.visitorName}>
                    {request?.visitorName || 'Visitor'}
                  </Text>

                  {!!request?.flat?.number && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="home" size={14} color="#6c7a8f" />
                      <Text style={styles.detailText}>Flat {request.flat.number}</Text>
                    </View>
                  )}

                  {!!request?.visitorPhone && (
                    <View style={styles.detailRow}>
                      <MaterialIcons name="call" size={14} color="#6c7a8f" />
                      <Text style={styles.detailText}>{request.visitorPhone}</Text>
                    </View>
                  )}

                  <View style={styles.detailRow}>
                    <MaterialIcons name="access-time" size={14} color="#6c7a8f" />
                    <Text style={styles.detailText}>
                      {new Date(request?.entryTime || Date.now()).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                    <Text style={styles.countdownText}> - {countdown}s remaining</Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.denyBtn, loading === 'approve' && styles.btnMuted]}
                    onPress={() => void handleRespond('deny')}
                    disabled={!!loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['rgba(238,125,119,0.2)', 'rgba(238,125,119,0.1)']}
                      style={styles.btnInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {loading === 'deny' ? (
                        <ActivityIndicator color="#EE7D77" />
                      ) : (
                        <>
                          <MaterialIcons name="close" size={28} color="#EE7D77" />
                          <Text style={styles.denyBtnText}>Deny</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.approveBtn, loading === 'deny' && styles.btnMuted]}
                    onPress={() => void handleRespond('approve')}
                    disabled={!!loading}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#25E0A7', '#1ab88a']}
                      style={styles.btnInner}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      {loading === 'approve' ? (
                        <ActivityIndicator color="#090E18" />
                      ) : (
                        <>
                          <MaterialIcons name="check" size={28} color="#090E18" />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.dismissLink}
                  onPress={minimizeAlert}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissText}>Keep this as a running alert</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>

      {request && minimized && !result && (
        <View pointerEvents="box-none" style={styles.bannerWrap}>
          <Animated.View
            style={[styles.bannerCard, { transform: [{ scale: bannerPulseAnim }] }]}
          >
            <TouchableOpacity
              style={styles.bannerMain}
              activeOpacity={0.9}
              onPress={reopenAlert}
            >
              <View
                style={[
                  styles.bannerIcon,
                  { backgroundColor: `${typeCfg.color}1f` },
                ]}
              >
                <MaterialIcons
                  name={typeCfg.icon as keyof typeof MaterialIcons.glyphMap}
                  size={18}
                  color={typeCfg.color}
                />
              </View>

              <View style={styles.bannerCopy}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  {request.visitorName} is still waiting
                </Text>
                <Text style={styles.bannerSub} numberOfLines={1}>
                  {typeCfg.label} - {bannerStatusText}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bannerAction}
              onPress={reopenAlert}
              activeOpacity={0.85}
            >
              <Text style={styles.bannerActionText}>Review</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const SHEET_HEIGHT = height * 0.72;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.68)',
    justifyContent: 'flex-end',
  },

  sheet: {
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
    alignItems: 'center',
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  progressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },

  progressFill: {
    height: 3,
    backgroundColor: '#25E0A7',
  },

  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 2,
    marginTop: 14,
  },

  iconSection: {
    marginTop: 28,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
  },

  ring: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
  },

  visitorIconBg: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerSection: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },

  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },

  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  typeLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 0.5,
  },

  atGateText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    letterSpacing: 2.2,
    color: '#6c7a8f',
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  detailCard: {
    width: width - 48,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    padding: 20,
    gap: 10,
    marginBottom: 28,
  },

  visitorName: {
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    color: '#DEE1F7',
    textAlign: 'center',
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },

  detailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#9BABCE',
  },

  countdownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#FACC15',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 14,
    width: width - 48,
  },

  denyBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(238,125,119,0.3)',
    minHeight: 80,
  },

  approveBtn: {
    flex: 1.4,
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 80,
  },

  btnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 16,
  },

  btnMuted: {
    opacity: 0.3,
  },

  denyBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#EE7D77',
  },

  approveBtnText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#090E18',
  },

  dismissLink: {
    marginTop: 16,
  },

  dismissText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#9BABCE',
    textDecorationLine: 'underline',
  },

  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 40,
  },

  resultIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultIconGreen: {
    backgroundColor: 'rgba(37,224,167,0.15)',
  },

  resultIconRed: {
    backgroundColor: 'rgba(238,125,119,0.15)',
  },

  resultTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    textAlign: 'center',
  },

  resultSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: '#9BABCE',
    textAlign: 'center',
    lineHeight: 22,
  },

  bannerWrap: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 26,
    left: 14,
    right: 14,
    zIndex: 2000,
  },

  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.35)',
    backgroundColor: 'rgba(7,12,23,0.96)',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  bannerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bannerCopy: {
    flex: 1,
    gap: 2,
  },

  bannerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#DEE1F7',
  },

  bannerSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#9BABCE',
  },

  bannerAction: {
    borderRadius: 14,
    backgroundColor: 'rgba(37,224,167,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(37,224,167,0.24)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  bannerActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#25E0A7',
  },
});
