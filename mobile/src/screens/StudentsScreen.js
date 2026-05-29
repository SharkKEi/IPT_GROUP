import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, AppInput, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';

export default function StudentsScreen() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState({ student_number: '', full_name: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiRequest('/accounts/api/students/');
      setStudents(Array.isArray(res) ? res : res.results || []);
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
