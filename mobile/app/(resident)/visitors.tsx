import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ResidentHeader from '../../components/ResidentHeader';
import api from '../../lib/api';

interface EntryLog {
  id: string; visitorName: string; visitorType: string;
  status: string; exitTime: string | null; entryTime: string;
  flat?: { number: string };
}

const TYPE_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery', GUEST: 'Guest', CAB: 'Cab',
  HOUSEHOLD_WORKER: 'Staff', SERVICE_PROFESSIONAL: 'Service',
};

const STATUS_CONFIG: Record<string, { text: string; badge: string }> = {
  APPROVED: { text: '#25E0A7', badge: 'rgba(37,224,167,0.15)' },
  SCANNED:  { text: '#818cf8', badge: 'rgba(99,102,241,0.15)' },
  PENDING:  { text: '#fbbf24', badge: 'rgba(251,191,36,0.15)' },
  REJECTED: { text: '#EE7D77', badge: 'rgba(238,125,119,0.15)' },
  EXITED:   { text: '#64748b', badge: 'rgba(100,116,139,0.15)' },
};

export default function ResidentVisitors() {
  const router = useRouter();
  const [entries,    setEntries]    = useState<EntryLog[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState<'all' | 'active' | 'exited'>('all');

  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/entry/my-flat');
      setEntries(res.data.data || []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const filtered = entries.filter(e => {
    if (tab === 'active') return !e.exitTime && (e.status === 'APPROVED' || e.status === 'SCANNED');
    if (tab === 'exited') return !!e.exitTime;
    return true;
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      <ResidentHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchEntries(true)} tintColor="#53FEC2" />
        }
      >
        <Text style={styles.eyebrow}>ACCESS CONTROL</Text>
        <Text style={styles.heroTitle}>My Visitors</Text>

        {/* Tab Pills */}
        <View style={styles.pillRow}>
          {(['all', 'active', 'exited'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.pill, tab === t && styles.pillActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.pillText, tab === t && styles.pillTextActive]}>
                {t === 'all' ? 'All History' : t === 'active' ? 'Currently Inside' : 'Exited'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Create pass FAB hint */}
        <TouchableOpacity
          style={styles.createPassRow}
          onPress={() => router.push('/(resident)/create-pass')}
          activeOpacity={0.85}
        >
          <View style={styles.createPassIcon}>
            <MaterialIcons name="add" size={20} color="#53FEC2" />
          </View>
          <Text style={styles.createPassText}>Create new visitor pass</Text>
          <MaterialIcons name="chevron-right" size={18} color="#6c7a8f" />
        </TouchableOpacity>

        {/* Entry list */}
        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={44} color="#25293A" />
            <Text style={styles.emptyText}>No entries in this category</Text>
          </View>
        ) : filtered.map(entry => {
          const isExited = !!entry.exitTime;
          const displayStatus = isExited ? 'EXITED' : entry.status;
          const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.PENDING;
          const entryTime = new Date(entry.entryTime).toLocaleString([], {
            month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          });
          const exitTime = entry.exitTime
            ? new Date(entry.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;
          const initials = entry.visitorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

          return (
            <View key={entry.id} style={styles.entryCard}>
              <View style={styles.entryLeft}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials.toUpperCase()}</Text>
                </View>
                <View style={styles.entryInfo}>
                  <Text style={styles.entryName}>{entry.visitorName}</Text>
                  <Text style={styles.entrySub}>
                    {TYPE_LABEL[entry.visitorType] || entry.visitorType?.replace(/_/g, ' ')}
                    {entry.flat?.number ? ` · Flat ${entry.flat.number}` : ''}
                  </Text>
                  <Text style={styles.entryTime}>In: {entryTime}{exitTime ? `  ·  Out: ${exitTime}` : ''}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.badge }]}>
                <Text style={[styles.statusText, { color: cfg.text }]}>
                  {isExited ? 'Exited' : displayStatus}
                </Text>
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
  container:     { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  eyebrow:   { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  heroTitle: { fontFamily: 'Inter-Bold', fontSize: 32, color: '#DEE1F7', marginBottom: 20 },

  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  pill:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillActive:   { backgroundColor: '#34495E', borderColor: 'rgba(255,255,255,0.05)' },
  pillText:     { fontFamily: 'Inter-Medium', fontSize: 13, color: '#9BABCE' },
  pillTextActive:{ color: '#DBE5FF' },

  createPassRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(83,254,194,0.05)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(83,254,194,0.15)',
    paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20,
  },
  createPassIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(83,254,194,0.1)', alignItems: 'center', justifyContent: 'center' },
  createPassText: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#DEE1F7', flex: 1 },

  entryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(20,25,35,0.5)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, marginBottom: 10,
  },
  entryLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar:     { width: 44, height: 44, borderRadius: 12, backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#9BABCE' },
  entryInfo:  { flex: 1, gap: 2 },
  entryName:  { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },
  entrySub:   { fontFamily: 'Inter-Regular', fontSize: 12, color: '#9BABCE' },
  entryTime:  { fontFamily: 'Inter-Regular', fontSize: 10, color: '#4a5568', marginTop: 2 },
  statusBadge:{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  statusText: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase' as const },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText:  { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },
});
