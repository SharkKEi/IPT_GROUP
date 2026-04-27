import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage({ nightMode, onToggleNight }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirm_password: '' });
    const [picture, setPicture] = useState(null);
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

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
                <div className="relative w-full max-w-md">
                    <div className="absolute inset-0 bg-white/10 rounded-3xl" />
                    <div className="relative z-10 rounded-3xl bg-black/30 border border-white/10 shadow-2xl p-10">
                        <div className="text-center mb-8">
                            <h1 className="text-4xl font-bold text-white">Register</h1>
                            <p className="text-sm text-white/70 mt-2">Create a new portal account.</p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">{error}</div>
                        )}
                        {success && (
                            <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-6 py-4 text-sm text-emerald-100">{success}</div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Username</label>
                                <input type="text" name="username" placeholder="Username" value={form.username}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                    required disabled={loading} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Email</label>
                                <input type="email" name="email" placeholder="Email address" value={form.email}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                    required disabled={loading} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Password</label>
                                <input type="password" name="password" placeholder="Password" value={form.password}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                    required disabled={loading} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Confirm Password</label>
                                <input type="password" name="confirm_password" placeholder="Confirm password" value={form.confirm_password}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/50 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                    required disabled={loading} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-white/70">Profile Picture</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-center text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
                                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={loading} />
                                        {picture ? picture.name : 'Choose an image…'}
                                    </label>
                                    {preview && (
                                        <img src={preview} alt="Preview" className="h-12 w-12 rounded-full object-cover border border-white/20" />
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-4 text-lg font-semibold text-white shadow-xl shadow-black/40 transition hover:brightness-110 disabled:opacity-50">
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
    );
}
