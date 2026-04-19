import { useEffect, useState } from 'react';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subjectCode, setSubjectCode] = useState('');
  const [title, setTitle] = useState('');
  const [units, setUnits] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/accounts/api/subjects/');
      const data = await res.json();
      setSubjects(normalizeListResponse(data));
    } catch {
      setError('Failed to load subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/accounts/api/subjects/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject_code: subjectCode, title, units: Number(units) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Failed to add subject');
        return;
      }

      setSubjectCode('');
      setTitle('');
      setUnits(1);
      await fetchSubjects();
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
          <h2 className="text-3xl font-bold text-white">Add Subjects</h2>
          <p className="text-white/70 mt-2">Create subjects with academic units.</p>

          <form onSubmit={handleCreate} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-white/70">Subject Code</label>
                <input
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Units</label>
                <input
                  type="number"
                  min={1}
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? 'Adding…' : 'Add Subject'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white">Subjects</h3>
            {loading ? (
              <p className="text-white/70 mt-3">Loading…</p>
            ) : (
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm text-white/80">
                  <thead>
                    <tr className="text-white/70 text-left">
                      <th className="py-2 pr-6">#</th>
                      <th className="py-2 pr-6">Code</th>
                      <th className="py-2 pr-6">Title</th>
                      <th className="py-2">Units</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjects.map((s) => (
                      <tr key={s.id} className="border-t border-white/10">
                        <td className="py-2 pr-6">{s.id}</td>
                        <td className="py-2 pr-6">{s.subject_code}</td>
                        <td className="py-2 pr-6">{s.title}</td>
                        <td className="py-2">{s.units}</td>
                      </tr>
                    ))}
                    {subjects.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-white/60">
                          No subjects yet.
                        </td>
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

