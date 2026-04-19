import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function StudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [studentNumber, setStudentNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/accounts/api/students/', { credentials: 'include' });
      const data = await res.json();
      setStudents(normalizeListResponse(data));
    } catch {
      setError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/accounts/api/students/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ student_number: studentNumber, full_name: fullName }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Failed to add student');
        return;
      }

      setSuccess(`✓ Student "${fullName}" added successfully.`);
      setStudentNumber('');
      setFullName('');
      await fetchStudents();
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

          <h2 className="text-3xl font-bold text-white">Add Students</h2>
          <p className="text-white/70 mt-2">Create students to enroll in subjects.</p>

          <form onSubmit={handleCreate} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">{error}</div>
            )}
            {success && (
              <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-4 py-3 text-sm text-emerald-100">{success}</div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-white/70">Student Number</label>
                <input
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  placeholder="e.g. 2024-0001"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : '+ Add Student'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Students <span className="text-sm text-white/40 font-normal">({students.length})</span></h3>
            {loading ? (
              <p className="text-white/50 text-sm">Loading…</p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm text-white/80">
                  <thead>
                    <tr className="text-white/50 text-left text-xs uppercase tracking-widest">
                      <th className="py-2 pr-6">#</th>
                      <th className="py-2 pr-6">Student Number</th>
                      <th className="py-2">Full Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s) => (
                      <tr key={s.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="py-3 pr-6 text-white/40">{s.id}</td>
                        <td className="py-3 pr-6 font-semibold text-white">{s.student_number}</td>
                        <td className="py-3">{s.full_name}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-white/40">No students yet.</td>
                      </tr>
                    )}
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