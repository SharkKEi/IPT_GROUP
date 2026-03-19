import { useState } from 'react'
import Dashboard from './components/Dashboard.jsx'

function App() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoggedIn(true);
        setUser({ username: data.user || formData.username });
        setError('');
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

  if (isLoggedIn) {
    return (
      <Dashboard
        user={user}
        onLogout={() => {
          setIsLoggedIn(false);
          setUser(null);
          setFormData({ username: '', password: '' });
          setError('');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1b0d3a]">
      <div className="relative w-full max-w-md px-6 py-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative z-10 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="px-10 py-10">
            <h1 className="text-center text-4xl font-bold text-white mb-6">Login</h1>
            <p className="text-center text-sm text-white/70 mb-8">Use your credentials to access the dashboard.</p>

            {error && (
              <div className="bg-red-500/10 border border-red-400/50 text-red-100 px-6 py-4 rounded-2xl mb-6 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/60">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15.5c2.571 0 4.99.722 7.121 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder="Username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full rounded-2xl bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 border border-white/10 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 outline-none transition"
                  required
                  disabled={loading}
                />
              </div>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/60">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" />
                  </svg>
                </span>
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-2xl bg-white/10 py-4 pl-12 pr-4 text-white placeholder:text-white/40 border border-white/10 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/30 outline-none transition"
                  required
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-white/70">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={false}
                    disabled
                    className="h-4 w-4 rounded border-white/30 bg-white/10 text-blue-500 focus:ring-blue-300"
                  />
                  Remember me
                </label>
                <button type="button" className="text-sm font-semibold text-white/80 hover:text-white" onClick={() => alert('Forgot password flow not yet implemented')}>
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-white/10 py-4 text-lg font-semibold text-white shadow-lg shadow-black/20 hover:bg-white/20 transition"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-white/60">
              Don't have an account? <span className="font-semibold text-white/80">Contact your administrator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

