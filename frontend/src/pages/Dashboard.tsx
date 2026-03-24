import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Hexagon, Users, BarChart3, CalendarDays, Shield, Globe,
    LogOut, ChevronRight, Bell, Search, BookOpen, X,
    User, Edit2, Check, Tag, MapPin, GraduationCap
} from "lucide-react";
import { useAuth } from "../App";
import { apiUpdateProfile } from "../api";

const navItems = [
    { to: "/dashboard/vibe-matcher", icon: Users, label: "Vibe Matcher", color: "text-violet-400" },
    { to: "/dashboard/polls", icon: BarChart3, label: "Smart Polls", color: "text-amber-400" },
    { to: "/dashboard/events", icon: CalendarDays, label: "Event Planner", color: "text-emerald-400" },
    { to: "/dashboard/safety", icon: Shield, label: "Safety Shield", color: "text-red-400" },
    { to: "/dashboard/spaces", icon: Globe, label: "My Spaces", color: "text-cyan-400" },
    { to: "/dashboard/resources", icon: BookOpen, label: "Resources", color: "text-blue-400" },
];

const avatarOptions = ["👾", "🎓", "🚀", "🎯", "⚡", "🌟", "🔥", "🌊", "🎮", "🦋", "🐉", "🦊"];
const tagSuggestions = ["Python", "AI/ML", "Hackathons", "Night Owl", "React", "Design", "Music", "Gaming", "Web Dev", "DSA", "Cloud", "Open Source", "Photography", "Fitness"];

