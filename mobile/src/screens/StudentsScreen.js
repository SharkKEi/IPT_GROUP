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

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_number: '', full_name: '' });
  const [editingId, setEditingId] = useState(null);

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
