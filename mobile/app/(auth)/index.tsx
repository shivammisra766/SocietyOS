import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

type Role = 'resident' | 'guard' | 'service';

interface RoleCard {
  id: Role;
  title: string;
  subtitle: string;
  clearance: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accentColor: string;
  description: string;
}

const roles: RoleCard[] = [
  {
    id: 'resident',
    title: 'Resident',
    subtitle: 'Residential Access',
    clearance: 'Clearance I',
    icon: 'home',
    accentColor: '#dbe5ff',
    description: 'Manage your home, passes & notices',
  },
  {
    id: 'guard',
    title: 'Security',
    subtitle: 'ShieldGuard Protocol',
    clearance: 'Clearance II',
    icon: 'shield',
    accentColor: '#53fec2',
    description: 'Gate control, scanning & alerts',
  },
  {
    id: 'service',
    title: 'Service',
    subtitle: 'Staff Operations',
    clearance: 'Clearance III',
    icon: 'badge',
    accentColor: '#9babce',
    description: 'Digital ID, activity & profile',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const scaleAnims = useRef(roles.map(() => new Animated.Value(1))).current;

  const handlePressIn = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handlePressOut = (index: number) => {
    Animated.spring(scaleAnims[index], {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 20,
    }).start();
  };

  const handleRoleSelect = (role: Role) => {
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={['#090e18', '#0e1322', '#090e18']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Radial glow effect */}
      <View style={styles.glowContainer} pointerEvents="none">
        <View style={styles.glowBlue} />
        <View style={styles.glowTeal} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <MaterialIcons name="shield" size={28} color="#53fec2" />
            <Text style={styles.logoText}>Society OS</Text>
          </View>
          <Text style={styles.tagline}>Silent Authority Protocol</Text>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <Text style={styles.eyebrow}>ACCESS CONTROL</Text>
          <Text style={styles.title}>Select{'\n'}Your Role</Text>
          <Text style={styles.subtitle}>
            Authenticate with your designated clearance level to proceed.
          </Text>
        </View>

        {/* Role cards */}
        <View style={styles.cardStack}>
          {roles.map((role, index) => (
            <Animated.View
              key={role.id}
              style={{ transform: [{ scale: scaleAnims[index] }] }}
            >
              <TouchableOpacity
                onPressIn={() => handlePressIn(index)}
                onPressOut={() => handlePressOut(index)}
                onPress={() => handleRoleSelect(role.id)}
                activeOpacity={1}
              >
                <View style={styles.roleCard}>
                  {/* Card shimmer border */}
                  <View style={[styles.cardBorder, { borderColor: role.accentColor + '18' }]} />

                  <View style={styles.cardContent}>
                    {/* Left: icon */}
                    <View style={[styles.iconWrapper, { backgroundColor: role.accentColor + '15' }]}>
                      <MaterialIcons name={role.icon} size={22} color={role.accentColor} />
                    </View>

                    {/* Center: text */}
                    <View style={styles.cardText}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.roleTitle}>{role.title}</Text>
                        <View style={[styles.clearancePill, { borderColor: role.accentColor + '40' }]}>
                          <Text style={[styles.clearanceText, { color: role.accentColor }]}>
                            {role.clearance}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.roleSubtitle}>{role.subtitle}</Text>
                      <Text style={styles.roleDescription}>{role.description}</Text>
                    </View>

                    {/* Right: arrow */}
                    <MaterialIcons name="chevron-right" size={20} color="#4a5568" />
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialIcons name="lock" size={12} color="#3e4759" />
          <Text style={styles.footerText}>  Secure • Encrypted • Private</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e18',
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  glowBlue: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(59, 130, 246, 0.04)',
    top: -width * 0.3,
    left: -width * 0.1,
  },
  glowTeal: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(83, 254, 194, 0.03)',
    bottom: height * 0.2,
    right: -width * 0.2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    letterSpacing: 6,
    color: '#dbe5ff',
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    letterSpacing: 3,
    color: '#3e4759',
    marginTop: 6,
    textTransform: 'uppercase',
  },
  titleBlock: {
    marginBottom: 32,
  },
  eyebrow: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 3,
    color: '#53fec2',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 40,
    lineHeight: 46,
    color: '#dbe5ff',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: '#6c7a8f',
  },
  cardStack: {
    gap: 12,
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  cardBorder: {
    position: 'absolute',
    inset: 0,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 2,
  },
  roleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: '#dee1f7',
  },
  clearancePill: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  clearanceText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  roleSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#6c7a8f',
    letterSpacing: 0.3,
  },
  roleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#4a5568',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#3e4759',
    letterSpacing: 1,
  },
});
