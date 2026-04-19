import { useEffect, useState } from 'react';

export default function EnrollmentSummaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/accounts/api/enrollment-summary/');
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
          <h2 className="text-3xl font-bold text-white">Enrollment Summary</h2>
          <p className="text-white/70 mt-2">Total enrolled units + breakdown by student/subject.</p>

          {error && (
            <div className="mt-6 rounded-3xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">
              {error}
            </div>
          )}

          {loading ? (
            <p className="text-white/70 mt-6">Loading…</p>
          ) : summary ? (
            <>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <div className="text-xs text-white/60 font-semibold">Total Enrollments</div>
                  <div className="text-3xl font-bold text-white mt-1">{summary.total_enrollments}</div>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <div className="text-xs text-white/60 font-semibold">Total Enrolled Units</div>
                  <div className="text-3xl font-bold text-white mt-1">{summary.total_enrolled_units}</div>
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white">By Student</h3>
                  <div className="mt-4 overflow-auto">
                    <table className="min-w-full text-sm text-white/80">
                      <thead>
                        <tr className="text-white/70 text-left">
                          <th className="py-2 pr-6">Student</th>
                          <th className="py-2 pr-6">Subjects</th>
                          <th className="py-2">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.per_student?.map((s) => (
                          <tr key={s.student_id} className="border-t border-white/10">
                            <td className="py-2 pr-6">{s.full_name}</td>
                            <td className="py-2 pr-6">{s.subjects_enrolled}</td>
                            <td className="py-2">{s.units_total}</td>
                          </tr>
                        ))}
                        {(!summary.per_student || summary.per_student.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-4 text-white/60">
                              No enrollments yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white">By Subject</h3>
                  <div className="mt-4 overflow-auto">
                    <table className="min-w-full text-sm text-white/80">
                      <thead>
                        <tr className="text-white/70 text-left">
                          <th className="py-2 pr-6">Subject</th>
                          <th className="py-2 pr-6">Students</th>
                          <th className="py-2">Units</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summary.per_subject?.map((sub) => (
                          <tr key={sub.subject_code} className="border-t border-white/10">
                            <td className="py-2 pr-6">{sub.subject_code}</td>
                            <td className="py-2 pr-6">{sub.students_enrolled}</td>
                            <td className="py-2">{sub.units_total}</td>
                          </tr>
                        ))}
                        {(!summary.per_subject || summary.per_subject.length === 0) && (
                          <tr>
                            <td colSpan={3} className="py-4 text-white/60">
                              No enrollments yet.
                            </td>
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

