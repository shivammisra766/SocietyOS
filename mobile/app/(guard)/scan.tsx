import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');
const FRAME_SIZE = 288;

export default function GuardScan() {
  const insets = useSafeAreaInsets();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: FRAME_SIZE - 4,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scanLineAnim]);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    Alert.alert(
      'QR Code Scanned',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setScanned(false),
        },
        {
          text: 'OK',
          style: 'default',
        },
      ]
    );
  };

  // Permission not determined yet
  if (!permission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#090e18', '#060a12']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="hourglass-top" size={48} color="#53FEC2" />
          <Text style={styles.permissionTitle}>Loading Camera...</Text>
        </View>
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#090e18', '#060a12']} style={StyleSheet.absoluteFill} />
        <View style={styles.permissionContainer}>
          <MaterialIcons name="no-photography" size={64} color="#EE7D77" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSub}>
            ShieldGuard needs camera access to scan visitor QR codes and verify credentials.
          </Text>
          <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
            <LinearGradient
              colors={['#1e3a5f', '#152641']}
              style={styles.grantBtnInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="camera-alt" size={18} color="#dbe5ff" />
              <Text style={styles.grantBtnText}>GRANT CAMERA ACCESS</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Camera Feed */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'ean13', 'code128'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Dark overlay */}
      <View style={styles.overlayContainer}>
        {/* Top section */}
        <View style={[styles.overlaySection, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerRow}>
            <View style={styles.shieldBadge}>
              <MaterialIcons name="shield" size={18} color="#53FEC2" />
            </View>
            <Text style={styles.headerTitle}>SHIELDGUARD</Text>
          </View>
          <Text style={styles.guidance}>Align QR Code within the frame</Text>
          <Text style={styles.subGuidance}>
            {scanned ? 'Code detected! Processing...' : 'Scanning for authorized credentials...'}
          </Text>
        </View>

        {/* Scanner Frame */}
        <View style={styles.frameContainer}>
          <View style={styles.frame}>
            {/* Corner accents */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* Animated scan line */}
            <Animated.View
              style={[
                styles.scanLine,
                { transform: [{ translateY: scanLineAnim }] },
              ]}
            >
              <LinearGradient
                colors={['transparent', scanned ? '#FACC15' : '#53FEC2', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanLineGradient}
              />
            </Animated.View>
          </View>
        </View>

        {/* Bottom controls */}
        <View style={[styles.controls, { paddingBottom: insets.bottom + 80 }]}>
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setTorchOn((v) => !v)}
          >
            <MaterialIcons
              name={torchOn ? 'flash-off' : 'flash-on'}
              size={24}
              color={torchOn ? '#FACC15' : '#9BABCE'}
            />
            <Text style={[styles.controlLabel, torchOn && { color: '#FACC15' }]}>
              {torchOn ? 'Torch On' : 'Torch'}
            </Text>
          </TouchableOpacity>

          <View style={styles.scanBtnOuter}>
            <TouchableOpacity
              style={[
                styles.scanBtnInner,
                scanned && { backgroundColor: '#FACC15' },
              ]}
              onPress={() => setScanned(false)}
            >
              <MaterialIcons
                name="qr-code-scanner"
                size={28}
                color="#090E18"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.controlBtn}>
            <MaterialIcons name="zoom-in" size={24} color="#9BABCE" />
            <Text style={styles.controlLabel}>Zoom</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#060a12' },
  overlayContainer: { flex: 1, justifyContent: 'space-between' },

  /* Permission screens */
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permissionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    color: '#DEE1F7',
    textAlign: 'center',
  },
  permissionSub: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#9BABCE',
    textAlign: 'center',
    lineHeight: 22,
  },
  grantBtn: {
    marginTop: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  grantBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(219, 229, 255, 0.15)',
  },
  grantBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    letterSpacing: 2,
    color: '#dbe5ff',
  },

  /* Header */
  overlaySection: { alignItems: 'center', gap: 8, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shieldBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(83,254,194,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold', fontSize: 16, letterSpacing: 4, color: '#DEE1F7',
  },
  guidance: {
    fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7', marginTop: 16,
  },
  subGuidance: {
    fontFamily: 'Inter-Regular', fontSize: 13, color: '#53FEC2', letterSpacing: 0.5,
  },

  /* Frame */
  frameContainer: { alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.25)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute', width: 32, height: 32,
    borderColor: '#53FEC2', borderWidth: 4,
  },
  cornerTL: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 12 },
  cornerTR: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 12 },
  cornerBL: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 12 },

  scanLine: { position: 'absolute', left: 0, right: 0, height: 2 },
  scanLineGradient: { flex: 1 },

  /* Controls */
  controls: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlLabel: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#6c7a8f' },
  scanBtnOuter: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 3, borderColor: 'rgba(83,254,194,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  scanBtnInner: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#53FEC2',
    alignItems: 'center', justifyContent: 'center',
  },
});
