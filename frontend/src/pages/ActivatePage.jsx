import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ActivatePage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const uid = searchParams.get('uid');
        const token = searchParams.get('token');

        console.log('Activation params:', { uid, token });

        if (!uid || !token) {
            setStatus('error');
            setMessage('Missing activation parameters.');
            return;
        }

        // Use environment variable for backend URL
        const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
        const url = `${apiBase}/accounts/api/activate/?uid=${uid}&token=${encodeURIComponent(token)}`;

        console.log('Calling backend:', url);

        fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .then(({ ok, data }) => {
                if (ok) {
                    setStatus('success');
                    setMessage(data.message || 'Account activated successfully!');
                    setTimeout(() => navigate('/'), 3000);
                } else {
                    setStatus('error');
                    setMessage(data.detail || 'Activation failed. Link may be expired or invalid.');
                }
            })
            .catch(err => {
                console.error('Activation error:', err);
                setStatus('error');
                setMessage('Failed to connect to server. Please try again.');
            });
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39] flex items-center justify-center px-4">
            <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-10 shadow-2xl backdrop-blur-sm text-center">
                {status === 'loading' && (
                    <>
                        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Activating Account...</h1>
                        <p className="mt-2 text-sm text-white/60">Please wait while we verify your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-3xl text-emerald-300 border border-emerald-400/30">✓</div>
                        <h1 className="text-2xl font-bold text-white">Success!</h1>
                        <p className="mt-2 text-sm text-white/60">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-xl transition hover:brightness-110"
                        >
                            Go to Login
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl text-red-300 border border-red-400/30">✗</div>
                        <h1 className="text-2xl font-bold text-white">Activation Failed</h1>
                        <p className="mt-2 text-sm text-white/60">{message}</p>
                        <button
                            onClick={() => navigate('/')}
                            className="mt-8 w-full rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                        >
                            Back to Home
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}