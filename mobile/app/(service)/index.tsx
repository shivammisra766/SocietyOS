import React, { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

export default function ServiceDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/complaints/mine');
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setLoading(true);
      await api.patch(`/complaints/${id}/status`, { status });
      await fetchTasks();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to update task.' });
      setLoading(false);
    }
  };

  const assignedTasks = complaints.filter(c => c.status === 'ASSIGNED');
  const inProgressTasks = complaints.filter(c => c.status === 'IN_PROGRESS');
  const pastTasks = complaints.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED');

  const renderTask = (task: any) => {
    const isAssigned = task.status === 'ASSIGNED';
    const isInProgress = task.status === 'IN_PROGRESS';
    const isResolved = task.status === 'RESOLVED' || task.status === 'CLOSED';

    return (
      <View key={task.id} style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskSubtitle}>Flat {task.flat?.number || 'Unknown'} • {task.priority || 'LOW'} Priority</Text>
          </View>
          <View style={[styles.statusBadge, isResolved ? styles.statusClosed : isInProgress ? styles.statusProgress : styles.statusAssigned]}>
            <Text style={[styles.statusText, isResolved ? styles.textClosed : isInProgress ? styles.textProgress : styles.textAssigned]}>
              {task.status.replace('_', ' ')}
            </Text>
          </View>
        </View>

        <Text style={styles.taskDesc}>{task.description}</Text>

        <View style={styles.actionsBox}>
          {isAssigned && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.btnStart]} 
              onPress={() => updateStatus(task.id, 'IN_PROGRESS')}
            >
              <MaterialIcons name="play-arrow" size={16} color="#000" />
              <Text style={[styles.actionBtnText, { color: '#000' }]}>Start Work</Text>
            </TouchableOpacity>
          )}
          {isInProgress && (
             <TouchableOpacity 
              style={[styles.actionBtn, styles.btnResolve]} 
              onPress={() => updateStatus(task.id, 'RESOLVED')}
            >
              <MaterialIcons name="check" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#25E0A7" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Service Dashboard,</Text>
            <Text style={styles.name}>{user?.name || 'Staff'}</Text>
          </View>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#25E0A7" style={{ marginTop: 40 }} />
        ) : (
          <>
            {inProgressTasks.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>CURRENTLY WORKING</Text>
                {inProgressTasks.map(renderTask)}
              </>
            )}

            <Text style={[styles.sectionLabel, { marginTop: inProgressTasks.length ? 12 : 0 }]}>
              NEW ASSIGNMENTS ({assignedTasks.length})
            </Text>
            {assignedTasks.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No new assignments right now.</Text>
              </View>
            ) : (
              assignedTasks.map(renderTask)
            )}

            {pastTasks.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: 20 }]}>RECENTLY COMPLETED</Text>
                {pastTasks.slice(0, 5).map(renderTask)}
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20 },
  header: {
    marginBottom: 28,
  },
  greeting: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE' },
  name: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#DEE1F7', marginTop: 2 },
  sectionLabel: {
    fontFamily: 'Inter-Bold', fontSize: 11, letterSpacing: 2,
    color: '#9BABCE', marginBottom: 12,
  },
  emptyBox: {
    padding: 20,
    backgroundColor: 'rgba(20,25,35,0.4)',
    borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontFamily: 'Inter-Regular', fontSize: 13, color: '#6c7a8f',
  },
  taskCard: {
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  taskHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitle: {
    fontFamily: 'Inter-Bold', fontSize: 16, color: '#DEE1F7',
  },
  taskSubtitle: {
    fontFamily: 'Inter-Medium', fontSize: 12, color: '#6c7a8f', marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  statusAssigned: { backgroundColor: 'rgba(99,102,241,0.15)' },
  statusProgress: { backgroundColor: 'rgba(245,158,11,0.15)' },
  statusClosed: { backgroundColor: 'rgba(52,211,153,0.15)' },
  
  statusText: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 0.5 },
  textAssigned: { color: '#818cf8' },
  textProgress: { color: '#fbbf24' },
  textClosed: { color: '#34d399' },

  taskDesc: {
    fontFamily: 'Inter-Regular', fontSize: 14, color: '#9BABCE',
    lineHeight: 20, marginBottom: 16,
  },
  actionsBox: {
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, gap: 6,
  },
  btnStart: { backgroundColor: '#25E0A7' },
  btnResolve: { backgroundColor: '#3b82f6' },
  actionBtnText: {
    fontFamily: 'Inter-Bold', fontSize: 12, color: '#fff',
  },
});
