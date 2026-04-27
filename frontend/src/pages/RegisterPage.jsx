import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

function formatApiError(data, fallback = 'Registration failed.') {
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

export default function RegisterPage({ nightMode, onToggleNight }) {
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' })
    const [picture, setPicture] = useState(null)
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview)
        }
    }, [preview])

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        setError('')

        if (!file) {
            setPicture(null)
            setPreview(null)
            return
        }

        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file only.')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            setError('Profile picture must be 2MB or smaller.')
            return
        }

        setPicture(file)
        setPreview((oldPreview) => {
            if (oldPreview) URL.revokeObjectURL(oldPreview)
            return URL.createObjectURL(file)
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (form.password !== form.confirm_password) {
            setError('Passwords do not match.')
            return
        }

        setLoading(true)

        const data = new FormData()
        data.append('username', form.username.trim())
        data.append('email', form.email.trim().toLowerCase())
        data.append('password', form.password)
        data.append('confirm_password', form.confirm_password)
        if (picture) data.append('profile_picture', picture)

        try {
            const res = await fetch('/accounts/api/register/', {
                method: 'POST',
                body: data,
                credentials: 'include',
            })

            const result = await res.json().catch(() => ({}))

            if (res.ok) {
                setSuccess(result.message || 'Registration successful! Please check your email.')
                setForm({ username: '', email: '', password: '', confirm_password: '' })
                setPicture(null)
                setPreview(null)
            } else {
                setError(formatApiError(result))
            }
        } catch {
            setError('Network error. Make sure the Django backend is running.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#100c2b] via-[#1e0b4d] to-[#130b39]">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
                <div className="absolute inset-0 bg-[url('https://i.pinimg.com/originals/50/65/1e/50651e95ae192df7dddf0ddc8e92a284.jpg')] bg-cover bg-center opacity-20" />
            </div>

            <button
                onClick={() => onToggleNight && onToggleNight()}
                className="absolute top-6 right-6 z-10 rounded-full border border-white/20 bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
                title={nightMode ? 'Switch to Day' : 'Switch to Night'}
            >
                {nightMode ? '☀️' : '🌙'}
            </button>

            <div className="relative flex min-h-screen items-center justify-center px-4 py-16">
                <div className="relative w-full max-w-lg">
                    <div className="absolute inset-0 rounded-3xl bg-white/10 blur-xl" />
                    <div className="relative z-10 rounded-3xl border border-white/10 bg-black/30 p-8 shadow-2xl backdrop-blur sm:p-10">
                        <div className="mb-8 text-center">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-blue-200/80">New Account</p>
                            <h1 className="text-4xl font-bold text-white">Register</h1>
                            <p className="mt-2 text-sm text-white/70">Create an account, upload a profile photo, then activate it through email.</p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-2xl border border-red-400/50 bg-red-500/10 px-6 py-4 text-sm text-red-100">{error}</div>
                        )}
                        {success && (
                            <div className="mb-6 rounded-2xl border border-emerald-400/50 bg-emerald-500/10 px-6 py-4 text-sm text-emerald-100">
                                {success}
                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/')}
                                        className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:text-blue-100"
                                    >
                                        Go to login
                                    </button>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white/70">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        placeholder="Username"
                                        value={form.username}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                                        required
                                        disabled={loading}
                                        minLength={3}
                                        autoComplete="username"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white/70">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        value={form.email}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                                        required
                                        disabled={loading}
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white/70">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Minimum 6 characters"
                                        value={form.password}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                                        required
                                        disabled={loading}
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-white/70">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirm_password"
                                        placeholder="Repeat password"
                                        value={form.confirm_password}
                                        onChange={handleChange}
                                        className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 transition focus:ring-2 focus:ring-blue-400"
                                        required
                                        disabled={loading}
                                        minLength={6}
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={loading} />
                                        {picture ? picture.name : 'Choose an image…'}
                                    </label>
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 text-lg text-white/50">
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                        ) : (
                                            '👤'
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-white/40">Allowed: JPG, PNG, WEBP, GIF. Max size: 2MB.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? 'Creating account…' : 'Register'}
                            </button>

                            <p className="text-center text-sm text-white/60">
                                Already have an account?{' '}
                                <button type="button" onClick={() => navigate('/')} className="font-semibold text-white/80 hover:text-white">
                                    Log in
                                </button>
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
