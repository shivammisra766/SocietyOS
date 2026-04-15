import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';

export default function ServiceActivity() {
  const insets = useSafeAreaInsets();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/complaints/mine');
      const all = res.data.data || [];
      const completed = all.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED');
      setLogs(completed);
    } catch (err) {
      console.warn('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchLogs(true)} tintColor="#25E0A7" />}
      >
        <Text style={styles.eyebrow}>PERFORMANCE & LOGS</Text>
        <Text style={styles.title}>Completed Tasks</Text>

        {loading ? (
           <ActivityIndicator size="large" color="#25E0A7" style={{ marginTop: 40 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialIcons name="done-all" size={48} color="#25293A" />
            <Text style={styles.emptyText}>No completed tasks found.</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logCard}>
              <View style={styles.logIconRow}>
                <MaterialIcons name="check-circle" size={24} color="#25E0A7" />
                <View>
                  <Text style={styles.logTitle}>{log.title}</Text>
                  <Text style={styles.logTime}>{new Date(log.updatedAt).toLocaleString()}</Text>
                </View>
              </View>
              <Text style={styles.logDesc}>{log.description}</Text>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20 },
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#9BABCE', marginBottom: 8 },
  title: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 20 },
  emptyBox: { alignItems: 'center', marginTop: 60, opacity: 0.8 },
  emptyText: { fontFamily: 'Inter-Medium', color: '#9BABCE', marginTop: 12 },
  logCard: {
    backgroundColor: 'rgba(20,25,35,0.4)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 16, marginBottom: 12,
  },
  logIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logTitle: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#DEE1F7' },
  logTime: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#9BABCE' },
  logDesc: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#6c7a8f', lineHeight: 20 },
});
