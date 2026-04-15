import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import api from '../../lib/api';

const { width } = Dimensions.get('window');

type Role = 'resident' | 'guard' | 'service';

const roleConfig: Record<Role, { label: string; accent: string; headline: string; sub: string }> = {
  resident: { label: 'Resident', accent: '#dbe5ff', headline: 'Identity Recovery', sub: 'Residential Control Access' },
  guard: { label: 'Security', accent: '#53fec2', headline: 'Identity Recovery', sub: 'Security Clearance II' },
  service: { label: 'Service', accent: '#9babce', headline: 'Identity Recovery', sub: 'Service Clearance III' },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: Role }>();
  const config = roleConfig[role ?? 'resident'] || roleConfig.resident;

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };

  const requestOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccess(`OTP sent to your email`);
      setTimeout(() => setSuccess(null), 3000);
      setStep(2);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill all fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email: email.trim(), otp: otp.trim(), newPassword });
      setSuccess('Password reset successful');
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={['#090e18', '#0d1220', '#090e18']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.glow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#6c7a8f" />
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoRow}>
            <MaterialIcons name="lock-reset" size={24} color="#dbe5ff" />
            <Text style={styles.logoText}>SENTRY</Text>
          </View>
          <View style={[styles.roleBadge, { borderColor: config.accent + '30' }]}>
            <View style={[styles.roleDot, { backgroundColor: config.accent }]} />
            <Text style={[styles.roleLabel, { color: config.accent }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>SYSTEM OVERRIDE</Text>
          <Text style={styles.title}>{config.headline}</Text>
          <Text style={styles.subtitle}>{config.sub}</Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#EE7D77" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        {success && (
          <View style={[styles.errorBanner, { backgroundColor: 'rgba(83,254,194,0.1)', borderColor: 'rgba(83,254,194,0.3)' }]}>
            <MaterialIcons name="check-circle-outline" size={16} color="#53fec2" />
            <Text style={[styles.errorText, { color: '#53fec2' }]}>{success}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          {step === 1 ? (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Registered Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder="name@example.com"
                  placeholderTextColor="#9aab9e"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <MaterialIcons name="email" size={18} color="#6c7a8f" style={styles.inputIcon} />
              </View>
            </View>
          ) : (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>6-Digit OTP</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, { letterSpacing: 8, fontFamily: 'monospace' }]}
                    placeholder="123456"
                    placeholderTextColor="#9aab9e"
                    value={otp}
                    onChangeText={(text) => {
                      setOtp(text);
                      if (error) setError(null);
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                  <MaterialIcons name="pin" size={18} color="#6c7a8f" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9aab9e"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9aab9e"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                  />
                </View>
              </View>
            </>
          )}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }], marginHorizontal: 0 }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={step === 1 ? requestOtp : resetPassword}
            activeOpacity={1}
            disabled={loading}
          >
            <LinearGradient
              colors={loading ? ['#152641', '#152641'] : ['#1e3a5f', '#152641']}
              style={styles.loginButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <Text style={styles.loginButtonText}>PROCESSING...</Text>
              ) : (
                <>
                  <MaterialIcons name={step === 1 ? "send" : "check-circle"} size={18} color="#91a0c7ff" />
                  <Text style={styles.loginButtonText}>{step === 1 ? 'SEND OTP' : 'RESET PASSWORD'}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <MaterialIcons name="verified-user" size={14} color="#3e4759" />
            <Text style={styles.securityText}>Identity Verified</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  glow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(59, 130, 246, 0.035)',
    top: -width * 0.5,
    left: -width * 0.25,
  },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 40 },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 32 },
  backText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6c7a8f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { fontFamily: 'Inter-Bold', fontSize: 18, letterSpacing: 5, color: '#dbe5ff' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.03)' },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleLabel: { fontFamily: 'Inter-Medium', fontSize: 11, letterSpacing: 0.5 },
  titleBlock: { marginBottom: 28 },
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53fec2', marginBottom: 8 },
  title: { fontFamily: 'Inter-Bold', fontSize: 34, color: '#dbe5ff', marginBottom: 8 },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#6c7a8f', lineHeight: 20 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(127,41,39,0.25)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(238,125,119,0.3)', paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#EE7D77', flex: 1 },
  formCard: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 20, marginBottom: 20, gap: 16 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#9babce', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8e6e1', borderRadius: 12, paddingHorizontal: 14, height: 48 },
  input: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#1a1a2e' },
  inputIcon: { marginLeft: 8 },
  loginButton: { borderRadius: 14, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(219, 229, 255, 0.15)' },
  loginButtonText: { fontFamily: 'Inter-SemiBold', fontSize: 14, letterSpacing: 2, color: '#dbe5ff' },
  securityInfo: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 32, marginTop: 10 },
  securityItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  securityText: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#3e4759' },
});
