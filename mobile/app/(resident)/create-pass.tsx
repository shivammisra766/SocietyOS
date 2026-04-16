import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { triggerHaptic } from '../../utils/haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import api from '../../lib/api';

type AccessType = 'delivery' | 'cab' | 'guest' | 'service';

interface AccessTile {
  id: AccessType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

const accessTypes: AccessTile[] = [
  { id: 'delivery', label: 'Delivery', icon: 'local-shipping' },
  { id: 'cab',      label: 'Cab',      icon: 'directions-car' },
  { id: 'guest',    label: 'Guest',    icon: 'family-restroom' },
  { id: 'service',  label: 'Service',  icon: 'construction' },
];

export default function ResidentCreatePass() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qrCardRef = useRef<View>(null);

  const [guestName, setGuestName]   = useState('');
  const [phone, setPhone]           = useState('');
  const [notes, setNotes]           = useState('');
  const [selectedType, setSelectedType] = useState<AccessType>('delivery');

  const [date, setDate]                   = useState(new Date());
  const [showPickerMode, setShowPickerMode] = useState<'date' | 'time' | null>(null);
  const [multiEntry, setMultiEntry]       = useState(false);

  const [qrToken, setQrToken]         = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<Date | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [sharing, setSharing]         = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  const handlePressOut = () =>
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();

  const onChangeDateTime = (_: any, selectedDate?: Date) => {
    setShowPickerMode(null);
    if (selectedDate) setDate(selectedDate);
  };

