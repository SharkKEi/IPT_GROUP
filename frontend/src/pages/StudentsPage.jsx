import { useEffect, useState, useMemo } from 'react';
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
  { size: '220px', left: '-60px', top: '-60px', color: 'rgba(56,189,248,0.25)', delay: 0 },
  { size: '160px', left: '60%', top: '-20px', color: 'rgba(99,102,241,0.20)', delay: -1.8 },
];

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
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className={`fixed top-6 right-6 z-[60] flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl ${c}`}>
      <span>{type === 'success' ? '✓' : '✗'} {msg}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-2 text-lg">×</button>
    </motion.div>
  );
}

export default function StudentsPage({ nightMode }) {
  const isDay = !nightMode;
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterEnrolled, setFilterEnrolled] = useState('all'); // 'all' | 'enrolled' | 'not-enrolled'
  const [sortBy, setSortBy] = useState('number'); // 'number' | 'name' | 'enrollments'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ student_number: '', full_name: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetchStudents = async () => {
    try {
      const res = await fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/students/', { credentials: 'include' });
      const d = await res.json();
      setStudents(Array.isArray(d) ? d : d.results || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStudents(); }, []);

  const openAdd = () => { setForm({ student_number: '', full_name: '' }); setSelected(null); setModal('add'); };
  const openEdit = (s) => { setForm({ student_number: s.student_number, full_name: s.full_name }); setSelected(s); setModal('edit'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.student_number.trim() || !form.full_name.trim()) return;
    setSaving(true);
    try {
      const url = modal === 'edit' ? `/accounts/api/students/${selected.id}/` : '/accounts/api/students/';
      const method = modal === 'edit' ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      await fetchStudents();
      closeModal();
      setToast({ msg: modal === 'edit' ? 'Student updated.' : 'Student added.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/accounts/api/students/${selected.id}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      await fetchStudents();
      closeModal();
      setToast({ msg: 'Student removed.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    let list = [...students];
    const q = search.toLowerCase();
    if (q) list = list.filter(s =>
      s.full_name.toLowerCase().includes(q) || s.student_number.toLowerCase().includes(q)
    );
    if (filterEnrolled === 'enrolled') list = list.filter(s => (s.enrollment_count ?? 0) > 0);
    if (filterEnrolled === 'not-enrolled') list = list.filter(s => (s.enrollment_count ?? 0) === 0);
    if (sortBy === 'name') list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    else if (sortBy === 'enrollments') list.sort((a, b) => (b.enrollment_count ?? 0) - (a.enrollment_count ?? 0));
    else list.sort((a, b) => a.student_number.localeCompare(b.student_number));
    return list;
  }, [students, search, filterEnrolled, sortBy]);

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-white/30';
  const selectCls = isDay
    ? 'rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-sky-400'
    : 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400 [&>option]:bg-[#0d1f3c]';
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold transition';
  const pillActive = isDay ? 'bg-sky-500 text-white' : 'bg-sky-500/30 text-sky-300 ring-1 ring-sky-400/50';
  const pillInactive = isDay ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/10 text-white/50 hover:bg-white/20';
  const rowCls = isDay ? 'row-day' : 'row-night';

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />}
      </AnimatePresence>

      {/* Header card */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <OrbLayer orbs={CARD_ORBS} />
        <div className="relative flex flex-col gap-4" style={{ zIndex: 1 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-extrabold ${textH}`}>Students</h2>
              <p className={`text-sm mt-0.5 ${textS}`}>{students.length} student{students.length !== 1 ? 's' : ''} registered</p>
            </div>
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or number…" className={`${inputCls} max-w-xs`} />
              <button onClick={openAdd}
                className="shrink-0 rounded-xl bg-sky-500 hover:bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition shadow-md">
                + Add Student
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-widest ${textS}`}>Filter:</span>
            {[['all', 'All'], ['enrolled', 'Enrolled'], ['not-enrolled', 'Not Enrolled']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterEnrolled(val)}
                className={`${pillBase} ${filterEnrolled === val ? pillActive : pillInactive}`}>
                {label}
              </button>
            ))}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
              <option value="number">Student Number</option>
              <option value="name">Name A–Z</option>
              <option value="enrollments">Most Enrolled</option>
            </select>
            {(search || filterEnrolled !== 'all') && (
              <span className={`text-xs ${textS}`}>
                Showing {filtered.length} of {students.length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={`${glassCard} overflow-hidden`}>
        {loading ? (
          <div className={`py-20 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-20 text-center ${textS}`}>
            <div className="text-5xl mb-3">🎓</div>
            <p className="text-sm font-medium">{search ? 'No students match your search.' : 'No students yet. Add one to get started.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDay ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/3'}`}>
                  {['#', 'Student Number', 'Full Name', 'Enrolled Sections', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest ${textS}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`${rowCls} border-b last:border-0 transition-all duration-150 hover:scale-[1.003] group`}
                    style={{ borderColor: isDay ? 'rgba(186,230,253,0.5)' : 'rgba(255,255,255,0.06)' }}>
                    <td className={`px-5 py-4 font-mono text-xs ${textS}`}>{i + 1}</td>
                    <td className={`px-5 py-4 font-semibold font-mono ${isDay ? 'text-sky-600' : 'text-sky-400'}`}>{s.student_number}</td>
                    <td className={`px-5 py-4 font-semibold ${textH}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0d2a50,#1a4a8e)' }}>
                          {s.full_name[0]?.toUpperCase()}
                        </div>
                        {s.full_name}
                      </div>
                    </td>
                    <td className={`px-5 py-4 ${textS}`}>
                      {(s.enrollment_count ?? 0) > 0
                        ? <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${isDay ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/15 text-sky-300'}`}>{s.enrollment_count}</span>
                        : <span className={`text-xs ${textS}`}>—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-sky-200 text-sky-600 hover:bg-sky-50' : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'}`}>
                          Edit
                        </button>
                        <button onClick={() => openDelete(s)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <Modal title={modal === 'add' ? 'Add Student' : 'Edit Student'} onClose={closeModal} isDay={isDay}>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Student Number</label>
                <input value={form.student_number} onChange={e => setForm({ ...form, student_number: e.target.value })}
                  placeholder="e.g. 2024-00001" className={inputCls} disabled={saving} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Full Name</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Juan Dela Cruz" className={inputCls} disabled={saving} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} disabled={saving}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.student_number.trim() || !form.full_name.trim()}
                  className="flex-1 rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Student' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {modal === 'delete' && (
          <Modal title="Delete Student" onClose={closeModal} isDay={isDay}>
            <p className={`text-sm mb-6 ${textS}`}>
              Are you sure you want to remove <span className={`font-bold ${textH}`}>{selected?.full_name}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={closeModal} disabled={saving}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                Cancel
              </button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                {saving ? 'Deleting…' : 'Yes, Delete'}
              </button>
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