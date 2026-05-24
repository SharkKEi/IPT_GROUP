import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, AppInput, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';

export default function SectionsScreen() {
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ subject: '', section_code: '', capacity: '30', schedule: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [sec, sub] = await Promise.all([apiRequest('/accounts/api/sections/'), apiRequest('/accounts/api/subjects/')]);
      setSections(sec); setSubjects(sub);
      if (!form.subject && sub[0]) setForm((f) => ({ ...f, subject: String(sub[0].id) }));
    } catch (e) { setError(e.message || 'Could not load sections.'); }
    finally { setLoading(false); }
  }, [form.subject]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const reset = () => { setForm({ subject: subjects[0] ? String(subjects[0].id) : '', section_code: '', capacity: '30', schedule: '' }); setEditingId(null); };

  const save = async () => {
    if (saving) return;
    if (!form.subject || !form.section_code.trim() || !String(form.capacity).trim()) { setError('Subject, section code, and capacity are required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { subject: Number(form.subject), section_code: form.section_code.trim(), capacity: Number(form.capacity), schedule: form.schedule.trim() };
      await apiRequest(editingId ? `/accounts/api/sections/${editingId}/` : '/accounts/api/sections/', { method: editingId ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
      reset(); await load();
    } catch (e) { setError(e.message || 'Could not save section.'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    setSaving(true); setError('');
    try { await apiRequest(`/accounts/api/sections/${id}/`, { method: 'DELETE' }); await load(); }
    catch (e) { setError(e.message || 'Could not delete section.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen title="Sections" subtitle="Create sections under existing subjects.">
      <GlassCard>
        <SectionTitle>{editingId ? 'Update Section' : 'Create Section'}</SectionTitle>
        <AlertBox>{error}</AlertBox>
        <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8 }}>Subject</Text>
        <View style={{ gap: 8, marginBottom: 12 }}>
          {subjects.map((s) => (
            <SmallButton key={s.id} title={`${form.subject === String(s.id) ? '✓ ' : ''}${s.subject_code}`} onPress={() => setForm((f) => ({ ...f, subject: String(s.id) }))} />
          ))}
        </View>
        <AppInput label="Section Code" placeholder="A" value={form.section_code} onChangeText={(v) => setForm((f) => ({ ...f, section_code: v }))} editable={!saving} />
        <AppInput label="Capacity" keyboardType="numeric" value={String(form.capacity)} onChangeText={(v) => setForm((f) => ({ ...f, capacity: v }))} editable={!saving} />
        <AppInput label="Schedule" placeholder="MWF 9:00 AM" value={form.schedule} onChangeText={(v) => setForm((f) => ({ ...f, schedule: v }))} editable={!saving} />
        <AppButton title={editingId ? 'Update Section' : 'Create Section'} onPress={save} loading={saving} />
        {editingId ? <AppButton title="Cancel Edit" tone="ghost" onPress={reset} style={{ marginTop: 10 }} /> : null}
      </GlassCard>
      <GlassCard>
        <SectionTitle>Section List</SectionTitle>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {!loading && sections.length === 0 ? <Text style={{ color: colors.muted, textAlign: 'center' }}>No sections yet.</Text> : null}
        {sections.map((item) => {
          const subject = subjectMap[item.subject];
          return <DataRow key={item.id} title={`${subject?.subject_code || 'Subject'} - ${item.section_code}`} subtitle={`Capacity: ${item.capacity}`} meta={item.schedule} actions={<><SmallButton title="Edit" onPress={() => { setEditingId(item.id); setForm({ subject: String(item.subject), section_code: item.section_code, capacity: String(item.capacity), schedule: item.schedule || '' }); }} /><SmallButton title="Del" tone="danger" onPress={() => remove(item.id)} disabled={saving} /></>} />;
        })}
      </GlassCard>
    </Screen>
  );
}
