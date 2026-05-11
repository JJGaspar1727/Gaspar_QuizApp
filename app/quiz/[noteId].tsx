import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateQuizFromNote } from '../../lib/gemini';
import { Ionicons } from '@expo/vector-icons';

type Question = {
  question: string;
  type: 'multiple_choice' | 'identification';
  options?: string[];
  answer: string;
};

export default function Quiz() {
  const { noteId } = useLocalSearchParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    generateQuiz();
  }, [noteId]);

  async function generateQuiz() {
    setLoading(true);
    
    // 1. Fetch note content
    const { data: note, error } = await supabase
      .from('notes')
      .select('content, title')
      .eq('id', noteId)
      .single();

    if (error || !note) {
      Alert.alert('Error', 'Could not load note for quiz generation.');
      router.back();
      return;
    }

    // 2. Call AI API
    try {
      const aiQuestions = await generateQuizFromNote(note.title, note.content);
      setQuestions(aiQuestions);
    } catch (err: any) {
      Alert.alert('AI Error', err.message || 'Failed to generate quiz with AI.');
      router.back();
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(answer: string) {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[currentIndex] = answer;
    setUserAnswers(newUserAnswers);
    setCurrentInput('');
    
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      submitQuiz(newUserAnswers);
    }
  }

  async function submitQuiz(finalAnswers: string[]) {
    setLoading(true);
    let score = 0;
    questions.forEach((q, index) => {
      if (q.answer.toLowerCase() === finalAnswers[index].toLowerCase()) {
        score++;
      }
    });

    const { data: { user } } = await supabase.auth.getUser();
    
    // Save quiz
    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ 
        note_id: noteId, 
        user_id: user?.id, 
        questions: questions 
      }])
      .select()
      .single();

    if (quizError) {
      Alert.alert('Error saving quiz', quizError.message);
      setLoading(false);
      return;
    }

    // Save result
    const { data: resultData, error: resultError } = await supabase
      .from('quiz_results')
      .insert([{
        quiz_id: quizData.id,
        user_id: user?.id,
        score: score,
        total: questions.length,
        answers: finalAnswers
      }])
      .select()
      .single();

    if (resultError) {
      Alert.alert('Error saving results', resultError.message);
    } else {
      router.replace(`/quiz/results/${resultData.id}`);
    }
    setLoading(false);
  }

  if (loading || questions.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e78b7" />
        <Text style={styles.loadingText}>
          {questions.length === 0 ? 'Preparing Questions...' : 'Generating your AI Quiz...'}
        </Text>
      </View>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${((currentIndex + 1) / questions.length) * 100}%` }]} />
        <Text style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.quizContent}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {currentQuestion.type === 'multiple_choice' ? (
          <View style={styles.optionsContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
              >
                <Text style={styles.optionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Type your answer here..."
              value={currentInput}
              onChangeText={setCurrentInput}
              autoFocus
            />
            <TouchableOpacity 
              style={[styles.submitButton, !currentInput && styles.disabledButton]}
              onPress={() => handleAnswer(currentInput)}
              disabled={!currentInput}
            >
              <Text style={styles.submitButtonText}>Submit Answer</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#2e78b7',
    borderRadius: 4,
    marginBottom: 10,
  },
  progressText: {
    textAlign: 'center',
    color: '#666',
    fontWeight: 'bold',
  },
  quizContent: {
    padding: 25,
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 30,
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#eee',
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#fcfcfc',
  },
  optionText: {
    fontSize: 16,
    color: '#444',
    fontWeight: '500',
  },
  inputContainer: {
    gap: 20,
  },
  textInput: {
    borderBottomWidth: 2,
    borderBottomColor: '#2e78b7',
    fontSize: 20,
    paddingVertical: 10,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#2e78b7',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
