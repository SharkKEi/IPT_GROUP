import { useState } from 'react';
<<<<<<< HEAD
<<<<<<< HEAD
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertBox, AppButton, AppInput, GlassCard, LinkButton, Screen } from '../ui';
import { colors } from '../theme';
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
<<<<<<< HEAD
<<<<<<< HEAD
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (e) {
      setError(e.message || 'Login failed');
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
    if (loading) return;
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setError('Enter your username and password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(cleanUsername, password);
    } catch (e) {
      setError(e.message || 'Login failed.');
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
<<<<<<< HEAD
    <View style={styles.container}>
      <Text style={styles.title}>School Portal</Text>
      <Text style={styles.subtitle}>Mobile — sign in with your account</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#888"
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={onSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </Pressable>
      <Pressable onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Create an account</Text>
      </Pressable>
    </View>
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll={false}>
        <View style={styles.center}>
          <Text style={styles.title}>School Portal</Text>
          <Text style={styles.subtitle}>Mobile access connected through Django API</Text>

          <GlassCard style={styles.card}>
            <AlertBox>{error}</AlertBox>
            <AppInput
              label="Username"
              placeholder="Enter username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              editable={!loading}
              returnKeyType="next"
            />
            <AppInput
              label="Password"
              placeholder="Enter password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              editable={!loading}
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            <AppButton title="Login" onPress={onSubmit} loading={loading} disabled={!username.trim() || !password} />
            <LinkButton title="Create an account" onPress={() => navigation.navigate('Register')} />
          </GlassCard>

          <Text style={styles.apiText}>API: {API_BASE}</Text>
        </View>
      </Screen>
    </KeyboardAvoidingView>
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
<<<<<<< HEAD
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#1e0b4d' },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', textAlign: 'center' },
  subtitle: { color: '#aaa', textAlign: 'center', marginBottom: 24, marginTop: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#a5b4fc', textAlign: 'center', marginTop: 20 },
  error: { color: '#fca5a5', marginBottom: 12, textAlign: 'center' },
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
  center: { flex: 1, justifyContent: 'center', padding: 22 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  card: { marginBottom: 10 },
  apiText: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: 8 },
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
});
