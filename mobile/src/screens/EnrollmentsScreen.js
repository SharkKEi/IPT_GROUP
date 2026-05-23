import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';

export default function EnrollmentsScreen() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const studentMap = useMemo(() => Object.fromEntries(students.map((s) => [s.id, s])), [students]);
  const subjectMap = useMemo(() => Object.fromEntries(subjects.map((s) => [s.id, s])), [subjects]);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [stu, sub, enr] = await Promise.all([
        apiRequest('/accounts/api/students/'),
        apiRequest('/accounts/api/subjects/'),
        apiRequest('/accounts/api/enrollments/'),
      ]);
      setStudents(stu); setSubjects(sub); setEnrollments(enr);
      if (!selectedStudent && stu[0]) setSelectedStudent(String(stu[0].id));
      if (!selectedSubject && sub[0]) setSelectedSubject(String(sub[0].id));
    } catch (e) { setError(e.message || 'Could not load enrollment data.'); }
    finally { setLoading(false); }
  }, [selectedStudent, selectedSubject]);

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const enroll = async () => {
    if (!selectedStudent || !selectedSubject) { setError('Select a student and subject first.'); return; }
    setSaving(true); setError(''); setMessage('');
    try {
      await apiRequest('/accounts/api/enrollments/', { method: 'POST', body: JSON.stringify({ student: Number(selectedStudent), subject: Number(selectedSubject) }) });
      setMessage('Student enrolled successfully.');
      await load();
    } catch (e) { setError(e.message || 'Could not enroll student.'); }
    finally { setSaving(false); }
  };

  const drop = async (id) => {
    setSaving(true); setError(''); setMessage('');
    try {
      const data = await apiRequest(`/accounts/api/enrollments/${id}/`, { method: 'DELETE' });
      setMessage(data.detail || 'Enrollment dropped.');
      await load();
    } catch (e) { setError(e.message || 'Could not drop enrollment.'); }
    finally { setSaving(false); }
  };

  return (
    <Screen title="Enrollments" subtitle="Mobile enrollment uses the same Django API.">
      <GlassCard>
        <SectionTitle>Enroll Student</SectionTitle>
        <AlertBox>{error}</AlertBox>
        <AlertBox type="success">{message}</AlertBox>
        <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8 }}>Student</Text>
        <View style={{ gap: 8, marginBottom: 14 }}>
          {students.map((s) => <SmallButton key={s.id} title={`${selectedStudent === String(s.id) ? '✓ ' : ''}${s.full_name}`} onPress={() => setSelectedStudent(String(s.id))} />)}
        </View>
        <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8 }}>Subject</Text>
        <View style={{ gap: 8, marginBottom: 14 }}>
          {subjects.map((s) => <SmallButton key={s.id} title={`${selectedSubject === String(s.id) ? '✓ ' : ''}${s.subject_code} - ${s.title}`} onPress={() => setSelectedSubject(String(s.id))} />)}
        </View>
        <AppButton title="Enroll" onPress={enroll} loading={saving} disabled={!students.length || !subjects.length} />
      </GlassCard>

      <GlassCard>
        <SectionTitle>Enrollment List</SectionTitle>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {!loading && enrollments.length === 0 ? <Text style={{ color: colors.muted, textAlign: 'center' }}>No enrollments yet.</Text> : null}
        {enrollments.map((item) => {
          const stu = studentMap[item.student];
          const sub = subjectMap[item.subject];
          return <DataRow key={item.id} title={stu?.full_name || `Student #${item.student}`} subtitle={sub ? `${sub.subject_code} - ${sub.title}` : `Subject #${item.subject}`} meta={item.section ? `Section ID: ${item.section}` : 'Auto-section'} actions={<SmallButton title="Drop" tone="danger" onPress={() => drop(item.id)} disabled={saving} />} />;
        })}
      </GlassCard>
    </Screen>
  );
}
