import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/api';

export default function ResidentHeader() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pingAnim = useRef(new Animated.Value(1)).current;
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const [flatNumber, setFlatNumber] = useState<string | null>(null);

  useEffect(() => {
    api.get('/users/me')
      .then(res => setFlatNumber(res.data.data?.flat?.number ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pingAnim]);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('') || 'U';

  const handleLogout = () => {
    setMenuVisible(false);
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <BlurView
        intensity={40}
        tint="dark"
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* Left: Avatar + Name */}
        <View style={styles.leftSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name || 'Resident'}</Text>
            <Text style={styles.unit}>
              {flatNumber ? `Flat ${flatNumber}` : user?.role === 'RESIDENT' ? 'Resident' : user?.role || 'Resident'}
            </Text>
          </View>
        </View>

        {/* Right: Notification Bell + Overflow Menu */}
        <View style={styles.rightSection}>
          <TouchableOpacity 
            style={styles.bellWrapper}
            onPress={() => router.push('/(resident)/notices')}
          >
            <MaterialIcons name="notifications-none" size={24} color="#9BABCE" />
            <Animated.View style={[styles.pingDot, { opacity: pingAnim }]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialIcons name="more-vert" size={22} color="#6c7a8f" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Overflow Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { top: insets.top + 56 }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/(resident)/profile');
              }}
            >
              <MaterialIcons name="person-outline" size={18} color="#9BABCE" />
              <Text style={styles.menuText}>Profile</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setMenuVisible(false)}
            >
              <MaterialIcons name="settings" size={18} color="#9BABCE" />
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <MaterialIcons name="logout" size={18} color="#EE7D77" />
              <Text style={[styles.menuText, { color: '#EE7D77' }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
    backgroundColor: 'rgba(9,14,24,0.6)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148,163,184,0.1)',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25293A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#9BABCE',
  },
  name: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#DEE1F7',
  },
  unit: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#6c7a8f',
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bellWrapper: {
    position: 'relative',
  },
  pingDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FACC15',
  },
  /* Overflow Menu */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuContainer: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1a2036',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#DEE1F7',
  },
  menuDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginHorizontal: 16,
  },
});
