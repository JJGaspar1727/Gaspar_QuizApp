import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type QuizResult = {
  score: number;
  total: number;
  answers: string[];
  quizzes: {
    questions: Array<{
      question: string;
      answer: string;
    }>;
  };
};

export default function Results() {
  const { id } = useLocalSearchParams();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchResult();
  }, [id]);

  async function fetchResult() {
    setLoading(true);
    const { data, error } = await supabase
      .from('quiz_results')
      .select(`
        score,
        total,
        answers,
        quizzes (
          questions
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching result:', error);
    } else {
      setResult(data as any);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2e78b7" />
      </View>
    );
  }

  if (!result) return null;

  const percentage = Math.round((result.score / result.total) * 100);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.scoreCard}>
        <Text style={styles.scoreTitle}>Quiz Completed!</Text>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{result.score}/{result.total}</Text>
          <Text style={styles.percentage}>{percentage}%</Text>
        </View>
        <Text style={styles.feedbackText}>
          {percentage >= 70 ? 'Excellent job!' : percentage >= 50 ? 'Good effort!' : 'Keep studying!'}
        </Text>
      </View>

      <View style={styles.reviewSection}>
        <Text style={styles.sectionTitle}>Review Answers</Text>
        {result.quizzes.questions.map((q, index) => {
          const isCorrect = q.answer.toLowerCase() === result.answers[index].toLowerCase();
          return (
            <View key={index} style={[styles.reviewCard, isCorrect ? styles.correctCard : styles.wrongCard]}>
              <View style={styles.reviewHeader}>
                <Text style={styles.questionIndex}>Question {index + 1}</Text>
                <Ionicons 
                  name={isCorrect ? "checkmark-circle" : "close-circle"} 
                  size={24} 
                  color={isCorrect ? "#4CAF50" : "#F44336"} 
                />
              </View>
              <Text style={styles.questionText}>{q.question}</Text>
              <View style={styles.answerComparison}>
                <View style={styles.answerColumn}>
                  <Text style={styles.answerLabel}>Your Answer:</Text>
                  <Text style={[styles.answerValue, !isCorrect && styles.wrongValue]}>{result.answers[index]}</Text>
                </View>
                {!isCorrect && (
                  <View style={styles.answerColumn}>
                    <Text style={styles.answerLabel}>Correct Answer:</Text>
                    <Text style={[styles.answerValue, styles.correctValue]}>{q.answer}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => router.replace('/(tabs)')}
      >
        <Text style={styles.doneButtonText}>Back to Home</Text>
      </TouchableOpacity>
    </ScrollView>
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
  scoreCard: {
    backgroundColor: '#2e78b7',
    padding: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scoreTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  scoreCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  scoreValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  percentage: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.8,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 20,
    marginTop: 20,
    fontWeight: '600',
  },
  reviewSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 5,
  },
  correctCard: {
    borderLeftColor: '#4CAF50',
  },
  wrongCard: {
    borderLeftColor: '#F44336',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  questionIndex: {
    color: '#999',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  questionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginBottom: 15,
    lineHeight: 22,
  },
  answerComparison: {
    flexDirection: 'row',
    gap: 20,
  },
  answerColumn: {
    flex: 1,
  },
  answerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  answerValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
  },
  wrongValue: {
    color: '#F44336',
  },
  correctValue: {
    color: '#4CAF50',
  },
  doneButton: {
    backgroundColor: '#2e78b7',
    margin: 20,
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
