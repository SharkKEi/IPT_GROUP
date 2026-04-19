import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function EnrollmentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [studentsRes, subjectsRes, enrollmentsRes] = await Promise.all([
        fetch('/accounts/api/students/', { credentials: 'include' }),
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/enrollments/', { credentials: 'include' }),
      ]);
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();
      const enrollmentsData = await enrollmentsRes.json();

      const sList = normalizeListResponse(studentsData);
      const subList = normalizeListResponse(subjectsData);
      const eList = normalizeListResponse(enrollmentsData);

      setStudents(sList);
      setSubjects(subList);
      setEnrollments(eList);

      if (!studentId && sList.length > 0) setStudentId(String(sList[0].id));
      if (!subjectId && subList.length > 0) setSubjectId(String(subList[0].id));
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/accounts/api/enrollments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ student: Number(studentId), subject: Number(subjectId) }),
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
      setSuccess(`✓ ${studentName} enrolled in ${subjectCode} — assigned to section ${data.section_code || data.section}`);
      await fetchAll();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated">
      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-3xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            ← Dashboard
          </button>

          <h2 className="text-3xl font-bold text-white">Enroll Student in Subject</h2>
          <p className="text-white/70 mt-2">The system auto-assigns a section based on available capacity.</p>

          <form onSubmit={handleEnroll} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-4 py-3 text-sm text-emerald-100">
                {success}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Student</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white"
                  required
                  disabled={loading}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.student_number} — {s.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white"
                  required
                  disabled={loading}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.subject_code} — {s.title} ({s.units} units)</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Enrolling…' : '→ Enroll Student'}
            </button>
          </form>

          {/* Existing enrollments list */}
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Existing Enrollments</h3>
            {loading ? (
              <p className="text-white/50 text-sm">Loading…</p>
            ) : enrollments.length === 0 ? (
              <p className="text-white/40 text-sm py-4 text-center">No enrollments yet.</p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm text-white/80">
                  <thead>
                    <tr className="text-white/50 text-left text-xs uppercase tracking-widest">
                      <th className="py-2 pr-6">Student</th>
                      <th className="py-2 pr-6">Subject</th>
                      <th className="py-2">Section</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => {
                      const student = studentById.get(String(e.student));
                      const subject = subjectById.get(String(e.subject));
                      return (
                        <tr key={e.id} className="border-t border-white/10 hover:bg-white/5">
                          <td className="py-3 pr-6">
                            <div className="font-semibold text-white">{student?.full_name || `Student #${e.student}`}</div>
                            <div className="text-xs text-white/40">{student?.student_number}</div>
                          </td>
                          <td className="py-3 pr-6">
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{subject?.subject_code || `Subject #${e.subject}`}</span>
                          </td>
                          <td className="py-3">
                            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">Section #{e.section}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}