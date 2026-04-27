import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Dashboard from './components/Dashboard.jsx'
import EnrollmentSummaryPage from './pages/EnrollmentSummaryPage.jsx'
import EnrollmentsPage from './pages/EnrollmentsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import SectionsPage from './pages/SectionsPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import SubjectsPage from './pages/SubjectsPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ActivatePage from './pages/ActivatePage.jsx'

function formatApiError(data, fallback = 'Something went wrong.') {
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return Array.isArray(data.detail) ? data.detail.join(' ') : data.detail
  if (data.message) return Array.isArray(data.message) ? data.message.join(' ') : data.message

  const firstError = Object.entries(data)[0]
  if (firstError) {
    const [field, value] = firstError
    const message = Array.isArray(value) ? value.join(' ') : String(value)
    return `${field}: ${message}`
  }

  return fallback
}

function App() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [nightMode, setNightMode] = useState(() => {
    return localStorage.getItem('nightMode') === 'true'
  })
  const navigate = useNavigate()

  useEffect(() => {
    const root = document.documentElement
    if (nightMode) {
      root.classList.add('night')
    } else {
      root.classList.remove('night')
    }
    localStorage.setItem('nightMode', nightMode)
  }, [nightMode])

  useEffect(() => {
    document.title = 'School Portal'
  }, [])

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await fetch('/accounts/api/me/', { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setUser(data)
          setIsLoggedIn(true)
        }
      } catch {
        // No saved session available.
      } finally {
        setCheckingAuth(false)
      }
    }

    restoreSession()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/accounts/api/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...formData, remember }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        const loggedUser = data.user || { username: formData.username }
        setIsLoggedIn(true)
        setUser(loggedUser)
        setError('')
        setFormData({ username: '', password: '' })
        navigate('/dashboard')
      } else {
        setError(formatApiError(data, 'Invalid credentials.'))
      }
    } catch {
      setError('Network error. Make sure the Django backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/accounts/api/logout/', {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // Ignore network errors on logout.
    }

    setIsLoggedIn(false)
    setUser(null)
    setFormData({ username: '', password: '' })
    setError('')
    setRemember(true)
    navigate('/')
  }

  const loadingScreen = (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400" />
        <p className="text-sm text-white/70">Checking your session…</p>
      </div>
    </div>
  )

  const loginPage = (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-[url('https://i.pinimg.com/originals/50/65/1e/50651e95ae192df7dddf0ddc8e92a284.jpg')] bg-cover bg-center opacity-20" />
      </div>

      <button
        onClick={() => setNightMode(n => !n)}
        className="absolute top-6 right-6 z-10 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
        title={nightMode ? 'Switch to Day' : 'Switch to Night'}
      >
        {nightMode ? '☀️' : '🌙'}
      </button>

      <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl" />
          <div className="relative z-10 rounded-3xl border border-white/10 bg-black/30 p-10 shadow-2xl backdrop-blur">
            <div className="mb-8 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">School Portal</p>
              <h1 className="text-4xl font-bold text-white">Welcome Back</h1>
              <p className="mt-2 text-sm text-white/70">Use your username or email to access the portal.</p>
            </div>

            {error && (
              <div className="mb-6 rounded-2xl border border-red-400/50 bg-red-500/10 px-6 py-4 text-sm text-red-100">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Username or Email</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15.5c2.571 0 4.99.722 7.121 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Username or email"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white/70">Password</label>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/50">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-12 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                    required
                    disabled={loading}
                    autoComplete="current-password"
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
                <span className="text-white/40">Activate via email first</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <p className="text-center text-sm text-white/60">
                Don&apos;t have an account?{' '}
                <button type="button" onClick={() => navigate('/register')} className="font-semibold text-white/80 hover:text-white">
                  Register here
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )

  const withNightToggle = (Component, extraProps = {}) => (
    <Component
      user={user}
      onLogout={handleLogout}
      nightMode={nightMode}
      onToggleNight={() => setNightMode(n => !n)}
      {...extraProps}
    />
  )

  if (checkingAuth) {
    return loadingScreen
  }

  return (
    <Routes>
      <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : loginPage} />
      <Route path="/register" element={<RegisterPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} />} />
      <Route path="/activate" element={<ActivatePage />} />
      <Route path="/dashboard" element={isLoggedIn ? withNightToggle(Dashboard) : <Navigate to="/" replace />} />
      <Route path="/profile" element={isLoggedIn ? withNightToggle(ProfilePage) : <Navigate to="/" replace />} />
      <Route path="/students" element={isLoggedIn ? <StudentsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace />} />
      <Route path="/subjects" element={isLoggedIn ? <SubjectsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace />} />
      <Route path="/sections" element={isLoggedIn ? <SectionsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace />} />
      <Route path="/enrollments" element={isLoggedIn ? <EnrollmentsPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace />} />
      <Route path="/summary" element={isLoggedIn ? <EnrollmentSummaryPage nightMode={nightMode} onToggleNight={() => setNightMode(n => !n)} /> : <Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
