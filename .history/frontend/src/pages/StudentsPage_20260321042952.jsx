import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
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

export default function StudentsPage({ nightMode, onToggleNight }) {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [search, setSearch] = useState('');

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

  useEffect(() => { fetchStudents(); }, []);

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(s =>
      s.full_name.toLowerCase().includes(q) ||
      s.student_number.toLowerCase().includes(q)
    );
  }, [students, search]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
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
      setToast({ msg: `✓ Student "${fullName}" added successfully.`, type: 'success' });
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
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            ← Dashboard
          </button>
          <h2 className="text-3xl font-bold text-white">Add Students</h2>
          <p className="text-white/70 mt-2">Create students to enroll in subjects.</p>

          <form onSubmit={handleCreate} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-white/70">Student Number</label>
                <input value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} placeholder="e.g. 2024-0001"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Full Name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Juan Dela Cruz"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" required />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50">
              {submitting ? 'Adding…' : '+ Add Student'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4 gap-4">
              <h3 className="text-xl font-semibold text-white shrink-0">
                Students <span className="text-sm text-white/40 font-normal">({filtered.length}{search ? ` of ${students.length}` : ''})</span>
              </h3>
              <div className="relative flex-1 max-w-xs">
                <span className="absolute inset-y-0 left-3 flex items-center text-white/40">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or number…"
                  className="w-full rounded-2xl bg-white/10 pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
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
                    {filtered.map((s) => (
                      <tr key={s.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="py-3 pr-6 text-white/40">{s.id}</td>
                        <td className="py-3 pr-6 font-semibold text-white">{s.student_number}</td>
                        <td className="py-3">{s.full_name}</td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={3} className="py-6 text-center text-white/40">
                        {search ? `No students matching "${search}".` : 'No students yet.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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