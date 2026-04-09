import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Heart, Users, Plus, Search, Send, Bot, X, Check, Globe, Crown,
    MessageSquare, BarChart3, CalendarDays, Sparkles, ArrowLeft, UserPlus
} from "lucide-react";
import { useAuth, SpaceType } from "../App";
import { apiGetVibeRequests, apiFetch } from "../api";

type Connection = {
    id: number;
    from_user: { id: number; name: string; avatar: string; email: string; branch: string; tags: string[] };
    to_user: { id: number; name: string; avatar: string; email: string };
    status: string;
    score: number;
    created_at: string;
};

type PoolMessage = {
    id: number;
    author: string;
    avatar: string;
    text: string;
    time: string;
};

export default function ConnectionPool() {
    const { user, spaces, joinedSpaces, polls, events } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedConn, setSelectedConn] = useState<Connection | null>(null);
    const [search, setSearch] = useState("");
    const [messages, setMessages] = useState<Record<string, PoolMessage[]>>({});
    const [msgInput, setMsgInput] = useState("");
    const [activeTab, setActiveTab] = useState<"chat" | "shared-spaces" | "ideas">("chat");

    useEffect(() => {
        loadConnections();
    }, []);

    const loadConnections = async () => {
        setLoading(true);
        try {
            const data = await apiGetVibeRequests();
            setConnections(data.connections || []);
        } catch {
            // Fallback demo connections
            setConnections([]);
        } finally {
            setLoading(false);
        }
    };

    const getOtherUser = (conn: Connection) => {
        return conn.from_user.email === user?.email ? conn.to_user : conn.from_user;
    };

    const getPoolKey = (conn: Connection) => `pool-${Math.min(conn.from_user.id, conn.to_user.id)}-${Math.max(conn.from_user.id, conn.to_user.id)}`;

    const sendMessage = (conn: Connection) => {
        if (!msgInput.trim()) return;
        const key = getPoolKey(conn);
        const msg: PoolMessage = {
            id: Date.now(),
            author: user?.name || "You",
            avatar: user?.avatar || "👤",
            text: msgInput.trim(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages(prev => ({
            ...prev,
            [key]: [...(prev[key] || []), msg],
        }));
        setMsgInput("");
    };

    const filtered = connections.filter(c => {
        const other = getOtherUser(c);
        return other.name.toLowerCase().includes(search.toLowerCase());
    });

    // Connection Detail View
    if (selectedConn) {
        const other = getOtherUser(selectedConn);
        const key = getPoolKey(selectedConn);
        const poolMessages = messages[key] || [];
        const otherFull = "tags" in other ? (other as Connection["from_user"]) : null;

        return (
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedConn(null)} className="text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500/30 to-emerald-500/30 flex items-center justify-center text-xl border border-white/10">{other.avatar}</div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{other.name}</h2>
                            <p className="text-xs text-slate-500">Connected • Score: {selectedConn.score}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <Heart className="w-3 h-3 text-emerald-400 fill-current" />
                        <span className="text-xs font-medium text-emerald-400">Connected</span>
                    </div>
                </div>

                {/* Tags */}
                {otherFull?.tags && otherFull.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {otherFull.tags.map(t => (
                            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{t}</span>
                        ))}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 mb-4">
                    {(["chat", "shared-spaces", "ideas"] as const).map(t => (
                        <button key={t} onClick={() => setActiveTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${activeTab === t ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                            {t === "chat" ? "💬 Chat" : t === "shared-spaces" ? "🌐 Shared Spaces" : "💡 Ideas"}
                        </button>
                    ))}
                </div>

                {/* Chat */}
                {activeTab === "chat" && (
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px]">
                            {poolMessages.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Start sharing ideas with {other.name}!</p>
                                    <p className="text-xs text-slate-600 mt-1">This is your private connection space</p>
                                </div>
                            ) : (
                                poolMessages.map(msg => (
                                    <div key={msg.id} className={`flex gap-2 ${msg.author === user?.name ? "flex-row-reverse" : ""}`}>
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500/30 to-amber-500/30 flex items-center justify-center text-sm flex-shrink-0">{msg.avatar}</div>
                                        <div className={`max-w-[70%] ${msg.author === user?.name ? "text-right" : ""}`}>
                                            <div className={`px-3 py-2 rounded-xl text-sm ${msg.author === user?.name ? "bg-violet-500/15 text-violet-100 rounded-tr-none" : "bg-white/5 text-slate-200 rounded-tl-none"}`}>
                                                {msg.text}
                                            </div>
                                            <p className="text-[10px] text-slate-600 mt-0.5">{msg.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input value={msgInput} onChange={e => setMsgInput(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && sendMessage(selectedConn)}
                                placeholder="Share an idea..."
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/40 transition-all" />
                            <button onClick={() => sendMessage(selectedConn)}
                                className="px-4 py-2.5 bg-violet-500/15 text-violet-400 rounded-xl hover:bg-violet-500/25 transition-all">
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Shared Spaces */}
                {activeTab === "shared-spaces" && (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 mb-2">Spaces you both belong to</p>
                        {spaces.filter(s => joinedSpaces.includes(s.id)).length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-8">No shared spaces yet. Join together!</p>
                        ) : (
                            spaces.filter(s => joinedSpaces.includes(s.id)).map(s => (
                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <span className="text-2xl">{s.icon}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-white">{s.name}</p>
                                        <p className="text-[10px] text-slate-500">{s.members} members • {s.type}</p>
                                    </div>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r ${s.color} text-white`}>{s.category}</span>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Ideas Board */}
                {activeTab === "ideas" && (
                    <div className="space-y-3">
                        <p className="text-xs text-slate-500 mb-2">Shared idea board with {other.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: "🤝", title: "Hackathon Team", desc: "Form a team for the next hackathon" },
                                { icon: "📚", title: "Study Group", desc: "Create a study group together" },
                                { icon: "🚀", title: "Side Project", desc: "Build something cool together" },
                                { icon: "🎯", title: "Skill Exchange", desc: "Teach each other new skills" },
                            ].map((idea, i) => (
                                <motion.div key={i} className="glass rounded-xl p-3 text-center cursor-pointer hover:bg-white/[0.08] transition-all"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                    <span className="text-2xl">{idea.icon}</span>
                                    <p className="text-xs font-semibold text-white mt-1">{idea.title}</p>
                                    <p className="text-[10px] text-slate-500 mt-0.5">{idea.desc}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Connection Pool List
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Heart className="w-6 h-6 text-rose-400" /> Connection Pool
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Your accepted vibe matches — share ideas, collaborate, and connect</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                    { label: "Connections", value: connections.length, color: "text-emerald-400" },
                    { label: "Avg Score", value: connections.length > 0 ? `${Math.round(connections.reduce((s, c) => s + c.score, 0) / connections.length)}%` : "—", color: "text-violet-400" },
                    { label: "Active Chats", value: Object.keys(messages).filter(k => (messages[k] || []).length > 0).length, color: "text-amber-400" },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div className="relative mb-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connections..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-violet-500/40 transition-all outline-none" />
            </div>

            {/* Connection Cards */}
            {loading ? (
                <div className="text-center py-16">
                    <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-500">Loading connections...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">{connections.length === 0 ? "No connections yet." : "No matches found."}</p>
                    <p className="text-xs text-slate-600 mt-1">Use Vibe Matcher to find and connect with students!</p>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {filtered.map((conn, i) => {
                        const other = getOtherUser(conn);
                        const otherFull = "tags" in other ? (other as Connection["from_user"]) : null;
                        const key = getPoolKey(conn);
                        const msgCount = (messages[key] || []).length;
                        return (
                            <motion.div key={conn.id}
                                className="glass rounded-2xl p-4 cursor-pointer hover:bg-white/[0.08] transition-all group"
                                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                onClick={() => setSelectedConn(conn)}>
                                <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500/30 to-emerald-500/30 flex items-center justify-center text-2xl border border-white/10 flex-shrink-0">
                                        {other.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-white truncate">{other.name}</p>
                                            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{conn.score}%</span>
                                        </div>
                                        {otherFull?.branch && <p className="text-[10px] text-slate-500 mt-0.5">{otherFull.branch}</p>}
                                        {otherFull?.tags && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {otherFull.tags.slice(0, 3).map(t => (
                                                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                    <span className="text-[10px] text-slate-500">
                                        Connected {new Date(conn.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {msgCount > 0 && (
                                            <span className="flex items-center gap-1 text-[10px] text-violet-400">
                                                <MessageSquare className="w-3 h-3" />{msgCount}
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-600 group-hover:text-white transition-colors">Open →</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
