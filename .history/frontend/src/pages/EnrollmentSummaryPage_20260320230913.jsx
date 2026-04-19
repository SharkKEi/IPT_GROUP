import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function EnrollmentSummaryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/accounts/api/enrollment-summary/', { credentials: 'include' });
      const data = await res.json();
      setSummary(data);
    } catch {
      setError('Failed to load enrollment summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="min-h-screen bg-animated">
      <div className="relative z-10 px-6 py-10 lg:px-12">
        <div className="max-w-4xl mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
          >
            ← Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white">Enrollment Summary</h2>
              <p className="text-white/70 mt-2">Total enrolled units + breakdown by student and subject.</p>
            </div>
            <button
              onClick={fetchSummary}
              className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/20"
            >
              ↺ Refresh
            </button>
          </div>

          {error && (
            <div className="mt-6 rounded-3xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-white/70 mt-6">Loading…</p>
          ) : summary ? (
            <>
              {/* Stats */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-widest">Total Enrollments</div>
                  <div className="text-4xl font-bold text-white mt-2">{summary.total_enrollments}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <div className="text-xs text-white/50 font-semibold uppercase tracking-widest">Total Enrolled Units</div>
                  <div className="text-4xl font-bold text-white mt-2">{summary.total_enrolled_units}</div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* By Student */}
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">By Student</h3>
                  <div className="overflow-auto">
                    <table className="min-w-full text-sm text-white/80">
                      <thead>
                        <tr className="text-white/50 text-left text-xs uppercase tracking-widest">
                          <th className="py-2 pr-6">Student</th>
                          <th className="py-2 pr-6">Subjects</th>
                          <th className="py-2">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.per_student?.map((s) => (
                          <tr key={s.student_id} className="border-t border-white/10 hover:bg-white/5">
                            <td className="py-3 pr-6">
                              <div className="font-semibold text-white">{s.full_name}</div>
                              <div className="text-xs text-white/40">{s.student_id}</div>
                            </td>
                            <td className="py-3 pr-6">
                              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{s.subjects_enrolled}</span>
                            </td>
                            <td className="py-3">
                              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full">{s.units_total} units</span>
                            </td>
                          </tr>
                        ))}
                        {(!summary.per_student || summary.per_student.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-white/40 text-sm">No enrollments yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* By Subject */}
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-4">By Subject</h3>
                  <div className="overflow-auto">
                    <table className="min-w-full text-sm text-white/80">
                      <thead>
                        <tr className="text-white/50 text-left text-xs uppercase tracking-widest">
                          <th className="py-2 pr-6">Subject</th>
                          <th className="py-2 pr-6">Students</th>
                          <th className="py-2">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.per_subject?.map((sub) => (
                          <tr key={sub.subject_code} className="border-t border-white/10 hover:bg-white/5">
                            <td className="py-3 pr-6">
                              <div className="font-semibold text-white">{sub.subject_code}</div>
                              <div className="text-xs text-white/40">{sub.title}</div>
                            </td>
                            <td className="py-3 pr-6">
                              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{sub.students_enrolled}</span>
                            </td>
                            <td className="py-3">
                              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">{sub.units_total} units</span>
                            </td>
                          </tr>
                        ))}
                        {(!summary.per_subject || summary.per_subject.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-white/40 text-sm">No enrollments yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-white/70 mt-6">No summary data.</p>
          )}
        </div>
      </div>
    </div>
  );
}