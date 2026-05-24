import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export default function ActivatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Please wait while we verify your account.');
  const activationStarted = useRef(false);

  useEffect(() => {
    if (activationStarted.current) return;
    activationStarted.current = true;

    const token = searchParams.get('token') || '';
    const uid = searchParams.get('uid') || '';

    if (!token) {
      setStatus('error');
      setMessage('Activation token is missing. Please open the latest activation email.');
      return;
    }

    const activate = async () => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);

      try {
        const query = new URLSearchParams({ token });
        if (uid) query.set('uid', uid);

        const url = `${API_BASE}/accounts/api/activate/?${query.toString()}`;
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });

        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          setStatus('success');
          setMessage(data.message || 'Account activated successfully. You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.detail || data.message || 'Activation failed. The token may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        if (err?.name === 'AbortError') {
          setMessage('Activation request timed out. Make sure Django is running on port 8000.');
        } else {
          setMessage('Network error. Make sure Django is running on http://localhost:8000, then try again.');
        }
      } finally {
        window.clearTimeout(timeout);
      }
    };

    activate();
  }, [searchParams]);

  const isSuccess = status === 'success';
  const isError = status === 'error';

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39] flex items-center justify-center px-4 py-10">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-sm text-center">
        {status === 'loading' && (
          <>
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400" />
            <h1 className="text-3xl font-bold text-white">Activating…</h1>
            <p className="mt-3 text-base text-white/65">{message}</p>
          </>
        )}

        {(isSuccess || isError) && (
          <>
            <div className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-4xl border ${isSuccess ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-red-500/20 text-red-300 border-red-400/30'}`}>
              {isSuccess ? '✓' : '✗'}
            </div>
            <h1 className="text-3xl font-bold text-white">{isSuccess ? 'Activated!' : 'Activation Failed'}</h1>
            <p className="mt-3 text-base text-white/65">{message}</p>
            <button
              onClick={() => navigate('/')}
              className={`mt-8 w-full rounded-2xl py-4 text-base font-semibold text-white shadow-xl transition hover:brightness-110 ${isSuccess ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'border border-white/20 bg-white/10 hover:bg-white/20'}`}
            >
              Back to Login
            </button>
            {isError && (
              <a
                href={`${API_BASE}/accounts/activate/?${searchParams.toString()}`}
                className="mt-4 block text-sm font-semibold text-blue-200 hover:text-white"
              >
                Try direct backend activation
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
