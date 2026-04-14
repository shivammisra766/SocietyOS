import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import ResidentHeader from '../../components/ResidentHeader';
import { triggerHaptic } from '../../utils/haptics';
import { useSocket } from '../../hooks/useSocket';
import api from '../../lib/api';

/* ── Types ── */
interface NotifMetadata { entryId?: string; }
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  metadata?: NotifMetadata;
}

/* ── Icon / colour map per notification type ── */
const TYPE_CONFIG: Record<string, { icon: string; accent: string; bg: string }> = {
  WALK_IN_REQUEST: { icon: 'person-pin-circle', accent: '#FACC15', bg: 'rgba(250,204,21,0.08)' },
  ENTRY_APPROVED:  { icon: 'check-circle',      accent: '#25E0A7', bg: 'rgba(37,224,167,0.08)' },
  ENTRY_REJECTED:  { icon: 'cancel',            accent: '#EE7D77', bg: 'rgba(238,125,119,0.08)' },
  ENTRY_APPROVED_default: { icon: 'notifications', accent: '#818cf8', bg: 'rgba(99,102,241,0.08)' },
};
const defaultCfg = { icon: 'notifications', accent: '#9BABCE', bg: 'rgba(255,255,255,0.04)' };

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/* ── Animated entry-request card ── */
function EntryRequestCard({
  notif, onRespond,
}: {
  notif: Notification;
  onRespond: (notifId: string, entryId: string, action: 'approve' | 'deny') => Promise<void>;
}) {
  const [loading, setLoading] = useState<'approve' | 'deny' | null>(null);
  const [done,    setDone]    = useState<'approve' | 'deny' | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handle = async (action: 'approve' | 'deny') => {
    if (!notif.metadata?.entryId || loading || done) return;
    setLoading(action);
    await onRespond(notif.id, notif.metadata.entryId, action);
    setLoading(null);
    setDone(action);
    Animated.timing(fadeAnim, { toValue: 0.4, duration: 400, useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[styles.requestCard, { opacity: fadeAnim }]}>
      {/* Header */}
      <View style={styles.requestTopRow}>
        <View style={styles.requestBadge}>
          <Text style={styles.requestBadgeText}>Entry Request</Text>
        </View>
        <Text style={styles.notifTime}>{timeAgo(notif.createdAt)}</Text>
      </View>

      {/* Body */}
      <View style={styles.requestBody}>
        <View style={styles.requestAvatarWrap}>
          <MaterialIcons name="person-pin-circle" size={28} color="#FACC15" />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.requestName}>{notif.title}</Text>
          <Text style={styles.requestSub}>{notif.body}</Text>
        </View>
      </View>

      {/* Action buttons / result */}
      {done ? (
        <View style={[styles.doneRow, done === 'approve' ? styles.doneApprove : styles.doneDeny]}>
          <MaterialIcons name={done === 'approve' ? 'check-circle' : 'cancel'} size={16}
            color={done === 'approve' ? '#25E0A7' : '#EE7D77'} />
          <Text style={[styles.doneText, { color: done === 'approve' ? '#25E0A7' : '#EE7D77' }]}>
            {done === 'approve' ? 'Entry Approved' : 'Entry Denied'}
          </Text>
        </View>
      ) : (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.approveBtn, loading === 'deny' && styles.btnDisabled]}
            onPress={() => handle('approve')}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === 'approve'
              ? <ActivityIndicator size="small" color="#090E18" />
              : <MaterialIcons name="check" size={18} color="#090E18" />
            }
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.denyBtn, loading === 'approve' && styles.btnDisabled]}
            onPress={() => handle('deny')}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === 'deny'
              ? <ActivityIndicator size="small" color="#EE7D77" />
              : <MaterialIcons name="close" size={18} color="#EE7D77" />
            }
            <Text style={styles.denyBtnText}>Deny</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

