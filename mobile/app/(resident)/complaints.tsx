import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../lib/api';

export default function ResidentComplaints() {
  const insets = useSafeAreaInsets();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('PLUMBING'); // PLUMBING, ELECTRICAL, CLEANING, SECURITY, OTHER
  const [submitting, setSubmitting] = useState(false);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/mine');
      setComplaints(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please fill in both title and description.' });
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        title,
        description,
        category,
        priority: 'MEDIUM',
      });
      setModalVisible(false);
      setTitle('');
      setDescription('');
      fetchComplaints(); // Refresh list
    } catch (err: any) {
      console.error('Failed to submit ticket', err);
      Toast.show({ type: 'error', text1: 'Error', text2: err.response?.data?.message || 'Failed to submit ticket.' });
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return '#818cf8';
      case 'ASSIGNED': return '#c084fc';
      case 'IN_PROGRESS': return '#fbbf24';
      case 'RESOLVED': return '#34d399';
      case 'CLOSED': return '#9ca3af';
      default: return '#9ca3af';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>Service Tickets</Text>
          <Text style={styles.headerSub}>Report and track maintenance issues</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color="#090e18" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#53FEC2" style={{ marginTop: 40 }} />
        ) : complaints.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment-turned-in" size={48} color="#25293A" />
            <Text style={styles.emptyText}>No tickets reported yet.</Text>
          </View>
        ) : (
          complaints.map(ticket => (
            <View key={ticket.id} style={styles.ticketCard}>
              <View style={styles.ticketHeader}>
                <Text style={styles.ticketTitle}>{ticket.title}</Text>
                <View style={[styles.statusBadge, { borderColor: statusColor(ticket.status) }]}>
                  <Text style={[styles.statusText, { color: statusColor(ticket.status) }]}>
                    {ticket.status.replace('_', ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.ticketDesc}>{ticket.description}</Text>
              
              <View style={styles.ticketFooter}>
                <Text style={styles.ticketDate}>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.ticketCategory}>{ticket.category}</Text>
              </View>

              {ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS' || ticket.status === 'RESOLVED' ? (
                <View style={styles.staffBox}>
                  <MaterialIcons name="engineering" size={16} color="#53FEC2" />
                  <Text style={styles.staffText}>
                    {ticket.assignedTo?.name ? `Assigned to ${ticket.assignedTo.name}` : 'Staff Assigned'}
                  </Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Create Ticket Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Ticket</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <MaterialIcons name="close" size={24} color="#9BABCE" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {['PLUMBING', 'ELECTRICAL', 'CLEANING', 'SECURITY', 'OTHER'].map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Leaking tap in kitchen"
              placeholderTextColor="#4a5568"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Provide more details..."
              placeholderTextColor="#4a5568"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
            />

            <TouchableOpacity 
              style={styles.submitBtn} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                 <ActivityIndicator color="#090e18" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Ticket</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#DEE1F7' },
  headerSub: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE', marginTop: 4 },
  addBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#53FEC2',
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { padding: 20, paddingBottom: 100 },
  
  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.5 },
  emptyText: { fontFamily: 'Inter-Medium', color: '#9BABCE', marginTop: 12 },

  ticketCard: {
    backgroundColor: 'rgba(20,25,35,0.6)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
  },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketTitle: { fontFamily: 'Inter-Bold', fontSize: 16, color: '#DEE1F7', flex: 1, marginRight: 12 },
  statusBadge: { borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontFamily: 'Inter-Bold', fontSize: 10, textTransform: 'uppercase' },
  ticketDesc: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#9BABCE', marginBottom: 12, lineHeight: 20 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketDate: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6c7a8f' },
  ticketCategory: {
    fontFamily: 'Inter-Medium', fontSize: 10, color: '#9BABCE',
    backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4
  },
  staffBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)'
  },
  staffText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#53FEC2' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#111822', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#fff' },
  closeBtn: { padding: 4 },
  
  label: { fontFamily: 'Inter-Bold', fontSize: 12, color: '#9BABCE', marginBottom: 8, textTransform: 'uppercase' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12, padding: 14, color: '#fff', fontFamily: 'Inter-Regular', marginBottom: 20,
  },
  textArea: { height: 100 },
  
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: { backgroundColor: 'rgba(83,254,194,0.1)', borderColor: '#53FEC2' },
  categoryText: { fontFamily: 'Inter-Medium', fontSize: 11, color: '#9BABCE' },
  categoryTextActive: { color: '#53FEC2' },

  submitBtn: {
    backgroundColor: '#53FEC2', borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 10,
  },
  submitBtnText: { fontFamily: 'Inter-Bold', fontSize: 15, color: '#090e18' },
});
