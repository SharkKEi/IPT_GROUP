import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { canManageSchool, isAdmin } from '../api/client';

/* ── Count-up hook ── */
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    return () => setValue(target);
  }, [target, duration]);
  return value;
}

/* ══ Particle Header canvas ══ */
function ParticleHeader({ isDay, children }) {
  const canvasRef = useRef(null);
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf, W, H;
    const COLORS_DAY = ['#7dd3fc', '#c4b5fd', '#6ee7b7', '#fcd34d', '#f9a8d4', '#fde68a'];
    const COLORS_NIGHT = ['#ffffff', '#87ddfe', '#acaaff', '#1bffc2', '#f88aff', '#ffd580'];
    const colors = isDay ? COLORS_DAY : COLORS_NIGHT;
    const SHAPES = ['c', 's', 't'];
    const resize = () => { W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random() * 1200, y: Math.random() * 300,
      r: 4 + Math.random() * 26,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 0.45,
      opacity: 0.10 + Math.random() * 0.32,
    }));
    const draw = (p) => {
      ctx.save(); ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color; ctx.translate(p.x, p.y);
      if (p.shape === 'c') { ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); }
      else if (p.shape === 's') { ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); }
      else { ctx.beginPath(); ctx.moveTo(0, -p.r); ctx.lineTo(p.r, p.r); ctx.lineTo(-p.r, p.r); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    };
    const animate = () => {
      ctx.clearRect(0, 0, W, H); ctx.save(); ctx.transform(1, 0, Math.tan(-0.035), 1, 0, 0);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -50) p.x = W + 50; if (p.x > W + 50) p.x = -50;
        if (p.y < -50) p.y = H + 50; if (p.y > H + 50) p.y = -50;
        draw(p);
      });
      ctx.restore(); raf = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [isDay]);

  const bg = isDay
    ? 'linear-gradient(120deg,#1e40af,#0369a1,#4338ca,#0369a1,#1e40af)'
    : 'linear-gradient(120deg,#0a1628,#0d2a54,#1a3a7a,#0a1628)';

  return (
    <div className="header-canvas-wrap mb-8 rounded-2xl shadow-2xl overflow-hidden" style={{ minHeight: 130, position: 'relative' }}>
      <div className="absolute inset-0 rounded-2xl overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0" style={{ background: bg }} />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ display: 'block' }} />
      </div>
      <div className="relative px-8 py-7 flex items-center justify-between" style={{ zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
}

/* ══ Orb Layer ══ */
function OrbLayer({ orbs }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none" style={{ zIndex: 0 }}>
      {orbs.map((o, i) => (
        <div key={i} className="orb" style={{ width: o.size, height: o.size, left: o.left, top: o.top, background: o.color, animationDelay: `${o.delay}s` }} />
      ))}
    </div>
  );
}

/* ══ Stat Card ══ */
function StatCard({ label, value, icon, accentClass, isDay, orbs }) {
  const count = useCountUp(value, 1200);
  return (
    <div className={`glass-card ${isDay ? 'glass-day' : 'glass-night'} flex flex-col justify-between p-6 rounded-2xl relative overflow-hidden cursor-default transition-all duration-300 ease-out`}>
      <OrbLayer orbs={orbs} />
      <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-2xl ${accentClass}`} style={{ zIndex: 1 }} />
      <div className="relative flex items-center justify-between w-full mt-2" style={{ zIndex: 1 }}>
        <div className={`text-5xl font-extrabold tracking-tight ${isDay ? 'text-slate-800' : 'text-white'}`}>{count}</div>
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl ${isDay ? 'bg-white/70 shadow' : 'bg-white/10'}`}>{icon}</div>
      </div>
      <p className={`relative mt-5 text-sm font-semibold uppercase tracking-widest ${isDay ? 'text-slate-600' : 'text-white/60'}`} style={{ zIndex: 1 }}>{label}</p>
    </div>
  );
}

