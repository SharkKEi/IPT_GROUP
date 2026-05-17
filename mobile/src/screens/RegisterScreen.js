import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { register } from '../api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
    setError('');
    setMessage('');
    try {
      const data = await register(form);
      setMessage(data.message || 'Registered. Check your email to activate.');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
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
