import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value?: string;
}

const accountItems: MenuItem[] = [
  { icon: 'account-circle', label: 'Personal Information' },
  { icon: 'work-outline', label: 'Employment Details' },
  { icon: 'badge', label: 'Digital ID Settings' },
];

const appItems: MenuItem[] = [
  { icon: 'notifications-none', label: 'Notifications' },
  { icon: 'language', label: 'Language', value: 'English' },
  { icon: 'dark-mode', label: 'Appearance', value: 'Gunmetal Dark' },
  { icon: 'help-outline', label: 'Help & Support' },
  { icon: 'info-outline', label: 'About', value: 'v1.0.2' },
];

export default function ServiceProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const renderGroup = (items: MenuItem[]) => (
    <View style={styles.settingsGroup}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          <TouchableOpacity style={styles.settingRow} activeOpacity={0.7}>
            <View style={styles.settingIconWrap}>
              <MaterialIcons name={item.icon} size={20} color="#9BABCE" />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
            {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
            <MaterialIcons name="chevron-right" size={20} color="#4a5568" />
          </TouchableOpacity>
          {i < items.length - 1 && <View style={styles.rowDivider} />}
        </React.Fragment>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#090e18', '#0e1322', '#090e18']} style={StyleSheet.absoluteFill} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.split(' ').map(n => n[0]).join('') || 'SS'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name || 'Staff'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>Housekeeping</Text>
              </View>
              <View style={styles.idBadge}>
                <Text style={styles.idBadgeText}>SO-2023-A84</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <MaterialIcons name="edit" size={18} color="#9BABCE" />
          </TouchableOpacity>
        </View>

        {/* Account Settings */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        {renderGroup(accountItems)}

        {/* Application Settings */}
        <Text style={styles.sectionLabel}>APPLICATION</Text>
        {renderGroup(appItems)}

        {/* Logout */}
        <Text style={styles.sectionLabel}>DANGER ZONE</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <MaterialIcons name="logout" size={20} color="#EE7D77" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>Service Coordinator v1.0.2</Text>
        <Text style={styles.footerSub}>Powered by SocietyOS</Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e18' },
  scrollContent: { paddingHorizontal: 20 },
  eyebrow: {
    fontFamily: 'Inter-Medium', fontSize: 10, letterSpacing: 3, color: '#9BABCE', marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold', fontSize: 28, color: '#DEE1F7', marginBottom: 24,
  },

  /* Profile Card */
  profileCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 20, marginBottom: 8, gap: 14,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: '#25293A', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(83,254,194,0.2)',
  },
  avatarText: { fontFamily: 'Inter-Bold', fontSize: 20, color: '#53FEC2' },
  profileInfo: { flex: 1, gap: 8 },
  profileName: { fontFamily: 'Inter-Bold', fontSize: 18, color: '#DEE1F7' },
  badgeRow: { flexDirection: 'row', gap: 8 },
  roleBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  roleBadgeText: { fontFamily: 'Inter-Medium', fontSize: 10, color: '#9BABCE' },
  idBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 9999,
    borderWidth: 1, borderColor: 'rgba(37,224,167,0.3)',
  },
  idBadgeText: { fontFamily: 'Inter-Bold', fontSize: 9, letterSpacing: 0.5, color: '#25E0A7' },
  editBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },

  /* Section Labels */
  sectionLabel: {
    fontFamily: 'Inter-Bold', fontSize: 10, letterSpacing: 3,
    color: '#9BABCE', marginBottom: 12, marginTop: 24,
  },

  /* Settings Group */
  settingsGroup: {
    backgroundColor: 'rgba(20,25,35,0.6)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 14,
  },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center',
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontFamily: 'Inter-Medium', fontSize: 14, color: '#DEE1F7' },
  settingValue: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#6c7a8f', marginRight: 4 },
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
  footer: {
    fontFamily: 'Inter-SemiBold', fontSize: 12, color: '#3e4759',
    textAlign: 'center', marginTop: 32,
  },
  footerSub: {
    fontFamily: 'Inter-Regular', fontSize: 10, color: '#2a3340',
    textAlign: 'center', marginTop: 4,
  },
});
