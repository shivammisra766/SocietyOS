import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTab } from '../../components/haptic-tab';

function TabBarBackground() {
  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    />
  );
}

export default function ServiceLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#25E0A7',
        tabBarInactiveTintColor: '#4a5568',
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.05)',
          backgroundColor: 'rgba(9,14,24,0.8)',
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          paddingTop: 8,
        },
        tabBarBackground: () => <TabBarBackground />,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
          marginTop: 2,
        },
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="engineering" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="history" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person-outline" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
