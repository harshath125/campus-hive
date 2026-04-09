import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Tag, Brain, Zap, Heart, TrendingUp, GitBranch, Calendar, MapPin, UserPlus, Check, X, Clock, Send } from "lucide-react";
import { useAuth } from "../App";
import { apiVibeMatches, apiUpdateTags, apiSendVibeRequest, apiGetVibeRequests, apiRespondVibeRequest } from "../api";

const allTags = ["Python", "AI/ML", "Hackathons", "Night Owl", "React", "Design", "Music", "Gaming", "Web Dev", "DSA", "Cloud", "Open Source", "Photography", "Fitness", "Chess", "Poetry", "Robotics", "Public Speaking"];

type MatchUser = {
    user: {
        id: number;
        name: string;
        avatar: string;
        tags: string[];
        branch: string;
        section: string;
        year: number;
    };
    score: number;
    common_tags: string[];
    insight: string;
    match_factors?: {
        tags_similarity: number;
        branch_match: boolean;
        year_proximity: number;
        section_match: boolean;
        shared_count: number;
    };
};

type VibeReq = {
    id: number;
    from_user: { id: number; name: string; avatar: string; email: string; branch: string; tags: string[] };
    to_user: { id: number; name: string; avatar: string; email: string };
    status: string;
    score: number;
    created_at: string;
};

// Fallback mock data (when backend is unavailable)
const mockMatches: MatchUser[] = [
    { user: { id: 1, name: "Priya Sharma", avatar: "🌟", tags: ["Python", "AI/ML", "Hackathons", "Night Owl", "Chess"], branch: "CSE", section: "3-A", year: 3 }, score: 87, common_tags: ["Python", "AI/ML", "Hackathons"], insight: "You both thrive in late-night AI hackathons!", match_factors: { tags_similarity: 82, branch_match: true, year_proximity: 0, section_match: true, shared_count: 3 } },
    { user: { id: 2, name: "Rahul Verma", avatar: "🚀", tags: ["DSA", "Web Dev", "Cloud", "Python", "Open Source"], branch: "CSE", section: "3-A", year: 3 }, score: 75, common_tags: ["Python", "Open Source"], insight: "Great synergy for open-source projects together.", match_factors: { tags_similarity: 65, branch_match: true, year_proximity: 0, section_match: true, shared_count: 2 } },
    { user: { id: 3, name: "Ananya Patel", avatar: "🎨", tags: ["Design", "React", "Photography", "Music"], branch: "CSE", section: "3-B", year: 3 }, score: 68, common_tags: ["React", "Design"], insight: "Perfect team for UI/UX and frontend projects.", match_factors: { tags_similarity: 58, branch_match: true, year_proximity: 0, section_match: false, shared_count: 2 } },
];

