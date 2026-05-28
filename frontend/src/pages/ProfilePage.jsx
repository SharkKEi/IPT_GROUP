import { useEffect, useState } from 'react';
import { jsonFetch } from '../api/client';

export default function ProfilePage({ user, onProfileUpdate, nightMode }) {
    const isDay = !nightMode;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        birthday: '',
        department: '',
        specialty: '',
    });
    const [newPicture, setNewPicture] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await jsonFetch('/accounts/api/me/');
                if (!res.ok) { setError('Failed to load profile.'); return; }
                const data = await res.json();
                setProfile(data);
                setEditForm({
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    birthday: data.birthday || '',
                    department: data.department || '',
                    specialty: data.specialty || '',
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
        setSaveSuccess('');

        const formData = new FormData();
        formData.append('first_name', editForm.first_name);
        formData.append('last_name', editForm.last_name);
        formData.append('email', editForm.email);
        formData.append('birthday', editForm.birthday);
        formData.append('department', editForm.department);
        formData.append('specialty', editForm.specialty);
        if (newPicture) formData.append('profile_picture', newPicture);

        try {
            const res = await jsonFetch('/accounts/api/me/', { method: 'PATCH', body: formData });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) { setError(data.detail || 'Failed to save changes.'); return; }

            setProfile(data);
            setNewPicture(null);
            setPreviewUrl(null);
            setSaveSuccess('Profile updated successfully!');
            setEditing(false);
            if (onProfileUpdate) onProfileUpdate(data);
        } catch {
            setError('Network error.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setNewPicture(null);
        setPreviewUrl(null);
        setEditForm({
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || '',
            email: profile?.email || '',
            birthday: profile?.birthday || '',
            department: profile?.department || '',
            specialty: profile?.specialty || '',
        });
    };

    /* ── Helpers ── */
    const formatDate = (raw) => {
        if (!raw) return '—';
        const d = new Date(raw + 'T00:00:00'); // avoid timezone shift
        return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const calcAge = (raw) => {
        if (!raw) return null;
        const bday = new Date(raw + 'T00:00:00');
        const today = new Date();
        let age = today.getFullYear() - bday.getFullYear();
        const m = today.getMonth() - bday.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bday.getDate())) age--;
        return age;
    };

    const initial = profile?.username?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U';
    const avatarSrc = previewUrl || profile?.profile_picture || null;
    const age = calcAge(profile?.birthday);

    /* ── Theme ── */
    const textH = isDay ? 'text-slate-800' : 'text-white';
    const textS = isDay ? 'text-slate-500' : 'text-white/50';
    const divider = isDay ? 'border-slate-200' : 'border-white/10';
    const fieldLbl = `text-[10px] font-bold uppercase tracking-widest mb-1 ${textS}`;
    const fieldVal = `text-base font-semibold ${textH}`;
    const readonlyVal = isDay
        ? 'w-full rounded-xl border border-slate-200 bg-slate-100/60 px-4 py-3 text-sm text-slate-400 cursor-not-allowed'
        : 'w-full rounded-xl border border-white/5 bg-white/5 px-4 py-3 text-sm text-white/30 cursor-not-allowed';
    const inputCls = isDay
        ? 'w-full rounded-xl border border-slate-200 bg-white/60 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-400'
        : 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-amber-400';

    if (loading) return <div className={`animate-pulse text-sm ${textS}`}>Loading profile data…</div>;

    return (
        <div className={`glass-card ${isDay ? 'glass-day' : 'glass-night'} rounded-3xl p-8 lg:p-12 shadow-2xl flex flex-col md:flex-row gap-12 items-start max-w-5xl mx-auto`}>

            {/* ── LEFT: Avatar + identity summary ── */}
            <div className="w-full md:w-1/3 flex flex-col items-center text-center shrink-0">
                <label className={`relative group ${editing ? 'cursor-pointer' : 'cursor-default'}`}>
                    <div className="relative p-1.5 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_0_40px_rgba(245,158,11,0.4)]">
                        {avatarSrc ? (
                            <img src={avatarSrc} alt="Profile"
                                className={`h-48 w-48 rounded-full object-cover border-4 ${isDay ? 'border-white' : 'border-[#0d1f3c]'}`} />
                        ) : (
                            <div className={`h-48 w-48 rounded-full flex items-center justify-center text-7xl font-extrabold text-slate-400 border-4
                                ${isDay ? 'bg-gradient-to-br from-slate-200 to-slate-300 border-white' : 'bg-gradient-to-br from-slate-700 to-slate-800 border-[#0d1f3c]'}`}>
                                {initial}
                            </div>
                        )}
                        {editing && (
                            <>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                <div className="absolute inset-1.5 rounded-full bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                    <span className="text-3xl mb-2">📷</span>
                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Change Photo</span>
                                </div>
                            </>
                        )}
                    </div>
                </label>

                <h2 className={`mt-6 text-3xl font-extrabold tracking-tight ${textH}`}>{profile?.username}</h2>

                {/* Role badge */}
                <span className={`mt-2 inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest
                    ${profile?.role === 'admin' || profile?.is_staff ? 'bg-amber-400/20 text-amber-500' : 'bg-sky-400/20 text-sky-500'}`}>
                    {profile?.role || (profile?.is_staff ? 'Admin' : 'User')}
                </span>

                {/* Department + Specialty chips */}
                {(profile?.department || profile?.specialty) && (
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {profile?.department && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                ${isDay ? 'bg-sky-100 text-sky-700' : 'bg-sky-500/15 text-sky-300'}`}>
                                🏛 {profile.department}
                            </span>
                        )}
                        {profile?.specialty && (
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                ${isDay ? 'bg-violet-100 text-violet-700' : 'bg-violet-500/15 text-violet-300'}`}>
                                ⭐ {profile.specialty}
                            </span>
                        )}
                    </div>
                )}

                {/* Age display if birthday is set */}
                {age !== null && (
                    <p className={`mt-3 text-sm ${textS}`}>
                        {age} years old
                    </p>
                )}
            </div>

            {/* ── RIGHT: Info / Edit form ── */}
            <div className="flex-1 w-full">
                <div className={`flex items-center justify-between mb-8 border-b pb-4 ${divider}`}>
                    <div>
                        <h3 className={`text-2xl font-bold ${textH}`}>{editing ? 'Edit Profile' : 'Personal Information'}</h3>
                        <p className={`text-sm mt-1 ${textS}`}>
                            {editing ? 'Update your details, photo, and academic info.' : 'Your account details and academic profile.'}
                        </p>
                    </div>
                    {!editing && (
                        <button onClick={() => { setEditing(true); setSaveSuccess(''); }}
                            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition shadow-md">
                            Edit Profile
                        </button>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 text-red-500 text-sm font-bold">{error}</div>
                )}
                {saveSuccess && !editing && (
                    <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm font-bold">✓ {saveSuccess}</div>
                )}

                {/* ── VIEW MODE ── */}
                {!editing ? (
                    <div className="space-y-7">
                        {/* Account */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>
                                Account
                            </p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className={fieldLbl}>Username</p>
                                    <p className={fieldVal}>@{profile?.username || '—'}</p>
                                </div>
                                <div>
                                    <p className={fieldLbl}>Email Address</p>
                                    <p className={fieldVal}>{profile?.email || '—'}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`border-t ${divider}`} />

                        {/* Personal */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>
                                Personal
                            </p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className={fieldLbl}>First Name</p>
                                    <p className={fieldVal}>{profile?.first_name || '—'}</p>
                                </div>
                                <div>
                                    <p className={fieldLbl}>Last Name</p>
                                    <p className={fieldVal}>{profile?.last_name || '—'}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className={fieldLbl}>Birthday</p>
                                    <p className={fieldVal}>{formatDate(profile?.birthday)}</p>
                                </div>
                            </div>
                        </div>

                        <div className={`border-t ${divider}`} />

                        {/* Academic */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>
                                Academic
                            </p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <p className={fieldLbl}>Department</p>
                                    <p className={fieldVal}>{profile?.department || '—'}</p>
                                </div>
                                <div>
                                    <p className={fieldLbl}>Specialty / Major</p>
                                    <p className={fieldVal}>{profile?.specialty || '—'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    /* ── EDIT MODE ── */
                    <div className="space-y-6">

                        {/* Account — username is read-only */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>Account</p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={`block ${fieldLbl}`}>Username <span className={`normal-case tracking-normal ${textS}`}>(cannot change)</span></label>
                                    <input type="text" value={profile?.username || ''} disabled className={readonlyVal} />
                                </div>
                                <div>
                                    <label className={`block ${fieldLbl}`}>Email Address</label>
                                    <input type="email" value={editForm.email}
                                        onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                            </div>
                        </div>

                        <div className={`border-t ${divider}`} />

                        {/* Personal */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>Personal</p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={`block ${fieldLbl}`}>First Name</label>
                                    <input type="text" value={editForm.first_name}
                                        onChange={e => setEditForm({ ...editForm, first_name: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                                <div>
                                    <label className={`block ${fieldLbl}`}>Last Name</label>
                                    <input type="text" value={editForm.last_name}
                                        onChange={e => setEditForm({ ...editForm, last_name: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                                <div className="col-span-2">
                                    <label className={`block ${fieldLbl}`}>Birthday</label>
                                    <input type="date" value={editForm.birthday}
                                        onChange={e => setEditForm({ ...editForm, birthday: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                            </div>
                        </div>

                        <div className={`border-t ${divider}`} />

                        {/* Academic */}
                        <div>
                            <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>Academic</p>
                            <div className="grid grid-cols-2 gap-5">
                                <div>
                                    <label className={`block ${fieldLbl}`}>Department</label>
                                    <input type="text" placeholder="e.g. College of Engineering"
                                        value={editForm.department}
                                        onChange={e => setEditForm({ ...editForm, department: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                                <div>
                                    <label className={`block ${fieldLbl}`}>Specialty / Major</label>
                                    <input type="text" placeholder="e.g. Computer Science"
                                        value={editForm.specialty}
                                        onChange={e => setEditForm({ ...editForm, specialty: e.target.value })}
                                        className={inputCls} disabled={saving} />
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className={`flex gap-3 pt-4 mt-2 border-t ${divider}`}>
                            <button onClick={handleCancel} disabled={saving}
                                className={`px-6 py-3 rounded-xl text-sm font-bold border transition
                                    ${isDay ? 'border-slate-200 hover:bg-slate-50 text-slate-600' : 'border-white/10 hover:bg-white/5 text-white'}`}>
                                Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="px-8 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold transition shadow-md">
                                {saving ? 'Saving…' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}