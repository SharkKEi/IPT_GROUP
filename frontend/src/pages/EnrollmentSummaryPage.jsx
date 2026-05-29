import { useEffect, useMemo, useState } from 'react';
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

function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => setValue(target);
  }, [target, duration]);
  return value;
}

function StatPill({ label, value, accent, isDay }) {
  const count = useCountUp(value);
  return (
    <div className={`glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl p-5 flex flex-col gap-1`}>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${isDay ? 'text-slate-400' : 'text-white/40'}`}>{label}</p>
      <p className={`text-4xl font-extrabold ${accent}`}>{count}</p>
    </div>
  );
}

function FillBar({ pct, isDay }) {
  const color = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-400' : 'bg-emerald-400';
  return (
    <div className={`w-full h-2 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

/* ── Roster Modal ── */
function RosterModal({ subject, onClose, isDay }) {
  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const [activeSection, setActiveSection] = useState(subject.sections[0]?.id ?? null);

  const currentSection = subject.sections.find(s => s.id === activeSection);
  const pillBase = 'px-3 py-1.5 rounded-full text-xs font-semibold transition';
  const pillActive = isDay ? 'bg-amber-500 text-white' : 'bg-amber-500/30 text-amber-300 ring-1 ring-amber-400/50';
  const pillInactive = isDay ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-white/10 text-white/50 hover:bg-white/20';

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl z-10 p-7 max-h-[85vh] flex flex-col ${isDay ? 'bg-white border border-slate-100' : 'bg-[#0d1f3c] border border-white/10'}`}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold font-mono text-sm ${isDay ? 'text-amber-600' : 'text-amber-400'}`}>{subject.subject_code}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDay ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/40'}`}>{subject.units} units</span>
            </div>
            <h2 className={`text-lg font-bold ${textH}`}>{subject.title}</h2>
            <p className={`text-xs mt-0.5 ${textS}`}>
              {subject.totalEnrolled} student{subject.totalEnrolled !== 1 ? 's' : ''} enrolled across {subject.sections.length} section{subject.sections.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className={`text-2xl leading-none mt-1 transition ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
        </div>

        {subject.sections.length === 0 ? (
          <div className={`py-12 text-center ${textS}`}>
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">No sections for this subject yet.</p>
          </div>
        ) : (
          <>
            {/* Section tabs */}
            <div className="flex flex-wrap gap-2 mb-5 shrink-0">
              {subject.sections.map(sec => (
                <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                  className={`${pillBase} ${activeSection === sec.id ? pillActive : pillInactive}`}>
                  {sec.section_code}
                  <span className={`ml-1.5 text-[10px] ${activeSection === sec.id ? 'opacity-70' : 'opacity-50'}`}>
                    {sec.students.length}/{sec.capacity}
                  </span>
                </button>
              ))}
            </div>

            {/* Section detail */}
            {currentSection && (
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Section meta */}
                <div className={`rounded-xl p-4 mb-4 border ${isDay ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${textS}`}>Section</p>
                      <p className={`text-sm font-bold font-mono ${textH}`}>{currentSection.section_code}</p>
                    </div>
                    {currentSection.schedule && (
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${textS}`}>Schedule</p>
                        <p className={`text-sm font-semibold ${textH}`}>{currentSection.schedule}</p>
                      </div>
                    )}
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${textS}`}>Capacity</p>
                      <p className={`text-sm font-semibold ${currentSection.pct >= 100 ? 'text-red-500' : isDay ? 'text-emerald-600' : 'text-emerald-400'}`}>
                        {currentSection.students.length} / {currentSection.capacity}
                      </p>
                    </div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${textS}`}>Status</p>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentSection.pct >= 100
                          ? (isDay ? 'bg-red-100 text-red-600' : 'bg-red-500/20 text-red-300')
                          : currentSection.pct >= 80
                            ? (isDay ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-300')
                            : (isDay ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-300')
                        }`}>
                        {currentSection.pct >= 100 ? 'Full' : currentSection.pct >= 80 ? 'Almost Full' : 'Open'}
                      </span>
                    </div>
                  </div>
                  <FillBar pct={currentSection.pct} isDay={isDay} />
                </div>

                {/* Student roster */}
                {currentSection.students.length === 0 ? (
                  <div className={`py-10 text-center ${textS}`}>
                    <div className="text-3xl mb-2">👤</div>
                    <p className="text-sm">No students enrolled in this section yet.</p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${textS}`}>
                      Enrolled Students — {currentSection.students.length}
                    </p>
                    <div className="space-y-2">
                      {currentSection.students.map((stu, idx) => (
                        <div key={stu.id}
                          className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition ${isDay ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-white/8 bg-white/3 hover:bg-white/5'}`}>
                          <span className={`text-xs font-mono w-5 text-right shrink-0 ${textS}`}>{idx + 1}</span>
                          <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg,#0d2a50,#1a4a8e)' }}>
                            {stu.full_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${textH}`}>{stu.full_name}</p>
                            <p className={`text-xs font-mono ${textS}`}>{stu.student_number}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isDay ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/40'}`}>
                            #{stu.student_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>,
    document.body
  );
}

export default function EnrollmentSummaryPage({ nightMode }) {
  const isDay = !nightMode;
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [rosterSubject, setRosterSubject] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [subR, secR, eR, sR] = await Promise.all([
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/subjects/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/sections/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/enrollments/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/students/', { credentials: 'include' }),
        ]);
        const arr = async r => { const d = await r.json(); return Array.isArray(d) ? d : d.results || []; };
        const [sub, sec, e, s] = await Promise.all([arr(subR), arr(secR), arr(eR), arr(sR)]);
        setSubjects(sub); setSections(sec); setEnrollments(e); setStudents(s);
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  const studentById = useMemo(() => {
    const map = new Map();
    for (const s of students) map.set(String(s.id), s);
    return map;
  }, [students]);

  const summary = useMemo(() => {
    return subjects.map(sub => {
      const subSections = sections.filter(s => String(s.subject) === String(sub.id));
      const subEnrollments = enrollments.filter(e => String(e.subject) === String(sub.id));
      const totalCap = subSections.reduce((a, s) => a + s.capacity, 0);
      return {
        ...sub,
        sections: subSections.map(sec => {
          const secEnrollments = enrollments.filter(e => String(e.section) === String(sec.id));
          const count = secEnrollments.length;
          const pct = sec.capacity > 0 ? (count / sec.capacity) * 100 : 0;
          const enrolledStudents = secEnrollments
            .map(e => studentById.get(String(e.student)))
            .filter(Boolean)
            .sort((a, b) => a.full_name.localeCompare(b.full_name));
          return { ...sec, count, pct, students: enrolledStudents };
        }),
        totalEnrolled: subEnrollments.length,
        totalCap,
        fillPct: totalCap > 0 ? (subEnrollments.length / totalCap) * 100 : 0,
      };
    });
  }, [subjects, sections, enrollments, studentById]);

  const filtered = summary.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.subject_code.toLowerCase().includes(search.toLowerCase())
  );

  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl`;
  const inputCls = isDay
    ? 'w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2.5 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-slate-400'
    : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-sky-400 placeholder:text-white/30';

  const topSubjects = [...summary].sort((a, b) => b.totalEnrolled - a.totalEnrolled).slice(0, 3);

  return (
    <div className="space-y-6">

      {/* Stat pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatPill label="Students" value={students.length} accent={isDay ? 'text-sky-600' : 'text-sky-400'} isDay={isDay} />
        <StatPill label="Subjects" value={subjects.length} accent={isDay ? 'text-amber-600' : 'text-amber-400'} isDay={isDay} />
        <StatPill label="Sections" value={sections.length} accent={isDay ? 'text-emerald-600' : 'text-emerald-400'} isDay={isDay} />
        <StatPill label="Enrollments" value={enrollments.length} accent={isDay ? 'text-violet-600' : 'text-violet-400'} isDay={isDay} />
      </div>

      {/* Top subjects */}
      {topSubjects.length > 0 && (
        <div className={`${glassCard} p-6 relative overflow-hidden`}>
          <OrbLayer orbs={[
            { size: '200px', left: '-50px', top: '-40px', color: 'rgba(56,189,248,0.18)', delay: 0 },
            { size: '160px', left: '70%', top: '-20px', color: 'rgba(99,102,241,0.14)', delay: -2 },
          ]} />
          <h3 className={`relative text-base font-bold mb-4 ${textH}`} style={{ zIndex: 1 }}>Top Enrolled Subjects</h3>
          <div className="relative space-y-3" style={{ zIndex: 1 }}>
            {topSubjects.map((s, i) => (
              <div key={s.id} className="flex items-center gap-4">
                <span className={`text-lg font-extrabold w-6 text-center ${isDay ? 'text-slate-300' : 'text-white/20'}`}>{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-sm font-semibold ${textH}`}>{s.subject_code}</span>
                    <span className={`text-xs ${textS}`}>{s.totalEnrolled} / {s.totalCap}</span>
                  </div>
                  <FillBar pct={s.fillPct} isDay={isDay} />
                </div>
                <button onClick={() => setRosterSubject(s)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-sky-200 text-sky-600 hover:bg-sky-50' : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'}`}>
                  View Roster
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full breakdown */}
      <div className={`${glassCard} p-6 relative overflow-hidden`}>
        <OrbLayer orbs={[
          { size: '180px', left: '-40px', top: '-30px', color: 'rgba(52,211,153,0.15)', delay: -1 },
          { size: '140px', left: '75%', top: '20%', color: 'rgba(167,139,250,0.12)', delay: -2.5 },
        ]} />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5" style={{ zIndex: 1 }}>
          <div>
            <h3 className={`text-base font-bold ${textH}`}>Enrollment Breakdown</h3>
            <p className={`text-sm ${textS}`}>Per-subject and per-section fill rates</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subject…" className={`${inputCls} max-w-xs`} />
        </div>

        {loading ? (
          <div className={`py-16 text-center text-sm ${textS}`}>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>Loading summary…
          </div>
        ) : filtered.length === 0 ? (
          <div className={`py-16 text-center ${textS}`}><div className="text-4xl mb-3">📊</div><p className="text-sm">No data to display.</p></div>
        ) : (
          <div className="relative space-y-4" style={{ zIndex: 1 }}>
            {filtered.map(sub => (
              <div key={sub.id} className={`rounded-2xl border p-4 transition-all ${isDay ? 'border-slate-100 bg-white/40 hover:bg-white/60' : 'border-white/8 bg-white/3 hover:bg-white/5'}`}>

                {/* Subject header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`font-bold font-mono text-sm ${isDay ? 'text-amber-600' : 'text-amber-400'}`}>{sub.subject_code}</span>
                    <span className={`font-semibold text-sm ${textH}`}>{sub.title}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDay ? 'bg-slate-100 text-slate-500' : 'bg-white/10 text-white/40'}`}>{sub.units} units</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-semibold ${textS}`}>{sub.totalEnrolled} / {sub.totalCap} enrolled</span>
                    <div className={`w-24 h-1.5 rounded-full ${isDay ? 'bg-slate-200' : 'bg-white/10'}`}>
                      <div className={`h-full rounded-full ${sub.fillPct >= 100 ? 'bg-red-500' : sub.fillPct >= 80 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(sub.fillPct, 100)}%` }} />
                    </div>
                    <button onClick={() => setRosterSubject(sub)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold border transition ${isDay ? 'border-sky-200 text-sky-600 hover:bg-sky-50' : 'border-sky-500/30 text-sky-400 hover:bg-sky-500/10'}`}>
                      👥 View Roster
                    </button>
                  </div>
                </div>

                {/* Sections */}
                {sub.sections.length === 0 ? (
                  <p className={`text-xs italic ${textS}`}>No sections for this subject.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {sub.sections.map(sec => (
                      <div key={sec.id}
                        onClick={() => { setRosterSubject(sub); }}
                        className={`rounded-xl p-3 border cursor-pointer transition ${isDay ? 'bg-white/60 border-slate-100 hover:border-sky-200 hover:bg-sky-50/40' : 'bg-white/5 border-white/8 hover:border-sky-500/30 hover:bg-sky-500/5'}`}>
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className={`text-xs font-bold font-mono ${isDay ? 'text-emerald-600' : 'text-emerald-400'}`}>{sec.section_code}</span>
                          <span className={`text-[10px] ${sec.pct >= 100 ? 'text-red-500 font-bold' : textS}`}>{sec.count}/{sec.capacity}</span>
                        </div>
                        {sec.schedule && <p className={`text-[10px] mb-1.5 ${textS}`}>{sec.schedule}</p>}
                        <FillBar pct={sec.pct} isDay={isDay} />
                        <p className={`text-[10px] mt-1.5 ${textS}`}>
                          {sec.students.length === 0 ? 'No students yet' : `${sec.students.length} student${sec.students.length !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster Modal */}
      <AnimatePresence>
        {rosterSubject && (
          <RosterModal
            subject={rosterSubject}
            onClose={() => setRosterSubject(null)}
            isDay={isDay}
          />
        )}
      </AnimatePresence>
    </div>
  );
}