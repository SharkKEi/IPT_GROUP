import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, AppButton, DataRow, GlassCard, Screen, SectionTitle } from '../ui';
import { colors } from '../theme';

export default function SummaryScreen() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setSummary(await apiRequest('/accounts/api/enrollment-summary/')); }
    catch (e) { setError(e.message || 'Could not load summary.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Summary" subtitle="Enrollment totals shared with web dashboard.">
      <GlassCard>
        <AlertBox>{error}</AlertBox>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        <View style={styles.grid}>
          <Stat label="Enrollments" value={summary?.total_enrollments || 0} />
          <Stat label="Total Units" value={summary?.total_enrolled_units || 0} />
        </View>
        <AppButton title="Refresh" tone="ghost" onPress={load} loading={loading} style={{ marginTop: 14 }} />
      </GlassCard>
      <GlassCard>
        <SectionTitle>Per Student</SectionTitle>
        {(summary?.per_student || []).map((s) => <DataRow key={s.student_id} title={s.full_name} subtitle={`${s.subjects_enrolled} subjects`} meta={`${s.units_total} units`} />)}
        {!loading && !(summary?.per_student || []).length ? <Text style={styles.empty}>No student summary yet.</Text> : null}
      </GlassCard>
      <GlassCard>
        <SectionTitle>Per Subject</SectionTitle>
        {(summary?.per_subject || []).map((s) => <DataRow key={s.subject_code} title={`${s.subject_code} - ${s.title}`} subtitle={`${s.students_enrolled} students`} meta={`${s.units_total} units`} />)}
        {!loading && !(summary?.per_subject || []).length ? <Text style={styles.empty}>No subject summary yet.</Text> : null}
      </GlassCard>
    </Screen>
  );
}

function Stat({ label, value }) {
  return <View style={styles.stat}><Text style={styles.value}>{value}</Text><Text style={styles.label}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.panelSoft, borderRadius: 18, padding: 16, alignItems: 'center' },
  value: { color: colors.text, fontSize: 28, fontWeight: '900' },
  label: { color: colors.muted, marginTop: 3 },
  empty: { color: colors.muted, textAlign: 'center', paddingVertical: 12 },
});
