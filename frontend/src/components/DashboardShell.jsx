import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isAdmin, canManageSchool } from '../api/client';

/* ── Helper to calculate greeting string matching Dashboard ── */
function getGreeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
}

/* ── Per-page subtitle map ── */
const PAGE_SUBTITLES = {
    '/profile': (u) => `Your identity, your story — @${u?.username || 'you'}.`,
    '/students': () => `Manage and track your student roster.`,
    '/subjects': () => `Courses that shape the curriculum.`,
    '/sections': () => `Where students and subjects come together.`,
    '/enrollments': () => `Connecting students to their academic path.`,
    '/summary': () => `The full picture at a glance.`,
    '/users': () => `Access levels and role management.`,
};

function getSubtitle(pathname, user, accent) {
    const fn = PAGE_SUBTITLES[pathname];
    if (fn) {
        return <span className="font-medium">{fn(user)}</span>;
    }
    // Default greeting
    return (
        <>
            Good {getGreeting()},{' '}
            <span className={`font-semibold ${accent}`}>{user?.username || 'there'}</span>
        </>
    );
}

/* ══ Global Notification Bell ══ */
function NotifBell({ isDay }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const build = async () => {
            try {
                const [eRes, secRes, sRes] = await Promise.all([
                    fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/enrollments/', { credentials: 'include' }),
                    fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/sections/', { credentials: 'include' }),
                    fetch((import.meta.env.VITE_API_BASE || '') + '/accounts/api/students/', { credentials: 'include' }),
                ]);
                const arr = async (res) => { const d = await res.json(); return Array.isArray(d) ? d : d.results || []; };
                const [enrollments, sections, students] = await Promise.all([arr(eRes), arr(secRes), arr(sRes)]);

                const items = [];
                [...enrollments].reverse().slice(0, 3).forEach(e => {
                    const s = students.find(st => String(st.id) === String(e.student));
                    items.push({
                        id: `enroll-${e.id}`, icon: '✅',
                        text: `${s?.full_name || 'A student'} was enrolled in section #${e.section}`,
                        time: 'Recent', color: 'text-emerald-500', to: '/enrollments',
                    });
                });
                sections.forEach(sec => {
                    const count = enrollments.filter(e => String(e.section) === String(sec.id)).length;
                    const cap = sec.capacity || 0;
                    if (cap > 0 && count >= cap * 0.9) {
                        items.push({
                            id: `cap-${sec.id}`, icon: '⚠️',
                            text: `Section "${sec.section_code}" is almost full (${count}/${cap})`,
                            time: 'Now', color: 'text-amber-500', to: '/sections',
                        });
                    }
                });
                if (students.length > 0) {
                    items.push({
                        id: `students-total-${students.length}`, icon: '🎓',
                        text: `${students.length} student${students.length !== 1 ? 's' : ''} registered in the system`,
                        time: 'Info', color: 'text-sky-500', to: '/students',
                    });
                }

                const newNotifs = items.slice(0, 5);
                setNotifs(newNotifs);

                const lastSeenRaw = localStorage.getItem('notif_last_seen');
                const lastSeenIds = lastSeenRaw ? JSON.parse(lastSeenRaw) : [];
                const newIds = newNotifs.map(n => n.id);
                const unseen = newIds.filter(id => !lastSeenIds.includes(id));
                setUnreadCount(unseen.length);

            } catch { }
        };

        build(); // run immediately
        const interval = setInterval(build, 10000); // then every 10 seconds
        return () => clearInterval(interval); // cleanup on unmount
    }, []);

    const handleOpen = () => {
        setOpen(o => !o);
        // Mark all current notifs as seen
        const ids = notifs.map(n => n.id);
        localStorage.setItem('notif_last_seen', JSON.stringify(ids));
        setUnreadCount(0);
    };

    return (
        <div className="relative">
            <button
                onClick={handleOpen}
                className={`relative rounded-xl p-2.5 border transition ${isDay
                    ? 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white/90'
                    : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                        <span className="text-[9px] font-bold text-white leading-none">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                        className={`absolute right-0 top-12 w-80 rounded-2xl shadow-2xl border z-50 overflow-hidden ${isDay ? 'bg-white border-slate-100' : 'bg-[#0d1f3c] border-white/10'}`}>
                        <div className={`flex items-center justify-between px-4 py-3 border-b ${isDay ? 'border-slate-100' : 'border-white/10'}`}>
                            <p className={`text-sm font-bold ${isDay ? 'text-slate-800' : 'text-white'}`}>
                                Notifications
                                {notifs.length > 0 && (
                                    <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-500">{notifs.length}</span>
                                )}
                            </p>
                            <button onClick={() => setOpen(false)} className={`text-lg ${isDay ? 'text-slate-400 hover:text-slate-700' : 'text-white/40 hover:text-white'}`}>×</button>
                        </div>
                        <div className="max-h-72 overflow-y-auto">
                            {notifs.length === 0 ? (
                                <div className={`text-xs text-center py-8 ${isDay ? 'text-slate-400' : 'text-white/30'}`}>
                                    <div className="text-3xl mb-2">🔔</div>No notifications yet
                                </div>
                            ) : notifs.map((n) => (
                                <button key={n.id}
                                    onClick={() => { if (n.to) { setOpen(false); navigate(n.to); } }}
                                    className={`w-full flex items-start gap-3 px-4 py-3 border-b last:border-0 text-left transition
                                        ${n.to ? 'cursor-pointer' : 'cursor-default'}
                                        ${isDay ? 'border-slate-50 hover:bg-sky-50' : 'border-white/5 hover:bg-white/5'}`}>
                                    <span className="text-xl shrink-0 mt-0.5">{n.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs leading-relaxed ${isDay ? 'text-slate-700' : 'text-white/80'}`}>{n.text}</p>
                                        <div className="flex items-center justify-between mt-1">
                                            <p className={`text-[10px] font-semibold ${n.color}`}>{n.time}</p>
                                            {n.to && <p className={`text-[10px] ${isDay ? 'text-slate-400' : 'text-white/30'}`}>View →</p>}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ══ Sidebar Component Content ══ */
function SidebarContent({ navigate, onToggleNight, nightMode, onLogout, user, onClose, pathname }) {
    const role = user?.role || 'user';
    const isDay = !nightMode;

    const NAV_ITEMS = [
        { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
        { label: 'Students', icon: '🎓', to: '/students', staffOnly: true },
        { label: 'Subjects', icon: '📚', to: '/subjects', staffOnly: true },
        { label: 'Sections', icon: '🏫', to: '/sections', staffOnly: true },
        { label: 'Enrollments', icon: '✅', to: '/enrollments', staffOnly: true },
        { label: 'Summary', icon: '📊', to: '/summary' },
        { label: 'Users', icon: '🛡️', to: '/users', adminOnly: true },
    ];

    return (
        <div className={`flex flex-col h-full ${isDay ? 'sidebar-day' : 'sidebar-night'}`}>
            {/* Profile block */}
            <div className="px-5 pt-7 pb-5 border-b border-white/10">
                <div className="flex items-start justify-between mb-3">
                    <div className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-2xl font-extrabold overflow-hidden shadow-lg ring-2 ring-amber-400/40 text-[#0a1628] flex-shrink-0">
                        {user?.profile_picture
                            ? <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                            : user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <button onClick={onToggleNight}
                        className="rounded-full bg-white/10 hover:bg-white/25 transition p-2 text-white/70 hover:text-white mt-1">
                        <span className="text-lg">{isDay ? '🌙' : '☀️'}</span>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-white leading-tight truncate">
                        {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'User'}
                    </p>
                    {pathname !== '/profile' && (
                        <button onClick={() => { navigate('/profile'); onClose?.(); }} title="Edit profile"
                            className="shrink-0 rounded-full p-1 bg-white/10 hover:bg-amber-400/20 hover:text-amber-300 text-white/50 transition">
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                            </svg>
                        </button>
                    )}
                </div>
                <p className="text-xs text-white/40 mt-0.5 truncate">@{user?.username || 'user'}</p>
                {user?.role && (
                    <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
            ${role === 'admin' ? 'bg-amber-400/20 text-amber-300' : role === 'staff' ? 'bg-sky-400/20 text-sky-300' : 'bg-white/10 text-white/40'}`}>
                        {role}
                    </span>
                )}
            </div>

            <div className="flex flex-col flex-1 overflow-y-auto px-3 pt-3 gap-1">
                <p className="px-4 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">General</p>
                {[
                    { label: 'Dashboard', icon: '🏠', to: '/dashboard' },
                    { label: 'Profile', icon: '👤', to: '/profile' },
                ].map(item => {
                    const active = pathname === item.to;
                    return (
                        <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
                            <span className="text-lg w-6 text-center">{item.icon}</span>
                            <span>{item.label}</span>
                            {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
                        </button>
                    );
                })}

                <div className="my-2 border-t border-white/10" />
                <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Management</p>
                {NAV_ITEMS.filter(item => {
                    if (item.adminOnly) return false;
                    if (item.staffOnly) return canManageSchool(role);
                    return !['Dashboard', 'Profile'].includes(item.label);
                }).map(item => {
                    const active = pathname === item.to;
                    return (
                        <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
                            <span className="text-lg w-6 text-center">{item.icon}</span>
                            <span>{item.label}</span>
                            {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
                        </button>
                    );
                })}

                {isAdmin(role) && (<>
                    <div className="my-2 border-t border-white/10" />
                    <p className="px-4 pb-1 text-[10px] font-bold uppercase tracking-widest text-white/25">Admin</p>
                    {NAV_ITEMS.filter(i => i.adminOnly).map(item => {
                        const active = pathname === item.to;
                        return (
                            <button key={item.to} onClick={() => { navigate(item.to); onClose?.(); }}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-left text-[15px] font-medium transition-all border
                  ${active ? 'bg-amber-400/20 text-amber-300 border-amber-400/25' : 'text-white/60 hover:bg-white/10 hover:text-white border-transparent'}`}>
                                <span className="text-lg w-6 text-center">{item.icon}</span>
                                <span>{item.label}</span>
                                {active && <span className="ml-auto w-1.5 h-5 rounded-full bg-amber-400" />}
                            </button>
                        );
                    })}
                </>)}

                <div className="flex-1" />
                <div className="border-t border-white/10 mt-2" />
                <button onClick={onLogout}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-400/70 hover:bg-red-500/15 hover:text-red-300 transition text-[15px] font-medium border border-transparent w-full">
                    <span className="text-lg w-6 text-center">🚪</span><span>Log Out</span>
                </button>
                <p className="px-4 py-2 text-[11px] text-white/20 font-medium tracking-widest uppercase">School Portal v1.0</p>
            </div>
        </div>
    );
}

