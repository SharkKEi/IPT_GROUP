import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ActivatePage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [status, setStatus] = useState('loading')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = searchParams.get('token')

        if (!token) {
            setStatus('error')
            setMessage('Activation token is missing.')
            return
        }

        const activate = async () => {
            try {
                const res = await fetch(`/accounts/api/activate/?token=${encodeURIComponent(token)}`, {
                    credentials: 'include',
                })
                const data = await res.json().catch(() => ({}))

                if (res.ok) {
                    setStatus('success')
                    setMessage(data.message || 'Account activated successfully!')
                } else {
                    setStatus('error')
                    setMessage(data.detail || 'Activation failed. The token may be invalid or expired.')
                }
            } catch {
                setStatus('error')
                setMessage('Network error. Make sure the Django backend is running.')
            }
        }

        activate()
    }, [searchParams])

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39] flex items-center justify-center px-4">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
                <div className="absolute inset-0 bg-[url('https://i.pinimg.com/originals/50/65/1e/50651e95ae192df7dddf0ddc8e92a284.jpg')] bg-cover bg-center opacity-20" />
            </div>

            <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-black/30 p-10 text-center shadow-2xl backdrop-blur">
                {status === 'loading' && (
                    <>
                        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-blue-400" />
                        <h1 className="text-2xl font-bold text-white">Activating…</h1>
                        <p className="mt-2 text-sm text-white/60">Please wait while we verify your account.</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-3xl text-emerald-300">
                            ✓
                        </div>
                        <h1 className="text-2xl font-bold text-white">Activated!</h1>
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
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 text-3xl text-red-300">
                            ✗
                        </div>
                        <h1 className="text-2xl font-bold text-white">Activation Failed</h1>
                        <p className="mt-2 text-sm text-white/60">{message}</p>
                        <div className="mt-8 grid gap-3">
                            <button
                                onClick={() => navigate('/register')}
                                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-sm font-semibold text-white shadow-xl transition hover:brightness-110"
                            >
                                Create Account Again
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="w-full rounded-2xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                            >
                                Back to Login
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