/* ══ Notification Bell ══ */
function NotifBell({ isDay }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [read, setRead] = useState(false);

  useEffect(() => {
    const build = async () => {
      try {
        const [eRes, secRes, sRes] = await Promise.all([
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/enrollments/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/sections/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/students/', { credentials: 'include' }),
        ]);
        const arr = async (res) => { const d = await res.json(); return Array.isArray(d) ? d : d.results || []; };
        const [enrollments, sections, students] = await Promise.all([arr(eRes), arr(secRes), arr(sRes)]);

        const items = [];
        [...enrollments].reverse().slice(0, 3).forEach(e => {
          const s = students.find(st => String(st.id) === String(e.student));
          items.push({
            id: `enroll-${e.id}`, icon: '✅',
            text: `${s?.full_name || 'A student'} was enrolled in section #${e.section}`,
            time: 'Recent', color: 'text-emerald-500', to: '/enrollments',
          });
        });
        sections.forEach(sec => {
          const count = enrollments.filter(e => String(e.section) === String(sec.id)).length;
          const cap = sec.capacity || sec.max_students || 0;
          if (cap > 0 && count >= cap * 0.9) {
            items.push({
              id: `cap-${sec.id}`, icon: '⚠️',
              text: `Section "${sec.section_code || sec.name || sec.id}" is almost full (${count}/${cap})`,
              time: 'Now', color: 'text-amber-500', to: '/sections',
            });
          }
        });
        if (students.length > 0) {
          items.push({
            id: 'students-total', icon: '🎓',
            text: `${students.length} student${students.length !== 1 ? 's' : ''} registered in the system`,
            time: 'Info', color: 'text-sky-500', to: '/students',
          });
        }
        setNotifs(items.slice(0, 5));
      } catch { /* silently fail */ }
    };
    build();
  }, []);

  const hasUnread = notifs.length > 0 && !read;

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(o => !o); setRead(true); }}
        className={`relative rounded-xl p-2.5 border transition ${isDay
          ? 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white/90'
          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDay ? 'bg-white border-slate-100' : 'bg-[#0d1f3c] border-white/10'}`}>
            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDay ? 'border-slate-100' : 'border-white/10'}`}>
              <p className={`text-sm font-bold ${isDay ? 'text-slate-800' : 'text-white'}`}>
                Notifications
                {notifs.length > 0 && (
                  <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-500">{notifs.length}</span>
                )}
              </p>
              <button onClick={() => setOpen(false)} className={`text-lg ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifs.length === 0 ? (
                <div className={`text-xs text-center py-8 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>
                  <div className="text-3xl mb-2">🔔</div>No notifications yet
                </div>
              ) : notifs.map((n) => (
                <button key={n.id}
                  onClick={() => { if (n.to) { setOpen(false); setRead(true); navigate(n.to); } }}
                  className={`w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 text-left transition
                    ${n.to ? 'cursor-pointer' : 'cursor-default'}
                    ${isDay ? 'border-slate-50 hover:bg-sky-50' : 'border-white/5 hover:bg-white/5'}`}>
                  <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${isDay ? 'text-slate-700' : 'text-white/80'}`}>{n.text}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-[10px] font-semibold ${n.color}`}>{n.time}</p>
                      {n.to && <p className={`text-[10px] ${isDay ? 'text-slate-400' : 'text-white/30'}`}>View →</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══ Toast ══ */
function Toast({ msg, type, onClose }) {
  useEffect(() => { if (!msg) return; const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [msg]);
  if (!msg) return null;
  const c = type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'bg-red-50 border-red-300 text-red-800';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-2xl ${c}`}>
      <span>{type === 'success' ? '✓' : '✗'} {msg}</span>
      <button onClick={onClose} className="opacity-50 hover:opacity-100 ml-2 text-lg">×</button>
    </div>
  );
}

/* ══ School Building ══ */
function SchoolSilhouette({ isDay }) {
  const blendMode = isDay ? 'multiply' : 'screen';
  const opacity = isDay ? 0.35 : 0.22;
  return (
    <div className="pointer-events-none select-none fixed bottom-0 right-0 z-0"
      style={{ width: 1100, height: 750, overflow: 'hidden', zIndex: 1 }}>
      <img src="/school-bg.png" alt="" style={{
        width: '100%', height: '100%',
        objectFit: 'contain', objectPosition: 'right bottom',
        opacity, mixBlendMode: blendMode,
        filter: isDay ? 'grayscale(20%) contrast(1.05)' : 'grayscale(40%) contrast(1.1) brightness(1.5)',
        maskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0) 85%)',
        WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0) 85%)',
      }} />
    </div>
  );
}

