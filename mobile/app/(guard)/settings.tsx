import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

interface SettingItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
}

const securitySettings: SettingItem[] = [
  { icon: 'fingerprint', label: 'Biometric Lock' },
  { icon: 'vpn-key', label: 'Change PIN' },
  { icon: 'history', label: 'Login History' },
  { icon: 'devices', label: 'Trusted Devices' },
];

const appSettings: SettingItem[] = [
  { icon: 'notifications', label: 'Notification Preferences' },
  { icon: 'dark-mode', label: 'Appearance', subtitle: 'Gunmetal Dark' },
  { icon: 'language', label: 'Language', subtitle: 'English' },
  { icon: 'help-outline', label: 'Help & Support' },
  { icon: 'info-outline', label: 'About SocietyOS', subtitle: 'v1.0.0' },
];

export default function GuardSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [profilePic, setProfilePic] = useState<string | null>(user?.profilePicture || null);
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets?.length > 0) {
      const asset = result.assets[0];
      setUploadingPic(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: asset.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        } as any);

        const res = await api.post('/users/me/profile-picture', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProfilePic(res.data.profilePicture);
        Toast.show({ type: 'success', text1: 'Updated', text2: 'Profile picture updated.' });
      } catch {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload picture.' });
      } finally {
        setUploadingPic(false);
      }
    }
  };

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'GD';

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]} showsVerticalScrollIndicator={false}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={20} color="#6c7a8f" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>Settings</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploadingPic}>
            <View style={styles.profileAvatar}>
              {uploadingPic ? (
                <ActivityIndicator color="#53FEC2" />
              ) : profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.profileAvatarImage} />
              ) : (
                <Text style={styles.profileAvatarText}>{initials}</Text>
              )}
              <View style={styles.editBadge}>
                <MaterialIcons name="edit" size={11} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Guard'}</Text>
            <Text style={styles.profileRole}>Security Officer</Text>
            <View style={styles.badgeRow}>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>ID-{user?.id?.slice(-6).toUpperCase() ?? '------'}</Text>
              </View>
              <View style={styles.shiftBadge}>
                <View style={styles.shiftDot} />
                <Text style={styles.shiftText}>Active</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security & Account */}
        <Text style={styles.sectionLabel}>SECURITY & ACCOUNT</Text>
        <View style={styles.settingsGroup}>
          {securitySettings.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={styles.settingIconWrap}>
                  <MaterialIcons name={item.icon} size={20} color="#9BABCE" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.subtitle && <Text style={styles.settingSub}>{item.subtitle}</Text>}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4a5568" />
              </TouchableOpacity>
              {i < securitySettings.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Application */}
        <Text style={styles.sectionLabel}>APPLICATION</Text>
        <View style={styles.settingsGroup}>
          {appSettings.map((item, i) => (
            <React.Fragment key={item.label}>
              <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
                <View style={styles.settingIconWrap}>
                  <MaterialIcons name={item.icon} size={20} color="#9BABCE" />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{item.label}</Text>
                  {item.subtitle && <Text style={styles.settingSub}>{item.subtitle}</Text>}
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#4a5568" />
              </TouchableOpacity>
              {i < appSettings.length - 1 && <View style={styles.rowDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* Logout Danger Zone */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color="#EE7D77" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>SocietyOS v1.0.0</Text>
        <Text style={styles.footerSub}>Secured by SocietyOS Identity Shield</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 20 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#6c7a8f' },
  eyebrow: { fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#53FEC2', marginBottom: 8 },
  title: { fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 20 },
  sectionLabel: { fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3, color: '#9BABCE', textTransform: 'uppercase' as const, marginBottom: 12, marginTop: 24 },

  /* Profile */
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', padding: 20,
  },
  profileAvatar: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.2)',
  },
  profileAvatarImage: { width: '100%', height: '100%', borderRadius: 18 } as any,
  editBadge: {
    position: 'absolute', bottom: -6, right: -6,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#090e18', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  profileAvatarText: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#53FEC2' },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#DEE1F7' },
  profileRole: { fontFamily: 'Inter-Regular', fontSize: 13, color: '#9BABCE' },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  idBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  idBadgeText: { fontFamily: 'Inter-Bold', fontSize: 9, letterSpacing: 0.5, color: '#9BABCE', textTransform: 'uppercase' as const },
  shiftBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999,
    borderWidth: 1, borderColor: 'rgba(37,224,167,0.3)',
  },
  shiftDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#25E0A7' },
  shiftText: { fontFamily: 'Inter-Bold', fontSize: 9, letterSpacing: 0.5, color: '#25E0A7', textTransform: 'uppercase' as const },

  /* Settings Group */
  settingsGroup: {
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden',
  },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 14 },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1, gap: 1 },
  settingLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#DEE1F7' },
  settingSub: { fontFamily: 'Inter-Regular', fontSize: 11, color: '#6c7a8f' },
  rowDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginLeft: 68 },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(127,41,39,0.25)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(238,125,119,0.3)',
    height: 52,
  },
  logoutText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#EE7D77' },

  /* Footer */
  footer: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#3e4759', textAlign: 'center', marginTop: 32 },
  footerSub: { fontFamily: 'Inter-Regular', fontSize: 10, color: '#2a3340', textAlign: 'center', marginTop: 4 },
});
