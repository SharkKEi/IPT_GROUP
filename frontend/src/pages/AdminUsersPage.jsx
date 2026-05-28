import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';


function OrbLayer({ orbs }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((o, i) => (
        <div key={i} className="orb" style={{ width: o.size, height: o.size, left: o.left, top: o.top, background: o.color, animationDelay: `${o.delay}s` }} />
      ))}
    </div>
  );
}

const CARD_ORBS = [
  { size: '200px', left: '-50px', top: '-50px', color: 'rgba(245,158,11,0.25)', delay: 0 },
  { size: '150px', left: '65%', top: '-10px', color: 'rgba(167,139,250,0.18)', delay: -1.6 },
];

const ROLE_COLORS = {
  admin: { badge: 'bg-amber-400/20 text-amber-400 border-amber-400/30', dot: 'bg-amber-400' },
  staff: { badge: 'bg-sky-400/20 text-sky-400 border-sky-400/30', dot: 'bg-sky-400' },
  user: { badge: 'bg-white/10 text-white/40 border-white/15', dot: 'bg-white/30' },
};
const ROLE_COLORS_DAY = {
  admin: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  staff: { badge: 'bg-sky-100 text-sky-700 border-sky-200', dot: 'bg-sky-400' },
  user: { badge: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-300' },
};

function Modal({ title, onClose, children, isDay }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl z-[10000] p-7 ${isDay ? 'bg-white border border-slate-100' : 'bg-[#0d1f3c] border border-white/10'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDay ? 'text-slate-800' : 'text-white'}`}>{title}</h2>
          <button onClick={onClose} className={`text-2xl leading-none ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
        </div>
        {children}
      </motion.div>
    </div>,
    document.getElementById('root')
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onClose, 3200); return () => clearTimeout(t); }, [msg]);
  if (!msg) return null;
  const c = type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800';
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`fixed top-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl ${c}`}>
      <span>{type === 'success' ? '✓' : '✗'} {msg}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-2 text-lg">×</button>
    </motion.div>
  );
}