export default function Dashboard() {
    const { user, logout, announcements, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [showProfile, setShowProfile] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editedUser, setEditedUser] = useState(user);
    const [tagInput, setTagInput] = useState("");
    const [showNotifications, setShowNotifications] = useState(false);

    const handleLogout = () => { logout(); navigate("/"); };

    const saveProfile = async () => {
        if (editedUser) {
            updateProfile(editedUser);
            // Sync to backend so Vibe Matcher can access the latest tags/branch/year
            try {
                await apiUpdateProfile({
                    name: editedUser.name,
                    tags: editedUser.tags,
                    branch: editedUser.branch,
                    section: editedUser.section,
                    year: editedUser.year,
                    avatar: editedUser.avatar,
                });
            } catch (e) {
                console.warn("Profile sync to backend failed (offline mode):", e);
            }
        }
        setEditMode(false);
    };

    const addTag = (tag: string) => {
        if (!editedUser) return;
        const trimmed = tag.trim();
        if (trimmed && !editedUser.tags.includes(trimmed)) {
            setEditedUser(prev => prev ? { ...prev, tags: [...prev.tags, trimmed] } : prev);
        }
        setTagInput("");
    };

    const removeTag = (t: string) => {
        setEditedUser(prev => prev ? { ...prev, tags: prev.tags.filter(tag => tag !== t) } : prev);
    };

    return (
        <div className="min-h-screen bg-[#020617] flex">
            {/* ── Desktop Sidebar ── */}
            <aside className="hidden lg:flex w-64 flex-col border-r border-white/5 bg-[#0F172A]/70 backdrop-blur-sm fixed h-full z-30">
                {/* Logo */}
                <div className="p-5 flex items-center gap-2.5 border-b border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center shadow-lg">
                        <Hexagon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                        <span className="text-base font-bold text-white block leading-none">Campus Hive</span>
                        <span className="text-[9px] font-medium text-amber-300/70">ANITS</span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                                    ? "bg-gradient-to-r from-amber-500/10 to-violet-500/10 text-white border border-amber-500/20"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                                }`}>
                            <item.icon className={`w-4.5 h-4.5 ${item.color}`} />
                            {item.label}
                            <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-30 group-hover:opacity-70 transition-opacity" />
                        </NavLink>
                    ))}
                </nav>

                {/* ── Profile Section ── */}
                <div className="p-4 border-t border-white/5">
                    <button onClick={() => { setShowProfile(true); setEditedUser(user); setEditMode(false); }}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all group mb-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-lg shadow-md flex-shrink-0">
                            {user?.avatar || "👾"}
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-white truncate">{user?.name || "Student"}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
                        </div>
                        <User className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                    </button>
                    <button onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col lg:ml-64">
                {/* Top Bar */}
                <header className="h-14 border-b border-white/5 px-4 flex items-center justify-between sticky top-0 z-20 bg-[#020617]/80 backdrop-blur-sm">
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 lg:hidden">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center">
                            <Hexagon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-white text-sm">Campus Hive</span>
                    </div>

                    {/* Search */}
                    <div className="hidden sm:flex items-center flex-1 max-w-sm lg:max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input type="text" placeholder="Search spaces, events, polls..."
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-amber-500/40 transition-all outline-none" />
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        {/* Bell */}
                        <button onClick={() => setShowNotifications(!showNotifications)} className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors">
                            <Bell className="w-4.5 h-4.5 text-slate-400" />
                            {announcements.length > 0 && <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-amber-500 rounded-full" />}
                        </button>
                        
                        {/* Notifications Dropdown */}
                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-16 right-4 w-80 bg-[#0F172A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                                    <div className="p-4 border-b border-white/5 bg-white/5">
                                        <h3 className="text-sm font-bold text-white">Notifications &amp; Announcements</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto w-full p-2 space-y-2">
                                        {announcements.length === 0 && <p className="text-xs text-slate-500 text-center py-4">No recent announcements.</p>}
                                        {announcements.map((a: any, idx) => (
                                            <div key={a.id || idx} className="p-3 rounded-xl bg-white/5 border border-white/5">
                                                <h4 className="text-sm font-bold text-amber-400 mb-1">{a.title}</h4>
                                                <p className="text-xs text-slate-300">{a.content}</p>
                                                {a.created_at && <p className="text-[10px] text-slate-500 mt-2">{new Date(a.created_at).toLocaleString()}</p>}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Mobile avatar / profile */}
                        <button onClick={() => { setShowProfile(true); setEditedUser(user); setEditMode(false); }}
                            className="lg:hidden w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-sm shadow-md">
                            {user?.avatar || "👾"}
                        </button>
                        {/* Mobile logout */}
                        <button onClick={handleLogout}
                            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-red-500/10 transition-colors">
                            <LogOut className="w-4 h-4 text-slate-400 hover:text-red-400" />
                        </button>
                    </div>
                </header>

                {/* Mobile Nav */}
                <div className="lg:hidden flex overflow-x-auto gap-1 px-3 py-2 border-b border-white/5 bg-[#0F172A]/50 scrollbar-hide">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${isActive ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400 hover:text-white"
                                }`}>
                            <item.icon className="w-3.5 h-3.5" /> {item.label}
                        </NavLink>
                    ))}
                </div>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                        <Outlet />
                    </motion.div>
                </main>
            </div>

            {/* ── Profile Modal ── */}
            <AnimatePresence>
                {showProfile && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !editMode && setShowProfile(false)} />
                        <motion.div className="relative w-full max-w-md glass-strong rounded-2xl overflow-hidden"
                            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                            {/* Header */}
                            <div className="relative h-24 bg-gradient-to-r from-violet-500/30 to-amber-500/30">
                                <button onClick={() => setShowProfile(false)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
                                    <X className="w-4 h-4 text-slate-300" />
                                </button>
                            </div>
                            <div className="px-6 pb-6">
                                {/* Avatar */}
                                <div className="flex items-end justify-between -mt-8 mb-4">
                                    <div>
                                        {editMode ? (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {avatarOptions.map(av => (
                                                    <button key={av} onClick={() => setEditedUser(prev => prev ? { ...prev, avatar: av } : prev)}
                                                        className={`text-2xl p-1.5 rounded-lg transition-all ${editedUser?.avatar === av ? "bg-amber-500/20 ring-2 ring-amber-500/50" : "hover:bg-white/10"}`}>
                                                        {av}
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-3xl shadow-lg ring-4 ring-[#020617]">
                                                {user?.avatar || "👾"}
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={editMode ? saveProfile : () => setEditMode(true)}
                                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${editMode ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white" : "bg-white/5 text-slate-300 hover:bg-white/10"}`}>
                                        {editMode ? <><Check className="w-4 h-4" /> Save</> : <><Edit2 className="w-4 h-4" /> Edit</>}
                                    </button>
                                </div>

                                {/* Name & email */}
                                {editMode ? (
                                    <input value={editedUser?.name || ""} onChange={e => setEditedUser(prev => prev ? { ...prev, name: e.target.value } : prev)}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-lg font-bold text-white outline-none focus:border-violet-500/50 mb-1 transition-all" />
                                ) : (
                                    <h2 className="text-xl font-bold text-white">{user?.name}</h2>
                                )}
                                <p className="text-sm text-slate-400 mb-1">{user?.email}</p>

                                {/* Bio */}
                                {editMode ? (
                                    <textarea value={editedUser?.bio || ""} onChange={e => setEditedUser(prev => prev ? { ...prev, bio: e.target.value } : prev)}
                                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 outline-none focus:border-violet-500/50 mb-3 transition-all resize-none h-16 mt-2"
                                        placeholder="Write a short bio..." />
                                ) : (
                                    <p className="text-sm text-slate-400 mb-3 mt-1">{user?.bio}</p>
                                )}

                                {/* Branch / Section / Year */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {editMode ? (
                                        <>
                                            <select value={editedUser?.branch || ""} onChange={e => setEditedUser(prev => prev ? { ...prev, branch: e.target.value } : prev)}
                                                className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-amber-500/50 transition-all w-28 appearance-none cursor-pointer">
                                                <option value="">Branch</option>
                                                {["CSE","CSM","CSD","CSO","IT","ECE","EEE","ME","CE"].map(b => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                            <select value={editedUser?.section || ""} onChange={e => setEditedUser(prev => prev ? { ...prev, section: e.target.value } : prev)}
                                                className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-amber-500/50 transition-all w-24 appearance-none cursor-pointer">
                                                <option value="">Section</option>
                                                {["A","B","C","D"].map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                            <select value={editedUser?.year || ""} onChange={e => setEditedUser(prev => prev ? { ...prev, year: Number(e.target.value) } : prev)}
                                                className="px-3 py-1.5 bg-slate-800 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-amber-500/50 transition-all w-24 appearance-none cursor-pointer">
                                                <option value="">Year</option>
                                                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                            </select>
                                        </>
                                    ) : (
                                        <>
                                            {user?.branch && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300"><GraduationCap className="w-3 h-3" />{user.branch}</span>}
                                            {user?.section && <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300"><MapPin className="w-3 h-3" />Sec {user.section}</span>}
                                            {user?.year ? <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300">Year {user.year}</span> : null}
                                        </>
                                    )}
                                </div>

                                {/* Tags */}
                                <div>
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-2"><Tag className="w-3 h-3" /> Interests</p>
                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {(editMode ? editedUser?.tags : user?.tags || [])?.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 text-slate-300">
                                                {tag}
                                                {editMode && <button onClick={() => removeTag(tag)} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-3 h-3" /></button>}
                                            </span>
                                        ))}
                                    </div>
                                    {editMode && (
                                        <>
                                            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                                                onKeyDown={e => e.key === "Enter" && addTag(tagInput)}
                                                placeholder="Add tag, press Enter..." className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-amber-500/50 transition-all mb-2" />
                                            <div className="flex flex-wrap gap-1">
                                                {tagSuggestions.filter(t => !editedUser?.tags.includes(t)).slice(0, 8).map(t => (
                                                    <button key={t} onClick={() => addTag(t)} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                                                        + {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Logout button in modal */}
                                <button onClick={handleLogout}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400 border border-red-500/20 hover:bg-red-500/10 transition-all">
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
