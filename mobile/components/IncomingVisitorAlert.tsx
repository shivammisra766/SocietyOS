/**
 * IncomingVisitorAlert
 *
 * Full-screen "incoming call" style overlay — shown when a visitor arrives
 * at the gate and the resident's app is in the foreground.
 *
 * Features:
 *  - 3 staggered pulsing concentric rings (call animation)
 *  - Visitor name + gate message
 *  - 30-second auto-deny countdown
 *  - Phone-call-inspired Allow / Deny button layout
 */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Animated,
  TouchableOpacity, Modal, ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useIncomingVisitor } from '../context/IncomingVisitorContext';
import { triggerHaptic } from '../utils/haptics';
import api from '../lib/api';

const { height } = Dimensions.get('window');
const AUTO_DENY_SEC = 30;

export default function IncomingVisitorAlert() {
  const { incoming, setIncoming } = useIncomingVisitor();
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null);
  const [timeLeft, setTimeLeft] = useState(AUTO_DENY_SEC);

  // ── Animations ─────────────────────────────────────────────────────────────
  const ring1    = useRef(new Animated.Value(0)).current;
  const ring2    = useRef(new Animated.Value(0)).current;
  const ring3    = useRef(new Animated.Value(0)).current;
  const avatarPulse = useRef(new Animated.Value(1)).current;
  const slideY   = useRef(new Animated.Value(height)).current;

  // Slide in when a new visitor arrives
  useEffect(() => {
    if (!incoming) return;

    slideY.setValue(height);
    Animated.spring(slideY, {
      toValue: 0, useNativeDriver: true,
      tension: 70, friction: 14,
    }).start();

    // Pulsing rings — staggered by 600 ms each
    const makeRingLoop = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    const r1 = makeRingLoop(ring1, 0);
    const r2 = makeRingLoop(ring2, 600);
    const r3 = makeRingLoop(ring3, 1200);
    r1.start(); r2.start(); r3.start();

    // Avatar heartbeat
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarPulse, { toValue: 1.1, duration: 500, useNativeDriver: true }),
        Animated.timing(avatarPulse, { toValue: 1.0, duration: 500, useNativeDriver: true }),
      ])
    );
    beat.start();

    // Countdown → auto-deny
    setTimeLeft(AUTO_DENY_SEC);
    let remaining = AUTO_DENY_SEC;
    const timer = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        handleDeny(true);
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      r1.stop(); r2.stop(); r3.stop(); beat.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming?.entryId]);

  const dismiss = useCallback(() => {
    Animated.timing(slideY, { toValue: height, duration: 280, useNativeDriver: true }).start(() => {
      setIncoming(null);
      slideY.setValue(height);
    });
  }, [setIncoming, slideY]);

  const handleApprove = useCallback(async () => {
    if (!incoming || loading) return;
    setLoading('approve');
    triggerHaptic('success');
    try { await api.patch(`/entry/${incoming.entryId}/approve`); } catch { /* no-op */ }
    setLoading(null);
    dismiss();
  }, [incoming, loading, dismiss]);

  const handleDeny = useCallback(async (auto = false) => {
    if (!incoming || loading) return;
    setLoading('deny');
    if (!auto) triggerHaptic('error');
    try { await api.patch(`/entry/${incoming.entryId}/deny`); } catch { /* no-op */ }
    setLoading(null);
    dismiss();
  }, [incoming, loading, dismiss]);

  if (!incoming) return null;

  // Ring interpolations
  const ringProps = (anim: Animated.Value) => ({
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.8] }) }],
    opacity:   anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.5, 0.25, 0] }),
  });

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.root, { transform: [{ translateY: slideY }] }]}>
        {/* Background */}
        <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={['rgba(4,8,18,0.96)', 'rgba(9,14,24,0.98)', 'rgba(4,8,18,0.96)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top badge */}
        <View style={styles.topBadge}>
          <MaterialIcons name="shield" size={14} color="#53FEC2" />
          <Text style={styles.topBadgeText}>SOCIETYOS · GATE ALERT</Text>
        </View>

        {/* ── Call Visual Center ── */}
        <View style={styles.callCenter}>
          <Text style={styles.incomingLabel}>VISITOR AT GATE</Text>

          {/* Rings + Avatar */}
          <View style={styles.ringsWrapper}>
            <Animated.View style={[styles.ring, ringProps(ring1)]} />
            <Animated.View style={[styles.ring, ringProps(ring2)]} />
            <Animated.View style={[styles.ring, ringProps(ring3)]} />

            <Animated.View style={[styles.avatar, { transform: [{ scale: avatarPulse }] }]}>
              <LinearGradient
                colors={['#1e3a5f', '#0e1f3d']}
                style={styles.avatarGradient}
              >
                <MaterialIcons name="person" size={56} color="#DEE1F7" />
              </LinearGradient>
            </Animated.View>
          </View>

          {/* Visitor info */}
          <Text style={styles.visitorName}>{incoming.visitorName}</Text>
          <Text style={styles.visitorSub}>
            {incoming.message || 'is requesting entry to your flat'}
          </Text>
          {incoming.visitorType && (
            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{incoming.visitorType.replace(/_/g, ' ')}</Text>
            </View>
          )}

          {/* Countdown pill */}
          <View style={styles.countdownPill}>
            <MaterialIcons name="timer" size={14} color="#FACC15" />
            <Text style={styles.countdownText}>
              Auto-deny in {timeLeft}s
            </Text>
          </View>
        </View>

        {/* ── Call Buttons ── */}
        <View style={styles.buttons}>
          {/* Deny */}
          <View style={styles.buttonCol}>
            <TouchableOpacity
              style={styles.denyOuter}
              onPress={() => handleDeny(false)}
              disabled={!!loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['rgba(238,125,119,0.25)', 'rgba(238,125,119,0.12)']}
                style={styles.btnCircle}
              >
                {loading === 'deny'
                  ? <ActivityIndicator color="#EE7D77" size={28} />
                  : <MaterialIcons name="call-end" size={32} color="#EE7D77" />
                }
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.btnLabel, { color: '#EE7D77' }]}>Deny</Text>
          </View>

          {/* Approve */}
          <View style={styles.buttonCol}>
            <TouchableOpacity
              style={styles.approveOuter}
              onPress={handleApprove}
              disabled={!!loading}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#25E0A7', '#1abc8e']}
                style={styles.btnCircle}
              >
                {loading === 'approve'
                  ? <ActivityIndicator color="#090e18" size={28} />
                  : <MaterialIcons name="call" size={32} color="#090e18" />
                }
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.btnLabel, { color: '#25E0A7' }]}>Allow Entry</Text>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const AVATAR_SIZE  = 110;
const RING_SIZE    = AVATAR_SIZE;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 72,
    paddingBottom: 60,
  },

  topBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(83,254,194,0.08)',
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(83,254,194,0.2)',
    paddingHorizontal: 14, paddingVertical: 7,
  },
  topBadgeText: {
    fontFamily: 'Inter-Bold', fontSize: 11, letterSpacing: 2, color: '#53FEC2',
  },

  // ── Call Visual ──────────────────────────────────────────────────────────
  callCenter: { alignItems: 'center', gap: 14 },

  incomingLabel: {
    fontFamily: 'Inter-Bold', fontSize: 12, letterSpacing: 4,
    color: '#FACC15', marginBottom: 8,
  },

  ringsWrapper: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 20,
  },
  ring: {
    position: 'absolute',
    width: RING_SIZE, height: RING_SIZE, borderRadius: RING_SIZE / 2,
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.5)',
  },
  avatar: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3, borderColor: 'rgba(219,229,255,0.15)',
  },
  avatarGradient: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },

  visitorName: {
    fontFamily: 'Inter-Bold', fontSize: 30, color: '#DEE1F7',
    textAlign: 'center',
  },
  visitorSub: {
    fontFamily: 'Inter-Regular', fontSize: 15, color: '#9BABCE',
    textAlign: 'center', lineHeight: 22, maxWidth: 260,
  },
  typePill: {
    backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    paddingHorizontal: 14, paddingVertical: 5,
  },
  typePillText: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, letterSpacing: 1.5,
    color: '#818cf8', textTransform: 'uppercase' as const,
  },

  countdownPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(250,204,21,0.08)',
    borderRadius: 999, borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)',
    paddingHorizontal: 14, paddingVertical: 7,
    marginTop: 4,
  },
  countdownText: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: '#FACC15',
  },

  // ── Buttons ──────────────────────────────────────────────────────────────
  buttons: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 60,
  },
  buttonCol: { alignItems: 'center', gap: 12 },
  btnCircle: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  denyOuter: {
    borderRadius: 38,
    borderWidth: 2, borderColor: 'rgba(238,125,119,0.3)',
  },
  approveOuter: {
    borderRadius: 38,
    borderWidth: 2, borderColor: 'rgba(37,224,167,0.4)',
  },
  btnLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 14,
  },
});
