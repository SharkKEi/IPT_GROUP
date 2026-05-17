import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, apiRequest, getStoredTokens } from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled) return;
    await uploadProfile(result.assets[0].uri);
  };

  const uploadProfile = async (uri) => {
    setSaving(true);
    setMessage('');
    try {
      const tokens = await getStoredTokens();
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('email', form.email);
      formData.append('profile_picture', {
        uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      const res = await fetch(`${API_BASE}/accounts/api/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.access}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');
      setUser(data);
      setMessage('Profile updated');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const tokens = await getStoredTokens();
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('email', form.email);
      const res = await fetch(`${API_BASE}/accounts/api/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens.access}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Save failed');
      setUser(data);
      setMessage('Saved');
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      {user.profile_picture ? (
        <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarLetter}>{user.username?.[0]?.toUpperCase()}</Text>
        </View>
      )}
      <Pressable style={styles.pickBtn} onPress={pickImage}>
        <Text style={styles.pickText}>Upload photo (camera roll)</Text>
      </Pressable>
      {['first_name', 'last_name', 'email'].map((field) => (
        <TextInput
          key={field}
          style={styles.input}
          placeholder={field}
          placeholderTextColor="#888"
          value={form[field]}
          onChangeText={(v) => setForm((f) => ({ ...f, [field]: v }))}
        />
      ))}
      <Text style={styles.meta}>Verified: {user.is_email_verified ? 'Yes' : 'No'}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Pressable style={styles.button} onPress={save} disabled={saving}>
        <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save profile'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  avatarPlaceholder: { backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { color: '#fff', fontSize: 36, fontWeight: '700' },
  pickBtn: { marginBottom: 20 },
  pickText: { color: '#a5b4fc' },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    marginBottom: 10,
  },
  meta: { color: '#888', alignSelf: 'flex-start', marginBottom: 8 },
  message: { color: '#86efac', marginBottom: 8 },
  button: {
    width: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
