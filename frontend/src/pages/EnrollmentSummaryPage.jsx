import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CapacityBar({ enrolled, capacity }) {
  const pct = Math.min((enrolled / capacity) * 100, 100);
  const color = pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-yellow-400' : 'bg-emerald-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-white/10">
        <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-white/50 tabular-nums">{enrolled}/{capacity}</span>
    </div>
  );
}

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [msg]);
  if (!msg) return null;
  const colors = type === 'success'
    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
    : 'bg-red-500/20 border-red-400/40 text-red-100';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-medium shadow-2xl backdrop-blur-sm ${colors}`}>
      <span>{type === 'success' ? '✓' : '✗'} {msg}</span>
      <button onClick={onClose} className="text-white/50 hover:text-white ml-2">×</button>
    </div>
  );
}

function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 rounded-3xl border border-white/10 bg-[#0f1729] p-8 shadow-2xl max-w-sm w-full">
        <h3 className="text-lg font-bold text-white mb-2">Confirm Drop</h3>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-2xl bg-red-500/80 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500">
            Confirm Drop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentSummaryPage({ nightMode, onToggleNight }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [confirmDrop, setConfirmDrop] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryRes, sectionsRes, enrollmentsRes, subjectsRes, studentsRes] = await Promise.all([
        fetch('/accounts/api/enrollment-summary/', { credentials: 'include' }),
        fetch('/accounts/api/sections/', { credentials: 'include' }),
        fetch('/accounts/api/enrollments/', { credentials: 'include' }),
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/students/', { credentials: 'include' }),
      ]);
      const [summaryData, sectionsData, enrollmentsData, subjectsData, studentsData] = await Promise.all([
        summaryRes.json(), sectionsRes.json(), enrollmentsRes.json(), subjectsRes.json(), studentsRes.json(),
      ]);
      setSummary(summaryData);
      setSections(Array.isArray(sectionsData) ? sectionsData : sectionsData.results || []);
      setEnrollments(Array.isArray(enrollmentsData) ? enrollmentsData : enrollmentsData.results || []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : subjectsData.results || []);
      setStudents(Array.isArray(studentsData) ? studentsData : studentsData.results || []);
    } catch {
      setError('Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const sectionById = Object.fromEntries(sections.map(s => [String(s.id), s]));
  const subjectById = Object.fromEntries(subjects.map(s => [String(s.id), s]));

  const getStudentEnrollments = (studentNumber) => {
    const student = students.find(s => s.student_number === studentNumber);
    if (!student) return [];
    return enrollments
      .filter(e => String(e.student) === String(student.id))
      .map(e => ({
        ...e,
        sectionData: sectionById[String(e.section)],
        subjectData: subjectById[String(e.subject)],
      }));
  };

  const getSubjectEnrollments = (subjectCode) => {
    const subject = subjects.find(s => s.subject_code === subjectCode);
    if (!subject) return [];
    return enrollments
      .filter(e => String(e.subject) === String(subject.id))
      .map(e => ({
        ...e,
        sectionData: sectionById[String(e.section)],
        studentData: students.find(s => String(s.id) === String(e.student)),
      }));
  };

  const openStudentDrawer = (student) => {
    setDrawer({ type: 'student', student, enrollments: getStudentEnrollments(student.student_id) });
  };

  const openSubjectDrawer = (subject) => {
    setDrawer({
      type: 'subject', subject,
      enrollments: getSubjectEnrollments(subject.subject_code),
      subjectSections: sections.filter(sec => {
        const subj = subjects.find(s => s.subject_code === subject.subject_code);
        return subj && String(sec.subject) === String(subj.id);
      }),
    });
  };

  // Refresh drawer after drop
  const refreshDrawer = (updatedEnrollments) => {
    if (!drawer) return;
    if (drawer.type === 'student') {
      const student = students.find(s => s.student_number === drawer.student.student_id);
      if (!student) return;
      setDrawer(d => ({
        ...d,
        enrollments: updatedEnrollments
          .filter(e => String(e.student) === String(student.id))
          .map(e => ({ ...e, sectionData: sectionById[String(e.section)], subjectData: subjectById[String(e.subject)] }))
      }));
    } else if (drawer.type === 'subject') {
      const subject = subjects.find(s => s.subject_code === drawer.subject.subject_code);
      if (!subject) return;
      setDrawer(d => ({
        ...d,
        enrollments: updatedEnrollments
          .filter(e => String(e.subject) === String(subject.id))
          .map(e => ({ ...e, sectionData: sectionById[String(e.section)], studentData: students.find(s => String(s.id) === String(e.student)) }))
      }));
    }
  };

  const handleDrop = async () => {
    if (!confirmDrop) return;
    try {
      const res = await fetch(`/accounts/api/enrollments/${confirmDrop.enrollmentId}/`, {
        method: 'DELETE', credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setToast({ msg: data.detail || 'Failed to drop enrollment.', type: 'error' });
        return;
      }
      setToast({ msg: data.message || 'Enrollment dropped.', type: 'success' });
      const updatedEnrollments = enrollments.filter(e => String(e.id) !== String(confirmDrop.enrollmentId));
      setEnrollments(updatedEnrollments);
      refreshDrawer(updatedEnrollments);
      await fetchAll();
    } catch {
      setToast({ msg: 'Network error.', type: 'error' });
    } finally {
      setConfirmDrop(null);
    }
  };

  return (
    <div className="min-h-screen bg-animated overflow-x-hidden">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      <ConfirmModal
        open={!!confirmDrop}
        message={`Drop ${confirmDrop?.label}? This cannot be undone.`}
        onConfirm={handleDrop}
        onCancel={() => setConfirmDrop(null)}
      />

      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            ← Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Enrollment Summary</h2>
              <p className="text-white/70 mt-1">Click any row to see full details.</p>
            </div>
            <button onClick={fetchAll} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20">↺ Refresh</button>
          </div>

          {error && <div className="mt-6 rounded-3xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">{error}</div>}

          {loading ? (
            <div className="mt-12 text-center text-white/50">Loading…</div>
          ) : summary ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Total Enrollments', value: summary.total_enrollments, icon: '📋' },
                  { label: 'Total Enrolled Units', value: summary.total_enrolled_units, icon: '📚' },
                ].map(stat => (
                  <div key={stat.label} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                    <span className="text-4xl">{stat.icon}</span>
                    <div>
                      <p className="text-4xl font-bold text-white">{stat.value}</p>
                      <p className="text-xs text-white/50 mt-1 uppercase tracking-widest">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-1">By Student</h3>
                  <p className="text-xs text-white/40 mb-4">Click a row to see details →</p>
                  <table className="min-w-full text-sm text-white/80">
                    <thead>
                      <tr className="text-white/40 text-left text-xs uppercase tracking-widest">
                        <th className="py-2 pr-4">Student</th>
                        <th className="py-2 pr-4 text-center">Subjects</th>
                        <th className="py-2 text-center">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!summary.per_student || summary.per_student.length === 0) && (
                        <tr><td colSpan={3} className="py-6 text-center text-white/30 text-sm">No enrollments yet.</td></tr>
                      )}
                      {summary.per_student?.map((s) => (
                        <tr key={s.student_id} onClick={() => openStudentDrawer(s)} className="border-t border-white/10 hover:bg-white/10 cursor-pointer transition group">
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-white group-hover:text-blue-300 transition">{s.full_name}</div>
                            <div className="text-xs text-white/40">{s.student_id}</div>
                          </td>
                          <td className="py-3 pr-4 text-center"><span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{s.subjects_enrolled}</span></td>
                          <td className="py-3 text-center"><span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s.units_total} units</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-1">By Subject</h3>
                  <p className="text-xs text-white/40 mb-4">Click a row to see details →</p>
                  <table className="min-w-full text-sm text-white/80">
                    <thead>
                      <tr className="text-white/40 text-left text-xs uppercase tracking-widest">
                        <th className="py-2 pr-4">Subject</th>
                        <th className="py-2 pr-4 text-center">Students</th>
                        <th className="py-2 text-center">Units</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!summary.per_subject || summary.per_subject.length === 0) && (
                        <tr><td colSpan={3} className="py-6 text-center text-white/30 text-sm">No enrollments yet.</td></tr>
                      )}
                      {summary.per_subject?.map((sub) => (
                        <tr key={sub.subject_code} onClick={() => openSubjectDrawer(sub)} className="border-t border-white/10 hover:bg-white/10 cursor-pointer transition group">
                          <td className="py-3 pr-4">
                            <div className="font-semibold text-white group-hover:text-purple-300 transition">{sub.subject_code}</div>
                            <div className="text-xs text-white/40">{sub.title}</div>
                          </td>
                          <td className="py-3 pr-4 text-center"><span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{sub.students_enrolled}</span></td>
                          <td className="py-3 text-center"><span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{sub.units_total} units</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <p className="text-white/50 mt-8 text-center">No data available.</p>
          )}
        </div>
      </div>

      {/* Backdrop */}
      <div onClick={() => setDrawer(null)} className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${drawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0f1729] border-l border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${drawer ? 'translate-x-0' : 'translate-x-full'}`}>
        {drawer && (
          <div className="p-8">
            <button onClick={() => setDrawer(null)} className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition">✕ Close</button>

            {/* Student Drawer */}
            {drawer.type === 'student' && (
              <>
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white mb-4 shadow-lg">
                    {drawer.student.full_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <h2 className="text-2xl font-bold text-white">{drawer.student.full_name}</h2>
                  <p className="text-white/50 text-sm mt-1">{drawer.student.student_id}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Subjects</p>
                    <p className="text-2xl font-bold text-white mt-1">{drawer.enrollments.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Total Units</p>
                    <p className="text-2xl font-bold text-blue-300 mt-1">{drawer.student.units_total}</p>
                  </div>
                </div>
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Enrolled Subjects</h3>
                <div className="space-y-3">
                  {drawer.enrollments.length === 0 ? (
                    <p className="text-white/30 text-sm py-4 text-center">No enrollments found.</p>
                  ) : (
                    drawer.enrollments.map(e => (
                      <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 group">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-semibold text-white">{e.subjectData?.subject_code || `Subject #${e.subject}`}</p>
                            <p className="text-xs text-white/40 mt-0.5">{e.subjectData?.title}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full shrink-0">{e.subjectData?.units} units</span>
                            <button
                              onClick={() => setConfirmDrop({ enrollmentId: e.id, label: `${drawer.student.full_name} from ${e.subjectData?.subject_code}` })}
                              className="text-xs bg-red-500/10 border border-red-400/30 text-red-300 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20"
                            >DROP</button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-lg">📍 Section {e.sectionData?.section_code || `#${e.section}`}</span>
                          {e.sectionData?.schedule && <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-lg">🕐 {e.sectionData.schedule}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Subject Drawer */}
            {drawer.type === 'subject' && (
              <>
                <div className="mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl mb-4 shadow-lg">📚</div>
                  <h2 className="text-2xl font-bold text-white">{drawer.subject.subject_code}</h2>
                  <p className="text-white/50 text-sm mt-1">{drawer.subject.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Students</p>
                    <p className="text-2xl font-bold text-white mt-1">{drawer.enrollments.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-white/40 uppercase tracking-widest">Total Units</p>
                    <p className="text-2xl font-bold text-emerald-300 mt-1">{drawer.subject.units_total}</p>
                  </div>
                </div>

                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Enrolled Students</h3>
                <div className="space-y-3 mb-6">
                  {drawer.enrollments.length === 0 ? (
                    <p className="text-white/30 text-sm py-4 text-center">No students enrolled yet.</p>
                  ) : (
                    drawer.enrollments.map(e => (
                      <div key={e.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 flex items-center justify-center text-sm font-bold text-white shrink-0">
                              {e.studentData?.full_name?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{e.studentData?.full_name || `Student #${e.student}`}</p>
                              <p className="text-xs text-white/40">{e.studentData?.student_number}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setConfirmDrop({ enrollmentId: e.id, label: `${e.studentData?.full_name} from ${drawer.subject.subject_code}` })}
                            className="text-xs bg-red-500/10 border border-red-400/30 text-red-300 px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20"
                          >DROP</button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-lg">📍 Section {e.sectionData?.section_code || `#${e.section}`}</span>
                          {e.sectionData?.schedule && <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-lg">🕐 {e.sectionData.schedule}</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Sections</h3>
                <div className="space-y-3">
                  {drawer.subjectSections.length === 0 ? (
                    <p className="text-white/30 text-sm">No sections created yet.</p>
                  ) : (
                    drawer.subjectSections.map(sec => {
                      const secEnrolled = enrollments.filter(e => String(e.section) === String(sec.id)).length;
                      const pct = Math.min((secEnrolled / sec.capacity) * 100, 100);
                      const color = pct >= 100 ? 'bg-red-400' : pct >= 75 ? 'bg-yellow-400' : 'bg-emerald-400';
                      return (
                        <div key={sec.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-white">Section {sec.section_code}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${pct >= 100 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                              {pct >= 100 ? 'FULL' : `${sec.capacity - secEnrolled} open`}
                            </span>
                          </div>
                          {sec.schedule && <p className="text-xs text-white/40 mb-2">🕐 {sec.schedule}</p>}
                          <CapacityBar enrolled={secEnrolled} capacity={sec.capacity} />
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Night mode toggle */}
      <button
        onClick={onToggleNight}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-white/20 bg-white/10 p-3 text-xl shadow-xl backdrop-blur transition hover:bg-white/20"
        title="Toggle night mode"
      >
        {nightMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}