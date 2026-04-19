import { useEffect, useMemo, useState } from 'react';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function EnrollmentsPage() {
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [lastEnrollment, setLastEnrollment] = useState(null);

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
      const [studentsRes, subjectsRes] = await Promise.all([
        fetch('/accounts/api/students/'),
        fetch('/accounts/api/subjects/'),
      ]);
      const studentsData = await studentsRes.json();
      const subjectsData = await subjectsRes.json();

      const sList = normalizeListResponse(studentsData);
      const subList = normalizeListResponse(subjectsData);

      setStudents(sList);
      setSubjects(subList);

      if (!studentId && sList.length > 0) setStudentId(String(sList[0].id));
      if (!subjectId && subList.length > 0) setSubjectId(String(subList[0].id));
    } catch {
      setError('Failed to load students/subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setLastEnrollment(null);

    try {
      const res = await fetch('/accounts/api/enrollments/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student: Number(studentId), subject: Number(subjectId) }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.detail || data.message || 'Enrollment failed');
        return;
      }

      setLastEnrollment(data);
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
          <h2 className="text-3xl font-bold text-white">Enroll Student in Subject</h2>
          <p className="text-white/70 mt-2">The backend auto-assigns a section based on available capacity.</p>

          <form onSubmit={handleEnroll} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Student</label>
                <select
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                  disabled={loading}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">
                      {s.student_number} - {s.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                  disabled={loading}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">
                      {s.subject_code} - {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Enrolling…' : 'Enroll'}
            </button>
          </form>

          {lastEnrollment && (
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold text-white">Enrollment created</h3>
              <p className="text-white/70 mt-2">
                Student:{' '}
                {studentById.get(String(lastEnrollment.student))?.full_name || lastEnrollment.student}
              </p>
              <p className="text-white/70">
                Subject:{' '}
                {subjectById.get(String(lastEnrollment.subject))?.subject_code || lastEnrollment.subject}
              </p>
              <p className="text-white/70">
                Assigned Section ID: <span className="text-white font-semibold">{lastEnrollment.section}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

