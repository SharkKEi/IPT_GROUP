import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function getCsrfToken() {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(name + '=')) {
            return trimmed.substring(name.length + 1);
        }
    }
    return '';
}

export default function ProfilePage({ user, onLogout, onProfileUpdate, nightMode, onToggleNight }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({ first_name: '', last_name: '', email: '' });
    const [newPicture, setNewPicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [saveSuccess, setSaveSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch('/accounts/api/me/', { credentials: 'include' });
                if (!res.ok) { setError('Failed to load profile.'); return; }
                const data = await res.json();
                setProfile(data);
                setEditForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                });
            } catch {
                setError('Network error.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setNewPicture(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError('');
        setSaveSuccess('');

        const formData = new FormData();
        formData.append('first_name', editForm.first_name);
        formData.append('last_name', editForm.last_name);
        formData.append('email', editForm.email);
        if (newPicture) formData.append('profile_picture', newPicture);

        try {
            const res = await fetch('/accounts/api/me/', {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'X-CSRFToken': getCsrfToken() },
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setSaveError(data.detail || 'Failed to save changes.');
                return;
            }
            setProfile(data);
            setEditForm({
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                email: data.email || '',
            });
            setNewPicture(null);
            setPreviewUrl(null);
            setSaveSuccess('Profile updated successfully!');
            setEditing(false);
            // Sync updated profile back up to App.jsx
            if (onProfileUpdate) onProfileUpdate(data);
        } catch {
            setSaveError('Network error.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setSaveError('');
        setNewPicture(null);
        setPreviewUrl(null);
        setEditForm({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            email: profile?.email || '',
        });
    };

    const initial = profile?.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
    const avatarSrc = previewUrl || profile?.profile_picture || null;

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

                    {saveSuccess && !editing && (
                        <div className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-400/50 px-5 py-3 text-sm text-emerald-100">
                            ✓ {saveSuccess}
                        </div>
                    )}

                    {profile && (
                        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-sm">

                            {/* Avatar */}
                            <div className="flex flex-col items-center text-center mb-8">
                                <label className={`relative group ${editing ? 'cursor-pointer' : 'cursor-default'}`}>
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt="Profile"
                                            className="h-24 w-24 rounded-full object-cover shadow-xl border-2 border-white/20"
                                        />
                                    ) : (
                                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-indigo-400 to-emerald-400 flex items-center justify-center text-4xl font-bold text-white shadow-xl">
                                            {initial}
                                        </div>
                                    )}
                                    {editing && (
                                        <>
                                            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                                <span className="text-white text-xs font-semibold">Change</span>
                                            </div>
                                        </>
                                    )}
                                </label>
                                {editing && newPicture && (
                                    <p className="text-xs text-white/40 mt-2">{newPicture.name}</p>
                                )}

                                {!editing && (
                                    <>
                                        <h1 className="text-2xl font-bold text-white mt-4">
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
                                    </>
                                )}
                            </div>

                            {/* ── VIEW MODE ── */}
                            {!editing && (
                                <>
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
                                                <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</span>
                                                <span className="text-sm text-white font-medium">{value}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => { setEditing(true); setSaveSuccess(''); }}
                                        className="mt-6 w-full rounded-2xl border border-blue-400/30 bg-blue-500/10 py-3 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
                                    >
                                        ✏ Edit Profile
                                    </button>

                                    <button
                                        onClick={onLogout}
                                        className="mt-3 w-full rounded-2xl border border-red-400/30 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
                                    >
                                        Log out
                                    </button>
                                </>
                            )}

                            {/* ── EDIT MODE ── */}
                            {editing && (
                                <div className="space-y-4">
                                    {saveError && (
                                        <div className="rounded-2xl bg-red-500/10 border border-red-400/50 px-4 py-3 text-sm text-red-100">
                                            {saveError}
                                        </div>
                                    )}

                                    {[
                                        { label: 'First name', key: 'first_name', placeholder: 'Enter first name' },
                                        { label: 'Last name', key: 'last_name', placeholder: 'Enter last name' },
                                        { label: 'Email', key: 'email', placeholder: 'Enter email', type: 'email' },
                                    ].map(({ label, key, placeholder, type = 'text' }) => (
                                        <div key={key}>
                                            <label className="text-xs font-semibold text-white/40 uppercase tracking-widest">{label}</label>
                                            <input
                                                type={type}
                                                value={editForm[key]}
                                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                                placeholder={placeholder}
                                                className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 text-white placeholder:text-white/30 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-400"
                                                disabled={saving}
                                            />
                                        </div>
                                    ))}

                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-white/40 uppercase tracking-widest">Username</span>
                                        <span className="text-sm text-white/40">{profile.username} (cannot change)</span>
                                    </div>

                                    <div className="flex gap-3 mt-2">
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                                        >
                                            {saving ? 'Saving…' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}
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