import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter, useSegments } from 'expo-router';

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session && !inAuthGroup) {
        // Redirect to sign-in if not authenticated
        router.replace('/(auth)/sign-in');
      } else if (session && inAuthGroup) {
        // Redirect to home if authenticated
        router.replace('/(tabs)');
      }
    });
  }, [segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ title: 'Note Details' }} />
      <Stack.Screen name="quiz/[noteId]" options={{ title: 'Quiz' }} />
      <Stack.Screen name="quiz/results/[id]" options={{ title: 'Quiz Results' }} />
    </Stack>
  );
}
