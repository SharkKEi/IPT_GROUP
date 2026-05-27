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
  { size: '200px', left: '-50px', top: '-50px', color: 'rgba(52,211,153,0.22)', delay: 0 },
  { size: '160px', left: '65%', top: '-10px', color: 'rgba(56,189,248,0.18)', delay: -2 },
];

function CapacityBar({ enrolled, capacity, isDay }) {
  const pct = capacity > 0 ? Math.min((enrolled / capacity) * 100, 100) : 0;
  const color = pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs tabular-nums ${isDay ? 'text-slate-500' : 'text-white/50'}`}>{enrolled}/{capacity}</span>
    </div>
  );
}

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

export default function SectionsPage({ nightMode }) {
  const isDay = !nightMode;
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterCapacity, setFilterCapacity] = useState('all'); // 'all' | 'available' | 'full'
  const [sortBy, setSortBy] = useState('subject'); // 'subject' | 'code' | 'capacity' | 'availability'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ subject: '', section_code: '', capacity: 30, schedule: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const subjectById = useMemo(() => {
    const map = new Map();
    for (const s of subjects) map.set(String(s.id), s);
    return map;
  }, [subjects]);

  const enrollmentCountBySection = useMemo(() => {
    const map = new Map();
    for (const e of enrollments) {
      map.set(String(e.section), (map.get(String(e.section)) || 0) + 1);
    }
    return map;
  }, [enrollments]);

  const enrichedSections = useMemo(() => sections.map(sec => ({
    ...sec,
    enrolled: enrollmentCountBySection.get(String(sec.id)) || 0,
    isFull: (enrollmentCountBySection.get(String(sec.id)) || 0) >= sec.capacity,
  })), [sections, enrollmentCountBySection]);

  const fetchAll = async () => {
    try {
      const [subR, secR, eR] = await Promise.all([
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/sections/', { credentials: 'include' }),
        fetch('/accounts/api/enrollments/', { credentials: 'include' }),
      ]);
      const arr = async r => { const d = await r.json(); return Array.isArray(d) ? d : d.results || []; };
      const [sub, sec, e] = await Promise.all([arr(subR), arr(secR), arr(eR)]);
      setSubjects(sub); setSections(sec); setEnrollments(e);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setForm({ subject: subjects[0]?.id ? String(subjects[0].id) : '', section_code: '', capacity: 30, schedule: '' });
    setSelected(null); setModal('add');
  };
  const openEdit = (s) => {
    setForm({ subject: String(s.subject), section_code: s.section_code, capacity: s.capacity, schedule: s.schedule || '' });
    setSelected(s); setModal('edit');
  };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.subject || !form.section_code.trim()) return;
    setSaving(true);
    try {
      const url = modal === 'edit' ? `/accounts/api/sections/${selected.id}/` : '/accounts/api/sections/';
      const res = await fetch(url, {
        method: modal === 'edit' ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify({ ...form, subject: Number(form.subject), capacity: Number(form.capacity) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setToast({ msg: err.detail || err.non_field_errors?.[0] || JSON.stringify(err), type: 'error' });
        return;
      }
      await fetchAll(); closeModal();
      setToast({ msg: modal === 'edit' ? 'Section updated.' : 'Section created.', type: 'success' });
    } catch { setToast({ msg: 'Network error.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/accounts/api/sections/${selected.id}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      await fetchAll(); closeModal();
      setToast({ msg: 'Section removed.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const filtered = useMemo(() => {
    let list = [...enrichedSections];
    const q = search.toLowerCase();
    if (q) list = list.filter(s =>
      s.section_code.toLowerCase().includes(q) ||
      subjectById.get(String(s.subject))?.subject_code?.toLowerCase().includes(q) ||
      subjectById.get(String(s.subject))?.title?.toLowerCase().includes(q) ||
      (s.schedule || '').toLowerCase().includes(q)
    );
    if (filterSubject !== 'all') list = list.filter(s => String(s.subject) === filterSubject);
    if (filterCapacity === 'available') list = list.filter(s => !s.isFull);
    if (filterCapacity === 'full') list = list.filter(s => s.isFull);
    if (sortBy === 'code') list.sort((a, b) => a.section_code.localeCompare(b.section_code));
    else if (sortBy === 'capacity') list.sort((a, b) => b.capacity - a.capacity);
    else if (sortBy === 'availability') list.sort((a, b) => (b.capacity - b.enrolled) - (a.capacity - a.enrolled));
    else list.sort((a, b) => {
      const sa = subjectById.get(String(a.subject))?.subject_code || '';
      const sb = subjectById.get(String(b.subject))?.subject_code || '';
      return sa.localeCompare(sb) || a.section_code.localeCompare(b.section_code);
    });
    return list;
  }, [enrichedSections, search, filterSubject, filterCapacity, sortBy, subjectById]);

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-white/30';
  const selectCls = isDay
    ? 'rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-emerald-400'
    : 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400 [&>option]:bg-[#0d1f3c]';
  const modalInputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-white/30 [&>option]:bg-[#0d1f3c]';
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold transition';
  const pillActive = isDay ? 'bg-emerald-500 text-white' : 'bg-emerald-500/30 text-emerald-300 ring-1 ring-emerald-400/50';
  const pillInactive = isDay ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/10 text-white/50 hover:bg-white/20';
  const rowCls = isDay ? 'row-day' : 'row-night';

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />}</AnimatePresence>

      {/* Header card */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <OrbLayer orbs={CARD_ORBS} />
        <div className="relative flex flex-col gap-4" style={{ zIndex: 1 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-extrabold ${textH}`}>Sections</h2>
              <p className={`text-sm mt-0.5 ${textS}`}>{sections.length} section{sections.length !== 1 ? 's' : ''} total</p>
            </div>
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search section, subject, schedule…" className={`${inputCls} max-w-xs`} />
              <button onClick={openAdd}
                className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition shadow-md">
                + Add Section
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-widest ${textS}`}>Subject:</span>
            <button onClick={() => setFilterSubject('all')} className={`${pillBase} ${filterSubject === 'all' ? pillActive : pillInactive}`}>All</button>
            {subjects.map(s => (
              <button key={s.id} onClick={() => setFilterSubject(String(s.id))}
                className={`${pillBase} ${filterSubject === String(s.id) ? pillActive : pillInactive}`}>
                {s.subject_code}
              </button>
            ))}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Capacity:</span>
            {[['all', 'All'], ['available', 'Has Space'], ['full', 'Full']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterCapacity(val)}
                className={`${pillBase} ${filterCapacity === val ? pillActive : pillInactive}`}>
                {label}
              </button>
            ))}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
              <option value="subject">By Subject</option>
              <option value="code">Section Code</option>
              <option value="capacity">Most Capacity</option>
              <option value="availability">Most Available</option>
            </select>
            {(search || filterSubject !== 'all' || filterCapacity !== 'all') && (
              <span className={`text-xs ${textS}`}>Showing {filtered.length} of {sections.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={`${glassCard} overflow-hidden`}>
        {loading ? (
          <div className={`py-20 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            Loading sections…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-20 text-center ${textS}`}>
            <div className="text-5xl mb-3">🗂️</div>
            <p className="text-sm font-medium">{search ? 'No sections match your search.' : 'No sections yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDay ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/3'}`}>
                  {['#', 'Subject', 'Section', 'Schedule', 'Capacity', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest ${textS}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sec, i) => {
                  const subj = subjectById.get(String(sec.subject));
                  return (
                    <tr key={sec.id} className={`${rowCls} border-b last:border-0 transition-all duration-150 hover:scale-[1.003]`}
                      style={{ borderColor: isDay ? 'rgba(167,243,208,0.4)' : 'rgba(255,255,255,0.06)' }}>
                      <td className={`px-5 py-4 font-mono text-xs ${textS}`}>{i + 1}</td>
                      <td className="px-5 py-4">
                        <span className={`font-bold font-mono text-sm ${isDay ? 'text-amber-600' : 'text-amber-400'}`}>{subj?.subject_code || `#${sec.subject}`}</span>
                        <div className={`text-xs mt-0.5 ${textS}`}>{subj?.title}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${isDay ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white/80'}`}>
                          {sec.section_code}
                        </span>
                      </td>
                      <td className={`px-5 py-4 text-xs ${textS}`}>{sec.schedule || '—'}</td>
                      <td className="px-5 py-4 min-w-[140px]">
                        <CapacityBar enrolled={sec.enrolled} capacity={sec.capacity} isDay={isDay} />
                        {sec.isFull && (
                          <span className="mt-1 inline-flex text-[10px] font-bold text-red-400">FULL</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(sec)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}>
                            Edit
                          </button>
                          <button onClick={() => openDelete(sec)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
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

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {(modal === 'add' || modal === 'edit') && (
          <Modal title={modal === 'add' ? 'Add Section' : 'Edit Section'} onClose={closeModal} isDay={isDay}>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Subject</label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className={`${modalInputCls}`} disabled={saving}>
                  <option value="">Select subject…</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} — {s.title}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Section Code</label>
                <input value={form.section_code} onChange={e => setForm({ ...form, section_code: e.target.value })}
                  placeholder="e.g. A, B, BSCS-1A" className={modalInputCls} disabled={saving} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Capacity</label>
                <input type="number" min="1" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })}
                  className={modalInputCls} disabled={saving} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>
                  Schedule <span className={`font-normal normal-case ${textS}`}>(optional)</span>
                </label>
                <input value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}
                  placeholder="e.g. MWF 8:00–9:30 AM" className={modalInputCls} disabled={saving} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} disabled={saving}
                  className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving || !form.subject || !form.section_code.trim()}
                  className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Section' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {modal === 'delete' && (
          <Modal title="Delete Section" onClose={closeModal} isDay={isDay}>
            <p className={`text-sm mb-6 ${textS}`}>
              Remove section <span className={`font-bold ${textH}`}>{selected?.section_code}</span>? Students enrolled in this section will be affected.
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