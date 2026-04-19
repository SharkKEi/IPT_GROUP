import { useEffect, useState } from 'react'
import Dashboard from './components/Dashboard.jsx'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import EnrollmentSummaryPage from './pages/EnrollmentSummaryPage.jsx'
import EnrollmentsPage from './pages/EnrollmentsPage.jsx'
import SectionsPage from './pages/SectionsPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import SubjectsPage from './pages/SubjectsPage.jsx'

function App() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

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
        headers: {
          'Content-Type': 'application/json',
        },
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
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAdminLogin = async () => {
    setError('');
    setLoading(true);

    const demoCreds = { username: 'admin', password: 'admin123' };

    try {
      const response = await fetch('/accounts/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...demoCreds, remember }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser({ username: data.user || demoCreds.username });
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

  const loginPage = (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[url('C:\Coding\IPT_GROUP\frontend\src\assets\login_background.png')] bg-cover bg-center opacity-30" />
        <div className="absolute inset-0">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className={`absolute rounded-full bg-white/20 blur-xl animate-pulse ${
                i % 2 === 0
                  ? 'w-4 h-4 left-12 top-16'
                  : 'w-3 h-3 right-16 top-28'
              }`}
              style={{ animationDelay: `${i * 200}ms` }}
            />
          ))}
        </div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 bg-white/10 rounded-3xl" />
          <div className="relative z-10 rounded-3xl bg-black/30 border border-white/10 shadow-2xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white">Login</h1>
              <p className="text-sm text-white/70 mt-2">Use your credentials to access the dashboard.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Username</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5.121 17.804A13.937 13.937 0 0112 15.5c2.571 0 4.99.722 7.121 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z"
                      />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/70">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-blue-400"
                  />
                  Remember me
                </label>
                <a href="#" className="font-semibold text-white/80 hover:text-white">
                  Forgot password?
                </a>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleDemoAdminLogin}
                  disabled={loading}
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 backdrop-blur transition hover:bg-white/10 disabled:opacity-50"
                >
                  Demo admin
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <p className="text-center text-sm text-white/60">
                Don&apos;t have an account? <span className="font-semibold text-white/80">Contact your administrator</span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={isLoggedIn ? <Navigate to="/dashboard" replace /> : loginPage}
      />
      <Route
        path="/dashboard"
        element={
          isLoggedIn ? (
            <Dashboard
              user={user}
              onLogout={() => {
                setIsLoggedIn(false);
                setUser(null);
                setFormData({ username: '', password: '' });
                setError('');
                setRemember(true);
                navigate('/');
              }}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/students"
        element={
          isLoggedIn ? (
            <StudentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/subjects"
        element={
          isLoggedIn ? (
            <SubjectsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/sections"
        element={
          isLoggedIn ? (
            <SectionsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/enrollments"
        element={
          isLoggedIn ? (
            <EnrollmentsPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/summary"
        element={
          isLoggedIn ? (
            <EnrollmentSummaryPage />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  );
}

export default App;

