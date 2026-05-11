import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform, Modal, Animated } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { transcribeAudio } from '../../lib/gemini';

type Note = {
  id: string;
  title: string;
  subject: string;
  content: string;
  created_at: string;
};

export default function AddNote() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [loading, setLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const router = useRouter();

  useEffect(() => {
    fetchRecentNotes();
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);

  async function fetchRecentNotes() {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    if (data) setRecentNotes(data);
  }

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status === 'granted') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        setIsRecording(true);
        setShowVoiceModal(true);
      }
    } catch (err) {
      Alert.alert('Failed to start recording', (err as any).message);
    }
  }

  async function stopAndTranscribe() {
    if (!recording) return;

    try {
      setIsRecording(false);
      setIsTranscribing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        
        const transcription = await transcribeAudio(base64, 'audio/m4a');
        if (transcription) {
          setContent(prev => prev + (prev ? ' ' : '') + transcription);
        }
      }
    } catch (err) {
      Alert.alert('Transcription Error', (err as any).message);
    } finally {
      setIsTranscribing(false);
      setShowVoiceModal(false);
      setRecording(null);
    }
  }

  async function saveNote() {
    if (!title || !content) {
      Alert.alert('Error', 'Please provide a title and content.');
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('notes')
      .insert([
        { title, content, subject, user_id: user?.id }
      ]);

    if (error) {
      Alert.alert('Error saving note', error.message);
    } else {
      setTitle('');
      setContent('');
      setSubject('');
      fetchRecentNotes();
      Alert.alert('Success', 'Note saved successfully!');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Add New Note</Text>
        
        <View style={styles.inputCard}>
          <TextInput
            style={styles.titleInput}
            placeholder="Title (e.g. History Lesson 1)"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={styles.subjectInput}
            placeholder="Subject (e.g. History)"
            value={subject}
            onChangeText={setSubject}
          />
          
          <View style={styles.contentContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="Start writing or record your voice..."
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
            
            <TouchableOpacity 
              style={styles.fab} 
              onPress={startRecording}
            >
              <Ionicons name="mic" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.saveButton} 
          onPress={saveNote}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Note</Text>}
        </TouchableOpacity>

        {recentNotes.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>Recent Notes</Text>
            {recentNotes.map((note) => (
              <TouchableOpacity 
                key={note.id} 
                style={styles.noteItem}
                onPress={() => router.push(`/note/${note.id}`)}
              >
                <View style={styles.noteIcon}>
                  <Ionicons name="document-text" size={24} color="#2e78b7" />
                </View>
                <View style={styles.noteDetails}>
                  <Text style={styles.noteTitleText}>{note.title}</Text>
                  <Text style={styles.noteSubjectText}>{note.subject || 'No Subject'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Voice Recording Modal */}
      <Modal
        visible={showVoiceModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {isTranscribing ? 'AI is thinking...' : 'Listening...'}
            </Text>
            
            <View style={styles.waveContainer}>
              <Animated.View style={[
                styles.pulseCircle,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Ionicons 
                  name={isTranscribing ? "cloud-upload" : "mic"} 
                  size={50} 
                  color="#fff" 
                />
              </Animated.View>
            </View>

            {isTranscribing ? (
              <ActivityIndicator size="large" color="#2e78b7" style={{ marginTop: 20 }} />
            ) : (
              <TouchableOpacity 
                style={styles.stopButton} 
                onPress={stopAndTranscribe}
              >
                <Text style={styles.stopButtonText}>Done Recording</Text>
              </TouchableOpacity>
            )}
            
            {!isTranscribing && (
              <TouchableOpacity 
                style={styles.cancelLink} 
                onPress={() => {
                  setShowVoiceModal(false);
                  setIsRecording(false);
                  if (recording) recording.stopAndUnloadAsync();
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    marginBottom: 10,
  },
  subjectInput: {
    fontSize: 14,
    color: '#666',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
    marginBottom: 15,
  },
  contentContainer: {
    position: 'relative',
    minHeight: 200,
  },
  contentInput: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    flex: 1,
    paddingBottom: 60,
  },
  fab: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: '#2e78b7',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  saveButton: {
    backgroundColor: '#2e78b7',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  recentSection: {
    marginTop: 30,
    marginBottom: 40,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  noteIcon: {
    backgroundColor: '#e3f2fd',
    width: 45,
    height: 45,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  noteDetails: {
    flex: 1,
  },
  noteTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  noteSubjectText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 30,
    padding: 40,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  waveContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pulseCircle: {
    backgroundColor: '#2e78b7',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  stopButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 10,
  },
  stopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelLink: {
    marginTop: 20,
  },
  cancelText: {
    color: '#999',
    fontSize: 14,
  },
});
