import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { API_BASE } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertBox, AppButton, AppInput, GlassCard, LinkButton, Screen } from '../ui';
import { colors } from '../theme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', padding: 22 },
  title: { color: colors.text, fontSize: 38, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.muted, fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  card: { marginBottom: 10 },
  apiText: { color: colors.faint, fontSize: 11, textAlign: 'center', marginTop: 8 },
});