/* ══ Universal Dashboard Layout Shell ══ */
export default function DashboardShell({ nightMode, onToggleNight, user, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isDay = !nightMode;
    const textH = isDay ? 'text-slate-800' : 'text-white';
    const textS = isDay ? 'text-slate-500' : 'text-white/50';
    const accent = isDay ? 'text-sky-600' : 'text-amber-400';

    const getPageTitle = () => {
        const path = location.pathname.replace('/', '');
        if (!path) return 'Dashboard';
        return path.charAt(0).toUpperCase() + path.slice(1);
    };

    return (
        <div className={`flex min-h-screen ${isDay ? 'bg-hue-day' : 'bg-hue-night'}`}>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 min-h-screen shrink-0">
                <SidebarContent
                    navigate={navigate}
                    onToggleNight={onToggleNight}
                    nightMode={nightMode}
                    onLogout={onLogout}
                    user={user}
                    pathname={location.pathname}
                />
            </aside>

            {/* Mobile Drawer */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div className="absolute left-0 top-0 bottom-0 w-72 flex flex-col" onClick={e => e.stopPropagation()}>
                        <SidebarContent
                            navigate={navigate}
                            onToggleNight={onToggleNight}
                            nightMode={nightMode}
                            onLogout={onLogout}
                            user={user}
                            onClose={() => setMobileMenuOpen(false)}
                            pathname={location.pathname}
                        />
                    </div>
                </div>
            )}

            {/* Main Content Pane */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

                <header className={`${isDay ? 'topbar-day' : 'topbar-night'} border-b px-6 lg:px-10 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm`}>
                    <button className={`lg:hidden rounded-xl border p-2.5 transition shrink-0
            ${isDay ? 'border-slate-200 bg-white/70 text-slate-600' : 'border-white/10 bg-white/5 text-white/70'}`}
                        onClick={() => setMobileMenuOpen(true)}>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    <div className="flex-1">
                        <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight leading-none ${textH}`}>
                            {getPageTitle()}
                        </h1>
                        {/* ── Per-page contextual subtitle ── */}
                        <p className={`text-sm mt-1 ${textS}`}>
                            {getSubtitle(location.pathname, user, accent)}
                        </p>
                    </div>

                    <NotifBell isDay={isDay} />

                    <div className="hidden lg:flex flex-col items-end shrink-0">
                        <p className={`text-base font-bold leading-none ${textH}`}>
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        </p>
                        <p className={`text-xs mt-0.5 ${textS}`}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric' })}
                        </p>
                    </div>
                </header>

                {/*
                  FIX: scrollbar-gutter: stable reserves the scrollbar track width at all times,
                  so the layout doesn't shift when navigating between short and tall pages.
                */}
                <main
                    className="flex-1 overflow-y-auto px-6 lg:px-10 py-8 relative"
                    style={{ scrollbarGutter: 'stable' }}
                >
                    <AnimatePresence mode="wait" initial={true}>
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                            style={{ willChange: 'opacity, transform' }}
                            className="min-h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

            </div>
        </div>
    );
}