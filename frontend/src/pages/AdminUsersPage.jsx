import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client';

const ROLES = [
  { value: 'admin', label: 'Administrator' },
  { value: 'staff', label: 'Staff' },
  { value: 'user', label: 'User' },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/accounts/api/users/');
      setUsers(data);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateRole = async (id, role) => {
    try {
      const updated = await apiFetch(`/accounts/api/users/${id}/role/`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers((list) => list.map((u) => (u.id === id ? updated : u)));
    } catch (e) {
      setError(e.message || 'Failed to update role');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">User management</h1>
      <p className="mt-2 text-white/60 text-sm">Assign roles: Admin, Staff, or User (RBAC).</p>
      {error && <p className="mt-4 text-red-300 text-sm">{error}</p>}
      {loading ? (
        <p className="mt-8 text-white/50">Loading…</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm text-white/80">
            <thead className="bg-white/5 text-white/50">
              <tr>
                <th className="px-4 py-3">Username</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/10">
                  <td className="px-4 py-3 font-medium text-white">{u.username}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.is_email_verified ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="rounded-lg bg-white/10 px-2 py-1 text-white"
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value} className="text-black">
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
