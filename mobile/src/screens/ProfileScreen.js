import { useEffect, useState } from 'react';
<<<<<<< HEAD
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, apiRequest, getStoredTokens } from '../api';
import { useAuth } from '../context/AuthContext';
=======
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, getErrorMessage, getStoredTokens } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertBox, AppButton, AppInput, Badge, GlassCard, Screen } from '../ui';
import { colors } from '../theme';
>>>>>>> 56b74d6 (Updated project code)

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
<<<<<<< HEAD
=======
  const [error, setError] = useState('');
>>>>>>> 56b74d6 (Updated project code)

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

<<<<<<< HEAD
  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
=======
  const patchProfile = async (includePhotoUri) => {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const tokens = await getStoredTokens();
      const formData = new FormData();
      formData.append('first_name', form.first_name);
      formData.append('last_name', form.last_name);
      formData.append('email', form.email);
      if (includePhotoUri) {
        formData.append('profile_picture', {
          uri: includePhotoUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }
      const res = await fetch(`${API_BASE}/accounts/api/me/`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${tokens?.access}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(getErrorMessage(data, 'Profile update failed'));
      setUser(data);
      setMessage(includePhotoUri ? 'Profile photo updated.' : 'Profile saved.');
    } catch (e) {
      setError(e.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError('Photo permission is required to upload a profile picture.');
      return;
    }
>>>>>>> 56b74d6 (Updated project code)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
<<<<<<< HEAD
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
=======
    if (!result.canceled) await patchProfile(result.assets[0].uri);
  };

  return (
    <Screen title="Profile" subtitle="Update your web/mobile account details.">
      <GlassCard style={{ alignItems: 'center' }}>
        {user?.profile_picture ? (
          <Image source={{ uri: user.profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarLetter}>{user?.username?.[0]?.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.username}>{user?.username}</Text>
        <Badge tone={user?.is_email_verified ? 'success' : 'danger'}>
          {user?.is_email_verified ? 'Verified' : 'Not verified'}
        </Badge>
        <AppButton title="Upload photo" tone="ghost" onPress={pickImage} loading={saving} style={{ width: '100%', marginTop: 14 }} />
      </GlassCard>

      <GlassCard>
        <AlertBox>{error}</AlertBox>
        <AlertBox type="success">{message}</AlertBox>
        <AppInput label="First Name" value={form.first_name} onChangeText={(v) => setForm((f) => ({ ...f, first_name: v }))} editable={!saving} />
        <AppInput label="Last Name" value={form.last_name} onChangeText={(v) => setForm((f) => ({ ...f, last_name: v }))} editable={!saving} />
        <AppInput label="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={(v) => setForm((f) => ({ ...f, email: v }))} editable={!saving} />
        <AppButton title="Save profile" onPress={() => patchProfile(null)} loading={saving} />
      </GlassCard>
    </Screen>
>>>>>>> 56b74d6 (Updated project code)
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
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
=======
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  avatarPlaceholder: { backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.text, fontSize: 42, fontWeight: '900' },
  username: { color: colors.text, fontWeight: '900', fontSize: 20, marginBottom: 8 },
>>>>>>> 56b74d6 (Updated project code)
});