const NAV_ITEMS = [
  { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
  { label: 'Students', icon: '🎓', to: '/students', staffOnly: true },
  { label: 'Subjects', icon: '📚', to: '/subjects', staffOnly: true },
  { label: 'Sections', icon: '🏫', to: '/sections', staffOnly: true },
  { label: 'Enrollments', icon: '✅', to: '/enrollments', staffOnly: true },
  { label: 'Summary', icon: '📊', to: '/summary' },
  { label: 'Users', icon: '🛡️', to: '/users', adminOnly: true },
];

/* ══ Sidebar ══ */
function SidebarContent({ navigate, onToggleNight, nightMode, onLogout, user, onClose }) {
  const location = useLocation();
  const isDay = !nightMode;
  const role = user?.role || 'user';

  return (
    <div className={`flex flex-col h-full ${isDay ? 'sidebar-day' : 'sidebar-night'}`}>
      {/* Profile block */}
      <div className="px-5 pt-7 pb-5 border-b border-white/10">
        <div className="flex items-start justify-between mb-3">
          <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-extrabold overflow-hidden shadow-lg ring-2 ring-amber-400/40 text-[#0a1628] flex-shrink-0">
            {user?.profile_picture
              ? <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
              : user?.username?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={onToggleNight}
            className="rounded-full bg-white/10 hover:bg-white/25 transition p-2 text-white/70 hover:text-white mt-1">
            <span className="text-lg">{isDay ? '🌙' : '☀️'}</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-white leading-tight truncate">
            {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User'}
          </p>
          <button onClick={() => { navigate('/profile'); onClose?.(); }} title="Edit profile"
            className="shrink-0 rounded-full p-1 bg-white/10 hover:bg-amber-400/20 hover:text-amber-300 text-white/50 transition">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-white/40 mt-0.5 truncate">@{user?.username || 'user'}</p>
        {user?.role && (
          <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
            ${role === 'admin' ? 'bg-amber-400/20 text-amber-300' : role === 'staff' ? 'bg-sky-400/20 text-sky-300' : 'bg-white/10 text-white/40'}`}>
            {role}
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto px-3 pt-3 gap-1">
        <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">General</p>
        {[
          { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
          { label: 'Profile', icon: '👤', to: '/profile' },
        ].map(item => {
          const active = location.pathname === item.to;
          return (
            <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
            </button>
          );
        })}

        <div className="my-2 border-t border-white/10" />
        <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Management</p>
        {NAV_ITEMS.filter(item => {
          if (item.adminOnly) return false;
          if (item.staffOnly) return canManageSchool(role);
          return !['Dashboard', 'Profile'].includes(item.label);
        }).map(item => {
          const active = location.pathname === item.to;
          return (
            <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
              <span className="text-lg w-6 text-center">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
            </button>
          );
        })}

        {isAdmin(role) && (<>
          <div className="my-2 border-t border-white/10" />
          <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Admin</p>
          {NAV_ITEMS.filter(i => i.adminOnly).map(item => {
            const active = location.pathname === item.to;
            return (
              <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                  ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span>{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
              </button>
            );
          })}
        </>)}

        <div className="flex-1" />
        <div className="border-t border-white/10 mt-2" />
        <button onClick={onLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/15 hover:text-red-300 transition text-[15px] font-medium border border-transparent w-full">
          <span className="text-lg w-6 text-center">🚪</span><span>Log Out</span>
        </button>
        <p className="px-4 py-2 text-[11px] text-white/20 font-medium tracking-widest uppercase">School Portal v1.0</p>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
}

const CARD_ORBS = [
  [{ size: '180px', left: '-40px', top: '-40px', color: 'rgba(56,189,248,0.45)', delay: 0 }, { size: '120px', left: '60%', top: '20px', color: 'rgba(99,102,241,0.35)', delay: -1.5 }],
  [{ size: '160px', left: '-30px', top: '-30px', color: 'rgba(251,146,60,0.45)', delay: -0.8 }, { size: '110px', left: '55%', top: '30px', color: 'rgba(250,204,21,0.35)', delay: -2 }],
  [{ size: '170px', left: '-35px', top: '-35px', color: 'rgba(52,211,153,0.45)', delay: -1.2 }, { size: '130px', left: '60%', top: '10px', color: 'rgba(56,189,248,0.30)', delay: -2.5 }],
  [{ size: '160px', left: '-40px', top: '-40px', color: 'rgba(167,139,250,0.45)', delay: -0.4 }, { size: '120px', left: '50%', top: '20px', color: 'rgba(244,114,182,0.35)', delay: -1.8 }],
];
const PANEL_ORBS_LEFT = [
  { size: '300px', left: '-80px', top: '-70px', color: 'rgba(56,189,248,0.20)', delay: 0 },
  { size: '240px', left: '45%', top: '30%', color: 'rgba(99,102,241,0.16)', delay: -1.5 },
  { size: '200px', left: '72%', top: '-50px', color: 'rgba(52,211,153,0.14)', delay: -2.8 },
];
const PANEL_ORBS_RIGHT = [
  { size: '220px', left: '-60px', top: '-50px', color: 'rgba(251,146,60,0.22)', delay: -0.6 },
  { size: '180px', left: '48%', top: '42%', color: 'rgba(167,139,250,0.18)', delay: -2 },
];

/* ════════════════════════════════════════
   MAIN DASHBOARD
════════════════════════════════════════ */
export default function Dashboard({ user, onLogout, nightMode, onToggleNight }) {
  const navigate = useNavigate();
  const isDay = !nightMode;
  const [toast, setToast] = useState({ msg: '', type: '' });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalSections, setTotalSections] = useState(0);
  const [totalSubjects, setTotalSubjects] = useState(0);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [sR, eR, secR, subR] = await Promise.all([
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/students/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/enrollments/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/sections/', { credentials: 'include' }),
          fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/subjects/', { credentials: 'include' }),
        ]);
        const [sD, eD, secD, subD] = await Promise.all([sR.json(), eR.json(), secR.json(), subR.json()]);
        const arr = d => Array.isArray(d) ? d : d.results || [];
        const sList = arr(sD), eList = arr(eD), secList = arr(secD), subList = arr(subD);
        setTotalStudents(sList.length); setTotalEnrollments(eList.length);
        setTotalSections(secList.length); setTotalSubjects(subList.length);
        setStudents(sList); setSubjects(subList);
        setRecentEnrollments([...eList].reverse().slice(0, 5));
      } catch (e) { console.error(e); }
    })();
  }, []);

  const studentById = useMemo(() => Object.fromEntries(students.map(s => [String(s.id), s])), [students]);
  const subjectById = useMemo(() => Object.fromEntries(subjects.map(s => [String(s.id), s])), [subjects]);

  const stats = useMemo(() => [
    { label: 'Total Students', value: totalStudents, icon: '🎓', accentClass: 'bg-sky-400', orbs: CARD_ORBS[0] },
    { label: 'Total Subjects', value: totalSubjects, icon: '📚', accentClass: 'bg-amber-400', orbs: CARD_ORBS[1] },
    { label: 'Active Sections', value: totalSections, icon: '🏫', accentClass: 'bg-emerald-400', orbs: CARD_ORBS[2] },
    { label: 'Total Enrollments', value: totalEnrollments, icon: '✅', accentClass: 'bg-violet-400', orbs: CARD_ORBS[3] },
  ], [totalStudents, totalSubjects, totalSections, totalEnrollments]);

  const role = user?.role || 'user';
  
  const quickActions = useMemo(() => {
  const all = [
    { label: 'Add Student', emoji: '➕', to: '/students', staffOnly: true },
    { label: 'Add Subject', emoji: '📚', to: '/subjects', staffOnly: true },
    { label: 'Create Section', emoji: '🧩', to: '/sections', staffOnly: true },
    { label: 'Enroll Student', emoji: '🎯', to: '/enrollments', staffOnly: true },
    { label: 'View Summary', emoji: '📊', to: '/summary' },
  ];
  return all.filter(a => !a.staffOnly || canManageSchool(role));
}, [role]);

  const glassCard = `glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-2xl transition-all duration-300`;
  const textH = isDay ? 'text-slate-800' : 'text-white';
  const textS = isDay ? 'text-slate-500' : 'text-white/50';
  const accent = isDay ? 'text-sky-600' : 'text-amber-400';
  const rowCls = isDay ? 'row-day' : 'row-night';

  return (
    <div className={`flex min-h-screen ${isDay ? 'bg-hue-day' : 'bg-hue-night'}`}>

      <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: '', type: '' })} />
      <SchoolSilhouette isDay={isDay} />

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 min-h-screen shrink-0">
        <SidebarContent navigate={navigate} onToggleNight={onToggleNight}
          nightMode={nightMode} onLogout={onLogout} user={user} />
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col" onClick={e => e.stopPropagation()}>
            <SidebarContent navigate={navigate} onToggleNight={onToggleNight}
              nightMode={nightMode} onLogout={onLogout} user={user}
              onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">

        {/* Top bar — notification bell only, no chat button */}
        <header className={`${isDay ? 'topbar-day' : 'topbar-night'} border-b px-6 lg:px-10 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm`}>
          <button className={`lg:hidden rounded-xl border p-2.5 transition shrink-0
            ${isDay ? 'border-slate-200 bg-white/70 text-slate-600' : 'border-white/10 bg-white/5 text-white/70'}`}
            onClick={() => setMobileMenuOpen(true)}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight leading-none ${textH}`}>Dashboard</h1>
            <p className={`text-sm mt-1 ${textS}`}>
              Good {getGreeting()}, <span className={`font-semibold ${accent}`}>{user?.username || 'there'}</span>
            </p>
          </div>
          <NotifBell isDay={isDay} />
          <div className="hidden lg:flex flex-col items-end shrink-0">
            <p className={`text-base font-bold leading-none ${textH}`}>
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </p>
            <p className={`text-xs mt-0.5 ${textS}`}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        <motion.main
          className="flex-1 px-6 lg:px-10 py-8"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          <ParticleHeader isDay={isDay}>
            <div>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="text-amber-300">{user?.username || 'there'}</span> 👋
              </h2>
              <p className="mt-1.5 text-white/70 text-sm lg:text-base">Here's what's happening in your school today.</p>
            </div>
          </ParticleHeader>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {stats.map(stat => <StatCard key={stat.label} {...stat} isDay={isDay} />)}
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            <div className={`${glassCard} lg:col-span-2 p-6 relative overflow-hidden`}>
              <OrbLayer orbs={PANEL_ORBS_LEFT} />
              <div className="relative flex items-center justify-between mb-5" style={{ zIndex: 1 }}>
                <div>
                  <h2 className={`text-lg font-bold ${textH}`}>Recent Enrollments</h2>
                  <p className={`text-sm mt-0.5 ${textS}`}>Latest activity across the system.</p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> LIVE
                </span>
              </div>
              <div className="relative space-y-2" style={{ zIndex: 1 }}>
                {recentEnrollments.length === 0 ? (
                  <div className={`text-center py-12 ${textS}`}><div className="text-4xl mb-3">📭</div>No enrollments yet.</div>
                ) : recentEnrollments.map(e => {
                  const student = studentById[String(e.student)];
                  const subject = subjectById[String(e.subject)];
                  return (
                    <div key={e.id} className={`${rowCls} flex items-center justify-between rounded-xl border px-4 py-3.5 transition-all duration-200 ease-out hover:scale-[1.01] hover:shadow-md`}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ background: 'linear-gradient(135deg,#0d2a50,#1a4a8e)' }}>
                          {student?.full_name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${textH}`}>{student?.full_name || `Student #${e.student}`}</p>
                          <p className={`text-xs mt-0.5 ${textS}`}>
                            Enrolled in <span className={`font-semibold ${accent}`}>{subject?.subject_code || `Subject #${e.subject}`}</span>
                            <span className="mx-1.5 opacity-30">·</span>
                            Section <span className={isDay ? 'text-slate-600' : 'text-white/60'}>#{e.section}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-xs shrink-0 ml-3 font-mono opacity-30">#{e.id}</div>
                    </div>
                  );
                })}
              </div>
              {recentEnrollments.length > 0 && (
                <button onClick={() => navigate('/enrollments')} style={{ zIndex: 1, position: 'relative' }}
                  className={`mt-4 w-full rounded-xl border py-2.5 text-sm font-semibold transition-all duration-200 ease-out hover:scale-[1.01]
                    ${isDay ? 'border-sky-200 bg-white/50 text-sky-700 hover:bg-white/80 hover:shadow-md' : 'border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10'}`}>
                  View All Enrollments →
                </button>
              )}
            </div>

            <div className={`${glassCard} p-6 relative overflow-hidden`}>
              <OrbLayer orbs={PANEL_ORBS_RIGHT} />
              <h2 className={`relative text-lg font-bold ${textH}`} style={{ zIndex: 1 }}>Quick Actions</h2>
              <p className={`relative mt-1 text-sm ${textS}`} style={{ zIndex: 1 }}>Jump straight into common tasks.</p>
              <div className="relative mt-5 grid gap-2.5" style={{ zIndex: 1 }}>
                {quickActions.map(action => (
                  <button key={action.label} onClick={() => navigate(action.to)}
                    className={`flex items-center justify-between rounded-xl border px-4 py-4 text-left transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md active:scale-[0.99]
                      ${isDay ? 'border-slate-200 bg-white/55 hover:bg-white/85 text-slate-700' : 'border-white/10 bg-white/5 hover:bg-white/12 text-white/85'}`}>
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{action.emoji}</span>
                      <span className="text-sm font-semibold">{action.label}</span>
                    </span>
                    <span className={`text-lg ${isDay ? 'text-slate-400' : 'text-white/30'}`}>›</span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        </motion.main>

        <footer className={`py-6 text-center text-xs border-t ${isDay ? 'text-slate-400 border-slate-200/60' : 'text-white/20 border-white/8'}`}>
          © {new Date().getFullYear()} Student Enrollment &amp; Sectioning System
        </footer>
      </div>
    </div>
  );
}