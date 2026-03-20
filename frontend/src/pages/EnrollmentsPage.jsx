import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

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

function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 rounded-3xl border border-white/10 bg-[#0f1729] p-8 shadow-2xl max-w-sm w-full">
        <h3 className="text-lg font-bold text-white mb-2">Confirm Action</h3>
        <p className="text-sm text-white/60 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500/80 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Confirm Drop
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EnrollmentsPage({ nightMode, onToggleNight }) {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sectionSearch, setSectionSearch] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [warning, setWarning] = useState('');

  // Drop confirmation modal
  const [confirmDrop, setConfirmDrop] = useState(null); // { enrollmentId, label }

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
    for (const e of enrollments) {
      map.set(String(e.section), (map.get(String(e.section)) || 0) + 1);
    }
    return map;
  }, [enrollments]);

  const enrichedSections = useMemo(() => {
    return sections
      .map(sec => ({
        ...sec,
        enrolled: enrollmentCountBySection.get(String(sec.id)) || 0,
        available: sec.capacity - (enrollmentCountBySection.get(String(sec.id)) || 0),
        isFull: (enrollmentCountBySection.get(String(sec.id)) || 0) >= sec.capacity,
      }))
      .sort((a, b) => b.available - a.available);
  }, [sections, enrollmentCountBySection]);

  const filteredSections = useMemo(() => {
    return enrichedSections.filter(sec => {
      const matchSubject = !subjectId || String(sec.subject) === String(subjectId);
      const matchSearch = !sectionSearch ||
        sec.section_code.toLowerCase().includes(sectionSearch.toLowerCase()) ||
        subjectById.get(String(sec.subject))?.subject_code?.toLowerCase().includes(sectionSearch.toLowerCase());
      return matchSubject && matchSearch;
    });
  }, [enrichedSections, subjectId, sectionSearch, subjectById]);

  const recommendedSection = useMemo(() => {
    return filteredSections.find(s => !s.isFull) || null;
  }, [filteredSections]);

  // ── Duplicate check ──────────────────────────────────────────────────────
  const isDuplicateEnrollment = useMemo(() => {
    if (!studentId || !subjectId) return false;
    return enrollments.some(
      e => String(e.student) === String(studentId) && String(e.subject) === String(subjectId)
    );
  }, [studentId, subjectId, enrollments]);

  // ── All sections full check ──────────────────────────────────────────────
  const allSectionsFull = useMemo(() => {
    if (!subjectId) return false;
    const subjectSections = enrichedSections.filter(s => String(s.subject) === String(subjectId));
    return subjectSections.length > 0 && subjectSections.every(s => s.isFull);
  }, [subjectId, enrichedSections]);

  // Update warning when student/subject changes
  useEffect(() => {
    if (isDuplicateEnrollment) {
      const studentName = studentById.get(String(studentId))?.full_name || 'This student';
      const subjectCode = subjectById.get(String(subjectId))?.subject_code || 'this subject';
      setWarning(`⚠ ${studentName} is already enrolled in ${subjectCode}.`);
    } else if (allSectionsFull) {
      const subjectCode = subjectById.get(String(subjectId))?.subject_code || 'this subject';
      setWarning(`⚠ All sections for ${subjectCode} are currently full.`);
    } else {
      setWarning('');
    }
  }, [isDuplicateEnrollment, allSectionsFull, studentId, subjectId]);

  useEffect(() => {
    if (recommendedSection) {
      setSelectedSectionId(String(recommendedSection.id));
    } else {
      setSelectedSectionId('');
    }
  }, [recommendedSection]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, subjectsRes, sectionsRes, enrollmentsRes] = await Promise.all([
        fetch('/accounts/api/students/', { credentials: 'include' }),
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/sections/', { credentials: 'include' }),
        fetch('/accounts/api/enrollments/', { credentials: 'include' }),
      ]);
      const [studentsData, subjectsData, sectionsData, enrollmentsData] = await Promise.all([
        studentsRes.json(), subjectsRes.json(), sectionsRes.json(), enrollmentsRes.json(),
      ]);
      const sList = normalizeListResponse(studentsData);
      const subList = normalizeListResponse(subjectsData);
      const secList = normalizeListResponse(sectionsData);
      const eList = normalizeListResponse(enrollmentsData);
      setStudents(sList);
      setSubjects(subList);
      setSections(secList);
      setEnrollments(eList);
      if (!studentId && sList.length > 0) setStudentId(String(sList[0].id));
      if (!subjectId && subList.length > 0) setSubjectId(String(subList[0].id));
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // ── Enroll ───────────────────────────────────────────────────────────────
  const handleEnroll = async (e) => {
    e.preventDefault();
    if (isDuplicateEnrollment || allSectionsFull) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/accounts/api/enrollments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          student: Number(studentId),
          subject: Number(subjectId),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          Array.isArray(data) ? data[0] :
            data.detail || data.message || data.non_field_errors?.[0] || 'Enrollment failed'
        );
        return;
      }
      const studentName = studentById.get(String(data.student))?.full_name || 'Student';
      const subjectCode = subjectById.get(String(data.subject))?.subject_code || 'Subject';
      setSuccess(`✓ ${studentName} enrolled in ${subjectCode} — auto-assigned to Section #${data.section}`);
      await fetchAll();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Drop ─────────────────────────────────────────────────────────────────
  const handleDrop = async () => {
    if (!confirmDrop) return;
    try {
      const res = await fetch(`/accounts/api/enrollments/${confirmDrop.enrollmentId}/`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || 'Failed to drop enrollment.');
        return;
      }
      setSuccess(`✓ ${data.message || 'Enrollment dropped successfully.'}`);
      await fetchAll();
    } catch {
      setError('Network error');
    } finally {
      setConfirmDrop(null);
    }
  };

  const canEnroll = !isDuplicateEnrollment && !allSectionsFull && recommendedSection && !loading;

  return (
    <div className="min-h-screen bg-animated">
      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-6xl mx-auto">

          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            ← Dashboard
          </button>

          <h2 className="text-3xl font-bold text-white">Enroll Student in Subject</h2>
          <p className="text-white/70 mt-2">System auto-assigns the most available section — or browse sections on the right.</p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* ── Left ── */}
            <div className="space-y-4">
              <form onSubmit={handleEnroll} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">Enrollment Form</h3>

                {error && <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">{error}</div>}
                {success && <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-4 py-3 text-sm text-emerald-100">{success}</div>}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-white/70">Student</label>
                    <select
                      value={studentId}
                      onChange={(e) => { setStudentId(e.target.value); setError(''); setSuccess(''); }}
                      className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white"
                      required disabled={loading}
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>{s.student_number} — {s.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-white/70">Subject</label>
                    <select
                      value={subjectId}
                      onChange={(e) => { setSubjectId(e.target.value); setSectionSearch(''); setError(''); setSuccess(''); }}
                      className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white"
                      required disabled={loading}
                    >
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.subject_code} — {s.title} ({s.units} units)</option>
                      ))}
                    </select>
                  </div>

                  {/* Warning: duplicate or full */}
                  {warning && (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-200">
                      {warning}
                    </div>
                  )}

                  {/* Auto-assign preview */}
                  {!warning && recommendedSection && (
                    <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
                      <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">⚡ Auto-assigned Section</p>
                      <p className="text-sm font-semibold text-white">Section {recommendedSection.section_code}</p>
                      <p className="text-xs text-white/50 mt-0.5 mb-2">{recommendedSection.available} slots available — best match</p>
                      <CapacityBar enrolled={recommendedSection.enrolled} capacity={recommendedSection.capacity} />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submitting || !canEnroll}
                  className={`mt-6 w-full rounded-2xl py-3 text-lg font-semibold text-white shadow-xl transition ${canEnroll
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:brightness-110 shadow-black/40'
                      : 'bg-white/10 cursor-not-allowed opacity-50'
                    } disabled:opacity-50`}
                >
                  {submitting ? 'Enrolling…' : isDuplicateEnrollment ? 'Already Enrolled' : allSectionsFull ? 'All Sections Full' : '→ Confirm Enrollment'}
                </button>
              </form>

              {/* Enrollments list with DROP button */}
              <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Enrollments
                  <span className="ml-2 text-sm text-white/40 font-normal">({enrollments.length})</span>
                </h3>
                {loading ? (
                  <p className="text-white/50 text-sm">Loading…</p>
                ) : enrollments.length === 0 ? (
                  <p className="text-white/40 text-sm py-4 text-center">No enrollments yet.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...enrollments].reverse().map((e) => {
                      const student = studentById.get(String(e.student));
                      const subject = subjectById.get(String(e.subject));
                      return (
                        <div key={e.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 px-4 py-3 group">
                          <div>
                            <p className="text-sm font-semibold text-white">{student?.full_name || `Student #${e.student}`}</p>
                            <p className="text-xs text-white/40">{student?.student_number} · {subject?.subject_code || `Subject #${e.subject}`} · Section #{e.section}</p>
                          </div>
                          <button
                            onClick={() => setConfirmDrop({
                              enrollmentId: e.id,
                              label: `${student?.full_name || 'Student'} from ${subject?.subject_code || 'subject'}`
                            })}
                            className="ml-3 shrink-0 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 opacity-0 group-hover:opacity-100 transition hover:bg-red-500/20"
                          >
                            DROP
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Section Browser ── */}
            <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
              <h3 className="text-lg font-semibold text-white mb-1">Section Browser</h3>
              <p className="text-sm text-white/50 mb-4">Sorted by availability — most open slots first.</p>

              <div className="relative mb-4">
                <span className="absolute inset-y-0 left-4 flex items-center text-white/40">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input
                  value={sectionSearch}
                  onChange={(e) => setSectionSearch(e.target.value)}
                  placeholder="Search section or subject code…"
                  className="w-full rounded-2xl bg-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="flex gap-2 flex-wrap mb-4">
                <button
                  onClick={() => setSubjectId('')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${!subjectId ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/50' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                >
                  All
                </button>
                {subjects.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(String(s.id))}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${String(subjectId) === String(s.id) ? 'bg-blue-500/30 text-blue-200 ring-1 ring-blue-400/50' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                  >
                    {s.subject_code}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {loading ? (
                  <p className="text-white/50 text-sm text-center py-8">Loading…</p>
                ) : filteredSections.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-8">No sections found.</p>
                ) : (
                  filteredSections.map(sec => {
                    const subj = subjectById.get(String(sec.subject));
                    const isRecommended = recommendedSection?.id === sec.id;
                    const isSelected = String(selectedSectionId) === String(sec.id);
                    return (
                      <div
                        key={sec.id}
                        onClick={() => !sec.isFull && setSelectedSectionId(String(sec.id))}
                        className={`rounded-2xl border px-4 py-3 transition ${sec.isFull
                            ? 'border-white/5 bg-black/10 opacity-50 cursor-not-allowed'
                            : isRecommended
                              ? 'border-emerald-400/40 bg-emerald-500/10 ring-1 ring-emerald-400/30 cursor-pointer'
                              : isSelected
                                ? 'border-blue-400/40 bg-blue-500/10 ring-1 ring-blue-400/30 cursor-pointer'
                                : 'border-white/10 bg-black/10 hover:bg-white/5 cursor-pointer'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-white">{sec.section_code}</span>
                            <span className="text-xs bg-white/10 text-white/50 px-2 py-0.5 rounded-full">{subj?.subject_code || `#${sec.subject}`}</span>
                            {isRecommended && (
                              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">⚡ Auto</span>
                            )}
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${sec.isFull ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {sec.isFull ? 'FULL' : `${sec.available} open`}
                          </span>
                        </div>
                        {sec.schedule && <p className="text-xs text-white/40 mb-1.5">🕐 {sec.schedule}</p>}
                        <CapacityBar enrolled={sec.enrolled} capacity={sec.capacity} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm drop modal */}
      <ConfirmModal
        open={!!confirmDrop}
        message={`Are you sure you want to drop ${confirmDrop?.label}? This cannot be undone.`}
        onConfirm={handleDrop}
        onCancel={() => setConfirmDrop(null)}
      />

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