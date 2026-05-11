import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Note = {
  id: string;
  title: string;
  content: string;
  subject: string;
  created_at: string;
};

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function fetchNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching notes:', error);
    else setNotes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  const renderItem = ({ item }: { item: Note }) => (
    <TouchableOpacity 
      style={styles.noteCard}
      onPress={() => router.push(`/note/${item.id}`)}
    >
      <View style={styles.noteHeader}>
        <Text style={styles.noteTitle}>{item.title}</Text>
        <Text style={styles.noteSubject}>{item.subject}</Text>
      </View>
      <Text style={styles.notePreview} numberOfLines={2}>
        {item.content}
      </Text>
      <Text style={styles.noteDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e78b7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {notes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No notes yet. Add your first one!</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={fetchNotes}
          refreshing={loading}
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => router.push('/(tabs)/add-note')}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 15,
  },
  noteCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  noteSubject: {
    fontSize: 12,
    color: '#2e78b7',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notePreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noteDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#2e78b7',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
