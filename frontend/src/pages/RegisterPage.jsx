import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EyeIcon = ({ open }) => open ? (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
) : (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
);

export default function RegisterPage({ nightMode, onToggleNight }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' });
    const [picture, setPicture] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPicture(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const data = new FormData();
        data.append('username', form.username);
        data.append('email', form.email);
        data.append('password', form.password);
        data.append('confirm_password', form.confirm_password);
        if (picture) data.append('profile_picture', picture);

        try {
            const res = await fetch('/accounts/api/register/', {
                method: 'POST',
                body: data,
            });
            const result = await res.json().catch(() => ({}));
            if (res.ok) {
                setSuccess(result.message || 'Registration successful! Please check your email.');
                setForm({ username: '', email: '', password: '', confirm_password: '' });
                setPicture(null);
                setPreview(null);
            } else {
                const msg = result.detail || result.message || JSON.stringify(result) || 'Registration failed.';
                setError(msg);
            }
        } catch {
            setError('Network error.');
        } finally {
            setLoading(false);
        }
    };

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
                    <div className="absolute inset-0 bg-white/10 rounded-3xl" />
                    <div className="relative z-10 rounded-3xl bg-black/30 border border-white/10 shadow-2xl p-10">

                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white">Create Account</h1>
                            <p className="text-sm text-white/70 mt-2">Join the School Portal today.</p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">{error}</div>
                        )}

                        {success && (
                            <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-6 py-4 text-sm text-emerald-100">
                                <p className="font-semibold mb-1">🎉 Registration successful!</p>
                                <p>{success}</p>
                                <button
                                    onClick={() => navigate('/')}
                                    className="mt-3 w-full rounded-xl bg-emerald-500/20 border border-emerald-400/30 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30 transition"
                                >
                                    Go to Login
                                </button>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-6">

                                {/* ── SECTION 1: Profile Picture ── */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Profile Photo</p>
                                    <div className="flex flex-col items-center">
                                        <label className="relative group cursor-pointer">
                                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-dashed border-white/30 bg-white/10 flex items-center justify-center shadow-xl transition group-hover:border-blue-400/60">
                                                {preview ? (
                                                    <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                                ) : (
                                                    <svg className="h-10 w-10 text-white/30 group-hover:text-blue-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <svg className="h-6 w-6 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-white text-xs font-semibold">
                                                    {preview ? 'Change' : 'Upload'}
                                                </span>
                                            </div>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={loading} />
                                        </label>
                                        <p className="mt-3 text-xs text-white/40">
                                            {picture ? picture.name : 'Click circle to upload a photo (optional)'}
                                        </p>
                                        {preview && (
                                            <button
                                                type="button"
                                                onClick={() => { setPicture(null); setPreview(null); }}
                                                className="mt-1 text-xs text-red-400/70 hover:text-red-400 transition"
                                            >
                                                Remove photo
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border-t border-white/10" />

                                {/* ── SECTION 2: Account Info ── */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Account Info</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-white/70">Username</label>
                                            <div className="relative mt-2">
                                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15.5c2.571 0 4.99.722 7.121 2.304M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                </span>
                                                <input type="text" name="username" placeholder="e.g. juan_delacruz" value={form.username}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-11 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                                    required disabled={loading} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-white/70">Email</label>
                                            <div className="relative mt-2">
                                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </span>
                                                <input type="email" name="email" placeholder="you@example.com" value={form.email}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-11 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                                    required disabled={loading} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-white/10" />

                                {/* ── SECTION 3: Password ── */}
                                <div>
                                    <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">Password</p>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-semibold text-white/70">Password</label>
                                            <div className="relative mt-2">
                                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c1.657 0 3-1.343 3-3V5a3 3 0 10-6 0v3c0 1.657 1.343 3 3 3z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 11h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7a2 2 0 012-2z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    name="password" placeholder="Min. 6 characters" value={form.password}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-11 pr-11 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                                    required disabled={loading} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(s => !s)}
                                                    className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition"
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon open={showPassword} />
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-sm font-semibold text-white/70">Confirm Password</label>
                                            <div className="relative mt-2">
                                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-white/40">
                                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                    </svg>
                                                </span>
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    name="confirm_password" placeholder="Re-enter password" value={form.confirm_password}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 pl-11 pr-11 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                                    required disabled={loading} />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(s => !s)}
                                                    className="absolute inset-y-0 right-4 flex items-center text-white/40 hover:text-white transition"
                                                    tabIndex={-1}
                                                >
                                                    <EyeIcon open={showConfirmPassword} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50">
                                    {loading ? 'Creating account…' : 'Create Account'}
                                </button>

                                <p className="text-center text-sm text-white/60">
                                    Already have an account?{' '}
                                    <button type="button" onClick={() => navigate('/')} className="font-semibold text-white/80 hover:text-white">
                                        Log in
                                    </button>
                                </p>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}