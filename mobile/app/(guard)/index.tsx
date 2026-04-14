import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TextInput, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GuardHeader from '../../components/GuardHeader';
import api from '../../lib/api';

interface EntryLog {
  id: string;
  visitorName: string;
  visitorType: string;
  status: string;
  exitTime: string | null;
  entryTime: string;
  flat?: { number: string };
}

const BADGE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: 'rgba(37,224,167,0.15)', text: '#25E0A7', label: 'INSIDE' },
  SCANNED:  { bg: 'rgba(99,102,241,0.15)', text: '#818cf8', label: 'SCANNED' },
  PENDING:  { bg: 'rgba(251,191,36,0.15)', text: '#fbbf24', label: 'PENDING' },
  REJECTED: { bg: 'rgba(238,125,119,0.15)',text: '#EE7D77', label: 'DENIED' },
  EXPIRED:  { bg: 'rgba(100,116,139,0.15)',text: '#64748b', label: 'EXPIRED' },
  EXITED:   { bg: 'rgba(100,116,139,0.15)',text: '#64748b', label: 'EXITED' },
};

export default function GuardLogs() {
  const [entries,     setEntries]     = useState<EntryLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState('');

  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res  = await api.get('/entry/today');
      setEntries(res.data.data || []);
    } catch (err) {
      console.error('[GuardLogs] fetch failed:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    const interval = setInterval(() => fetchEntries(), 10000);
    return () => clearInterval(interval);
  }, [fetchEntries]);

  /* Derived metrics */
  const total   = entries.length;
  const active  = entries.filter(e => (e.status === 'APPROVED' || e.status === 'SCANNED') && !e.exitTime).length;
  const pending = entries.filter(e => e.status === 'PENDING').length;

  const filtered = search.trim()
    ? entries.filter(e =>
        e.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        (e.flat?.number || '').toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      <GuardHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchEntries(true)}
            tintColor="#53FEC2"
          />
        }
      >
        <Text style={styles.eyebrow}>SECURITY LOG</Text>
        <Text style={styles.title}>Activity Logs</Text>

        {/* Metrics */}
        <View style={styles.metricRow}>
          {[
            { label: 'Today',   value: String(total),  color: '#DEE1F7' },
            { label: 'Inside',  value: String(active),  color: '#25E0A7' },
            { label: 'Pending', value: String(pending), color: '#fbbf24' },
          ].map((m, i) => (
            <View key={i} style={styles.metricCard}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text style={[styles.metricValue, { color: m.color }]}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#6c7a8f" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or flat…"
            placeholderTextColor="#4a5568"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color="#6c7a8f" />
            </TouchableOpacity>
          )}
        </View>

        {/* Log Feed */}
        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={40} color="#25293A" />
            <Text style={styles.emptyText}>No entries yet today</Text>
          </View>
        ) : filtered.map(entry => {
          const displayStatus = entry.exitTime ? 'EXITED' : entry.status;
          const badge = BADGE_COLORS[displayStatus] || BADGE_COLORS.PENDING;
          const time  = new Date(entry.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const initials = entry.visitorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2);

          return (
            <View key={entry.id} style={styles.logCard}>
              <View style={styles.logAvatar}>
                <Text style={styles.logAvatarText}>{initials.toUpperCase()}</Text>
              </View>
              <View style={styles.logInfo}>
                <Text style={styles.logName}>{entry.visitorName}</Text>
                <Text style={styles.logType}>
                  {entry.visitorType?.replace(/_/g, ' ')} · Flat {entry.flat?.number || '—'}
                </Text>
                <Text style={styles.logMeta}>{time}</Text>
              </View>
              <View style={[styles.logBadge, { backgroundColor: badge.bg }]}>
                <Text style={[styles.logBadgeText, { color: badge.text }]}>{badge.label}</Text>
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
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  title:   { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 20 },

  metricRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  metricCard: {
    flex: 1, backgroundColor: 'rgba(20,25,35,0.6)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16, gap: 6,
  },
  metricLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#9BABCE' },
  metricValue: { fontFamily: 'Inter-Bold', fontSize: 26 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.6)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 48, gap: 10, marginBottom: 20,
  },
  searchInput: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#DEE1F7' },

  logCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.4)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 14, marginBottom: 8, gap: 12,
  },
  logAvatar:     { width: 44, height: 44, borderRadius: 12, backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center' },
  logAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: '#9BABCE' },
  logInfo:       { flex: 1, gap: 2 },
  logName:       { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },
  logType:       { fontFamily: 'Inter-Regular', fontSize: 12, color: '#9BABCE' },
  logMeta:       { fontFamily: 'Inter-Regular', fontSize: 10, color: '#4a5568' },
  logBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  logBadgeText:  { fontFamily: 'Inter-Bold', fontSize: 8, letterSpacing: 1, textTransform: 'uppercase' as const },

  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText:  { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },
});
