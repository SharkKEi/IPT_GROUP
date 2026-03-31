import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import EnrollmentSummaryPage from './pages/EnrollmentSummaryPage.jsx'
import EnrollmentsPage from './pages/EnrollmentsPage.jsx'
import SectionsPage from './pages/SectionsPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import SubjectsPage from './pages/SubjectsPage.jsx'

function App() {
  const [formData, setFormData ] = useState({ username: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nightMode, setNightMode] = useState(() => {
    return localStorage.getItem('nightMode') === 'true';
  });
  const navigate = useNavigate();

  // Apply night class to <html> element
  useEffect(() => {
    const root = document.documentElement;
    if (nightMode) {
      root.classList.add('night');
    } else {
      root.classList.remove('night');
    }
    localStorage.setItem('nightMode', nightMode);
  }, [nightMode]);

  useEffect(() => {
    document.title = 'School Portal';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/accounts/api/login/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({ ...formData, remember }),
      });
      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser({ username: data.user || formData.username });
        setError('');
        navigate('/dashboard');
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.detail || data.message || 'Invalid credentials');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setFormData({ username: '', password: '' });
    setError('');
    setRemember(true);
    navigate('/');
  };

  const loginPage = (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/originals/50/65/1e/50651e95ae192df7dddf0ddc8e92a284.jpg')] bg-cover bg-center opacity-20" />
      </div>

      {/* Night mode toggle on login page */}
      <button
        onClick={() => setNightMode(n => !n)}
        className="absolute top-6 right-6 z-10 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
        title={nightMode ? 'Switch to Day' : 'Switch to Night'}
      >
        {nightMode ? '☀️' : '🌙'}
      </button>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-white/10 rounded-3xl" />
          <div className="relative z-10 rounded-3xl bg-black/30 border border-white/10 shadow-2xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white">Login</h1>
              <p className="text-sm text-white/70 mt-2">Use your credentials to access the portal.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Username</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15.5c2.571 0 4.99 .722 7.121 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input type="text" placeholder="Username" value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                    required disabled={loading} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v7a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <input type="password" placeholder="Password" value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                    required disabled={loading} />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/70">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-blue-400" />
                  Remember me
                </label>
                <a href="#" className="font-semibold text-white/80 hover:text-white">Forgot password?</a>
              </div>

              <button type="submit" disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50">
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <p className="text-center text-sm text-white/60">
                Don't have an account? <span className="font-semibold text-white/80">Contact your administrator</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  const withNightToggle = (Component, extraProps = {}) => (
    <Component
      user={user}
      onLogout={handleLogout}
      nightMode={nightMode}
      onToggleNight={() => setNightMode(n => !n)}
      {...extraProps}
    />
  );

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : loginPage} />
      <Route path="/dashboard" element={isLoggedIn ? withNightToggle(Dashboard) : <Navigate to="/" replace />} />
      <Route path="/students" element={isLoggedIn ? <StudentsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace /> } />
      <Route path="/subjects" element={isLoggedIn ? <SubjectsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace /> } />
      <Route path="/sections" element={isLoggedIn ? <SectionsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace /> } />
      <Route path="/enrollments" element={isLoggedIn ? <EnrollmentsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace /> } />
      <Route path="/summary" element={isLoggedIn ? <EnrollmentSummaryPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace /> } />
    </Routes>
  );
}

export default App;