/* ── Main screen ── */
export default function ResidentMessages() {
  const socket = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,        setLoading]       = useState(true);
  const [refreshing,     setRefreshing]    = useState(false);

  const fetchNotifications = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/notifications');
      const data: Notification[] = res.data.data || [];
      setNotifications(data);
      // Mark all as read silently
      await api.patch('/notifications/read-all').catch(() => {});
    } catch (err) {
      console.error('[Messages] fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Live: new walk-in notification arrives via socket
  useEffect(() => {
    if (!socket) return;
    const handler = ({ entry }: any) => {
      const newNotif: Notification = {
        id:        `live-${entry.id}`,
        type:      'WALK_IN_REQUEST',
        title:     'Entry Request',
        body:      `${entry.visitorName} is at the gate requesting entry`,
        isRead:    false,
        createdAt: new Date().toISOString(),
        metadata:  { entryId: entry.id },
      };
      setNotifications(prev => [newNotif, ...prev]);
      triggerHaptic('success');
    };
    socket.on('entry:new', handler);
    return () => { socket.off('entry:new', handler); };
  }, [socket]);

  const handleRespond = useCallback(async (
    notifId: string, entryId: string, action: 'approve' | 'deny'
  ) => {
    try {
      await api.patch(`/entry/${entryId}/${action}`);
      triggerHaptic(action === 'approve' ? 'success' : 'error');
    } catch (err: any) {
      console.error('[Messages] respond error:', err?.response?.data || err);
    }
  }, []);

  /* Split notifications */
  const pending  = notifications.filter(n => n.type === 'WALK_IN_REQUEST');
  const history  = notifications.filter(n => n.type !== 'WALK_IN_REQUEST');

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      <ResidentHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} tintColor="#53FEC2" />
        }
      >
        <Text style={styles.eyebrow}>INBOX</Text>
        <Text style={styles.heroTitle}>Messages</Text>

        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* ── Pending Entry Requests ── */}
            {pending.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabelAccent}>PENDING ACTIONS</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{pending.length}</Text>
                  </View>
                </View>

                {pending.map(n => (
                  <EntryRequestCard key={n.id} notif={n} onRespond={handleRespond} />
                ))}
              </>
            )}

            {pending.length === 0 && (
              <View style={styles.emptyPending}>
                <MaterialIcons name="check-circle-outline" size={32} color="#25293A" />
                <Text style={styles.emptyPendingText}>No pending entry requests</Text>
              </View>
            )}

            {/* ── Notification History ── */}
            {history.length > 0 && (
              <>
                <View style={[styles.sectionHeader, { marginTop: 12 }]}>
                  <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
                  <TouchableOpacity onPress={() => api.patch('/notifications/read-all').catch(() => {})}>
                    <Text style={styles.markAllRead}>Mark all read</Text>
                  </TouchableOpacity>
                </View>

                {history.map(n => {
                  const cfg = TYPE_CONFIG[n.type] || defaultCfg;
                  return (
                    <View key={n.id} style={[styles.notifCard, { backgroundColor: cfg.bg }, !n.isRead && styles.notifUnread]}>
                      <View style={[styles.notifIconWrap, { borderColor: cfg.accent + '30' }]}>
                        <MaterialIcons name={cfg.icon as any} size={20} color={cfg.accent} />
                      </View>
                      <View style={styles.notifInfo}>
                        <Text style={styles.notifTitle}>{n.title}</Text>
                        <Text style={styles.notifBody} numberOfLines={2}>{n.body}</Text>
                        <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                      </View>
                      {!n.isRead && <View style={[styles.unreadDot, { backgroundColor: cfg.accent }]} />}
                    </View>
                  );
                })}
              </>
            )}

            {notifications.length === 0 && (
              <View style={styles.emptyFull}>
                <MaterialIcons name="inbox" size={52} color="#25293A" />
                <Text style={styles.emptyFullTitle}>All clear</Text>
                <Text style={styles.emptyFullSub}>No messages or notifications yet</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  eyebrow:   { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  heroTitle: { fontFamily: 'Inter-Bold', fontSize: 32, color: '#DEE1F7', marginBottom: 20 },

  sectionHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionLabelAccent: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#53FEC2', textTransform: 'uppercase' as const },
  sectionLabel:       { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#9BABCE', textTransform: 'uppercase' as const, flex: 1 },
  markAllRead:        { fontFamily: 'Inter-Medium', fontSize: 12, color: '#53FEC2' },
  countBadge:         { backgroundColor: 'rgba(250,204,21,0.2)', borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText:     { fontFamily: 'Inter-Bold', fontSize: 10, color: '#FACC15' },

  /* ── Entry Request Card ── */
  requestCard: {
    backgroundColor: 'rgba(250,204,21,0.05)',
    borderRadius: 24, borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)',
    padding: 20, marginBottom: 12, gap: 14,
  },
  requestTopRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestBadge:   { backgroundColor: 'rgba(250,204,21,0.15)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 4 },
  requestBadgeText: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 1, color: '#FACC15', textTransform: 'uppercase' as const },
  requestBody:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requestAvatarWrap: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(250,204,21,0.1)', alignItems: 'center', justifyContent: 'center' },
  requestName:    { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7' },
  requestSub:     { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE', lineHeight: 18 },

  actionRow:  { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25E0A7', borderRadius: 12, height: 48 },
  approveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#090E18' },
  denyBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(238,125,119,0.12)', borderRadius: 12, height: 48, borderWidth: 1, borderColor: 'rgba(238,125,119,0.3)' },
  denyBtnText:{ fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#EE7D77' },
  btnDisabled:{ opacity: 0.4 },

  doneRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  doneApprove: { backgroundColor: 'rgba(37,224,167,0.08)', borderRadius: 10, paddingHorizontal: 12 },
  doneDeny:    { backgroundColor: 'rgba(238,125,119,0.08)', borderRadius: 10, paddingHorizontal: 12 },
  doneText:    { fontFamily: 'Inter-SemiBold', fontSize: 13 },

  /* ── Notification card ── */
  notifCard: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, marginBottom: 8, gap: 12,
  },
  notifUnread:   { borderColor: 'rgba(255,255,255,0.12)' },
  notifIconWrap: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.04)' },
  notifInfo:     { flex: 1, gap: 3 },
  notifTitle:    { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },
  notifBody:     { fontFamily: 'Inter-Regular', fontSize: 12, color: '#9BABCE', lineHeight: 18 },
  notifTime:     { fontFamily: 'Inter-Regular', fontSize: 10, color: '#4a5568' },
  unreadDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 4 },

  /* ── Empty states ── */
  emptyPending:     { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: 'rgba(37,224,167,0.05)', borderRadius: 14, marginBottom: 24 },
  emptyPendingText: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#4a5568' },
  emptyFull:        { alignItems: 'center', gap: 10, paddingVertical: 60 },
  emptyFullTitle:   { fontFamily: 'Inter-Bold', fontSize: 20, color: '#25293A' },
  emptyFullSub:     { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },
});
