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
});
