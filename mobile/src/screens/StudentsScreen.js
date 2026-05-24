<<<<<<< HEAD
<<<<<<< HEAD
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { apiRequest } from '../api';
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, AppInput, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_number: '', full_name: '' });
  const [editingId, setEditingId] = useState(null);
<<<<<<< HEAD
<<<<<<< HEAD

  const load = async () => {
    const data = await apiRequest('/accounts/api/students/');
    setStudents(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form.student_number || !form.full_name) return;
    if (editingId) {
      await apiRequest(`/accounts/api/students/${editingId}/`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
    } else {
      await apiRequest('/accounts/api/students/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
    }
    setForm({ student_number: '', full_name: '' });
    setEditingId(null);
    load();
  };

  const remove = async (id) => {
    await apiRequest(`/accounts/api/students/${id}/`, { method: 'DELETE' });
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>{editingId ? 'Update' : 'Create'} student</Text>
      <TextInput
        style={styles.input}
        placeholder="Student number"
        placeholderTextColor="#888"
        value={form.student_number}
        onChangeText={(v) => setForm((f) => ({ ...f, student_number: v }))}
      />
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#888"
        value={form.full_name}
        onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))}
      />
      <Pressable style={styles.button} onPress={save}>
        <Text style={styles.buttonText}>{editingId ? 'Update' : 'Create'}</Text>
      </Pressable>
      <FlatList
        data={students}
        keyExtractor={(item) => String(item.id)}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.full_name}</Text>
              <Text style={styles.sub}>{item.student_number}</Text>
            </View>
            <Pressable
              onPress={() => {
                setEditingId(item.id);
                setForm({ student_number: item.student_number, full_name: item.full_name });
              }}
            >
              <Text style={styles.action}>Edit</Text>
            </Pressable>
            <Pressable onPress={() => remove(item.id)}>
              <Text style={[styles.action, styles.delete]}>Del</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  heading: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  name: { color: '#fff', fontWeight: '600' },
  sub: { color: '#888', fontSize: 12 },
  action: { color: '#a5b4fc', marginLeft: 12 },
  delete: { color: '#f87171' },
});
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setStudents(await apiRequest('/accounts/api/students/'));
    } catch (e) {
      setError(e.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => {
    setForm({ student_number: '', full_name: '' });
    setEditingId(null);
  };

  const save = async () => {
    if (saving) return;
    if (!form.student_number.trim() || !form.full_name.trim()) {
      setError('Student number and full name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { student_number: form.student_number.trim(), full_name: form.full_name.trim() };
      await apiRequest(editingId ? `/accounts/api/students/${editingId}/` : '/accounts/api/students/', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      reset();
      await load();
    } catch (e) {
      setError(e.message || 'Could not save student.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/accounts/api/students/${id}/`, { method: 'DELETE' });
      await load();
    } catch (e) {
      setError(e.message || 'Could not delete student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title="Students" subtitle="Manage student records from mobile.">
      <GlassCard>
        <SectionTitle>{editingId ? 'Update Student' : 'Create Student'}</SectionTitle>
        <AlertBox>{error}</AlertBox>
        <AppInput label="Student Number" value={form.student_number} onChangeText={(v) => setForm((f) => ({ ...f, student_number: v }))} editable={!saving} />
        <AppInput label="Full Name" value={form.full_name} onChangeText={(v) => setForm((f) => ({ ...f, full_name: v }))} editable={!saving} />
        <AppButton title={editingId ? 'Update Student' : 'Create Student'} onPress={save} loading={saving} />
        {editingId ? <AppButton title="Cancel Edit" tone="ghost" onPress={reset} style={{ marginTop: 10 }} /> : null}
      </GlassCard>

      <GlassCard>
        <SectionTitle>Student List</SectionTitle>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {!loading && students.length === 0 ? <Text style={styles.empty}>No students yet.</Text> : null}
        {students.map((item) => (
          <DataRow
            key={item.id}
            title={item.full_name}
            subtitle={item.student_number}
            actions={
              <>
                <SmallButton title="Edit" onPress={() => { setEditingId(item.id); setForm({ student_number: item.student_number, full_name: item.full_name }); }} />
                <SmallButton title="Del" tone="danger" onPress={() => remove(item.id)} disabled={saving} />
              </>
            }
          />
        ))}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({ empty: { color: colors.muted, textAlign: 'center', paddingVertical: 12 } });
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
