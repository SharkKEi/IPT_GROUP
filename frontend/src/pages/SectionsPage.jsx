import { useEffect, useMemo, useState } from 'react';
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

function EditModal({ section, subjects, onClose, onSave }) {
  const [sectionCode, setSectionCode] = useState(section.section_code);
  const [capacity, setCapacity] = useState(section.capacity);
  const [schedule, setSchedule] = useState(section.schedule || '');
  const [subjectId, setSubjectId] = useState(section.subject);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/accounts/api/sections/${section.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          section_code: sectionCode,
          capacity: Number(capacity),
          schedule,
          subject: Number(subjectId),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Failed to update section');
        return;
      }
      onSave();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 rounded-3xl border border-white/10 bg-[#0f1729] p-8 shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold text-white mb-6">Edit Section</h3>
        {error && <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">{error}</div>}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white/70">Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white">
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_code} — {s.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold text-white/70">Section Code</label>
            <input value={sectionCode} onChange={e => setSectionCode(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-white/70">Capacity</label>
            <input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" />
          </div>
          <div>
            <label className="text-sm font-semibold text-white/70">Schedule <span className="text-white/30 font-normal">(optional)</span></label>
            <input value={schedule} onChange={e => setSchedule(e.target.value)} placeholder="e.g. MWF 8:00-9:30 AM"
              className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SectionsPage({ nightMode, onToggleNight }) {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [editingSection, setEditingSection] = useState(null);

  const [subjectId, setSubjectId] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [capacity, setCapacity] = useState(30);
  const [schedule, setSchedule] = useState('');
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
        fetch('/accounts/api/subjects/', { credentials: 'include' }),
        fetch('/accounts/api/sections/', { credentials: 'include' }),
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

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/accounts/api/sections/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ subject: Number(subjectId), section_code: sectionCode, capacity: Number(capacity), schedule }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || data.message || 'Failed to add section');
        return;
      }
      const subj = subjectById.get(String(subjectId));
      setToast({ msg: `✓ Section "${sectionCode}" created for ${subj?.subject_code || 'subject'}.`, type: 'success' });
      setSectionCode(''); setCapacity(30); setSchedule('');
      await fetchAll();
    } catch {
      setError('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-animated">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      {editingSection && (
        <EditModal
          section={editingSection}
          subjects={subjects}
          onClose={() => setEditingSection(null)}
          onSave={async () => {
            setEditingSection(null);
            setToast({ msg: '✓ Section updated successfully.', type: 'success' });
            await fetchAll();
          }}
        />
      )}
      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate('/dashboard')} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20">
            ← Dashboard
          </button>
          <h2 className="text-3xl font-bold text-white">Create Sections</h2>
          <p className="text-white/70 mt-2">Create and manage sections.</p>

          <form onSubmit={handleCreate} className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            {error && <div className="mb-4 rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">{error}</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Subject</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400 [&>option]:bg-[#1e0b4d] [&>option]:text-white" required>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.subject_code} — {s.title}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Section Code</label>
                <input value={sectionCode} onChange={(e) => setSectionCode(e.target.value)} placeholder="e.g. A, B, BSCS-1A"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" required />
              </div>
              <div>
                <label className="text-sm font-semibold text-white/70">Capacity</label>
                <input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)}
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" required />
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-white/70">Schedule <span className="text-white/30 font-normal">(optional)</span></label>
                <input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="e.g. MWF 8:00-9:30 AM"
                  className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>
            <button type="submit" disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-lg font-semibold text-white shadow-xl transition hover:brightness-110 disabled:opacity-50">
              {submitting ? 'Creating…' : '+ Create Section'}
            </button>
          </form>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">Sections <span className="text-sm text-white/40 font-normal">({sections.length})</span></h3>
            {loading ? <p className="text-white/50 text-sm">Loading…</p> : (
              <div className="overflow-auto">
                <table className="min-w-full text-sm text-white/80">
                  <thead>
                    <tr className="text-white/50 text-left text-xs uppercase tracking-widest">
                      <th className="py-2 pr-6">Subject</th>
                      <th className="py-2 pr-6">Section</th>
                      <th className="py-2 pr-6">Schedule</th>
                      <th className="py-2 pr-6">Capacity</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections.map((sec) => {
                      const subj = subjectById.get(String(sec.subject));
                      return (
                        <tr key={sec.id} className="border-t border-white/10 hover:bg-white/5 group">
                          <td className="py-3 pr-6">
                            <span className="font-semibold text-white">{subj?.subject_code || `#${sec.subject}`}</span>
                            <div className="text-xs text-white/40">{subj?.title}</div>
                          </td>
                          <td className="py-3 pr-6"><span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{sec.section_code}</span></td>
                          <td className="py-3 pr-6 text-white/50 text-xs">{sec.schedule || '—'}</td>
                          <td className="py-3 pr-6"><span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{sec.capacity} slots</span></td>
                          <td className="py-3">
                            <button
                              onClick={() => setEditingSection(sec)}
                              className="text-xs bg-blue-500/10 border border-blue-400/30 text-blue-300 px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transition hover:bg-blue-500/20"
                            >
                              ✏ Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {sections.length === 0 && (
                      <tr><td colSpan={5} className="py-6 text-center text-white/40">No sections yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <button onClick={onToggleNight} className="fixed bottom-6 right-6 z-50 rounded-full border border-white/20 bg-white/10 p-3 text-xl shadow-xl backdrop-blur transition hover:bg-white/20" title="Toggle night mode">
        {nightMode ? '☀️' : '🌙'}
      </button>
    </div>
  );
}