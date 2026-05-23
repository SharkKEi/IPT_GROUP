<<<<<<< HEAD
<<<<<<< HEAD
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiRequest, canManage } from '../api';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ students: 0, subjects: 0, enrollments: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [students, subjects, enrollments] = await Promise.all([
          apiRequest('/accounts/api/students/'),
          apiRequest('/accounts/api/subjects/'),
          apiRequest('/accounts/api/enrollments/'),
        ]);
        setStats({
          students: students.length,
          subjects: subjects.length,
          enrollments: enrollments.length,
        });
      } catch {
        /* ignore */
      }
    })();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Hello, {user?.username}</Text>
      <Text style={styles.role}>Role: {user?.role || 'user'}</Text>
      <View style={styles.grid}>
        <Stat label="Students" value={stats.students} />
        <Stat label="Subjects" value={stats.subjects} />
        <Stat label="Enrollments" value={stats.enrollments} />
      </View>
      <Pressable style={styles.card} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.cardText}>Profile & photo upload</Text>
      </Pressable>
      {canManage(user?.role) && (
        <Pressable style={styles.card} onPress={() => navigation.navigate('Students')}>
          <Text style={styles.cardText}>Manage students (CRUD)</Text>
        </Pressable>
      )}
      <Pressable style={styles.card} onPress={() => navigation.navigate('Chatbot')}>
        <Text style={styles.cardText}>Chatbot assistant</Text>
      </Pressable>
      <Pressable style={[styles.card, styles.logout]} onPress={logout}>
        <Text style={styles.cardText}>Log out</Text>
      </Pressable>
    </ScrollView>
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
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
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
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
<<<<<<< HEAD
<<<<<<< HEAD
  container: { padding: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#fff' },
  role: { color: '#a5b4fc', marginBottom: 20, textTransform: 'capitalize' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  stat: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '700', color: '#fff' },
  statLabel: { color: '#aaa', fontSize: 12, marginTop: 4 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
  },
  cardText: { color: '#fff', fontWeight: '600' },
  logout: { marginTop: 24, backgroundColor: 'rgba(239,68,68,0.25)' },
=======
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
  profileRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  name: { color: colors.text, fontWeight: '900', fontSize: 19 },
  email: { color: colors.muted, marginTop: 3 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '48%', backgroundColor: colors.panelSoft, borderRadius: 18, padding: 15, alignItems: 'center' },
  statValue: { color: colors.text, fontSize: 28, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, marginTop: 4 },
  gap: { height: 10 },
<<<<<<< HEAD
>>>>>>> 56b74d6 (Updated project code)
=======
>>>>>>> a00cc98 (Fix project errors and mobile app issues)
});
