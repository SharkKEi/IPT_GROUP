import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => setValue(target);
  }, [target, duration]);
  return value;
}

function StatCard({ label, value, icon }) {
  const count = useCountUp(value, 1200);
  return (
    <div className="flex flex-col items-start justify-between p-6 rounded-3xl shadow-xl border border-white/10 bg-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between w-full">
        <div className="text-3xl font-semibold text-white">{count}</div>
        <div className="text-3xl text-white/60">{icon}</div>
      </div>
      <p className="mt-4 text-sm font-medium text-white/70">{label}</p>
    </div>
  );
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

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [toast, setToast] = useState({ msg: '', type: '' });

  // Live stats
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [studentsRes, enrollmentsRes, sectionsRes, subjectsRes] = await Promise.all([
          fetch('/accounts/api/students/', { credentials: 'include' }),
          fetch('/accounts/api/enrollments/', { credentials: 'include' }),
          fetch('/accounts/api/sections/', { credentials: 'include' }),
          fetch('/accounts/api/subjects/', { credentials: 'include' }),
        ]);
        const [studentsData, enrollmentsData, sectionsData, subjectsData] = await Promise.all([
          studentsRes.json(), enrollmentsRes.json(), sectionsRes.json(), subjectsRes.json(),
        ]);

        const sList = Array.isArray(studentsData) ? studentsData : studentsData.results || [];
        const eList = Array.isArray(enrollmentsData) ? enrollmentsData : enrollmentsData.results || [];
        const secList = Array.isArray(sectionsData) ? sectionsData : sectionsData.results || [];
        const subList = Array.isArray(subjectsData) ? subjectsData : subjectsData.results || [];

        setTotalStudents(sList.length);
        setTotalEnrollments(eList.length);
        setTotalSections(secList.length);
        setTotalSubjects(subList.length);
        setStudents(sList);
        setSubjects(subList);
        setRecentEnrollments([...eList].reverse().slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }
    };
    fetchStats();
  }, []);

  const studentById = useMemo(() => Object.fromEntries(students.map(s => [String(s.id), s])), [students]);
  const subjectById = useMemo(() => Object.fromEntries(subjects.map(s => [String(s.id), s])), [subjects]);

  const stats = useMemo(() => [
    { label: 'Total Students', value: totalStudents, icon: '🎓' },
    { label: 'Total Subjects', value: totalSubjects, icon: '📚' },
    { label: 'Active Sections', value: totalSections, icon: '🏫' },
    { label: 'Total Enrollments', value: totalEnrollments, icon: '✅' },
  ], [totalStudents, totalSubjects, totalSections, totalEnrollments]);

  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, idx) => ({
      id: idx,
      size: 36 + Math.random() * 40,
      left: 8 + Math.random() * 84,
      top: 6 + Math.random() * 78,
      delay: Math.random() * 4,
      duration: 10 + Math.random() * 8,
    })), []);

  const quickActions = [
    { label: 'Add student', emoji: '➕', to: '/students' },
    { label: 'Add subject', emoji: '📚', to: '/subjects' },
    { label: 'Create section', emoji: '🧩', to: '/sections' },
    { label: 'Enroll student', emoji: '🎯', to: '/enrollments' },
    { label: 'Enrollment summary', emoji: '📊', to: '/summary' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-animated">
      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />

      <div className="absolute inset-0 opacity-60">
        {particles.map((p) => (
          <span key={p.id} className="absolute rounded-full bg-white/15 blur-2xl animate-float"
            style={{ width: `${p.size}px`, height: `${p.size}px`, left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }} />
        ))}
      </div>

      <div className="relative z-10 px-6 pb-16 pt-10 lg:px-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Dashboard</h1>
            <p className="mt-2 text-white/70">Hi {user?.username || 'there'}, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onLogout} className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-white/20">
              Log out
            </button>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 shadow-xl flex items-center justify-center text-xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Live Stats */}
        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => <StatCard key={stat.label} {...stat} />)}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          {/* Recent Enrollments */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Enrollments</h2>
                <p className="text-sm text-white/70">Latest enrollment activity.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live
              </span>
            </div>
            <div className="space-y-3">
              {recentEnrollments.length === 0 ? (
                <div className="text-center py-8 text-white/30 text-sm">No enrollments yet. Start by enrolling a student!</div>
              ) : (
                recentEnrollments.map((e) => {
                  const student = studentById[String(e.student)];
                  const subject = subjectById[String(e.subject)];
                  return (
                    <div key={e.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-sm font-bold text-white shrink-0">
                          {student?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{student?.full_name || `Student #${e.student}`}</p>
                          <p className="text-xs text-white/50">enrolled in <span className="text-white/70">{subject?.subject_code || `Subject #${e.subject}`}</span> · Section #{e.section}</p>
                        </div>
                      </div>
                      <div className="text-xs text-white/30 shrink-0 ml-3">#{e.id}</div>
                    </div>
                  );
                })
              )}
            </div>
            {recentEnrollments.length > 0 && (
              <button onClick={() => navigate('/enrollments')} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 py-2 text-sm text-white/50 hover:text-white hover:bg-white/10 transition">
                View all enrollments →
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-white/70">Jump straight into common tasks.</p>
            <div className="mt-6 grid gap-3">
              {quickActions.map((action) => (
                <button key={action.label} onClick={() => navigate(action.to)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/20">
                  <span>
                    <span className="mr-2 text-lg">{action.emoji}</span>
                    <span className="font-medium">{action.label}</span>
                  </span>
                  <span className="text-white/60">›</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="mt-14 text-center text-xs text-white/50">
          © {new Date().getFullYear()} Student Enrollment & Sectioning System.
        </footer>
      </div>
    </div>
  );
}