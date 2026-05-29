import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { apiRequest } from '../api';
import { AlertBox, Badge, DataRow, GlassCard, Screen, SectionTitle, SmallButton } from '../ui';
import { colors } from '../theme';

const roles = ['admin', 'staff', 'user'];

export default function UsersScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await apiRequest('/accounts/api/users/');
      setUsers(Array.isArray(res) ? res : res.results || []);
    } catch (e) { setError(e.message || 'Could not load users.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id, role) => {
    setSavingId(id); setError(''); setMessage('');
    try {
      await apiRequest(`/accounts/api/users/${id}/role/`, { method: 'PATCH', body: JSON.stringify({ role }) });
      setMessage('Role updated.');
      await load();
    } catch (e) { setError(e.message || 'Could not update role.'); }
    finally { setSavingId(null); }
  };

  return (
    <Screen title="User Roles" subtitle="Admin-only role management.">
      <GlassCard>
        <AlertBox>{error}</AlertBox>
        <AlertBox type="success">{message}</AlertBox>
        <SectionTitle>Users</SectionTitle>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        {!loading && users.length === 0 ? <Text style={{ color: colors.muted, textAlign: 'center' }}>No users found.</Text> : null}
        {users.map((u) => (
          <View key={u.id}>
            <DataRow title={u.username} subtitle={u.email || 'No email'} meta={u.is_email_verified ? 'Email verified' : 'Not verified'} actions={<Badge tone={u.role === 'admin' ? 'success' : 'default'}>{u.role}</Badge>} />
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              {roles.map((role) => <SmallButton key={role} title={role} disabled={savingId === u.id || u.role === role} onPress={() => changeRole(u.id, role)} />)}
            </View>
          </View>
        ))}
      </GlassCard>
    </Screen>
  );
}
