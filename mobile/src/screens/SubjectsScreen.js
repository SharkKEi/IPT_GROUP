import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, AppInput, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject_code: '', title: '', units: '3' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setSubjects(await apiRequest('/accounts/api/subjects/')); }
    catch (e) { setError(e.message || 'Could not load subjects.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reset = () => { setForm({ subject_code: '', title: '', units: '3' }); setEditingId(null); };

  const save = async () => {
    if (saving) return;
    if (!form.subject_code.trim() || !form.title.trim() || !String(form.units).trim()) {
      setError('Subject code, title, and units are required.');
      return;
    }
    setSaving(true); setError('');
    try {
      const payload = { subject_code: form.subject_code.trim(), title: form.title.trim(), units: Number(form.units) };
      await apiRequest(editingId ? `/accounts/api/subjects/${editingId}/` : '/accounts/api/subjects/', {
        method: editingId ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      reset(); await load();
    } catch (e) { setError(e.message || 'Could not save subject.'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    setSaving(true); setError('');
    try { await apiRequest(`/accounts/api/subjects/${id}/`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e.message || 'Could not delete subject.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen title="Subjects" subtitle="Same subject records used by the web app.">
      <GlassCard>
        <SectionTitle>{editingId ? 'Update Subject' : 'Create Subject'}</SectionTitle>
        <AlertBox>{error}</AlertBox>
        <AppInput label="Subject Code" placeholder="IT101" value={form.subject_code} onChangeText={(v) => setForm((f) => ({ ...f, subject_code: v }))} editable={!saving} />
        <AppInput label="Title" placeholder="Application Development" value={form.title} onChangeText={(v) => setForm((f) => ({ ...f, title: v }))} editable={!saving} />
        <AppInput label="Units" keyboardType="numeric" value={String(form.units)} onChangeText={(v) => setForm((f) => ({ ...f, units: v }))} editable={!saving} />
        <AppButton title={editingId ? 'Update Subject' : 'Create Subject'} onPress={save} loading={saving} />
        {editingId ? <AppButton title="Cancel Edit" tone="ghost" onPress={reset} style={{ marginTop: 10 }} /> : null}
      </GlassCard>
      <GlassCard>
        <SectionTitle>Subject List</SectionTitle>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {!loading && subjects.length === 0 ? <Text style={{ color: colors.muted, textAlign: 'center' }}>No subjects yet.</Text> : null}
        {subjects.map((item) => (
          <DataRow key={item.id} title={`${item.subject_code} — ${item.title}`} subtitle={`${item.units} units`} actions={<><SmallButton title="Edit" onPress={() => { setEditingId(item.id); setForm({ subject_code: item.subject_code, title: item.title, units: String(item.units) }); }} /><SmallButton title="Del" tone="danger" onPress={() => remove(item.id)} disabled={saving} /></>} />
        ))}
      </GlassCard>
    </Screen>
  );
}