export default function VibeMatcher() {
    const { user } = useAuth();
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [matches, setMatches] = useState<MatchUser[]>([]);
    const [sentRequests, setSentRequests] = useState<Record<number, string>>({}); // userId -> status
    const [incomingRequests, setIncomingRequests] = useState<VibeReq[]>([]);
    const [connections, setConnections] = useState<VibeReq[]>([]);
    const [totalConsidered, setTotalConsidered] = useState(0);
    const [algorithm, setAlgorithm] = useState("TF-IDF + Cosine Similarity + Weighted Multi-Factor");
    const [error, setError] = useState("");
    const [showIncoming, setShowIncoming] = useState(true);
    const [sending, setSending] = useState<number | null>(null);

    // Load vibe requests on mount
    useEffect(() => {
        loadVibeRequests();
    }, []);

    const loadVibeRequests = async () => {
        try {
            const data = await apiGetVibeRequests();
            setIncomingRequests((data.incoming || []).filter((r: VibeReq) => r.status === "pending"));
            setConnections(data.connections || []);
            // Build sent map
            const sent: Record<number, string> = {};
            for (const r of data.outgoing || []) {
                sent[r.to_user.id] = r.status;
            }
            for (const r of data.incoming || []) {
                if (r.status === "accepted") sent[r.from_user.id] = "accepted";
            }
            setSentRequests(sent);
        } catch { /* offline */ }
    };

    const runMatcher = async () => {
        setRunning(true);
        setDone(false);
        setError("");

        try {
            const data = await apiVibeMatches();
            const fetchedMatches = (data.matches || []).map((m: any) => ({
                user: m.user,
                score: m.score,
                common_tags: m.common_tags,
                insight: m.insight || "Great match! 🌟",
                match_factors: m.match_factors,
            }));
            setMatches(fetchedMatches);
            setTotalConsidered(data.total_considered || 0);
            setAlgorithm(data.algorithm || "ML-Enhanced Matching");
            setDone(true);
        } catch (err: any) {
            console.warn("Backend unavailable, using mock data:", err);
            setTimeout(() => {
                setMatches(mockMatches.sort((a, b) => b.score - a.score));
                setTotalConsidered(mockMatches.length * 8);
                setDone(true);
            }, 1500);
        } finally {
            setRunning(false);
        }
    };

    const handleSendRequest = async (userId: number, score: number) => {
        setSending(userId);
        try {
            await apiSendVibeRequest(userId, score);
            setSentRequests(prev => ({ ...prev, [userId]: "pending" }));
            await loadVibeRequests();
        } catch (err: any) {
            if (err?.status === 409) {
                setSentRequests(prev => ({ ...prev, [userId]: "pending" }));
            }
        } finally {
            setSending(null);
        }
    };

    const handleRespond = async (requestId: number, action: "accept" | "decline") => {
        try {
            await apiRespondVibeRequest(requestId, action);
            await loadVibeRequests();
        } catch { /* */ }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "from-emerald-400 to-green-500";
        if (score >= 60) return "from-amber-400 to-orange-500";
        if (score >= 40) return "from-blue-400 to-violet-500";
        return "from-slate-400 to-slate-500";
    };

    const getRequestStatus = (userId: number): string | null => {
        return sentRequests[userId] || null;
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Users className="w-6 h-6 text-violet-400" /> Vibe Matcher
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">ML-powered student matching • TF-IDF + Cosine Similarity</p>
                </div>
            </div>

            {/* Incoming Vibe Requests */}
            {incomingRequests.length > 0 && (
                <motion.div className="glass rounded-2xl p-4 mb-5 border border-violet-500/20" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3 cursor-pointer" onClick={() => setShowIncoming(!showIncoming)}>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                                <UserPlus className="w-3.5 h-3.5 text-violet-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Incoming Vibe Requests</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300">{incomingRequests.length}</span>
                        </div>
                    </div>
                    <AnimatePresence>
                        {showIncoming && (
                            <motion.div className="space-y-2" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                {incomingRequests.map(req => (
                                    <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500/30 to-amber-500/30 flex items-center justify-center text-lg">{req.from_user.avatar}</div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{req.from_user.name}</p>
                                                <p className="text-[10px] text-slate-500">{req.from_user.branch} • Score: {req.score}%</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleRespond(req.id, "accept")}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all">
                                                <Check className="w-3 h-3" /> Accept
                                            </button>
                                            <button onClick={() => handleRespond(req.id, "decline")}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-all">
                                                <X className="w-3 h-3" /> Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}

            {/* Connections */}
            {connections.length > 0 && (
                <div className="glass rounded-2xl p-4 mb-5 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                        <Heart className="w-4 h-4 text-emerald-400 fill-current" />
                        <span className="text-sm font-semibold text-white">Your Connections ({connections.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {connections.map(c => {
                            const other = c.from_user.email === user?.email ? c.to_user : c.from_user;
                            return (
                                <div key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <span className="text-sm">{other.avatar}</span>
                                    <span className="text-xs font-medium text-emerald-300">{other.name}</span>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Your Profile & Tags */}
            <div className="glass rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{user?.avatar || "👾"}</div>
                    <div>
                        <p className="text-sm font-semibold text-white">{user?.name}</p>
                        <p className="text-xs text-slate-400">{user?.branch} {user?.section ? `· Sec ${user.section}` : ""}</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {(user?.tags || []).map(tag => (
                        <span key={tag} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
                            <Tag className="w-2.5 h-2.5" />{tag}
                        </span>
                    ))}
                    {(!user?.tags || user.tags.length === 0) && <p className="text-xs text-slate-500">No tags yet — edit your profile to add interests!</p>}
                </div>
                <button onClick={runMatcher} disabled={running}
                    className="w-full py-3 text-sm font-semibold bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    {running ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing profiles with ML algorithm…</>
                    ) : (
                        <><Brain className="w-4 h-4" /> Find My Vibe Matches</>
                    )}
                </button>
                {running && <p className="text-xs text-center text-violet-300/70 mt-2">Running TF-IDF + Cosine Similarity on student profiles…</p>}
            </div>

            {/* Algorithm Info */}
            {done && (
                <div className="glass rounded-xl p-3 mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs text-slate-400">Algorithm: <span className="text-emerald-400 font-medium">{algorithm}</span></span>
                    </div>
                    <span className="text-xs text-slate-500">{totalConsidered} profiles analyzed</span>
                </div>
            )}

            {/* Matches */}
            <AnimatePresence>
                {done && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" />Showing top {matches.length} matches</p>
                        <div className="space-y-3">
                            {matches.map((m, i) => {
                                const reqStatus = getRequestStatus(m.user.id);
                                const isSending = sending === m.user.id;
                                return (
                                    <motion.div key={m.user.name} className="glass rounded-2xl p-4 hover:bg-white/[0.08] transition-all"
                                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-500/30 to-amber-500/30 border border-white/10 flex items-center justify-center text-2xl">
                                                    {m.user.avatar}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{m.user.name}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {m.user.branch && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><GitBranch className="w-2.5 h-2.5" />{m.user.branch}</span>}
                                                        {m.user.year && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><Calendar className="w-2.5 h-2.5" />Year {m.user.year}</span>}
                                                        {m.user.section && <span className="text-[10px] text-slate-500 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{m.user.section}</span>}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {m.common_tags.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{t}</span>)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-3">
                                                <div className={`text-xl font-bold bg-gradient-to-r ${getScoreColor(m.score)} bg-clip-text text-transparent`}>{m.score}%</div>
                                                <div className="text-[10px] text-slate-500">Vibe Score</div>
                                            </div>
                                        </div>
                                        <div className="mt-3">
                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-2">
                                                <motion.div className={`h-full bg-gradient-to-r ${getScoreColor(m.score)} rounded-full`}
                                                    initial={{ width: 0 }} animate={{ width: `${m.score}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }} />
                                            </div>
                                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 text-amber-400 flex-shrink-0" />{m.insight}
                                            </p>

                                            {/* Match Factors */}
                                            {m.match_factors && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {m.match_factors.branch_match && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">✓ Same Branch</span>}
                                                    {m.match_factors.section_match && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">✓ Same Section</span>}
                                                    {m.match_factors.year_proximity === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">✓ Same Year</span>}
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">{m.match_factors.shared_count} shared tags</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                            <div className="flex flex-wrap gap-1">
                                                {m.user.tags.slice(0, 4).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 text-slate-500">{t}</span>)}
                                            </div>
                                            {/* Send Vibe Request Button */}
                                            {reqStatus === "accepted" ? (
                                                <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                                                    <Check className="w-3.5 h-3.5" /> Connected
                                                </span>
                                            ) : reqStatus === "pending" ? (
                                                <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                                                    <Clock className="w-3.5 h-3.5" /> Request Sent
                                                </span>
                                            ) : (
                                                <button onClick={() => handleSendRequest(m.user.id, m.score)} disabled={isSending}
                                                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-all font-medium disabled:opacity-50">
                                                    {isSending ? <div className="w-3 h-3 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                                    {isSending ? "Sending..." : "Send Vibe Request"}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {!done && !running && (
                <div className="text-center py-12 text-slate-500">
                    <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-8 h-8 text-violet-400 opacity-50" />
                    </div>
                    <p className="text-sm">Click "Find My Vibe Matches" to discover students who share your interests!</p>
                    <p className="text-xs text-slate-600 mt-2">Powered by TF-IDF + Cosine Similarity + Multi-Factor Scoring</p>
                </div>
            )}
        </div>
    );
}
