import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

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
  { size: '200px', left: '-50px', top: '-50px', color: 'rgba(251,146,60,0.25)', delay: 0 },
  { size: '150px', left: '65%', top: '-10px', color: 'rgba(250,204,21,0.20)', delay: -2 },
];

function Modal({ title, onClose, children, isDay }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`relative w-full max-w-md rounded-2xl shadow-2xl z-10 p-7 ${isDay ? 'bg-white border border-slate-100' : 'bg-[#0d1f3c] border border-white/10'}`}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-bold ${isDay ? 'text-slate-800' : 'text-white'}`}>{title}</h2>
          <button onClick={onClose} className={`text-2xl leading-none ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
        </div>
        {children}
      </motion.div>
    </div>
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

export default function SubjectsPage({ nightMode }) {
  const isDay = !nightMode;
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterUnits, setFilterUnits] = useState('all'); // 'all' | '1' | '2' | '3' | ...
  const [filterSections, setFilterSections] = useState('all'); // 'all' | 'has-sections' | 'no-sections'
  const [sortBy, setSortBy] = useState('code'); // 'code' | 'title' | 'units' | 'sections'
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ subject_code: '', title: '', units: 3 });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: '' });

  const fetch_ = async () => {
    try {
      const res = await fetch('/accounts/api/subjects/', { credentials: 'include' });
      const d = await res.json();
      setSubjects(Array.isArray(d) ? d : d.results || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetch_(); }, []);

  const openAdd = () => { setForm({ subject_code: '', title: '', units: 3 }); setSelected(null); setModal('add'); };
  const openEdit = (s) => { setForm({ subject_code: s.subject_code, title: s.title, units: s.units }); setSelected(s); setModal('edit'); };
  const openDelete = (s) => { setSelected(s); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleSave = async () => {
    if (!form.subject_code.trim() || !form.title.trim()) return;
    setSaving(true);
    try {
      const url = modal === 'edit' ? `/accounts/api/subjects/${selected.id}/` : '/accounts/api/subjects/';
      const res = await fetch(url, {
        method: modal === 'edit' ? 'PUT' : 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        body: JSON.stringify({ ...form, units: Number(form.units) }),
      });
      if (!res.ok) throw new Error();
      await fetch_(); closeModal();
      setToast({ msg: modal === 'edit' ? 'Subject updated.' : 'Subject added.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await fetch(`/accounts/api/subjects/${selected.id}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      await fetch_(); closeModal();
      setToast({ msg: 'Subject removed.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  // Unique unit values for filter pills
  const unitOptions = useMemo(() => [...new Set(subjects.map(s => s.units))].sort((a, b) => a - b), [subjects]);

  const filtered = useMemo(() => {
    let list = [...subjects];
    const q = search.toLowerCase();
    if (q) list = list.filter(s =>
      s.subject_code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
    if (filterUnits !== 'all') list = list.filter(s => String(s.units) === filterUnits);
    if (filterSections === 'has-sections') list = list.filter(s => (s.section_count ?? 0) > 0);
    if (filterSections === 'no-sections') list = list.filter(s => (s.section_count ?? 0) === 0);
    if (sortBy === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'units') list.sort((a, b) => b.units - a.units);
    else if (sortBy === 'sections') list.sort((a, b) => (b.section_count ?? 0) - (a.section_count ?? 0));
    else list.sort((a, b) => a.subject_code.localeCompare(b.subject_code));
    return list;
  }, [subjects, search, filterUnits, filterSections, sortBy]);

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400 placeholder:text-white/30';
  const selectCls = isDay
    ? 'rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-400'
    : 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400 [&>option]:bg-[#0d1f3c]';
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold transition';
  const pillActive = isDay ? 'bg-amber-500 text-white' : 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400/50';
  const pillInactive = isDay ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/10 text-white/50 hover:bg-white/20';
  const rowCls = isDay ? 'row-day' : 'row-night';

  const UNIT_COLORS = {
    1: isDay ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/15 text-sky-300',
    2: isDay ? 'bg-violet-100 text-violet-700' : 'bg-violet-500/15 text-violet-300',
    3: isDay ? 'bg-amber-100 text-amber-700' : 'bg-amber-500/15 text-amber-300',
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>{toast.msg && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />}</AnimatePresence>

      {/* Header card */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <OrbLayer orbs={CARD_ORBS} />
        <div className="relative flex flex-col gap-4" style={{ zIndex: 1 }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-2xl font-extrabold ${textH}`}>Subjects</h2>
              <p className={`text-sm mt-0.5 ${textS}`}>{subjects.length} subject{subjects.length !== 1 ? 's' : ''} in curriculum</p>
            </div>
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search code or title…" className={`${inputCls} max-w-xs`} />
              <button onClick={openAdd}
                className="shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition shadow-md">
                + Add Subject
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-widest ${textS}`}>Units:</span>
            <button onClick={() => setFilterUnits('all')} className={`${pillBase} ${filterUnits === 'all' ? pillActive : pillInactive}`}>All</button>
            {unitOptions.map(u => (
              <button key={u} onClick={() => setFilterUnits(String(u))}
                className={`${pillBase} ${filterUnits === String(u) ? pillActive : pillInactive}`}>
                {u} unit{u !== 1 ? 's' : ''}
              </button>
            ))}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Sections:</span>
            {[['all', 'All'], ['has-sections', 'Has Sections'], ['no-sections', 'No Sections']].map(([val, label]) => (
              <button key={val} onClick={() => setFilterSections(val)}
                className={`${pillBase} ${filterSections === val ? pillActive : pillInactive}`}>
                {label}
              </button>
            ))}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
              <option value="code">Code</option>
              <option value="title">Title A–Z</option>
              <option value="units">Most Units</option>
              <option value="sections">Most Sections</option>
            </select>
            {(search || filterUnits !== 'all' || filterSections !== 'all') && (
              <span className={`text-xs ${textS}`}>Showing {filtered.length} of {subjects.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={`${glassCard} overflow-hidden`}>
        {loading ? (
          <div className={`py-20 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
            Loading subjects…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-20 text-center ${textS}`}>
            <div className="text-5xl mb-3">📚</div>
            <p className="text-sm font-medium">{search ? 'No subjects match your search.' : 'No subjects yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDay ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/3'}`}>
                  {['#', 'Code', 'Title', 'Units', 'Sections', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest ${textS}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} className={`${rowCls} border-b last:border-0 transition-all duration-150 hover:scale-[1.003]`}
                    style={{ borderColor: isDay ? 'rgba(254,215,170,0.5)' : 'rgba(255,255,255,0.06)' }}>
                    <td className={`px-5 py-4 font-mono text-xs ${textS}`}>{i + 1}</td>
                    <td className={`px-5 py-4 font-bold font-mono ${isDay ? 'text-amber-600' : 'text-amber-400'}`}>{s.subject_code}</td>
                    <td className={`px-5 py-4 font-semibold ${textH}`}>{s.title}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${UNIT_COLORS[s.units] || (isDay ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/60')}`}>
                        {s.units} unit{s.units !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className={`px-5 py-4 ${textS}`}>
                      {(s.section_count ?? 0) > 0
                        ? <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${isDay ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/15 text-emerald-300'}`}>{s.section_count}</span>
                        : <span className={`text-xs ${textS}`}>—</span>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}>Edit</button>
                        <button onClick={() => openDelete(s)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>Delete</button>
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
          <Modal title={modal === 'add' ? 'Add Subject' : 'Edit Subject'} onClose={closeModal} isDay={isDay}>
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Subject Code</label>
                <input value={form.subject_code} onChange={e => setForm({ ...form, subject_code: e.target.value })} placeholder="e.g. CS101" className={inputCls} disabled={saving} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to Computing" className={inputCls} disabled={saving} />
              </div>
              <div>
                <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Units</label>
                <input type="number" min="1" max="6" value={form.units} onChange={e => setForm({ ...form, units: e.target.value })} className={inputCls} disabled={saving} />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={closeModal} disabled={saving} className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>Cancel</button>
                <button onClick={handleSave} disabled={saving || !form.subject_code.trim() || !form.title.trim()} className="flex-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                  {saving ? 'Saving…' : modal === 'add' ? 'Add Subject' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {modal === 'delete' && (
          <Modal title="Delete Subject" onClose={closeModal} isDay={isDay}>
            <p className={`text-sm mb-6 ${textS}`}>Remove <span className={`font-bold ${textH}`}>{selected?.subject_code} – {selected?.title}</span>? This will also remove all its sections.</p>
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