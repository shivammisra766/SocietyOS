import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { HapticTab } from '../../components/haptic-tab';
import EntryRequestModal from '../../components/EntryRequestModal';

function TabBarBackground() {
  return (
    <BlurView
      intensity={50}
      tint="dark"
      style={[StyleSheet.absoluteFill, { borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' }]}
    />
  );
}

export default function ResidentLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/*
        EntryRequestModal lives outside the Tabs tree so it renders
        on top of every tab screen and every nested navigator.
        It connects to the socket internally and shows itself when
        the backend fires an entry:new event for this resident.
      */}
      <EntryRequestModal />

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#dbe5ff',
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
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="visitors"
          options={{
            title: 'Visitors',
            tabBarIcon: ({ color }) => <MaterialIcons name="group" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <MaterialIcons name="chat-bubble-outline" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="vault"
          options={{
            title: 'Vault',
            tabBarIcon: ({ color }) => <MaterialIcons name="account-balance-wallet" size={24} color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="complaints"
          options={{
            title: 'Tickets',
            tabBarIcon: ({ color }) => <MaterialIcons name="build" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
          }}
        />
        {/* Hide create-pass and notices from tab bar */}
        <Tabs.Screen name="create-pass" options={{ href: null }} />
        <Tabs.Screen name="notices" options={{ href: null }} />
      </Tabs>
    </View>
  );
}
