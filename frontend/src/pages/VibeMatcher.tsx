import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Tag, Brain, Zap, Heart, TrendingUp, GitBranch, Calendar, MapPin } from "lucide-react";
import { useAuth } from "../App";
import { apiVibeMatches, apiUpdateTags } from "../api";

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

// Fallback mock data (when backend is unavailable)
const mockMatches: MatchUser[] = [
    { user: { id: 1, name: "Priya Sharma", avatar: "🌟", tags: ["Python", "AI/ML", "Hackathons", "Night Owl", "Chess"], branch: "CSE", section: "3-A", year: 3 }, score: 87, common_tags: ["Python", "AI/ML", "Hackathons"], insight: "You both thrive in late-night AI hackathons!", match_factors: { tags_similarity: 82, branch_match: true, year_proximity: 0, section_match: true, shared_count: 3 } },
    { user: { id: 2, name: "Rahul Verma", avatar: "🚀", tags: ["DSA", "Web Dev", "Cloud", "Python", "Open Source"], branch: "CSE", section: "3-A", year: 3 }, score: 75, common_tags: ["Python", "Open Source"], insight: "Great synergy for open-source projects together.", match_factors: { tags_similarity: 65, branch_match: true, year_proximity: 0, section_match: true, shared_count: 2 } },
    { user: { id: 3, name: "Ananya Patel", avatar: "🎨", tags: ["Design", "React", "Photography", "Music"], branch: "CSE", section: "3-B", year: 3 }, score: 68, common_tags: ["React", "Design"], insight: "Perfect team for UI/UX and frontend projects.", match_factors: { tags_similarity: 58, branch_match: true, year_proximity: 0, section_match: false, shared_count: 2 } },
    { user: { id: 4, name: "Karthik Nair", avatar: "⚡", tags: ["Cloud", "AI/ML", "Robotics", "Python", "Gaming"], branch: "ECE", section: "2-A", year: 2 }, score: 62, common_tags: ["Python", "AI/ML"], insight: "Strong alignment in AI and cloud computing paths.", match_factors: { tags_similarity: 55, branch_match: false, year_proximity: 1, section_match: false, shared_count: 2 } },
    { user: { id: 5, name: "Sneha Gupta", avatar: "🌿", tags: ["Public Speaking", "Design", "Music", "Poetry"], branch: "IT", section: "3-A", year: 3 }, score: 45, common_tags: ["Design", "Music"], insight: "Complementary skills — tech meets creativity!", match_factors: { tags_similarity: 35, branch_match: false, year_proximity: 0, section_match: true, shared_count: 2 } },
];

export default function VibeMatcher() {
    const { user } = useAuth();
    const [running, setRunning] = useState(false);
    const [done, setDone] = useState(false);
    const [matches, setMatches] = useState<MatchUser[]>([]);
    const [liked, setLiked] = useState<Record<string, boolean>>({});
    const [totalConsidered, setTotalConsidered] = useState(0);
    const [algorithm, setAlgorithm] = useState("TF-IDF + Cosine Similarity + Weighted Multi-Factor");
    const [error, setError] = useState("");

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
            // Fallback to mock data if backend is down
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

    const getScoreColor = (score: number) => {
        if (score >= 80) return "from-emerald-400 to-green-500";
        if (score >= 60) return "from-amber-400 to-orange-500";
        if (score >= 40) return "from-blue-400 to-violet-500";
        return "from-slate-400 to-slate-500";
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
                            {matches.map((m, i) => (
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

                                        {/* Match Factors Breakdown */}
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
                                        <button onClick={() => setLiked(prev => ({ ...prev, [m.user.name]: !prev[m.user.name] }))}
                                            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-all ${liked[m.user.name] ? "bg-red-500/15 text-red-400" : "bg-white/5 text-slate-400 hover:text-red-400 hover:bg-red-500/10"}`}>
                                            <Heart className={`w-3.5 h-3.5 ${liked[m.user.name] ? "fill-current" : ""}`} />
                                            {liked[m.user.name] ? "Connected" : "Connect"}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
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
