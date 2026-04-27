import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage({ user, onLogout, nightMode, onToggleNight }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/accounts/api/me/', { credentials: 'include' });
                if (!res.ok) { setError('Failed to load profile.'); return; }
                const data = await res.json();
                setProfile(data);
            } catch {
                setError('Network error.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const initial = profile?.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-animated">
            <div className="relative z-10 px-6 py-10 lg:px-12">
                <div className="max-w-xl mx-auto">

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
                    >
                        ← Dashboard
                    </button>

                    {loading && <p className="text-white/50 text-center mt-20">Loading…</p>}
                    {error && (
                        <div className="mt-6 rounded-3xl bg-red-500/10 border border-red-400/50 px-6 py-4 text-sm text-red-100">
                            {error}
                        </div>
                    )}

                    {profile && (
                        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-sm">


                            <div className="flex flex-col items-center text-center mb-8">
                                {profile.profile_picture ? (
                                    <img
                                        src={profile.profile_picture}
                                        alt="Profile"
                                        className="h-24 w-24 rounded-full object-cover shadow-xl mb-4 border-2 border-white/20"
                                    />
                                ) : (
                                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4">
                                        {initial}
                                    </div>
                                )}
                                <h1 className="text-2xl font-bold text-white">
                                    {profile.first_name || profile.last_name
                                        ? `${profile.first_name} ${profile.last_name}`.trim()
                                        : profile.username}
                                </h1>
                                <p className="text-white/50 text-sm mt-1">@{profile.username}</p>
                                {profile.is_staff && (
                                    <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-purple-500/20 border border-purple-400/30 px-3 py-1 text-xs font-semibold text-purple-300">
                                        Admin
                                    </span>
                                )}
                            </div>

                            {/* Details */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Username', value: profile.username },
                                    { label: 'Email', value: profile.email || '—' },
                                    { label: 'First name', value: profile.first_name || '—' },
                                    { label: 'Last name', value: profile.last_name || '—' },
                                    { label: 'Role', value: profile.is_staff ? 'Administrator' : 'Staff' },
                                    {
                                        label: 'Date joined',
                                        value: new Date(profile.date_joined).toLocaleDateString('en-US', {
                                            year: 'numeric', month: 'long', day: 'numeric',
                                        }),
                                    },
                                    {
                                        label: 'Last login',
                                        value: profile.last_login
                                            ? new Date(profile.last_login).toLocaleString('en-US', {
                                                dateStyle: 'medium', timeStyle: 'short',
                                            })
                                            : '—',
                                    },
                                ].map(({ label, value }) => (
                                    <div
                                        key={label}
                                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-3"
                                    >
                                        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                                            {label}
                                        </span>
                                        <span className="text-sm text-white font-medium">{value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Logout */}
                            <button
                                onClick={onLogout}
                                className="mt-8 w-full rounded-2xl border border-red-400/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                            >
                                Log out
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <button
                onClick={onToggleNight}
                className="fixed bottom-6 right-6 z-50 rounded-full border border-white/20 bg-white/10 p-3 text-xl shadow-xl backdrop-blur transition hover:bg-white/20"
                title="Toggle night mode"
            >
                {nightMode ? '☀️' : '🌙'}
            </button>
        </div>
    );
}