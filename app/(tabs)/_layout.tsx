import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#2e78b7' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'My Notes',
          tabBarIcon: ({ color }) => <Ionicons name="document-text" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add-note"
        options={{
          title: 'Add Note',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
