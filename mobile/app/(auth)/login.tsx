import React, { useRef, useState, useEffect } from 'react';
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
  Image,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../hooks/useAuth';
import { getItem, setItem } from '../../lib/storage';
import { BASE_URL } from '../../lib/api';

const { width } = Dimensions.get('window');

type Role = 'resident' | 'guard' | 'service';

const roleConfig: Record<Role, { label: string; accent: string; headline: string }> = {
  resident: {
    label: 'Resident',
    accent: '#dbe5ff',
    headline: 'Welcome Home',
  },
  guard: {
    label: 'Security',
    accent: '#dbe5ff',
    headline: 'Guard Access',
  },
  service: {
    label: 'Service Staff',
    accent: '#dbe5ff',
    headline: 'Staff Access',
  },
};

export default function LoginScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams<{ role: Role }>();
  const config = roleConfig[role ?? 'resident'];
  const { login } = useAuth();

  const [customUrl, setCustomUrl] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [tempUrl, setTempUrl] = useState('');

  useEffect(() => {
    getItem('societyos-custom-api-url').then((url) => {
      setCustomUrl(url || BASE_URL);
    });
  }, []);

  const saveCustomUrl = async (url: string) => {
    const trimmed = url.trim();
    if (trimmed) {
      await setItem('societyos-custom-api-url', trimmed);
      setCustomUrl(trimmed);
    } else {
      await setItem('societyos-custom-api-url', '');
      setCustomUrl(BASE_URL);
    }
    setShowUrlModal(false);
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.97, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 20 }).start();
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(email.trim(), password);
      // Navigation is handled by AuthContext after successful login
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Authentication failed. Please try again.';
      setError(message);
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

      {/* Subtle glow */}
      <View style={styles.glow} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#6c7a8f" />
          <Text style={styles.backText}>Change Role</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => {
              setTempUrl(customUrl);
              setShowUrlModal(true);
            }}
            style={styles.logoRow}
          >
            <Image 
              source={require('../../assets/images/icon.png')} 
              style={{ width: 28, height: 28 }} 
              resizeMode="contain" 
            />
            <Text style={styles.logoText}>SocietyOS</Text>
            <MaterialIcons name="settings" size={12} color="#4a5568" style={{ marginLeft: 2 }} />
          </TouchableOpacity>

          {/* Role badge */}
          <View style={[styles.roleBadge, { borderColor: config.accent + '30' }]}>
            <View style={[styles.roleDot, { backgroundColor: config.accent }]} />
            <Text style={[styles.roleLabel, { color: config.accent }]}>{config.label}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>AUTHENTICATION</Text>
          <Text style={styles.title}>{config.headline}</Text>
        </View>

        {/* Error banner */}
        {error && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#EE7D77" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Form card */}
        <View style={styles.formCard}>
          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#9aab9e"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError(null);
                }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
              />
              <MaterialIcons name="email" size={18} color="#6c7a8f" style={styles.inputIcon} />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9aab9e"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                secureTextEntry={!showPassword}
                textContentType="password"
              />
              <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={styles.inputIcon}>
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={18}
                  color="#6c7a8f"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot password */}
          <TouchableOpacity 
            style={styles.forgotRow} 
            onPress={() => router.push({ pathname: '/forgot-password' as any, params: { role } })}
          >
            <Text style={styles.forgotText}>Forgot credentials?</Text>
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], marginHorizontal: 0 }}>
          <TouchableOpacity
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleLogin}
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
                <Text style={styles.loginButtonText}>AUTHENTICATING...</Text>
              ) : (
                <>
                  <MaterialIcons name="lock-open" size={18} color="#91a0c7ff" />
                  <Text style={styles.loginButtonText}>AUTHENTICATE</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>SECURE ACCESS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Security info */}
        <View style={styles.securityInfo}>
          <View style={styles.securityItem}>
            <MaterialIcons name="verified-user" size={14} color="#3e4759" />
            <Text style={styles.securityText}>256-bit encrypted</Text>
          </View>
          <View style={styles.securityItem}>
            <MaterialIcons name="security" size={14} color="#3e4759" />
            <Text style={styles.securityText}>bcrypt hashed</Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>Secure • Encrypted • Private</Text>
      </ScrollView>

      <Modal
        visible={showUrlModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUrlModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>API Connection Settings</Text>
            <Text style={styles.modalDescription}>
              Configure your backend server URL. You can open this settings screen by tapping/long-pressing the SocietyOS logo on the login page.
            </Text>

            <View style={styles.urlInputWrapper}>
              <TextInput
                style={styles.urlInput}
                placeholder="http://192.168.1.4:5000"
                placeholderTextColor="#6c7a8f"
                value={tempUrl}
                onChangeText={setTempUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUrlModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={() => saveCustomUrl(tempUrl)}
              >
                <Text style={styles.saveButtonText}>Save URL</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => {
                setTempUrl('');
                saveCustomUrl('');
              }}
            >
              <Text style={styles.resetButtonText}>Reset to Default</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e18',
  },
  glow: {
    position: 'absolute',
    width: width * 1.5,
    height: width * 1.5,
    borderRadius: width * 0.75,
    backgroundColor: 'rgba(59, 130, 246, 0.035)',
    top: -width * 0.5,
    left: -width * 0.25,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 32,
  },
  backText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#6c7a8f',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    letterSpacing: 2,
    color: '#dbe5ff',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  roleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  titleBlock: {
    marginBottom: 28,
  },
  eyebrow: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: '#dbe5ff',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 34,
    color: '#dbe5ff',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6c7a8f',
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(127,41,39,0.25)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(238,125,119,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#EE7D77',
    flex: 1,
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 20,
    marginBottom: 20,
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#9babce',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8e6e1',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#1a1a2e',
  },
  inputIcon: {
    marginLeft: 8,
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#4a5568',
  },
  loginButton: {
    borderRadius: 14,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(219, 229, 255, 0.15)',
  },
  loginButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 2,
    color: '#dbe5ff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dividerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    letterSpacing: 2,
    color: '#3e4759',
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  securityText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#3e4759',
  },
  footer: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#2a3445',
    textAlign: 'center',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0d1220',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#dbe5ff',
  },
  modalDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: '#6c7a8f',
    lineHeight: 18,
  },
  urlInputWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    height: 48,
    justifyContent: 'center',
  },
  urlInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#dbe5ff',
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#6c7a8f',
  },
  saveButton: {
    backgroundColor: '#1e3a5f',
  },
  saveButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#dbe5ff',
  },
  resetButton: {
    alignSelf: 'center',
    marginTop: 4,
  },
  resetButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#EE7D77',
    textDecorationLine: 'underline',
  },
});
