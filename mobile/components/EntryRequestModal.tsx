/**
 * EntryRequestModal — MyGate-style full-screen entry approval overlay.
 *
 * When a guard submits a walk-in request for this resident's flat,
 * this modal slides up from the bottom, shows visitor details,
 * a countdown timer, and large Approve / Deny buttons.
 *
 * Drop this anywhere in the resident layout tree and it will appear
 * over whatever screen is currently visible.
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  Animated, Vibration, ActivityIndicator, Dimensions, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../utils/haptics';
import { useSocket } from '../hooks/useSocket';
import api from '../lib/api';

const { width, height } = Dimensions.get('window');
const COUNTDOWN_SECS = 60; // auto-dismiss after 60 s with no action

const VISITOR_TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  DELIVERY:             { icon: 'local_shipping', color: '#60a5fa', label: 'Delivery' },
  GUEST:                { icon: 'person',          color: '#a78bfa', label: 'Guest' },
  CAB:                  { icon: 'local_taxi',       color: '#fbbf24', label: 'Cab / Taxi' },
  HOUSEHOLD_WORKER:     { icon: 'cleaning_services',color: '#34d399', label: 'Household Staff' },
  SERVICE_PROFESSIONAL: { icon: 'handyman',         color: '#fb923c', label: 'Service Professional' },
};

interface EntryRequest {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorType: string;
  flat?: { number: string };
  entryTime: string;
}

export default function EntryRequestModal() {
  const socket = useSocket();

  const [request,   setRequest]   = useState<EntryRequest | null>(null);
  const [visible,   setVisible]   = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS);
  const [loading,   setLoading]   = useState<'approve' | 'deny' | null>(null);
  const [result,    setResult]    = useState<'approved' | 'denied' | null>(null);

  /* Animations */
  const slideAnim  = useRef(new Animated.Value(height)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const ringAnim   = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Open modal ── */
  const openModal = useCallback((entry: EntryRequest) => {
    setRequest(entry);
    setResult(null);
    setLoading(null);
    setCountdown(COUNTDOWN_SECS);
    setVisible(true);

    // Slide up
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();

    // Pulse icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    // Ring expand animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    ).start();

    // Progress bar countdown
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: COUNTDOWN_SECS * 1000,
      useNativeDriver: false,
    }).start();

    // Vibrate like MyGate (pattern: on-off-on-off-on)
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 400, 200, 400, 200, 600]);
    }

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          closeModal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [slideAnim, pulseAnim, ringAnim, progressAnim]);

  /* ── Close modal ── */
  const closeModal = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setRequest(null);
      pulseAnim.stopAnimation();
      ringAnim.stopAnimation();
    });
  }, [slideAnim, pulseAnim, ringAnim]);

  /* ── Listen for socket events ── */
  useEffect(() => {
    if (!socket) return;
    const handler = ({ entry }: { entry: EntryRequest }) => {
      openModal(entry);
    };
    socket.on('entry:new', handler);
    return () => { socket.off('entry:new', handler); };
  }, [socket, openModal]);

  /* ── Cleanup on unmount ── */
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  /* ── Respond approve / deny ── */
  const handleRespond = async (action: 'approve' | 'deny') => {
    if (!request || loading) return;
    setLoading(action);
    triggerHaptic(action === 'approve' ? 'success' : 'error');
    try {
      await api.patch(`/entry/${request.id}/${action}`);
      setResult(action === 'approve' ? 'approved' : 'denied');
      if (countdownRef.current) clearInterval(countdownRef.current);
      // Auto-close after showing result
      setTimeout(closeModal, 2000);
    } catch (err: any) {
      console.error('[EntryModal] respond error:', err?.response?.data || err);
      setLoading(null);
    }
  };

  const typeCfg = VISITOR_TYPE_CONFIG[request?.visitorType || ''] || VISITOR_TYPE_CONFIG.GUEST;

  const ringScale  = ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] });
  const ringOpacity= ringAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0.2, 0] });
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={closeModal}
    >
      {/* dim backdrop */}
      <View style={styles.backdrop}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} activeOpacity={1} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
          <LinearGradient
            colors={['#0d1526', '#060d1a']}
            style={StyleSheet.absoluteFill}
          />

          {/* Progress bar at very top */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>

          {/* Drag handle */}
          <View style={styles.handle} />

          {/* ── Result state ── */}
          {result ? (
            <View style={styles.resultContainer}>
              <View style={[styles.resultIcon, result === 'approved' ? styles.resultIconGreen : styles.resultIconRed]}>
                <MaterialIcons
                  name={result === 'approved' ? 'check-circle' : 'cancel'}
                  size={64}
                  color={result === 'approved' ? '#25E0A7' : '#EE7D77'}
                />
              </View>
              <Text style={[styles.resultTitle, { color: result === 'approved' ? '#25E0A7' : '#EE7D77' }]}>
                {result === 'approved' ? 'Entry Approved!' : 'Entry Denied'}
              </Text>
              <Text style={styles.resultSub}>
                {result === 'approved'
                  ? `${request?.visitorName} has been granted access.`
                  : `${request?.visitorName} has been turned away.`}
              </Text>
            </View>
          ) : (
            <>
              {/* ── Visitor icon with pulsing ring ── */}
              <View style={styles.iconSection}>
                {/* Ring */}
                <Animated.View
                  style={[styles.ring, {
                    borderColor: typeCfg.color,
                    transform: [{ scale: ringScale }],
                    opacity: ringOpacity,
                  }]}
                />
                {/* Icon */}
                <Animated.View
                  style={[styles.visitorIconBg, { backgroundColor: typeCfg.color + '20', transform: [{ scale: pulseAnim }] }]}
                >
                  <MaterialIcons name={typeCfg.icon as any} size={40} color={typeCfg.color} />
                </Animated.View>
              </View>

              {/* ── Header ── */}
              <View style={styles.headerSection}>
                <View style={styles.typePill}>
                  <View style={[styles.typeDot, { backgroundColor: typeCfg.color }]} />
                  <Text style={[styles.typeLabel, { color: typeCfg.color }]}>{typeCfg.label}</Text>
                </View>
                <Text style={styles.atGateText}>AT THE GATE</Text>
              </View>

              {/* ── Visitor details ── */}
              <View style={styles.detailCard}>
                <Text style={styles.visitorName}>{request?.visitorName || 'Visitor'}</Text>

                {request?.visitorPhone && (
                  <View style={styles.detailRow}>
                    <MaterialIcons name="call" size={14} color="#6c7a8f" />
                    <Text style={styles.detailText}>{request.visitorPhone}</Text>
                  </View>
                )}

                <View style={styles.detailRow}>
                  <MaterialIcons name="access-time" size={14} color="#6c7a8f" />
                  <Text style={styles.detailText}>
                    {new Date(request?.entryTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.countdownText}> · {countdown}s remaining</Text>
                </View>
              </View>

              {/* ── Action buttons ── */}
              <View style={styles.actionRow}>
                {/* Deny */}
                <TouchableOpacity
                  style={[styles.denyBtn, loading === 'approve' && styles.btnMuted]}
                  onPress={() => handleRespond('deny')}
                  disabled={!!loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['rgba(238,125,119,0.2)', 'rgba(238,125,119,0.1)']}
                    style={styles.btnInner}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {loading === 'deny'
                      ? <ActivityIndicator color="#EE7D77" />
                      : <>
                          <MaterialIcons name="close" size={28} color="#EE7D77" />
                          <Text style={styles.denyBtnText}>Deny</Text>
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                {/* Approve */}
                <TouchableOpacity
                  style={[styles.approveBtn, loading === 'deny' && styles.btnMuted]}
                  onPress={() => handleRespond('approve')}
                  disabled={!!loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#25E0A7', '#1ab88a']}
                    style={styles.btnInner}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  >
                    {loading === 'approve'
                      ? <ActivityIndicator color="#090E18" />
                      : <>
                          <MaterialIcons name="check" size={28} color="#090E18" />
                          <Text style={styles.approveBtnText}>Approve</Text>
                        </>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Dismiss */}
              <TouchableOpacity style={styles.dismissLink} onPress={closeModal} activeOpacity={0.7}>
                <Text style={styles.dismissText}>Ask later</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const SHEET_HEIGHT = height * 0.72;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
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

  progressTrack: { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.06)' },
  progressFill:  { height: 3, backgroundColor: '#25E0A7' },

  handle: { width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 2, marginTop: 14 },

  /* Icon + ring */
  iconSection: { marginTop: 28, marginBottom: 16, alignItems: 'center', justifyContent: 'center', width: 120, height: 120 },
  ring:          { position: 'absolute', width: 90, height: 90, borderRadius: 45, borderWidth: 2 },
  visitorIconBg: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },

  headerSection: { alignItems: 'center', gap: 6, marginBottom: 20 },
  typePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 9999, paddingHorizontal: 14, paddingVertical: 5 },
  typeDot:  { width: 6, height: 6, borderRadius: 3 },
  typeLabel:{ fontFamily: 'Inter-SemiBold', fontSize: 12, letterSpacing: 0.5 },
  atGateText: { fontFamily: 'Inter-Bold', fontSize: 11, letterSpacing: 4, color: '#4a5568', textTransform: 'uppercase' as const },

  detailCard: {
    width: width - 48,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 20, gap: 10, marginBottom: 28,
  },
  visitorName: { fontFamily: 'Inter-Bold', fontSize: 26, color: '#DEE1F7', textAlign: 'center' },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  detailText:  { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE' },
  countdownText:{ fontFamily: 'Inter-Medium', fontSize: 13, color: '#FACC15' },

  /* Buttons */
  actionRow: { flexDirection: 'row', gap: 14, width: width - 48 },
  denyBtn:    { flex: 1, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(238,125,119,0.3)', minHeight: 80 },
  approveBtn: { flex: 1.4, borderRadius: 20, overflow: 'hidden', minHeight: 80 },
  btnInner:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, padding: 16 },
  btnMuted:   { opacity: 0.3 },
  denyBtnText:    { fontFamily: 'Inter-Bold', fontSize: 18, color: '#EE7D77' },
  approveBtnText: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#090E18' },

  dismissLink: { marginTop: 16 },
  dismissText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4a5568', textDecorationLine: 'underline' },

  /* Result */
  resultContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 },
  resultIcon:      { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  resultIconGreen: { backgroundColor: 'rgba(37,224,167,0.15)' },
  resultIconRed:   { backgroundColor: 'rgba(238,125,119,0.15)' },
  resultTitle:     { fontFamily: 'Inter-Black', fontSize: 28, textAlign: 'center' },
  resultSub:       { fontFamily: 'Inter-Regular', fontSize: 15, color: '#9BABCE', textAlign: 'center', lineHeight: 22 },
});
