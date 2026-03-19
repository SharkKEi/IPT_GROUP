import { useEffect, useMemo, useState } from 'react';

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
  const stats = useMemo(
    () => [
      { label: 'Total Students', value: 1287, icon: '🎓' },
      { label: 'Active Sections', value: 32, icon: '🏫' },
      { label: 'Pending Requests', value: 14, icon: '🕒' },
      { label: 'Attendance Today', value: 94, icon: '✅' },
    ],
    [],
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
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <p className="text-sm text-white/70">Latest actions across the system.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Live
              </span>
            </div>

            <div className="mt-6 space-y-3">
              {[
                { time: 'Just now', action: 'New student enrolled: Alicia M.' },
                { time: '8 min ago', action: 'Section added: Math 101 - A' },
                { time: '22 min ago', action: 'Attendance submitted for Grade 9' },
                { time: '1 hr ago', action: 'New request: Classroom change' },
              ].map((item) => (
                <div key={item.time} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{item.action}</p>
                    <p className="mt-1 text-xs text-white/60">{item.time}</p>
                  </div>
                  <div className="text-sm font-semibold text-white/80">›</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
            <p className="mt-1 text-sm text-white/70">Jump straight into common tasks.</p>

            <div className="mt-6 grid gap-3">
              {[
                { label: 'Add student', emoji: '➕' },
                { label: 'Create section', emoji: '🧩' },
                { label: 'Review requests', emoji: '📝' },
                { label: 'Generate report', emoji: '📊' },
              ].map((action) => (
                <button
                  key={action.label}
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
          © {new Date().getFullYear()} Student Enrollment & Sectioning System. Designed for a clean, modern dashboard experience.
        </footer>
      </div>
    </div>
  );
}
