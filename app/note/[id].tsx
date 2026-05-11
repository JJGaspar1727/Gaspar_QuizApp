import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  created_at: string;
};

export default function NoteDetails() {
  const { id } = useLocalSearchParams();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNote();
  }, [id]);

  async function fetchNote() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching note:', error);
      Alert.alert('Error', 'Could not load note details.');
      router.back();
    } else {
      setNote(data);
    }
    setLoading(false);
  }

  async function deleteNote() {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('notes')
              .delete()
              .eq('id', id);
            
            if (error) Alert.alert('Error', error.message);
            else {
              Alert.alert('Success', 'Note deleted.');
              router.replace('/(tabs)');
            }
          }
        }
      ]
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e78b7" />
      </View>
    );
  }

  if (!note) return null;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subject}>{note.subject}</Text>
          <Text style={styles.date}>{new Date(note.created_at).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.title}>{note.title}</Text>
        <Text style={styles.noteContent}>{note.content}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={deleteNote}>
          <Ionicons name="trash-outline" size={24} color="#ff4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.quizButton}
          onPress={() => router.push(`/quiz/${note.id}`)}
        >
          <Text style={styles.quizButtonText}>Generate Quiz</Text>
          <Ionicons name="school-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subject: {
    fontSize: 14,
    color: '#2e78b7',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  date: {
    fontSize: 14,
    color: '#999',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  noteContent: {
    fontSize: 18,
    color: '#444',
    lineHeight: 28,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 10,
    marginRight: 15,
  },
  quizButton: {
    flex: 1,
    backgroundColor: '#2e78b7',
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
});