  /** Format ms remaining into "Xh Ym" or "Xm" or "Expired" */
  const formatRemaining = useCallback((ms: number): string => {
    if (ms <= 0) return 'Expired';
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h > 0) return `${h}h ${m}m remaining`;
    return `${m}m remaining`;
  }, []);

  /** Live countdown inside the QR modal */
  useEffect(() => {
    if (!showQrModal || !qrExpiresAt) return;
    const update = () => setTimeRemaining(formatRemaining(qrExpiresAt.getTime() - Date.now()));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [showQrModal, qrExpiresAt, formatRemaining]);

  const handleGenerate = async () => {
    if (!guestName.trim() || !phone.trim()) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please enter guest name and phone number.' });
      return;
    }
    // Validate: visit date must be in the future
    if (date.getTime() < Date.now() - 60000) {   // 1-minute grace
      Toast.show({
        type: 'error',
        text1: 'Invalid Date',
        text2: 'The visit date and time must be in the future. Please pick a valid date.',
      });
      return;
    }
    setLoading(true);
    try {
      const expiry = new Date(date.getTime() + (multiEntry ? 24 : 12) * 60 * 60 * 1000);
      const typeMap: Record<AccessType, string> = {
        delivery: 'DELIVERY',
        cab: 'CAB',
        guest: 'GUEST',
        service: 'SERVICE_PROFESSIONAL'
      };

      const res = await api.post('/passes', {
        type: 'ONE_TIME',
        visitorName: guestName.trim(),
        visitorPhone: phone.trim(),
        visitorType: typeMap[selectedType],
        notes: notes.trim() || undefined,
        expiresAt: expiry.toISOString(),
      });
      triggerHaptic('success');
      setQrToken(res.data.data.qrToken);
      setQrExpiresAt(expiry);
      setShowQrModal(true);
    } catch (err: any) {
      triggerHaptic('error');
      Toast.show({ type: 'error', text1: 'Error', text2: err?.response?.data?.message || 'Failed to generate pass.' });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!qrCardRef.current || sharing) return;
    setSharing(true);
    try {
      const uri = await captureRef(qrCardRef, { format: 'png', quality: 1 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Toast.show({ type: 'error', text1: 'Sharing unavailable', text2: 'Your device does not support sharing files.' });
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Visitor Pass — ${guestName}`,
        UTI: 'public.png',
      });
    } catch {
      Toast.show({ type: 'error', text1: 'Share Failed', text2: 'Could not capture QR card. Please try again.' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#6c7a8f" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>NEW PASS</Text>
        <Text style={styles.title}>Create Visitor Pass</Text>

        {/* ── Guest Details ── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>GUEST DETAILS</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Guest Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter guest name"
              placeholderTextColor="rgba(26,26,46,0.4)"
              value={guestName}
              onChangeText={setGuestName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              placeholderTextColor="rgba(26,26,46,0.4)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bring ID, Use side entrance…"
              placeholderTextColor="rgba(26,26,46,0.4)"
              value={notes}
              onChangeText={setNotes}
              autoCapitalize="sentences"
            />
          </View>
        </View>

        {/* ── Access Type ── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>ACCESS TYPE</Text>
          <View style={styles.typeGrid}>
            {accessTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeTile, selectedType === type.id && styles.typeTileSelected]}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.85}
              >
                <MaterialIcons
                  name={type.icon}
                  size={24}
                  color={selectedType === type.id ? '#DBE5FF' : '#64748B'}
                />
                <Text style={[styles.typeTileLabel, selectedType === type.id && styles.typeTileLabelSelected]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Schedule ── */}
        <View style={styles.formCard}>
          <Text style={styles.formSection}>SCHEDULE</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Visit Date</Text>
            <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowPickerMode('date')} activeOpacity={0.8}>
              <Text style={[styles.input, { flex: 1, color: '#1a1a2e' }]}>
                {date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
              <MaterialIcons name="calendar-today" size={18} color="#6c7a8f" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Visit Time</Text>
            <TouchableOpacity style={styles.inputWithIcon} onPress={() => setShowPickerMode('time')} activeOpacity={0.8}>
              <Text style={[styles.input, { flex: 1, color: '#1a1a2e' }]}>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <MaterialIcons name="access-time" size={18} color="#6c7a8f" style={styles.inputIcon} />
            </TouchableOpacity>
          </View>

          {showPickerMode && (
            <DateTimePicker
              value={date}
              mode={showPickerMode}
              is24Hour={true}
              display="default"
              onChange={onChangeDateTime}
              minimumDate={new Date()}
            />
          )}

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Allow Multiple Entries</Text>
              <Text style={styles.toggleSub}>Visitor can re-enter during the pass period</Text>
            </View>
            <Switch
              value={multiEntry}
              onValueChange={setMultiEntry}
              trackColor={{ false: 'rgba(255,255,255,0.08)', true: 'rgba(37,224,167,0.3)' }}
              thumbColor={multiEntry ? '#25E0A7' : '#6c7a8f'}
              ios_backgroundColor="rgba(255,255,255,0.08)"
            />
          </View>
        </View>

        {/* ── CTA ── */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleGenerate}
            activeOpacity={1}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#152641', '#152641'] : ['#1e3a5f', '#152641']}
              style={styles.ctaButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#DBE5FF" />
              ) : (
                <>
                  <MaterialIcons name="qr-code" size={20} color="#DBE5FF" />
                  <Text style={styles.ctaText}>GENERATE QR PASS</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── QR Modal ── */}
      <Modal 
        visible={showQrModal} 
        transparent 
        animationType="slide"
        onRequestClose={() => { setShowQrModal(false); router.back(); }}
      >
        <LinearGradient
          colors={['rgba(9,14,24,0.97)', 'rgba(14,19,34,0.99)']}
          style={styles.modalContainer}
        >
          {/* Close */}
          <TouchableOpacity
            style={styles.modalCloseBtn}
            onPress={() => { setShowQrModal(false); router.back(); }}
          >
            <MaterialIcons name="close" size={22} color="#DEE1F7" />
          </TouchableOpacity>

          {/* QR Card — captured for sharing */}
          <View ref={qrCardRef} style={styles.qrCard}>
              <View style={styles.qrWrapper}>
                {qrToken && (
                  <QRCode value={qrToken} size={200} color="#1a1a2e" backgroundColor="#ffffff" />
                )}
              </View>
              <Text style={styles.qrVisitorName}>{guestName}</Text>
              <Text style={styles.qrVisitorSub}>{selectedType.toUpperCase()} PASS</Text>

              <View style={styles.qrInfoDashed}>
                <View style={styles.qrInfoCol}>
                  <Text style={styles.qrLabel}>DATE</Text>
                  <Text style={styles.qrVal}>
                    {date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.qrInfoCol}>
                  <Text style={styles.qrLabel}>TIME</Text>
                  <Text style={styles.qrVal}>
                    {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {multiEntry && (
                  <View style={styles.qrInfoCol}>
                    <Text style={styles.qrLabel}>TYPE</Text>
                    <Text style={styles.qrVal}>Multi</Text>
                  </View>
                )}
              </View>

              {/* Expiry strip */}
              <View style={styles.expiryRow}>
                <MaterialIcons name="schedule" size={14} color={timeRemaining === 'Expired' ? '#EE7D77' : '#25E0A7'} />
                <Text style={[
                  styles.expiryText,
                  timeRemaining === 'Expired' && { color: '#EE7D77' },
                ]}>
                  {timeRemaining === 'Expired'
                    ? 'This pass has expired'
                    : `Valid until ${qrExpiresAt?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · ${timeRemaining}`
                  }
                </Text>
              </View>

              <Text style={styles.qrGuidance}>
                Show this QR code to the main gate security for rapid entry.
              </Text>
            </View>

          {/* Share Button */}
          <TouchableOpacity
            style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
            onPress={handleShare}
            disabled={sharing}
            activeOpacity={0.85}
          >
            {sharing ? (
              <ActivityIndicator color="#090e18" size="small" />
            ) : (
              <>
                <MaterialIcons name="share" size={20} color="#090e18" />
                <Text style={styles.shareBtnText}>Share Pass</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.shareHint}>
            Share via WhatsApp, Messages, Mail, or any app
          </Text>
        </LinearGradient>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },

  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24 },
  backText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6c7a8f' },

  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  title: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 24 },

  formCard: {
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 20, marginBottom: 16, gap: 16,
  },
  formSection: {
    fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3,
    color: '#9BABCE', textTransform: 'uppercase' as const,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#9BABCE', letterSpacing: 0.5 },
  input: {
    backgroundColor: '#FAF9F6', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    fontFamily: 'Inter-Regular', fontSize: 14, color: '#1a1a2e',
  },
  inputWithIcon: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FAF9F6', borderRadius: 12, paddingRight: 14,
  },
  inputIcon: { marginLeft: 8 },

  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeTile: {
    width: '47%' as any, backgroundColor: '#FAF9F6', borderRadius: 16,
    padding: 16, alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)',
  },
  typeTileSelected: {
    backgroundColor: '#34495E', borderColor: 'rgba(100,116,139,0.3)',
    elevation: 4,
  },
  typeTileLabel: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#64748B' },
  typeTileLabelSelected: { color: '#DBE5FF' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  toggleLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#DEE1F7' },
  toggleSub: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#6c7a8f', marginTop: 2 },

  ctaButton: {
    borderRadius: 14, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(219,229,255,0.15)',
  },
  ctaText: { fontFamily: 'Inter-SemiBold', fontSize: 14, letterSpacing: 2, color: '#DBE5FF' },

  /* ── Modal ── */
  modalContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, gap: 20 },
  modalCloseBtn: {
    position: 'absolute', top: 60, right: 24,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* QR Card */
  qrCard: {
    width: '100%', backgroundColor: '#FAF9F6', borderRadius: 32,
    padding: 32, alignItems: 'center',
    elevation: 20,
  },
  qrWrapper: {
    padding: 16, backgroundColor: '#FFF', borderRadius: 24,
    elevation: 4, marginBottom: 24,
  },
  qrVisitorName: { fontFamily: 'Inter-Bold', fontSize: 24, color: '#1a1a2e', marginBottom: 4 },
  qrVisitorSub: { fontFamily: 'Inter-Bold', fontSize: 13, color: '#6366f1', letterSpacing: 2, marginBottom: 24 },
  qrInfoDashed: {
    flexDirection: 'row', width: '100%', justifyContent: 'space-around',
    borderTopWidth: 2, borderBottomWidth: 2,
    borderColor: 'rgba(0,0,0,0.06)', borderStyle: 'dashed' as const,
    paddingVertical: 16, marginBottom: 24,
  },
  qrInfoCol: { flex: 1, alignItems: 'center', gap: 4 },
  qrLabel: { fontFamily: 'Inter-Bold', fontSize: 10, color: '#94a3b8', letterSpacing: 2 },
  qrVal: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#1a1a2e' },
  qrGuidance: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#64748b', textAlign: 'center', lineHeight: 20 },

  /* Expiry */
  expiryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(37,224,167,0.08)',
    borderRadius: 10, borderWidth: 1, borderColor: 'rgba(37,224,167,0.2)',
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: 16, width: '100%', justifyContent: 'center',
  },
  expiryText: {
    fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#25E0A7',
  },

  /* Share */
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#53FEC2', borderRadius: 16,
    height: 52, width: '100%',
  },
  shareBtnDisabled: { opacity: 0.6 },
  shareBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#090e18' },
  shareHint: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#4a5568', textAlign: 'center' },
});
