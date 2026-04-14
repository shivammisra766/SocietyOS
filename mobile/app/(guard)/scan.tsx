import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Dimensions, Animated,
  TouchableOpacity, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../lib/api';
import { triggerHaptic } from '../../utils/haptics';

const { width } = Dimensions.get('window');
const FRAME_SIZE = 288;

type ScanResult =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'success'; visitorName: string; visitorType: string; flat: string; method: string }
  | { state: 'error'; message: string };

export default function GuardScan() {
  const insets = useSafeAreaInsets();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [torchOn, setTorchOn] = useState(false);
  const [result, setResult] = useState<ScanResult>({ state: 'idle' });
  const scanned = result.state !== 'idle';

  /* Scan-line animation */
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: FRAME_SIZE - 4, duration: 3000, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0,              duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, [scanLineAnim]);

  const resetScan = useCallback(() => setResult({ state: 'idle' }), []);

  const handleBarCodeScanned = useCallback(async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    setResult({ state: 'loading' });

    try {
      // data from QR is the pass qrToken or passId
      const res = await api.post('/entry/scan', { passId: data });
      const entry = res.data.data;
      triggerHaptic('success');
      setResult({
        state: 'success',
        visitorName: entry.visitorName || 'Visitor',
        visitorType: entry.visitorType || 'GUEST',
        flat:        entry.flat?.number || '—',
        method:      entry.method || 'QR_SCAN',
      });
    } catch (err: any) {
      triggerHaptic('error');
      const msg = err?.response?.data?.message || 'Pass not found or invalid.';
      setResult({ state: 'error', message: msg });
    }
  }, [scanned]);

  /* ── Permission not loaded ── */
  if (!permission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#090e18', '#060a12']} style={StyleSheet.absoluteFill} />
        <View style={styles.permBlock}>
          <MaterialIcons name="hourglass-top" size={48} color="#53FEC2" />
          <Text style={styles.permTitle}>Loading Camera…</Text>
        </View>
      </View>
    );
  }

  /* ── Permission denied ── */
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#090e18', '#060a12']} style={StyleSheet.absoluteFill} />
        <View style={styles.permBlock}>
          <MaterialIcons name="no-photography" size={64} color="#EE7D77" />
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permSub}>ShieldGuard needs camera access to scan visitor QR codes.</Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <LinearGradient colors={['#1e3a5f', '#152641']} style={styles.grantBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialIcons name="camera-alt" size={18} color="#dbe5ff" />
              <Text style={styles.grantBtnText}>GRANT CAMERA ACCESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const lineColor = result.state === 'error' ? '#EE7D77' : result.state === 'success' ? '#53FEC2' : '#53FEC2';

  return (
    <View style={styles.container}>
      {/* Camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={[styles.headerSection, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.shieldBadge}>
              <MaterialIcons name="shield" size={18} color="#53FEC2" />
            </View>
            <Text style={styles.headerTitle}>SHIELDGUARD</Text>
          </View>
          <Text style={styles.guidance}>Align QR Code within the frame</Text>
          <Text style={[styles.subGuidance, result.state === 'error' && { color: '#EE7D77' }]}>
            {result.state === 'idle'    && 'Scanning for authorized credentials…'}
            {result.state === 'loading' && 'Verifying pass…'}
            {result.state === 'success' && 'Access granted ✓'}
            {result.state === 'error'   && 'Access denied ✗'}
          </Text>
        </View>

        {/* Frame */}
        <View style={styles.frameContainer}>
          <View style={[
            styles.frame,
            result.state === 'success' && { borderColor: 'rgba(83,254,194,0.5)' },
            result.state === 'error'   && { borderColor: 'rgba(238,125,119,0.5)' },
          ]}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim }] }]}>
              <LinearGradient
                colors={['transparent', lineColor, 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.scanLineGrad}
              />
            </Animated.View>
          </View>
        </View>

        {/* Result overlay card */}
        {result.state === 'success' && (
          <View style={styles.resultCard}>
            <View style={styles.resultIconRow}>
              <View style={styles.resultIconSuccess}>
                <MaterialIcons name="check-circle" size={24} color="#53FEC2" />
              </View>
              <Text style={styles.resultTitle}>{result.visitorName}</Text>
            </View>
            <Text style={styles.resultSub}>
              {result.visitorType.replace(/_/g, ' ')} · Flat {result.flat}
            </Text>
            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Text style={styles.scanAgainText}>Scan Next</Text>
            </TouchableOpacity>
          </View>
        )}

        {result.state === 'error' && (
          <View style={[styles.resultCard, styles.resultCardError]}>
            <View style={styles.resultIconRow}>
              <View style={styles.resultIconError}>
                <MaterialIcons name="cancel" size={24} color="#EE7D77" />
              </View>
              <Text style={[styles.resultTitle, { color: '#EE7D77' }]}>Access Denied</Text>
            </View>
            <Text style={[styles.resultSub, { color: '#EE7D77' }]}>{result.message}</Text>
            <TouchableOpacity style={[styles.scanAgainBtn, styles.scanAgainBtnError]} onPress={resetScan}>
              <Text style={styles.scanAgainText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 80 }]}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => setTorchOn(v => !v)}>
            <MaterialIcons name={torchOn ? 'flash-off' : 'flash-on'} size={24} color={torchOn ? '#FACC15' : '#9BABCE'} />
            <Text style={[styles.controlLabel, torchOn && { color: '#FACC15' }]}>{torchOn ? 'Torch On' : 'Torch'}</Text>
          </TouchableOpacity>

          <View style={styles.scanBtnOuter}>
            <TouchableOpacity
              style={[styles.scanBtnInner, result.state === 'loading' && { backgroundColor: '#1a2a1e' }]}
              onPress={resetScan}
            >
              <MaterialIcons name="qr-code-scanner" size={28} color="#090E18" />
            </TouchableOpacity>
          </View>

          <View style={styles.controlBtn}>
            <MaterialIcons name="info-outline" size={24} color="#9BABCE" />
            <Text style={styles.controlLabel}>Info</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060a12' },
  overlay:   { flex: 1, justifyContent: 'space-between' },

  permBlock: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 16 },
  permTitle: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#DEE1F7', textAlign: 'center' },
  permSub:   { fontFamily: 'Inter-Regular', fontSize: 14, color: '#9BABCE', textAlign: 'center', lineHeight: 22 },
  grantBtn:      { marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  grantBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 28, height: 52, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(219,229,255,0.15)' },
  grantBtnText:  { fontFamily: 'Inter-SemiBold', fontSize: 13, letterSpacing: 2, color: '#dbe5ff' },

  headerSection: { alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  headerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shieldBadge:   { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(83,254,194,0.1)', alignItems: 'center', justifyContent: 'center' },
  headerTitle:   { fontFamily: 'Inter-Bold', fontSize: 16, letterSpacing: 4, color: '#DEE1F7' },
  guidance:      { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7', marginTop: 16 },
  subGuidance:   { fontFamily: 'Inter-Regular', fontSize: 13, color: '#53FEC2', letterSpacing: 0.5 },

  frameContainer: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.25)',
    borderRadius: 12, overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#53FEC2', borderWidth: 4 },
  cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },
  scanLine:     { position: 'absolute', left: 0, right: 0, height: 2 },
  scanLineGrad: { flex: 1 },

  /* Result card */
  resultCard: {
    marginHorizontal: 20,
    backgroundColor: 'rgba(14,20,30,0.95)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(83,254,194,0.25)',
    padding: 20, gap: 10,
  },
  resultCardError: { borderColor: 'rgba(238,125,119,0.25)' },
  resultIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIconSuccess: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(83,254,194,0.12)', alignItems: 'center', justifyContent: 'center' },
  resultIconError:   { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(238,125,119,0.12)', alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#DEE1F7', flex: 1 },
  resultSub:   { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE' },
  scanAgainBtn:      { backgroundColor: 'rgba(83,254,194,0.12)', borderRadius: 12, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  scanAgainBtnError: { backgroundColor: 'rgba(238,125,119,0.12)' },
  scanAgainText:     { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#DEE1F7' },

  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 40 },
  controlBtn:   { alignItems: 'center', gap: 4 },
  controlLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#6c7a8f' },
  scanBtnOuter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: 'rgba(83,254,194,0.3)', alignItems: 'center', justifyContent: 'center' },
  scanBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#53FEC2', alignItems: 'center', justifyContent: 'center' },
});
