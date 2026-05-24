import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE, getErrorMessage, getStoredTokens } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertBox, AppButton, AppInput, Badge, GlassCard, Screen } from '../ui';
import { colors } from '../theme';

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

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
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
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
  );
}

const styles = StyleSheet.create({
  avatar: { width: 110, height: 110, borderRadius: 55, marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  avatarPlaceholder: { backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.text, fontSize: 42, fontWeight: '900' },
  username: { color: colors.text, fontWeight: '900', fontSize: 20, marginBottom: 8 },
});
