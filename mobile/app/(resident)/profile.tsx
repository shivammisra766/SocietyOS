import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/api';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  flat?: { number: string; floor: number } | null;
  society?: { name: string } | null;
  profilePicture?: string | null;
}

export default function ResidentProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/users/me');
      const data: ProfileData = res.data.data;
      setProfile(data);
      setName(data.name ?? '');
      setPhone(data.phone ?? '');
    } catch {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not load profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Validation', text2: 'Name cannot be empty.' });
      return;
    }
    setSaving(true);
    try {
      await api.patch('/users/me', { name: name.trim(), phone: phone.trim() });
      Toast.show({ type: 'success', text1: 'Saved', text2: 'Your profile has been updated.' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to update profile.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
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

    if (!result.canceled && result.assets && result.assets.length > 0) {
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

        // Optimistically update
        setProfile(prev => prev ? { ...prev, profilePicture: res.data.profilePicture } : null);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Profile picture updated.' });
      } catch (error) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to upload profile picture.' });
      } finally {
        setUploadingPic(false);
      }
    }
  };

  const initials = (profile?.name ?? user?.name ?? 'U')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const roleLabel: Record<string, string> = {
    RESIDENT: 'Resident', SECURITY: 'Security', SERVICE: 'Service Staff', ADMIN: 'Admin',
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color="#DEE1F7" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>

        {loading ? (
          <ActivityIndicator color="#53FEC2" style={{ marginTop: 60 }} />
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Avatar Card */}
            <View style={styles.avatarCard}>
              <TouchableOpacity onPress={handlePickImage} disabled={uploadingPic}>
                <View style={styles.avatarCircle}>
                  {uploadingPic ? (
                    <ActivityIndicator color="#090e18" />
                  ) : profile?.profilePicture ? (
                    <Image source={{ uri: profile.profilePicture }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>{initials}</Text>
                  )}
                  <View style={styles.editBadge}>
                    <MaterialIcons name="edit" size={12} color="#fff" />
                  </View>
                </View>
              </TouchableOpacity>
              <View style={styles.avatarInfo}>
                <Text style={styles.avatarName}>{profile?.name || '—'}</Text>
                <View style={styles.roleBadge}>
                  <View style={styles.roleDot} />
                  <Text style={styles.roleText}>{roleLabel[profile?.role ?? ''] ?? profile?.role ?? 'Unknown'}</Text>
                </View>
              </View>
            </View>

            {/* Society & Flat Info */}
            {(profile?.society || profile?.flat) && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>LOCATION</Text>
                <View style={styles.infoRow}>
                  <MaterialIcons name="business" size={18} color="#53FEC2" />
                  <Text style={styles.infoText}>{profile?.society?.name ?? '—'}</Text>
                </View>
                {profile?.flat && (
                  <View style={styles.infoRow}>
                    <MaterialIcons name="home" size={18} color="#53FEC2" />
                    <Text style={styles.infoText}>
                      Flat {profile.flat.number}
                      {profile.flat.floor !== undefined ? `, Floor ${profile.flat.floor}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Editable Fields */}
            <Text style={styles.sectionLabel}>EDIT PROFILE</Text>
            <View style={styles.formCard}>
              {/* Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="person-outline" size={18} color="#6c7a8f" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor="#3e4759"
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Phone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="phone" size={18} color="#6c7a8f" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#3e4759"
                    keyboardType="phone-pad"
                    textContentType="telephoneNumber"
                  />
                </View>
              </View>

              {/* Email (read-only) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email Address</Text>
                <View style={[styles.inputWrapper, styles.inputReadonly]}>
                  <MaterialIcons name="email" size={18} color="#3e4759" style={styles.inputIcon} />
                  <Text style={styles.inputReadonlyText}>{profile?.email ?? '—'}</Text>
                  <MaterialIcons name="lock-outline" size={14} color="#3e4759" />
                </View>
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={saving ? ['#1a2a1e', '#1a2a1e'] : ['#1a3a2e', '#0d2219']}
                style={styles.saveBtnInner}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              >
                {saving ? (
                  <ActivityIndicator color="#53FEC2" size="small" />
                ) : (
                  <>
                    <MaterialIcons name="check" size={18} color="#53FEC2" />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Account Status */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>ACCOUNT STATUS</Text>
              <View style={styles.statusRow}>
                <MaterialIcons
                  name={profile?.status === 'APPROVED' ? 'verified-user' : 'hourglass-empty'}
                  size={18}
                  color={profile?.status === 'APPROVED' ? '#53FEC2' : '#FACC15'}
                />
                <Text style={[
                  styles.statusText,
                  { color: profile?.status === 'APPROVED' ? '#53FEC2' : '#FACC15' }
                ]}>
                  {profile?.status === 'APPROVED' ? 'Verified Account' : (profile?.status ?? 'Pending')}
                </Text>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
              <MaterialIcons name="logout" size={18} color="#EE7D77" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#090e18' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: '#DEE1F7' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, gap: 20 },

  /* Avatar Card */
  avatarCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 20,
  },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 22,
    backgroundColor: '#0d2219', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.25)',
  },
  avatarImage: {
    width: '100%', height: '100%', borderRadius: 20,
  },
  editBadge: {
    position: 'absolute', bottom: -6, right: -6,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#090e18', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  avatarText: { fontFamily: 'Inter-Bold', fontSize: 22, color: '#53FEC2' },
  avatarInfo: { flex: 1, gap: 6 },
  avatarName: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#DEE1F7' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#53FEC2' },
  roleText: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#53FEC2' },

  /* Info section */
  infoSection: {
    backgroundColor: 'rgba(20,25,35,0.4)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 16, gap: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontFamily: 'Inter-Regular', fontSize: 14, color: '#9BABCE' },

  /* Labels */
  sectionLabel: {
    fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3,
    color: '#9BABCE', textTransform: 'uppercase' as const,
  },

  /* Form */
  formCard: {
    backgroundColor: 'rgba(20,25,35,0.4)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', padding: 20, gap: 16,
  },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontFamily: 'Inter-Medium', fontSize: 12, color: '#6c7a8f', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, height: 48,
  },
  inputIcon: {},
  input: {
    flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#DEE1F7',
  },
  inputReadonly: { borderColor: 'rgba(255,255,255,0.04)' },
  inputReadonlyText: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 14, color: '#3e4759' },

  /* Save */
  saveBtn: { borderRadius: 16, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(83,254,194,0.2)',
  },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#53FEC2' },

  /* Status */
  statusSection: { gap: 10 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusText: { fontFamily: 'Inter-SemiBold', fontSize: 13 },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(127,41,39,0.2)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(238,125,119,0.25)', height: 52,
  },
  logoutText: { fontFamily: 'Inter-SemiBold', fontSize: 15, color: '#EE7D77' },
});
