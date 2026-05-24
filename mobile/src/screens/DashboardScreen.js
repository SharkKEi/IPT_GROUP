import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { apiRequest, canManage, isAdmin } from '../api';
import { useAuth } from '../context/AuthContext';
import { AlertBox, AppButton, Badge, GlassCard, Screen, SectionTitle } from '../ui';
import { colors } from '../theme';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ students: 0, subjects: 0, sections: 0, enrollments: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [students, subjects, sections, enrollments] = await Promise.all([
        apiRequest('/accounts/api/students/'),
        apiRequest('/accounts/api/subjects/'),
        apiRequest('/accounts/api/sections/'),
        apiRequest('/accounts/api/enrollments/'),
      ]);
      setStats({
        students: students.length || 0,
        subjects: subjects.length || 0,
        sections: sections.length || 0,
        enrollments: enrollments.length || 0,
      });
    } catch (e) {
      setError(e.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen
      title={`Hello, ${user?.username || 'User'}`}
      subtitle="Shared web and mobile data through Django REST API"
      footer={null}
    >
      <GlassCard>
        <View style={styles.profileRow}>
          <View>
            <Text style={styles.name}>{user?.first_name || user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <Badge tone={user?.is_email_verified ? 'success' : 'danger'}>{user?.role || 'user'}</Badge>
        </View>
        <AlertBox>{error}</AlertBox>
        <View style={styles.grid}>
          <Stat label="Students" value={stats.students} />
          <Stat label="Subjects" value={stats.subjects} />
          <Stat label="Sections" value={stats.sections} />
          <Stat label="Enrollments" value={stats.enrollments} />
        </View>
      </GlassCard>

      <SectionTitle>Navigation</SectionTitle>
      <GlassCard>
        <AppButton title="Profile & Photo" tone="ghost" onPress={() => navigation.navigate('Profile')} />
        <View style={styles.gap} />
        <AppButton title="Enrollment Summary" tone="ghost" onPress={() => navigation.navigate('Summary')} />
        <View style={styles.gap} />
        <AppButton title="Chatbot Assistant" tone="ghost" onPress={() => navigation.navigate('Chatbot')} />
      </GlassCard>

      {canManage(user?.role) && (
        <>
          <SectionTitle>Management</SectionTitle>
          <GlassCard>
            <AppButton title="Students" tone="ghost" onPress={() => navigation.navigate('Students')} />
            <View style={styles.gap} />
            <AppButton title="Subjects" tone="ghost" onPress={() => navigation.navigate('Subjects')} />
            <View style={styles.gap} />
            <AppButton title="Sections" tone="ghost" onPress={() => navigation.navigate('Sections')} />
            <View style={styles.gap} />
            <AppButton title="Enrollments" tone="ghost" onPress={() => navigation.navigate('Enrollments')} />
            {isAdmin(user?.role) && (
              <>
                <View style={styles.gap} />
                <AppButton title="User Roles" tone="ghost" onPress={() => navigation.navigate('Users')} />
              </>
            )}
          </GlassCard>
        </>
      )}

      <AppButton title="Refresh Dashboard" tone="ghost" onPress={load} loading={loading} />
      <AppButton title="Log out" tone="danger" onPress={logout} style={{ marginTop: 10 }} />
    </Screen>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  name: { color: colors.text, fontWeight: '900', fontSize: 19 },
  email: { color: colors.muted, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', backgroundColor: colors.panelSoft, borderRadius: 18, padding: 15, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  gap: { height: 10 },
});
