import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
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

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  
  // State to hold our dynamic data
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeSections, setActiveSections] = useState(0);
  const [sectionsList, setSectionsList] = useState([]); // NEW: State for our section overview

  useEffect(() => {
    // 1. Fetch Total Students
    fetch('http://127.0.0.1:8000/accounts/api/students/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTotalStudents(data.length);
      })
      .catch(err => console.error("Failed to fetch students", err));

    // 2. Fetch Enrollments for stats
    fetch('http://127.0.0.1:8000/accounts/api/enrollments/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const uniqueSections = new Set(data.map(enrollment => enrollment.section));
          setActiveSections(uniqueSections.size);
        }
      })
      .catch(err => console.error("Failed to fetch enrollments", err));

    // 3. NEW: Fetch ALL created sections for the Overview List
    fetch('http://127.0.0.1:8000/accounts/api/sections/')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSectionsList(data);
      })
      .catch(err => console.error("Failed to fetch sections", err));
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Total Students', value: totalStudents, icon: '🎓' },
      { label: 'Active Sections', value: activeSections, icon: '🏫' },
      { label: 'Pending Requests', value: 14, icon: '🕒' },
      { label: 'Attendance Today', value: 94, icon: '✅' },
    ],
    [totalStudents, activeSections],
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 10 }, (_, idx) => ({
        id: idx,
        size: 36 + Math.random() * 40,
        left: 8 + Math.random() * 84,
        top: 6 + Math.random() * 78,
        delay: Math.random() * 4,
        duration: 10 + Math.random() * 8,
      })),
    [],
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-animated">
      <div className="absolute inset-0 opacity-60">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-white/15 blur-2xl animate-float"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 px-6 pb-16 pt-10 lg:px-12">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white drop-shadow-lg">Dashboard</h1>
            <p className="mt-2 text-white/70">Hi {user?.username || 'there'}, here’s what’s happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur transition hover:bg-white/20 hover:text-white"
            >
              Log out
            </button>
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 shadow-xl shadow-black/20 flex items-center justify-center text-xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          
          {/* --- REPLACED RECENT ACTIVITY WITH SECTION OVERVIEW --- */}
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm flex flex-col max-h-[400px]">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Section Overview</h2>
                <p className="text-sm text-white/70">All sections currently registered in the system.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> {sectionsList.length} Total
              </span>
            </div>

            <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1">
              {sectionsList.length > 0 ? (
                sectionsList.map((section) => (
                  <div key={section.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4 transition hover:bg-white/5">
                    <div>
                      {/* Note: If your serializer returns a nested subject object, you might use section.subject.subject_code */}
                      <p className="text-sm font-semibold text-white">
                        Section Code: <span className="text-emerald-300">{section.section_code}</span>
                      </p>
                      <p className="mt-1 text-xs text-white/60">
                        Subject ID: {typeof section.subject === 'object' ? section.subject.subject_code : section.subject}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white/80">Capacity: {section.capacity}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/50 py-10">
                  <p>No sections have been created yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Core Features</h2>
            <p className="mt-1 text-sm text-white/70">Everything you need for student enrollment & sectioning.</p>

            <ul className="mt-4 space-y-1 text-white/80 text-sm list-disc pl-5">
              <li>Add students & subjects</li>
              <li>Create sections</li>
              <li>Enroll student in subject</li>
              <li>Section capacity control</li>
            </ul>

            <div className="mt-6 grid gap-3">
              {[
                { label: 'Add student', emoji: '➕', to: '/students' },
                { label: 'Add subject', emoji: '📚', to: '/subjects' },
                { label: 'Create section', emoji: '🧩', to: '/sections' },
                { label: 'Enroll student', emoji: '🎯', to: '/enrollments' },
                { label: 'Enrollment summary', emoji: '📊', to: '/summary' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.to)}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:bg-white/10 hover:shadow-lg hover:shadow-indigo-500/20"
                >
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