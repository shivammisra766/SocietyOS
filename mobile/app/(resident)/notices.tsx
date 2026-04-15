import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { triggerHaptic } from '../../utils/haptics';

interface Notice {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  isPinned: boolean;
  createdAt: string;
}

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  GENERAL: 'announcement',
  MAINTENANCE: 'build',
  EVENT: 'event',
  EMERGENCY: 'warning',
};

const PRIORITY_COLORS: Record<string, string> = {
  NORMAL: '#9BABCE',
  HIGH: '#FACC15',
  URGENT: '#EE7D77',
};

export default function ResidentNotices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/notices');
      setNotices(res.data.data || []);
    } catch (err) {
      console.warn('Failed to fetch notices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    const handleNewNotice = (newNotice: Notice) => {
      setNotices(prev => {
        const exists = prev.some(n => n.id === newNotice.id);
        if (exists) return prev;
        
        const updated = [newNotice, ...prev];
        return updated.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      });
      triggerHaptic('success');
    };
    
    socket.on('notice:new', handleNewNotice);
    return () => { socket.off('notice:new', handleNewNotice); };
  }, [socket]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      
      {/* Custom Header (since it's not a tab) */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#DEE1F7" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notice Board</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchNotices(true)} tintColor="#53FEC2" />}
      >
        <Text style={styles.heroTitle}>Society Updates</Text>

        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginTop: 40 }} />
        ) : notices.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="campaign" size={44} color="#25293A" />
            <Text style={styles.emptyText}>No notices posted yet</Text>
          </View>
        ) : (
          notices.map(notice => {
            const icon = CATEGORY_ICONS[notice.category] || 'info-outline';
            const priorityColor = PRIORITY_COLORS[notice.priority] || PRIORITY_COLORS.NORMAL;
            const date = new Date(notice.createdAt).toLocaleString([], {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <View key={notice.id} style={[styles.noticeCard, notice.isPinned && styles.pinnedCard]}>
                {notice.isPinned && (
                  <View style={styles.pinBadge}>
                    <MaterialIcons name="push-pin" size={12} color="#FACC15" />
                    <Text style={styles.pinText}>PINNED</Text>
                  </View>
                )}
                <View style={styles.noticeHeader}>
                  <View style={[styles.iconWrapper, { backgroundColor: `${priorityColor}15` }]}>
                    <MaterialIcons name={icon} size={20} color={priorityColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.noticeTitle}>{notice.title}</Text>
                    <Text style={styles.noticeMeta}>{date} · {notice.category.toLowerCase()}</Text>
                  </View>
                </View>
                <Text style={styles.noticeBody}>{notice.body}</Text>
              </View>
            );
          })
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 24 },
  heroTitle: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 24 },
  emptyState: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },
  
  noticeCard: {
    backgroundColor: 'rgba(20,25,35,0.5)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    padding: 18, marginBottom: 16, position: 'relative',
  },
  pinnedCard: {
    borderColor: 'rgba(250,204,21,0.3)', backgroundColor: 'rgba(250,204,21,0.03)',
  },
  pinBadge: {
    position: 'absolute', top: -10, right: 16, backgroundColor: '#090e18',
    flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)',
  },
  pinText: { fontFamily: 'Inter-Bold', fontSize: 9, color: '#FACC15', letterSpacing: 0.5 },
  noticeHeader: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'center' },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7', marginBottom: 2 },
  noticeMeta: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#6c7a8f', textTransform: 'capitalize' },
  noticeBody: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#9BABCE', lineHeight: 22 },
});
