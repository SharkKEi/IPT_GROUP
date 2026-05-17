import { Link, useLocation, useNavigate } from 'react-router-dom';
import { canManageSchool, isAdmin } from '../api/client';
import Chatbot from './Chatbot';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { to: '/profile', label: 'Profile', icon: '👤' },
  { to: '/students', label: 'Students', icon: '🎓', staffOnly: true },
  { to: '/subjects', label: 'Subjects', icon: '📚', staffOnly: true },
  { to: '/sections', label: 'Sections', icon: '🧩', staffOnly: true },
  { to: '/enrollments', label: 'Enrollments', icon: '✅', staffOnly: true },
  { to: '/summary', label: 'Summary', icon: '📊' },
  { to: '/users', label: 'Users', icon: '🛡️', adminOnly: true },
];

export default function AppShell({ user, onLogout, nightMode, onToggleNight, children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.role || 'user';
  const links = NAV.filter((item) => {
    if (item.adminOnly) return isAdmin(role);
    if (item.staffOnly) return canManageSchool(role);
    return true;
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-animated">
      <Chatbot />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-black/20 p-6 backdrop-blur-md lg:flex">
          <h2 className="text-lg font-bold text-white">School Portal</h2>
          <p className="mt-1 text-xs text-white/50 capitalize">{role} account</p>
          <nav className="mt-8 flex flex-col gap-1">
            {links.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  location.pathname === item.to
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 px-6 py-4 backdrop-blur-md">
            <div className="lg:hidden">
              <select
                className="rounded-lg bg-white/10 px-3 py-2 text-sm text-white"
                value={location.pathname}
                onChange={(e) => navigate(e.target.value)}
              >
                {links.map((item) => (
                  <option key={item.to} value={item.to} className="text-black">
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <button type="button" onClick={onToggleNight} className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white">
                {nightMode ? '☀️' : '🌙'}
              </button>
              <button type="button" onClick={onLogout} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                Log out
              </button>
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-sm font-bold text-white"
              >
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="" className="h-full w-full object-cover" />
                ) : (
                  user?.username?.[0]?.toUpperCase() || 'U'
                )}
              </button>
            </div>
          </header>
          <main className="flex-1 p-6 lg:p-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