export default function AdminUsersPage({ nightMode }) {
  const isDay = !nightMode;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // 'role' | 'delete'
  const [selected, setSelected] = useState(null);
  const [newRole, setNewRole] = useState('user');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchUsers = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/users/', { credentials: 'include' });
      const d = await res.json();
      setUsers(Array.isArray(d) ? d : d.results || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openRole = (u) => { setSelected(u); setNewRole(u.role || 'user'); setModal('role'); };
  const openDelete = (u) => { setSelected(u); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleRoleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/accounts/api/users/${selected.id}/role/`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error();
      await fetchUsers(); closeModal();
      setToast({ msg: `Role updated to ${newRole}.`, type: 'success' });
    } catch { setToast({ msg: 'Failed to update role.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/accounts/api/users/${selected.id}/`, {
        method: 'DELETE', credentials: 'include', headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      await fetchUsers(); closeModal();
      setToast({ msg: 'User deleted.', type: 'success' });
    } catch { setToast({ msg: 'Failed to delete user.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-white/30';
  const selectCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-400'
    : 'w-full rounded-xl border border-white/10 bg-[#0d1f3c] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400';
  const rowCls = isDay ? 'row-day' : 'row-night';

  const roleColors = isDay ? ROLE_COLORS_DAY : ROLE_COLORS;

  // Counts
  const adminCount = users.filter(u => u.role === 'admin').length;
  const staffCount = users.filter(u => u.role === 'staff').length;
  const userCount = users.filter(u => !u.role || u.role === 'user').length;

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />}</AnimatePresence>

      {/* Header */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <OrbLayer orbs={CARD_ORBS} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ zIndex: 1 }}>
          <div>
            <h2 className={`text-2xl font-extrabold ${textH}`}>Users</h2>
            <p className={`text-sm mt-0.5 ${textS}`}>{users.length} registered account{users.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search username or email…" className={`${inputCls} max-w-xs`} />
          </div>
        </div>

        {/* Role summary chips */}
        <div className="relative flex flex-wrap gap-3 mt-4" style={{ zIndex: 1 }}>
          {[
            { label: 'Admins', count: adminCount, ...roleColors.admin },
            { label: 'Staff', count: staffCount, ...roleColors.staff },
            { label: 'Users', count: userCount, ...roleColors.user },
          ].map(r => (
            <div key={r.label} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${r.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${r.dot}`} />
              {r.count} {r.label}
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={`${glassCard} overflow-hidden`}>
        {loading ? (
          <div className={`py-20 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>Loading users…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-20 text-center ${textS}`}>
            <div className="text-5xl mb-3">🛡️</div>
            <p className="text-sm font-medium">{search ? 'No users match your search.' : 'No users found.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDay ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/3'}`}>
                  {['#', 'User', 'Email', 'Role', 'Verified', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest ${textS}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const rc = roleColors[u.role || 'user'] || roleColors.user;
                  return (
                    <tr key={u.id} className={`${rowCls} border-b last:border-0 transition-all duration-150 hover:scale-[1.003]`}
                      style={{ borderColor: isDay ? 'rgba(254,215,170,0.4)' : 'rgba(255,255,255,0.06)' }}>
                      <td className={`px-5 py-4 font-mono text-xs ${textS}`}>{i + 1}</td>
                      <td className={`px-5 py-4`}>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full overflow-hidden shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sm font-bold text-slate-900">
                            {u.profile_picture
                              ? <img src={u.profile_picture} alt="" className="h-full w-full object-cover" />
                              : u.username?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className={`font-semibold leading-tight ${textH}`}>{u.username}</p>
                            {(u.first_name || u.last_name) && (
                              <p className={`text-xs ${textS}`}>{[u.first_name, u.last_name].filter(Boolean).join(' ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`px-5 py-4 text-xs ${textS}`}>{u.email || '—'}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${rc.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.is_email_verified
                          ? <span className="text-emerald-500 text-xs font-semibold">✓ Verified</span>
                          : <span className={`text-xs ${textS}`}>Pending</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openRole(u)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}>
                            Role
                          </button>
                          <button onClick={() => openDelete(u)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role modal */}
      <AnimatePresence>
        {modal === 'role' && (
          <Modal title="Change Role" onClose={closeModal} isDay={isDay}>
            <p className={`text-sm mb-4 ${textS}`}>
              Updating role for <span className={`font-bold ${textH}`}>@{selected?.username}</span>
            </p>
            <div className="space-y-2 mb-6">
              {['admin', 'staff', 'user'].map(r => {
                const rc = (isDay ? ROLE_COLORS_DAY : ROLE_COLORS)[r];
                return (
                  <label key={r} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${newRole === r
                    ? (isDay ? 'border-amber-300 bg-amber-50' : 'border-amber-500/40 bg-amber-500/10')
                    : (isDay ? 'border-slate-200 hover:bg-slate-50' : 'border-white/10 hover:bg-white/5')}`}>
                    <input type="radio" name="role" value={r} checked={newRole === r} onChange={() => setNewRole(r)} className="hidden" />
                    <span className={`w-2 h-2 rounded-full ${rc.dot}`} />
                    <span className={`text-sm font-semibold capitalize ${textH}`}>{r}</span>
                    {r === 'admin' && <span className={`ml-auto text-[10px] ${textS}`}>Full access</span>}
                    {r === 'staff' && <span className={`ml-auto text-[10px] ${textS}`}>Manage content</span>}
                    {r === 'user' && <span className={`ml-auto text-[10px] ${textS}`}>View only</span>}
                  </label>
                );
              })}
            </div>
            <div className="flex gap-3">
              <button onClick={closeModal} disabled={saving} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>Cancel</button>
              <button onClick={handleRoleSave} disabled={saving} className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                {saving ? 'Saving…' : 'Save Role'}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete modal */}
      <AnimatePresence>
        {modal === 'delete' && (
          <Modal title="Delete User" onClose={closeModal} isDay={isDay}>
            <p className={`text-sm mb-6 ${textS}`}>
              Permanently delete <span className={`font-bold ${textH}`}>@{selected?.username}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} disabled={saving} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>Cancel</button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">{saving ? 'Deleting…' : 'Yes, Delete'}</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : '';
}