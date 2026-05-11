import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // 1. Get profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // 2. Set profile and add email from auth if not in profile
      setProfile({
        ...data,
        email: user.email,
        full_name: data?.full_name || user.email?.split('@')[0] || 'User'
      });
    }
    setLoading(false);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error logging out', error.message);
    else router.replace('/(auth)/sign-in');
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e78b7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color="#fff" />
        </View>
        <Text style={styles.name}>{profile?.full_name}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#ff4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 30,
    elevation: 2,
  },
  avatar: {
    backgroundColor: '#2e78b7',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  logoutButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffcccc',
  },
  logoutText: {
    color: '#ff4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
