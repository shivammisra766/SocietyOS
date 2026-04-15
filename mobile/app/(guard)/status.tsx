import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import GuardHeader from '../../components/GuardHeader';
import { triggerHaptic } from '../../utils/haptics';
import api from '../../lib/api';

/* ── Types ── */
interface Flat    { id: string; number: string; }
interface OnPremisesEntry {
  id: string; visitorName: string; visitorType: string;
  flat?: { number: string }; entryTime: string; status: string;
}

const VISITOR_TYPES = [
  { key: 'GUEST',                label: 'Guest'    },
  { key: 'DELIVERY',             label: 'Delivery' },
  { key: 'CAB',                  label: 'Cab'      },
  { key: 'HOUSEHOLD_WORKER',     label: 'Staff'    },
  { key: 'SERVICE_PROFESSIONAL', label: 'Service'  },
];

function durationSince(dateStr: string) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/* ── Currently Inside Card ── */
function InsideCard({
  entry, onExit, exiting,
}: {
  entry: OnPremisesEntry;
  onExit: (id: string) => void;
  exiting: boolean;
}) {
  const initials = entry.visitorName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const duration = durationSince(entry.entryTime);
  const typeLabel = entry.visitorType?.replace(/_/g, ' ') || 'Guest';

  return (
    <View style={styles.insideCard}>
      {/* Left: avatar + info */}
      <View style={styles.insideLeft}>
        <View style={styles.insideAvatar}>
          <Text style={styles.insideAvatarText}>{initials}</Text>
        </View>
        <View style={styles.insideInfo}>
          <Text style={styles.insideName}>{entry.visitorName}</Text>
          <Text style={styles.insideMeta}>
            {typeLabel} · Flat {entry.flat?.number || '—'}
          </Text>
          <View style={styles.durationRow}>
            <View style={styles.durationDot} />
            <Text style={styles.durationText}>Inside for {duration}</Text>
          </View>
        </View>
      </View>

      {/* Right: Log Exit */}
      <TouchableOpacity
        style={[styles.exitBtn, exiting && styles.exitBtnDisabled]}
        onPress={() => onExit(entry.id)}
        disabled={exiting}
        activeOpacity={0.8}
      >
        {exiting ? (
          <ActivityIndicator size="small" color="#EE7D77" />
        ) : (
          <>
            <MaterialIcons name="logout" size={16} color="#EE7D77" />
            <Text style={styles.exitBtnText}>Log Exit</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

/* ── Main screen ── */
export default function GuardStatus() {
  /* Form state */
  const [name,         setName]         = useState('');
  const [phone,        setPhone]        = useState('');
  const [visitorType,  setVisitorType]  = useState('GUEST');
  const [selectedFlat, setSelectedFlat] = useState<Flat | null>(null);
  const [flatSearch,   setFlatSearch]   = useState('');
  const [flats,        setFlats]        = useState<Flat[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);  // collapsible

  /* On-premises state */
  const [onPremises,  setOnPremises]  = useState<OnPremisesEntry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [exitingId,   setExitingId]   = useState<string | null>(null);

  /* Fetch flats once */
  useEffect(() => {
    api.get('/flats').then(res => setFlats(res.data.data || [])).catch(() => {});
  }, []);

  /* Fetch currently-inside list */
  const fetchOnPremises = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/entry/today');
      const inside: OnPremisesEntry[] = (res.data.data || []).filter(
        (e: any) => (e.status === 'APPROVED' || e.status === 'SCANNED') && !e.exitTime
      );
      setOnPremises(inside);
    } catch {}
    finally { setLoadingList(false); setRefreshing(false); }
  }, []);

  useEffect(() => {
    fetchOnPremises();
    const interval = setInterval(() => fetchOnPremises(), 10_000);
    return () => clearInterval(interval);
  }, [fetchOnPremises]);

  /* Log Exit */
  const handleLogExit = async (id: string) => {
    setExitingId(id);
    try {
      await api.patch(`/entry/${id}/exit`);
      triggerHaptic('light');
      setOnPremises(prev => prev.filter(v => v.id !== id));
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not log exit. Try again.' });
    } finally {
      setExitingId(null);
    }
  };

  /* Submit walk-in */
  const handleConfirm = async () => {
    if (!name.trim())  return Toast.show({ type: 'error', text1: 'Required', text2: 'Enter visitor name.' });
    if (!selectedFlat) return Toast.show({ type: 'error', text1: 'Required', text2: 'Select a destination flat.' });
    setSubmitting(true);
    try {
      await api.post('/entry/walkin', {
        visitorName:  name.trim(),
        visitorPhone: phone.trim() || undefined,
        visitorType,
        flatId:       selectedFlat.id,
      });
      triggerHaptic('success');
      Toast.show({ type: 'success', text1: 'Sent', text2: `Entry request sent to residents of Flat ${selectedFlat.number}. Awaiting approval.` });
      setName(''); setPhone(''); setVisitorType('GUEST');
      setSelectedFlat(null); setFlatSearch('');
      setShowForm(false);
      fetchOnPremises();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to submit.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredFlats = flatSearch.trim()
    ? flats.filter(f => f.number.toLowerCase().includes(flatSearch.toLowerCase()))
    : flats.slice(0, 8);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />
      <GuardHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchOnPremises(true)} tintColor="#53FEC2" />
        }
      >
        <Text style={styles.eyebrow}>GATE CONTROL</Text>
        <Text style={styles.title}>Entry Management</Text>

        {/* ── Currently Inside ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>CURRENTLY INSIDE</Text>
          <View style={styles.countPill}>
            <View style={styles.liveDot} />
            <Text style={styles.countPillText}>{onPremises.length} active</Text>
          </View>
        </View>

        {loadingList ? (
          <ActivityIndicator color="#53FEC2" style={{ marginBottom: 24 }} />
        ) : onPremises.length === 0 ? (
          <View style={styles.emptyInside}>
            <MaterialIcons name="check-circle-outline" size={36} color="#25293A" />
            <Text style={styles.emptyText}>Premises clear</Text>
          </View>
        ) : (
          <View style={styles.insideList}>
            {onPremises.map(entry => (
              <InsideCard
                key={entry.id}
                entry={entry}
                onExit={handleLogExit}
                exiting={exitingId === entry.id}
              />
            ))}
          </View>
        )}

        {/* ── Walk-in Request (collapsible) ── */}
        <TouchableOpacity
          style={styles.formToggle}
          onPress={() => setShowForm(v => !v)}
          activeOpacity={0.85}
        >
          <View style={styles.formToggleLeft}>
            <View style={styles.formToggleIcon}>
              <MaterialIcons name="person-add" size={18} color="#53FEC2" />
            </View>
            <Text style={styles.formToggleText}>New Walk-in Request</Text>
          </View>
          <MaterialIcons name={showForm ? 'expand-less' : 'expand-more'} size={22} color="#6c7a8f" />
        </TouchableOpacity>

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formSection}>VISITOR DETAILS</Text>

            {/* Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name *</Text>
              <TextInput
                style={styles.input} value={name} onChangeText={setName}
                placeholder="Visitor name" placeholderTextColor="rgba(26,26,46,0.4)"
                autoCapitalize="words"
              />
            </View>

            {/* Phone */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Phone (optional)</Text>
              <TextInput
                style={styles.input} value={phone} onChangeText={setPhone}
                placeholder="Phone number" placeholderTextColor="rgba(26,26,46,0.4)"
                keyboardType="phone-pad"
              />
            </View>

            {/* Type */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Visitor Type *</Text>
              <View style={styles.typePicker}>
                {VISITOR_TYPES.map(t => (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.typeBtn, visitorType === t.key && styles.typeBtnActive]}
                    onPress={() => setVisitorType(t.key)}
                  >
                    <Text style={[styles.typeBtnText, visitorType === t.key && styles.typeBtnTextActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Flat picker */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Destination Flat *</Text>
              {selectedFlat ? (
                <TouchableOpacity style={styles.selectedFlatRow} onPress={() => { setSelectedFlat(null); setFlatSearch(''); }}>
                  <Text style={styles.selectedFlatText}>Flat {selectedFlat.number}</Text>
                  <MaterialIcons name="close" size={16} color="#9BABCE" />
                </TouchableOpacity>
              ) : (
                <>
                  <TextInput
                    style={styles.input} value={flatSearch} onChangeText={setFlatSearch}
                    placeholder="Search flat…" placeholderTextColor="rgba(26,26,46,0.4)"
                  />
                  {filteredFlats.length > 0 && (
                    <View style={styles.flatDropdown}>
                      {filteredFlats.map(f => (
                        <TouchableOpacity
                          key={f.id} style={styles.flatOption}
                          onPress={() => { setSelectedFlat(f); setFlatSearch(''); }}
                        >
                          <Text style={styles.flatOptionText}>Flat {f.number}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.confirmBtn, submitting && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.85}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator size="small" color="#090E18" />
                : <MaterialIcons name="notifications-active" size={20} color="#090E18" />
              }
              <Text style={styles.confirmBtnText}>
                {submitting ? 'Notifying Resident…' : 'Request Entry Approval'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16 },
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  title:   { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 24 },

  sectionHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  sectionLabel:   { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#9BABCE', textTransform: 'uppercase' as const },
  countPill:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(37,224,167,0.1)', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot:        { width: 6, height: 6, borderRadius: 3, backgroundColor: '#25E0A7' },
  countPillText:  { fontFamily: 'Inter-Bold', fontSize: 11, color: '#25E0A7' },

  /* ── Currently Inside cards ── */
  insideList: { gap: 10, marginBottom: 28 },
  insideCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.55)',
    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(37,224,167,0.15)',
    padding: 14, gap: 12,
  },
  insideLeft:       { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  insideAvatar:     { width: 46, height: 46, borderRadius: 13, backgroundColor: 'rgba(37,224,167,0.1)', borderWidth: 1, borderColor: 'rgba(37,224,167,0.2)', alignItems: 'center', justifyContent: 'center' },
  insideAvatarText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#25E0A7' },
  insideInfo:       { flex: 1, gap: 3 },
  insideName:       { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },
  insideMeta:       { fontFamily: 'Inter-Regular', fontSize: 12, color: '#9BABCE' },
  durationRow:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 1 },
  durationDot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: '#25E0A7' },
  durationText:     { fontFamily: 'Inter-Regular', fontSize: 10, color: '#25E0A7' },

  exitBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(238,125,119,0.1)',
    borderWidth: 1, borderColor: 'rgba(238,125,119,0.3)',
    minWidth: 82, justifyContent: 'center',
  },
  exitBtnDisabled: { opacity: 0.4 },
  exitBtnText:     { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#EE7D77' },

  emptyInside: { alignItems: 'center', gap: 8, paddingVertical: 28, marginBottom: 24 },
  emptyText:   { fontFamily: 'Inter-Regular', fontSize: 14, color: '#4a5568' },

  /* ── Form toggle ── */
  formToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(83,254,194,0.06)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(83,254,194,0.15)',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
  },
  formToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  formToggleIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(83,254,194,0.1)', alignItems: 'center', justifyContent: 'center' },
  formToggleText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#DEE1F7' },

  /* ── Walk-in form ── */
  formCard: {
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 20, marginBottom: 24, gap: 16,
  },
  formSection: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#9BABCE', textTransform: 'uppercase' as const },
  fieldGroup:  { gap: 6 },
  fieldLabel:  { fontFamily: 'Inter-Medium', fontSize: 12, color: '#9BABCE', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FAF9F6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'Inter-Regular', fontSize: 14, color: '#1a1a2e',
  },
  typePicker:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn:           { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.04)' },
  typeBtnActive:     { backgroundColor: 'rgba(83,254,194,0.15)', borderColor: 'rgba(83,254,194,0.4)' },
  typeBtnText:       { fontFamily: 'Inter-Medium', fontSize: 12, color: '#9BABCE' },
  typeBtnTextActive: { color: '#53FEC2' },
  selectedFlatRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(83,254,194,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: 'rgba(83,254,194,0.25)' },
  selectedFlatText:  { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#53FEC2' },
  flatDropdown:      { backgroundColor: 'rgba(14,20,30,0.98)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginTop: 4, overflow: 'hidden' },
  flatOption:        { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  flatOptionText:    { fontFamily: 'Inter-Regular', fontSize: 14, color: '#DEE1F7' },
  confirmBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#53FEC2', borderRadius: 14, height: 52, marginTop: 4 },
  confirmBtnDisabled:{ opacity: 0.6 },
  confirmBtnText:    { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#090E18', letterSpacing: 0.5 },
});
