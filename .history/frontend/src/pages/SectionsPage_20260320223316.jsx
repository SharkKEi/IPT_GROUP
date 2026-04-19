import { useEffect, useMemo, useState } from 'react';

function normalizeListResponse(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export default function SectionsPage() {
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subjectId, setSubjectId] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [submitting, setSubmitting] = useState(false);

  const subjectById = useMemo(() => {
    const map = new Map();
    for (const s of subjects) map.set(String(s.id), s);
    return map;
  }, [subjects]);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [subjectsRes, sectionsRes] = await Promise.all([
        fetch('/accounts/api/subjects/'),
        fetch('/accounts/api/sections/'),
      ]);
      const subjectsData = await subjectsRes.json();
      const sectionsData = await sectionsRes.json();
      const subList = normalizeListResponse(subjectsData);
      const secList = normalizeListResponse(sectionsData);
      setSubjects(subList);
      setSections(secList);
      if (!subjectId && subList.length > 0) setSubjectId(String(subList[0].id));
    } catch {
      setError('Failed to load subjects/sections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/accounts/api/sections/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: Number(subjectId),
          section_code: sectionCode,
          capacity: Number(capacity),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Failed to add section');
        return;
      }

      setSectionCode('');
      setCapacity(30);
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
          <h2 className="text-3xl font-bold text-white">Create Sections</h2>
          <p className="text-white/70 mt-2">Each section belongs to a subject and has a capacity limit.</p>

          <form onSubmit={handleCreate} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && (
              <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id} className="text-black">
                      {s.subject_code} - {s.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Section Code</label>
                <input
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Capacity</label>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
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
              {submitting ? 'Creating…' : 'Create Section'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white">Sections</h3>
            {loading ? (
              <p className="text-white/70 mt-3">Loading…</p>
            ) : (
              <div className="mt-4 overflow-auto">
                <table className="min-w-full text-sm text-white/80">
                  <thead>
                    <tr className="text-white/70 text-left">
                      <th className="py-2 pr-6">#</th>
                      <th className="py-2 pr-6">Subject</th>
                      <th className="py-2 pr-6">Section</th>
                      <th className="py-2">Capacity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec) => {
                      const subj = subjectById.get(String(sec.subject));
                      return (
                        <tr key={sec.id} className="border-t border-white/10">
                          <td className="py-2 pr-6">{sec.id}</td>
                          <td className="py-2 pr-6">
                            {subj ? `${subj.subject_code} - ${subj.title}` : `Subject #${sec.subject}`}
                          </td>
                          <td className="py-2 pr-6">{sec.section_code}</td>
                          <td className="py-2">{sec.capacity}</td>
                        </tr>
                      );
                    })}
                    {sections.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-white/60">
                          No sections yet.
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

