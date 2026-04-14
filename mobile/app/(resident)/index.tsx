import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Dimensions,
  Animated, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ResidentHeader from '../../components/ResidentHeader';
import { useEntryRequests } from '../../hooks/useEntryRequests';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

interface EntryLog {
  id: string; visitorName: string; visitorType: string;
  status: string; exitTime: string | null; entryTime: string;
  flat?: { number: string };
}

const TYPE_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery', GUEST: 'Guest', CAB: 'Cab',
  HOUSEHOLD_WORKER: 'Staff', SERVICE_PROFESSIONAL: 'Service',
};

export default function ResidentHome() {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bannerSlide = useRef(new Animated.Value(-120)).current;

  const { pendingRequest, responding, respond, dismiss } = useEntryRequests();

  const [recentEntries, setRecentEntries] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /* Pulse dot for status indicator */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  /* Slide-in banner when a pending request arrives */
  useEffect(() => {
    Animated.spring(bannerSlide, {
      toValue: pendingRequest ? 0 : -200,
      useNativeDriver: true,
      tension: 120,
      friction: 10,
    }).start();
  }, [pendingRequest, bannerSlide]);

  /* Fetch entry history */
  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/entry/my-flat');
      setRecentEntries((res.data.data || []).slice(0, 5));
    } catch { }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const visitorTypeLabel = (type: string) =>
    TYPE_LABEL[type] || type?.replace(/_/g, ' ') || 'Visitor';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      <ResidentHeader />

      {/* ── Live Approval Banner ── */}
      <Animated.View style={[styles.approvalBanner, { transform: [{ translateY: bannerSlide }] }]}>
        {pendingRequest && (
          <View style={styles.approvalInner}>
            <View style={styles.approvalLeft}>
              <View style={styles.approvalIconBg}>
                <MaterialIcons name="person-pin-circle" size={22} color="#53FEC2" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.approvalTitle} numberOfLines={1}>
                  {pendingRequest.visitorName} at the gate
                </Text>
                <Text style={styles.approvalSub}>
                  {visitorTypeLabel(pendingRequest.visitorType)} · Tap to approve or deny
                </Text>
              </View>
            </View>
            <View style={styles.approvalActions}>
              <TouchableOpacity
                style={styles.denyBtn}
                onPress={() => respond('deny')}
                disabled={responding}
              >
                <MaterialIcons name="close" size={18} color="#EE7D77" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => respond('approve')}
                disabled={responding}
              >
                {responding
                  ? <ActivityIndicator size="small" color="#090E18" />
                  : <MaterialIcons name="check" size={18} color="#090E18" />
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchEntries(true)} tintColor="#53FEC2" />
        }
      >
        {/* Quick Actions Bento */}
        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.bentoGrid}>
          <TouchableOpacity
            style={styles.bentoPrimary}
            onPress={() => router.push('/(resident)/create-pass')}
            activeOpacity={0.85}
          >
            <MaterialIcons name="add-circle-outline" size={28} color="#DBE5FF" />
            <View style={styles.bentoPrimaryText}>
              <Text style={styles.bentoPrimaryTitle}>Create Visitor Pass</Text>
              <Text style={styles.bentoPrimarySub}>Generate a QR code for your guest</Text>
            </View>
            <View style={styles.bentoPrimaryArrow}>
              <MaterialIcons name="arrow-forward" size={18} color="#9BABCE" />
            </View>
          </TouchableOpacity>

          <View style={styles.bentoSecondaryStack}>
            <TouchableOpacity
              style={styles.bentoSecondary}
              onPress={() => router.push('/(resident)/visitors')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="history" size={20} color="#9BABCE" />
              <Text style={styles.bentoSecondaryText}>Entry History</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bentoSecondary} activeOpacity={0.85}>
              <MaterialIcons name="forum" size={20} color="#9BABCE" />
              <Text style={styles.bentoSecondaryText}>Notice Board</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Visitors */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT VISITORS</Text>
          <TouchableOpacity onPress={() => router.push('/(resident)/visitors')}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginVertical: 20 }} />
        ) : recentEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={36} color="#25293A" />
            <Text style={styles.emptyText}>No recent visitor activity</Text>
          </View>
        ) : recentEntries.map(entry => {
          const isExited = !!entry.exitTime;
          const isInbound = !isExited && (entry.status === 'APPROVED' || entry.status === 'SCANNED');
          const time = new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const initials = entry.visitorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

          return (
            <View key={entry.id} style={styles.visitorCard}>
              <View style={styles.visitorAvatar}>
                <Text style={styles.visitorAvatarText}>{initials.toUpperCase()}</Text>
              </View>
              <View style={styles.visitorInfo}>
                <Text style={styles.visitorName}>{entry.visitorName}</Text>
                <Text style={styles.visitorAction}>
                  {visitorTypeLabel(entry.visitorType)} · Flat {entry.flat?.number || '—'}
                </Text>
              </View>
              <View style={styles.visitorRight}>
                <Text style={styles.visitorTime}>{time}</Text>
                <View style={[styles.directionBadge, isInbound ? styles.badgeInbound : styles.badgeOutbound]}>
                  <Text style={[styles.directionText, isInbound ? styles.badgeInboundText : styles.badgeOutboundText]}>
                    {isExited ? 'Exited' : isInbound ? 'Inside' : entry.status}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },

  /* ── Approval Banner ── */
  approvalBanner: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
  },
  approvalInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(14,22,16,0.97)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(83,254,194,0.3)',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  approvalLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  approvalIconBg: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(83,254,194,0.1)', alignItems: 'center', justifyContent: 'center',
  },
  approvalTitle: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },
  approvalSub: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#9BABCE' },
  approvalActions: { flexDirection: 'row', gap: 8 },
  denyBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(238,125,119,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#53FEC2', alignItems: 'center', justifyContent: 'center',
  },

  /* Sections */
  sectionLabel: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#9BABCE', textTransform: 'uppercase', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  viewAll: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#53FEC2' },

  /* Bento Grid */
  bentoGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bentoPrimary: { flex: 1, backgroundColor: '#34495E', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', padding: 20, height: 144, justifyContent: 'space-between' },
  bentoPrimaryText: { gap: 4 },
  bentoPrimaryTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#DBE5FF' },
  bentoPrimarySub: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#9BABCE' },
  bentoPrimaryArrow: { alignSelf: 'flex-end' },
  bentoSecondaryStack: { flex: 1, gap: 12 },
  bentoSecondary: { flex: 1, backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bentoSecondaryText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#DEE1F7' },

  /* Visitor Card */
  visitorCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(20,25,35,0.4)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 14, marginBottom: 8, gap: 12 },
  visitorAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center' },
  visitorAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#9BABCE' },
  visitorInfo: { flex: 1, gap: 2 },
  visitorName: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#DEE1F7' },
  visitorAction: { fontFamily: 'Inter-Light', fontSize: 12, color: '#9BABCE' },
  visitorRight: { alignItems: 'flex-end', gap: 6 },
  visitorTime: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#6c7a8f' },
  directionBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999, borderWidth: 1 },
  badgeInbound: { borderColor: 'rgba(37,224,167,0.3)' },
  badgeOutbound: { borderColor: 'rgba(255,255,255,0.1)' },
  directionText: { fontFamily: 'Inter-Bold', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  badgeInboundText: { color: '#25E0A7' },
  badgeOutboundText: { color: '#9BABCE' },

  emptyState: { alignItems: 'center', gap: 8, paddingVertical: 32 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },
});
