import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ResidentHeader from '../../components/ResidentHeader';
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

const TYPE_LABEL: Record<string, string> = {
  DELIVERY: 'Delivery',
  GUEST: 'Guest',
  CAB: 'Cab',
  HOUSEHOLD_WORKER: 'Staff',
  SERVICE_PROFESSIONAL: 'Service',
};

export default function ResidentHome() {
  const router = useRouter();
  const [recentEntries, setRecentEntries] = useState<EntryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchEntries = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);

    try {
      const response = await api.get('/entry/my-flat');
      setRecentEntries((response.data.data || []).slice(0, 5));
    } catch {
      // Keep the surface calm if history fetch fails.
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchEntries();
  }, [fetchEntries]);

  const visitorTypeLabel = (type: string) =>
    TYPE_LABEL[type] || type?.replace(/_/g, ' ') || 'Visitor';

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#090e18', '#0e1322', '#090e18']}
        style={StyleSheet.absoluteFill}
      />
      <ResidentHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void fetchEntries(true)}
            tintColor="#53FEC2"
          />
        )}
      >
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
              <Text style={styles.bentoPrimarySub}>
                Generate a QR code for your guest
              </Text>
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

            <TouchableOpacity 
              style={styles.bentoSecondary} 
              activeOpacity={0.85}
              onPress={() => router.push('/(resident)/notices')}
            >
              <MaterialIcons name="forum" size={20} color="#9BABCE" />
              <Text style={styles.bentoSecondaryText}>Notice Board</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.serviceTicketBtn}
          onPress={() => router.push('/(resident)/complaints' as any)}
          activeOpacity={0.85}
        >
          <View style={styles.serviceTicketIconWrap}>
            <MaterialIcons name="build-circle" size={24} color="#C084FC" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceTicketTitle}>Service & Maintenance</Text>
            <Text style={styles.serviceTicketSub}>Report issues to facility management</Text>
          </View>
          <MaterialIcons name="chevron-right" size={20} color="#9BABCE" />
        </TouchableOpacity>

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
        ) : (
          recentEntries.map((entry) => {
            const isExited = !!entry.exitTime;
            const isInbound =
              !isExited && (entry.status === 'APPROVED' || entry.status === 'SCANNED');
            const time = new Date(entry.entryTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            const initials = (entry.visitorName || 'V')
              .split(' ')
              .map((name) => name[0] || '')
              .join('')
              .slice(0, 2);

            return (
              <View key={entry.id} style={styles.visitorCard}>
                <View style={styles.visitorAvatar}>
                  <Text style={styles.visitorAvatarText}>
                    {initials.toUpperCase()}
                  </Text>
                </View>

                <View style={styles.visitorInfo}>
                  <Text style={styles.visitorName}>{entry.visitorName}</Text>
                  <Text style={styles.visitorAction}>
                    {visitorTypeLabel(entry.visitorType)} - Flat {entry.flat?.number || '-'}
                  </Text>
                </View>

                <View style={styles.visitorRight}>
                  <Text style={styles.visitorTime}>{time}</Text>
                  <View
                    style={[
                      styles.directionBadge,
                      isInbound ? styles.badgeInbound : styles.badgeOutbound,
                    ]}
                  >
                    <Text
                      style={[
                        styles.directionText,
                        isInbound ? styles.badgeInboundText : styles.badgeOutboundText,
                      ]}
                    >
                      {isExited ? 'Exited' : isInbound ? 'Inside' : entry.status}
                    </Text>
                  </View>
                </View>
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
  container: {
    flex: 1,
    backgroundColor: '#090e18',
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },

  sectionLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 3,
    color: '#9BABCE',
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  viewAll: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#53FEC2',
  },

  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  bentoPrimary: {
    flex: 1,
    backgroundColor: '#34495E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    height: 144,
    justifyContent: 'space-between',
  },

  bentoPrimaryText: {
    gap: 4,
  },

  bentoPrimaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#DBE5FF',
  },

  bentoPrimarySub: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#9BABCE',
  },

  bentoPrimaryArrow: {
    alignSelf: 'flex-end',
  },

  bentoSecondaryStack: {
    flex: 1,
    gap: 12,
  },

  bentoSecondary: {
    flex: 1,
    backgroundColor: 'rgba(20,25,35,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  bentoSecondaryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#DEE1F7',
  },

  serviceTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.6)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 16,
    marginBottom: 24,
    gap: 14,
  },
  serviceTicketIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(192,132,252,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(192,132,252,0.2)',
  },
  serviceTicketTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#DEE1F7',
    marginBottom: 2,
  },
  serviceTicketSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#9BABCE',
  },

  visitorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },

  visitorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#25293A',
    alignItems: 'center',
    justifyContent: 'center',
  },

  visitorAvatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#9BABCE',
  },

  visitorInfo: {
    flex: 1,
    gap: 2,
  },

  visitorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#DEE1F7',
  },

  visitorAction: {
    fontFamily: 'Inter-Light',
    fontSize: 12,
    color: '#9BABCE',
  },

  visitorRight: {
    alignItems: 'flex-end',
    gap: 6,
  },

  visitorTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6c7a8f',
  },

  directionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    borderWidth: 1,
  },

  badgeInbound: {
    borderColor: 'rgba(37,224,167,0.3)',
  },

  badgeOutbound: {
    borderColor: 'rgba(255,255,255,0.1)',
  },

  directionText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  badgeInboundText: {
    color: '#25E0A7',
  },

  badgeOutboundText: {
    color: '#9BABCE',
  },

  emptyState: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 32,
  },

  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#4a5568',
  },
});
