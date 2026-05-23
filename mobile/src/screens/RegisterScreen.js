import { useState } from 'react';
<<<<<<< HEAD
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { register } from '../api';
=======
import { KeyboardAvoidingView, Platform } from 'react-native';
import { register } from '../api';
import { AlertBox, AppButton, AppInput, GlassCard, LinkButton, Screen } from '../ui';
>>>>>>> 56b74d6 (Updated project code)

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
<<<<<<< HEAD
=======
  const [loading, setLoading] = useState(false);
>>>>>>> 56b74d6 (Updated project code)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
<<<<<<< HEAD
    setError('');
    setMessage('');
    try {
      const data = await register(form);
      setMessage(data.message || 'Registered. Check your email to activate.');
    } catch (e) {
      setError(e.message);
=======
    if (loading) return;
    setError('');
    setMessage('');
    if (!form.username.trim() || !form.email.trim() || !form.password || !form.confirm_password) {
      setError('Complete all fields first.');
      return;
    }
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await register({ ...form, username: form.username.trim(), email: form.email.trim() });
      setMessage(data.detail || data.message || 'Registered. Check your email to activate your account.');
    } catch (e) {
      setError(e.message || 'Registration failed.');
    } finally {
      setLoading(false);
>>>>>>> 56b74d6 (Updated project code)
    }
  };

  return (
<<<<<<< HEAD
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.ok}>{message}</Text> : null}
      {['username', 'email', 'password', 'confirm_password'].map((field) => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field.replace('_', ' ')}
          placeholderTextColor="#888"
          secureTextEntry={field.includes('password')}
          autoCapitalize={field === 'email' ? 'none' : 'none'}
          keyboardType={field === 'email' ? 'email-address' : 'default'}
          value={form[field]}
          onChangeText={(v) => set(field, v)}
        />
      ))}
      <Pressable style={styles.button} onPress={onSubmit}>
        <Text style={styles.buttonText}>Register</Text>
      </Pressable>
      <Pressable onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Back to login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 16 },
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
  buttonText: { color: '#fff', fontWeight: '600' },
  link: { color: '#a5b4fc', textAlign: 'center', marginTop: 16 },
  error: { color: '#fca5a5', marginBottom: 12 },
  ok: { color: '#86efac', marginBottom: 12 },
});
=======
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen title="Create Account" subtitle="Use the same account for web and mobile.">
        <GlassCard>
          <AlertBox>{error}</AlertBox>
          <AlertBox type="success">{message}</AlertBox>
          <AppInput label="Username" placeholder="e.g. juan_delacruz" autoCapitalize="none" value={form.username} onChangeText={(v) => set('username', v)} editable={!loading} />
          <AppInput label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={(v) => set('email', v)} editable={!loading} />
          <AppInput label="Password" placeholder="Minimum 6 characters" secureTextEntry value={form.password} onChangeText={(v) => set('password', v)} editable={!loading} />
          <AppInput label="Confirm Password" placeholder="Repeat password" secureTextEntry value={form.confirm_password} onChangeText={(v) => set('confirm_password', v)} editable={!loading} />
          <AppButton title="Register" onPress={onSubmit} loading={loading} />
          <LinkButton title="Back to login" onPress={() => navigation.goBack()} />
        </GlassCard>
      </Screen>
    </KeyboardAvoidingView>
  );
}
>>>>>>> 56b74d6 (Updated project code)
