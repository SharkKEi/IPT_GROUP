import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

function OrbLayer({ orbs }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((o, i) => (
        <div key={i} className="orb" style={{
          width: o.size, height: o.size, left: o.left, top: o.top,
          background: o.color, animationDelay: `${o.delay}s`,
          pointerEvents: 'none' /* 👈 Added this to prevent invisible walls */
        }} />
      ))}
    </div>
  );
}

const CARD_ORBS = [
  { size: '200px', left: '-50px', top: '-50px', color: 'rgba(167,139,250,0.25)', delay: 0 },
  { size: '150px', left: '65%', top: '-10px', color: 'rgba(244,114,182,0.18)', delay: -1.8 },
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

function Modal({ open, title, onClose, children, isDay }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="generic-modal" className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
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
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

function ConfirmDropModal({ open, message, onConfirm, onCancel, isDay }) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="drop-modal" className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            className={`relative z-[10000] w-full max-w-sm rounded-2xl shadow-2xl p-7 ${isDay ? 'bg-white border border-slate-100' : 'bg-[#0d1f3c] border border-white/10'}`}>
            <h3 className={`text-base font-bold mb-2 ${isDay ? 'text-slate-800' : 'text-white'}`}>Confirm Drop</h3>
            <p className={`text-sm mb-6 ${isDay ? 'text-slate-500' : 'text-white/60'}`}>{message}</p>
            <div className="flex gap-3">
              <button onClick={onCancel}
                className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                Cancel
              </button>
              <button onClick={onConfirm}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 py-2.5 text-sm font-bold text-white transition">
                Yes, Drop
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
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

export default function EnrollmentsPage({ nightMode }) {
  const isDay = !nightMode;
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table filters
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterSection, setFilterSection] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'student' | 'subject'

  // Enroll form
  const [modal, setModal] = useState(null); // 'add' | 'delete'
  const [selected, setSelected] = useState(null);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [enrollSubjectId, setEnrollSubjectId] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [enrollError, setEnrollError] = useState('');
  const [enrollSuccess, setEnrollSuccess] = useState('');

  // Drop confirm
  const [confirmDrop, setConfirmDrop] = useState(null); // { enrollmentId, label }

  const [toast, setToast] = useState({ msg: '', type: '' });

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students) map.set(String(s.id), s);
    return map;
  }, [students]);

  const subjectById = useMemo(() => {
    const map = new Map();
    for (const s of subjects) map.set(String(s.id), s);
    return map;
  }, [subjects]);

  const enrollmentCountBySection = useMemo(() => {
    const map = new Map();
    for (const e of enrollments) map.set(String(e.section), (map.get(String(e.section)) || 0) + 1);
    return map;
  }, [enrollments]);

  const enrichedSections = useMemo(() => sections
    .map(sec => ({
      ...sec,
      enrolled: enrollmentCountBySection.get(String(sec.id)) || 0,
      available: sec.capacity - (enrollmentCountBySection.get(String(sec.id)) || 0),
      isFull: (enrollmentCountBySection.get(String(sec.id)) || 0) >= sec.capacity,
    }))
    .sort((a, b) => b.available - a.available),
    [sections, enrollmentCountBySection]);

  const filteredEnrollSections = useMemo(() => enrichedSections.filter(sec => {
    const matchSubject = !enrollSubjectId || String(sec.subject) === String(enrollSubjectId);
    const matchSearch = !sectionSearch ||
      sec.section_code.toLowerCase().includes(sectionSearch.toLowerCase()) ||
      subjectById.get(String(sec.subject))?.subject_code?.toLowerCase().includes(sectionSearch.toLowerCase());
    return matchSubject && matchSearch;
  }), [enrichedSections, enrollSubjectId, sectionSearch, subjectById]);

  const recommendedSection = useMemo(() => filteredEnrollSections.find(s => !s.isFull) || null, [filteredEnrollSections]);

  const isDuplicateEnrollment = useMemo(() => {
    if (!enrollStudentId || !enrollSubjectId) return false;
    return enrollments.some(e => String(e.student) === String(enrollStudentId) && String(e.subject) === String(enrollSubjectId));
  }, [enrollStudentId, enrollSubjectId, enrollments]);

  const allSectionsFull = useMemo(() => {
    if (!enrollSubjectId) return false;
    const subjectSections = enrichedSections.filter(s => String(s.subject) === String(enrollSubjectId));
    return subjectSections.length > 0 && subjectSections.every(s => s.isFull);
  }, [enrollSubjectId, enrichedSections]);

  const fetchAll = async () => {
    try {
      const [eR, sR, subR, secR] = await Promise.all([
        fetch('/accounts/api/enrollments/', { credentials: 'include' }),
        fetch('/accounts/api/students/', { credentials: 'include' }),
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/sections/', { credentials: 'include' }),
      ]);
      const arr = async r => { const d = await r.json(); return Array.isArray(d) ? d : d.results || []; };
      const [e, s, sub, sec] = await Promise.all([arr(eR), arr(sR), arr(subR), arr(secR)]);
      setEnrollments(e); setStudents(s); setSubjects(sub); setSections(sec);
      if (!enrollStudentId && s.length > 0) setEnrollStudentId(String(s[0].id));
      if (!enrollSubjectId && sub.length > 0) setEnrollSubjectId(String(sub[0].id));
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const studentName = id => studentById.get(String(id))?.full_name || `#${id}`;
  const subjectLabel = id => { const s = subjectById.get(String(id)); return s ? `${s.subject_code} – ${s.title}` : `#${id}`; };
  const sectionLabel = id => { const s = sections.find(s => String(s.id) === String(id)); return s ? s.section_code : `#${id}`; };

  const openAdd = () => { setEnrollError(''); setEnrollSuccess(''); setModal('add'); };
  const openDelete = (e) => { setSelected(e); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); setEnrollError(''); setEnrollSuccess(''); };

  const handleEnroll = async () => {
    if (isDuplicateEnrollment || allSectionsFull || !recommendedSection) return;
    setSaving(true); setEnrollError(''); setEnrollSuccess('');
    try {
      const res = await fetch('/accounts/api/enrollments/', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCookie('csrftoken') },
        // 👈 Fixed body below to include the recommended section!
        body: JSON.stringify({ student: Number(enrollStudentId), subject: Number(enrollSubjectId), section: Number(recommendedSection.id) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnrollError(Array.isArray(data) ? data[0] : data.detail || data.non_field_errors?.[0] || 'Enrollment failed');
        return;
      }
      const sName = studentById.get(String(data.student))?.full_name || 'Student';
      const sCode = subjectById.get(String(data.subject))?.subject_code || 'Subject';
      setEnrollSuccess(`✓ ${sName} enrolled in ${sCode} — Section ${sectionLabel(data.section)}`);
      await fetchAll();
    } catch { setEnrollError('Network error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/accounts/api/enrollments/${selected.id}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      if (!res.ok) throw new Error();
      await fetchAll(); closeModal();
      setToast({ msg: 'Enrollment removed.', type: 'success' });
    } catch { setToast({ msg: 'Something went wrong.', type: 'error' }); }
    finally { setSaving(false); }
  };

  const handleDrop = async () => {
    if (!confirmDrop) return;
    try {
      const res = await fetch(`/accounts/api/enrollments/${confirmDrop.enrollmentId}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setToast({ msg: data.detail || 'Failed to drop.', type: 'error' }); return; }
      setToast({ msg: data.message || 'Enrollment dropped.', type: 'success' });
      await fetchAll();
    } catch { setToast({ msg: 'Network error.', type: 'error' }); }
    finally { setConfirmDrop(null); }
  };

  // Table filtering
  const filtered = useMemo(() => {
    let list = [...enrollments];
    const q = search.toLowerCase();
    if (q) list = list.filter(e =>
      studentName(e.student).toLowerCase().includes(q) ||
      subjectLabel(e.subject).toLowerCase().includes(q) ||
      sectionLabel(e.section).toLowerCase().includes(q)
    );
    if (filterSubject !== 'all') list = list.filter(e => String(e.subject) === filterSubject);
    if (filterSection !== 'all') list = list.filter(e => String(e.section) === filterSection);
    if (sortBy === 'oldest') list.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    else if (sortBy === 'student') list.sort((a, b) => studentName(a.student).localeCompare(studentName(b.student)));
    else if (sortBy === 'subject') list.sort((a, b) => subjectLabel(a.subject).localeCompare(subjectLabel(b.subject)));
    else list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return list;
  }, [enrollments, search, filterSubject, filterSection, sortBy, students, subjects, sections]);

  // Unique sections for table filter (only those with enrollments)
  const sectionOptions = useMemo(() => [...new Map(enrollments.map(e => [String(e.section), e.section])).values()]
    .map(id => sections.find(s => String(s.id) === String(id))).filter(Boolean), [enrollments, sections]);

  const canEnroll = !isDuplicateEnrollment && !allSectionsFull && !!recommendedSection && !loading;

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-400 placeholder:text-white/30';
  const selectCls = isDay
    ? 'rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-violet-400'
    : 'rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-400 [&>option]:bg-[#0d1f3c]';
  const modalSelectCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-violet-400'
    : 'w-full rounded-xl border border-white/10 bg-[#0d1f3c] px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-violet-400 [&>option]:bg-[#0d1f3c]';
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold transition';
  const pillActive = isDay ? 'bg-violet-500 text-white' : 'bg-violet-500/30 text-violet-300 ring-1 ring-violet-400/50';
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
              <h2 className={`text-2xl font-extrabold ${textH}`}>Enrollments</h2>
              <p className={`text-sm mt-0.5 ${textS}`}>{enrollments.length} total enrollment{enrollments.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search student, subject, section…" className={`${inputCls} max-w-xs`} />
              <button onClick={openAdd}
                className="shrink-0 rounded-xl bg-violet-500 hover:bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition shadow-md">
                + Enroll Student
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
            {sectionOptions.length > 0 && <>
              <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Section:</span>
              <button onClick={() => setFilterSection('all')} className={`${pillBase} ${filterSection === 'all' ? pillActive : pillInactive}`}>All</button>
              {sectionOptions.map(s => (
                <button key={s.id} onClick={() => setFilterSection(String(s.id))}
                  className={`${pillBase} ${filterSection === String(s.id) ? pillActive : pillInactive}`}>
                  {s.section_code}
                </button>
              ))}
            </>}
            <span className={`text-xs font-bold uppercase tracking-widest ml-2 ${textS}`}>Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectCls}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="student">Student Name</option>
              <option value="subject">Subject</option>
            </select>
            {(search || filterSubject !== 'all' || filterSection !== 'all') && (
              <span className={`text-xs ${textS}`}>Showing {filtered.length} of {enrollments.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className={`${glassCard} overflow-hidden`}>
        {loading ? (
          <div className={`py-20 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>Loading enrollments…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-20 text-center ${textS}`}>
            <div className="text-5xl mb-3">✅</div>
            <p className="text-sm font-medium">{search ? 'No enrollments match your search.' : 'No enrollments yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDay ? 'border-slate-200 bg-slate-50/60' : 'border-white/10 bg-white/3'}`}>
                  {['#', 'Student', 'Subject', 'Section', 'Enrolled', 'Actions'].map(h => (
                    <th key={h} className={`px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-widest ${textS}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id} className={`${rowCls} border-b last:border-0 transition-all duration-150 hover:scale-[1.003] group`}
                    style={{ borderColor: isDay ? 'rgba(221,214,254,0.5)' : 'rgba(255,255,255,0.06)' }}>
                    <td className={`px-5 py-4 font-mono text-xs ${textS}`}>{i + 1}</td>
                    <td className={`px-5 py-4 font-semibold ${textH}`}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#4c1d95,#6d28d9)' }}>
                          {studentName(e.student)[0]?.toUpperCase()}
                        </div>
                        {studentName(e.student)}
                      </div>
                    </td>
                    <td className={`px-5 py-4 font-medium ${isDay ? 'text-violet-600' : 'text-violet-400'}`}>{subjectLabel(e.subject)}</td>
                    <td className={`px-5 py-4 font-mono font-semibold ${isDay ? 'text-slate-600' : 'text-white/70'}`}>{sectionLabel(e.section)}</td>
                    <td className={`px-5 py-4 text-xs ${textS}`}>{e.created_at ? new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setConfirmDrop({ enrollmentId: e.id, label: `${studentName(e.student)} from ${subjectLabel(e.subject)}` })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-red-200 text-red-500 hover:bg-red-50' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}>
                          Drop
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

      {/* Enroll Modal — two-panel layout */}
      {createPortal(
        <AnimatePresence>
          {modal === 'add' && (
            <motion.div key="add-modal" className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }} transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className={`relative w-full max-w-3xl rounded-2xl shadow-2xl z-[10000] p-7 ${isDay ? 'bg-white border border-slate-100' : 'bg-[#0d1f3c] border border-white/10'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className={`text-lg font-bold ${textH}`}>Enroll Student</h2>
                    <p className={`text-xs mt-0.5 ${textS}`}>System auto-assigns the most available section.</p>
                  </div>
                  <button onClick={closeModal} className={`text-2xl leading-none ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: form */}
                  <div className="space-y-4">
                    {enrollError && <div className={`rounded-xl px-4 py-3 text-sm border ${isDay ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-500/10 border-red-400/30 text-red-300'}`}>{enrollError}</div>}
                    {enrollSuccess && <div className={`rounded-xl px-4 py-3 text-sm border ${isDay ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'}`}>{enrollSuccess}</div>}

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Student</label>
                      <select value={enrollStudentId} onChange={e => { setEnrollStudentId(e.target.value); setEnrollError(''); setEnrollSuccess(''); }}
                        className={modalSelectCls} disabled={saving}>
                        {students.map(s => <option key={s.id} value={s.id}>{s.student_number} — {s.full_name}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-widest mb-1.5 ${textS}`}>Subject</label>
                      <select value={enrollSubjectId} onChange={e => { setEnrollSubjectId(e.target.value); setSectionSearch(''); setEnrollError(''); setEnrollSuccess(''); }}
                        className={modalSelectCls} disabled={saving}>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_code} — {s.title} ({s.units} units)</option>)}
                      </select>
                    </div>

                    {/* Warning */}
                    {isDuplicateEnrollment && (
                      <div className={`rounded-xl px-4 py-3 text-sm border ${isDay ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-400/30 text-amber-300'}`}>
                        ⚠ {studentById.get(String(enrollStudentId))?.full_name} is already enrolled in {subjectById.get(String(enrollSubjectId))?.subject_code}.
                      </div>
                    )}
                    {allSectionsFull && !isDuplicateEnrollment && (
                      <div className={`rounded-xl px-4 py-3 text-sm border ${isDay ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-500/10 border-amber-400/30 text-amber-300'}`}>
                        ⚠ All sections for {subjectById.get(String(enrollSubjectId))?.subject_code} are full.
                      </div>
                    )}

                    {/* Auto-assign preview */}
                    {!isDuplicateEnrollment && !allSectionsFull && recommendedSection && (
                      <div className={`rounded-xl px-4 py-3 border ${isDay ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-400/30'}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDay ? 'text-emerald-600' : 'text-emerald-400'}`}>⚡ Auto-assigned Section</p>
                        <p className={`text-sm font-semibold ${textH}`}>Section {recommendedSection.section_code}</p>
                        <p className={`text-xs mb-2 ${textS}`}>{recommendedSection.available} slot{recommendedSection.available !== 1 ? 's' : ''} available</p>
                        <CapacityBar enrolled={recommendedSection.enrolled} capacity={recommendedSection.capacity} isDay={isDay} />
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <button onClick={closeModal} disabled={saving}
                        className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
                        Cancel
                      </button>
                      <button onClick={handleEnroll} disabled={saving || !canEnroll}
                        className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
                        {saving ? 'Enrolling…' : isDuplicateEnrollment ? 'Already Enrolled' : allSectionsFull ? 'All Sections Full' : '→ Confirm Enrollment'}
                      </button>
                    </div>
                  </div>

                  {/* Right: section browser */}
                  <div className={`rounded-xl border p-4 ${isDay ? 'border-slate-200 bg-slate-50/50' : 'border-white/10 bg-white/3'}`}>
                    <h3 className={`text-sm font-bold mb-1 ${textH}`}>Section Browser</h3>
                    <p className={`text-xs mb-3 ${textS}`}>Sorted by availability — most open first.</p>

                    <input value={sectionSearch} onChange={e => setSectionSearch(e.target.value)}
                      placeholder="Search section or subject…"
                      className={`${inputCls} mb-3 text-xs py-2`} />

                    {/* Subject filter pills */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <button onClick={() => setEnrollSubjectId('')}
                        className={`px-2 py-1 rounded-full text-[10px] font-semibold transition ${!enrollSubjectId ? pillActive : pillInactive}`}>
                        All
                      </button>
                      {subjects.map(s => (
                        <button key={s.id} onClick={() => setEnrollSubjectId(String(s.id))}
                          className={`px-2 py-1 rounded-full text-[10px] font-semibold transition ${String(enrollSubjectId) === String(s.id) ? pillActive : pillInactive}`}>
                          {s.subject_code}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {filteredEnrollSections.length === 0 ? (
                        <p className={`text-xs text-center py-6 ${textS}`}>No sections found.</p>
                      ) : filteredEnrollSections.map(sec => {
                        const subj = subjectById.get(String(sec.subject));
                        const isRecommended = recommendedSection?.id === sec.id;
                        return (
                          <div key={sec.id}
                            className={`rounded-xl px-3 py-2.5 border transition ${sec.isFull
                              ? `opacity-50 cursor-not-allowed ${isDay ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-black/10'}`
                              : isRecommended
                                ? `${isDay ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-400/40 bg-emerald-500/10'}`
                                : `${isDay ? 'border-slate-200 bg-white hover:bg-slate-50' : 'border-white/10 bg-black/10 hover:bg-white/5'}`
                              }`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-xs font-bold ${textH}`}>{sec.section_code}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDay ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/50'}`}>{subj?.subject_code || `#${sec.subject}`}</span>
                                {isRecommended && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDay ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-300'}`}>⚡ Auto</span>}
                              </div>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sec.isFull ? (isDay ? 'bg-red-100 text-red-500' : 'bg-red-500/20 text-red-300') : (isDay ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-300')}`}>
                                {sec.isFull ? 'FULL' : `${sec.available} open`}
                              </span>
                            </div>
                            {sec.schedule && <p className={`text-[10px] mb-1.5 ${textS}`}>🕐 {sec.schedule}</p>}
                            <CapacityBar enrolled={sec.enrolled} capacity={sec.capacity} isDay={isDay} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Delete Modal */}
      <Modal open={modal === 'delete'} title="Remove Enrollment" onClose={closeModal} isDay={isDay}>
        <p className={`text-sm mb-6 ${textS}`}>
          Remove <span className={`font-bold ${textH}`}>{studentName(selected?.student)}</span> from <span className={`font-bold ${textH}`}>{subjectLabel(selected?.subject)}</span>?
        </p>
        <div className="flex gap-3">
          <button onClick={closeModal} disabled={saving}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold border transition ${isDay ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-white/60 hover:bg-white/5'}`}>
            Cancel
          </button>
          <button onClick={handleDelete} disabled={saving}
            className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 py-2.5 text-sm font-bold text-white transition">
            {saving ? 'Removing…' : 'Yes, Remove'}
          </button>
        </div>
      </Modal>

      {/* Drop confirm modal */}
      <ConfirmDropModal
        open={!!confirmDrop}
        message={`Are you sure you want to drop ${confirmDrop?.label}? This cannot be undone.`}
        onConfirm={handleDrop}
        onCancel={() => setConfirmDrop(null)}
        isDay={isDay}
      />
    </div>
  );
}

function getCookie(name) {
  const v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
  return v ? v[2] : '';
}