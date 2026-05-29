import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { register } from '../api';
import { AlertBox, AppButton, AppInput, GlassCard, LinkButton, Screen } from '../ui';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onSubmit = async () => {
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
    }
  };

  return (
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
