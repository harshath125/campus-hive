import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Sparkles, MessageSquare, Plus, Bot, X, Check, Globe, Lock, Wand2, Zap } from "lucide-react";
import { useAuth } from "../App";
import { apiPollInsight } from "../api";

export default function SmartPolls() {
    const { polls, addPoll, voteOnPoll, user, joinedSpaces, spaces } = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | "">("");
    const [showAI, setShowAI] = useState<number | null>(null);
    const [votingPollId, setVotingPollId] = useState<number | null>(null);
    const [reason, setReason] = useState("");
    const [filterSpace, setFilterSpace] = useState<number | "all">("all");
    const [loadingAI, setLoadingAI] = useState<number | null>(null);
    const [liveInsights, setLiveInsights] = useState<Record<number, string>>({}); // pollId -> insight

    // Only show polls from joined spaces
    const mySpaces = spaces.filter(s => joinedSpaces.includes(s.id));
    const visiblePolls = polls.filter(p => {
        if (filterSpace !== "all") return p.spaceId === filterSpace;
        return joinedSpaces.includes(p.spaceId);
    });

    const handleCreate = () => {
        if (!question.trim() || typeof selectedSpaceId !== "number") return;
        const validOpts = options.filter(o => o.trim());
        if (validOpts.length < 2) return;
        addPoll({
            spaceId: selectedSpaceId,
            question: question.trim(),
            options: validOpts.map((label, i) => ({ id: Date.now() + i, label: label.trim(), votes: 0 })),
            createdBy: user?.name || "Student",
            isActive: true,
        });
        setQuestion(""); setOptions(["", ""]); setSelectedSpaceId(""); setShowCreate(false);
    };

    const handleGetAIInsight = async (pollId: number, question: string, pollAiInsight?: string) => {
        // If already have backend insight, just show it
        if (pollAiInsight) { setShowAI(showAI === pollId ? null : pollId); return; }
        // If we already fetched live insight
        if (liveInsights[pollId]) { setShowAI(showAI === pollId ? null : pollId); return; }
        setLoadingAI(pollId);
        try {
            const data = await apiPollInsight(question);
            if (data.insight) setLiveInsights(prev => ({ ...prev, [pollId]: data.insight }));
        } catch { /* silent */ } finally {
            setLoadingAI(null);
            setShowAI(pollId);
        }
    };

    const getSpaceName = (id: number) => spaces.find(s => s.id === id)?.name || "";
    const getSpaceColor = (id: number) => spaces.find(s => s.id === id)?.color || "";

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-amber-400" /> Smart Polls
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">AI-powered consensus with mandatory reasoning</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-400 rounded-xl hover:bg-amber-500/20 transition-all text-sm font-medium border border-amber-500/20">
                    <Plus className="w-4 h-4" /> New Poll
                </button>
            </div>

            {/* Space Filter Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                <button onClick={() => setFilterSpace("all")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterSpace === "all" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    All Spaces
                </button>
                {mySpaces.map(s => (
                    <button key={s.id} onClick={() => setFilterSpace(s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterSpace === s.id ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        {s.icon} {s.name}
                    </button>
                ))}
            </div>

            {/* Polls */}
            {visiblePolls.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No polls in your spaces yet.</p>
                    <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-amber-400 hover:text-amber-300 transition-colors">Create the first poll →</button>
                </div>
            ) : (
                <div className="space-y-5">
                    {visiblePolls.map(poll => {
                        const space = spaces.find(s => s.id === poll.spaceId);
                        const total = poll.options.reduce((s, o) => s + o.votes, 0);
                        const isVoting = votingPollId === poll.id;
                        return (
                            <motion.div key={poll.id} className="glass rounded-2xl overflow-hidden"
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                                {/* Space label bar */}
                                {space && <div className={`h-1 bg-gradient-to-r ${space.color}`} />}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {space && <span className="text-xs flex items-center gap-1 text-slate-400">{space.icon} {space.name}</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${space?.type === "Private" ? "bg-slate-500/15 text-slate-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                                {space?.type === "Private" ? <span className="flex items-center gap-0.5"><Lock className="w-2.5 h-2.5 inline" /> Private</span> : <span className="flex items-center gap-0.5"><Globe className="w-2.5 h-2.5 inline" /> Public</span>}
                                            </span>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${poll.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                                            {poll.isActive ? "Active" : "Closed"}
                                        </span>
                                    </div>
                                    <h3 className="text-base font-semibold text-white mb-4">{poll.question}</h3>

                                    {/* Options with vote bars */}
                                    <div className="space-y-2.5 mb-4">
                                        {poll.options.map(opt => {
                                            const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                                            const isWinner = pct === Math.max(...poll.options.map(o => total > 0 ? Math.round((o.votes / total) * 100) : 0));
                                            const isUserVote = poll.userVote === opt.id;
                                            return (
                                                <div key={opt.id} className="relative overflow-hidden rounded-xl cursor-pointer group"
                                                    onClick={() => poll.isActive && !poll.userVote && setVotingPollId(isVoting ? null : poll.id)}>
                                                    <div className="absolute inset-0 rounded-xl transition-all" style={{
                                                        background: `linear-gradient(90deg, ${isWinner && total > 0 ? "rgba(124,58,237,0.2)" : "rgba(245,158,11,0.1)"} ${pct}%, transparent ${pct}%)`
                                                    }} />
                                                    <div className="relative flex items-center justify-between px-4 py-3 border border-white/5 rounded-xl">
                                                        <div className="flex items-center gap-2">
                                                            {isUserVote && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                                            <span className="text-sm font-medium text-white">{opt.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-500">{opt.votes} votes</span>
                                                            <span className="text-sm font-bold text-white w-9 text-right">{pct}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Vote with reason */}
                                    {poll.isActive && !poll.userVote && (
                                        <AnimatePresence>
                                            {isVoting && (
                                                <motion.div className="space-y-2.5 mb-4"
                                                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                                    <div className="relative">
                                                        <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                                                        <textarea value={reason} onChange={e => setReason(e.target.value)}
                                                            placeholder="Share your reason (min 10 chars)..."
                                                            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-amber-500/50 transition-all outline-none resize-none h-20" />
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {poll.options.map(opt => (
                                                            <button key={opt.id} onClick={() => { if (reason.length >= 10) { voteOnPoll(poll.id, opt.id, reason); setVotingPollId(null); setReason(""); } }}
                                                                disabled={reason.length < 10}
                                                                className="flex-1 py-2 text-sm font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl disabled:opacity-40 transition-all whitespace-nowrap px-2">
                                                                Vote: {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    )}
                                    {poll.userVote && <p className="text-xs text-emerald-400 flex items-center gap-1 mb-3"><Check className="w-3 h-3" /> Your vote is recorded!</p>}

                                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                        <span className="text-xs text-slate-500">{total} total votes · by {poll.createdBy}</span>
                                        <button
                                            onClick={() => handleGetAIInsight(poll.id, poll.question, poll.aiInsight)}
                                            disabled={loadingAI === poll.id}
                                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-60">
                                            {loadingAI === poll.id
                                                ? <><div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" /> Getting insight...</>
                                                : <><Bot className="w-3.5 h-3.5" /> {showAI === poll.id ? "Hide Insight" : "AI Insight"}</>}
                                        </button>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {showAI === poll.id && (poll.aiInsight || liveInsights[poll.id]) && (
                                        <motion.div className="px-5 pb-5"
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                            <div className="glass-strong rounded-xl p-4 relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500 to-violet-500" />
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-4 h-4 text-amber-400" />
                                                    <span className="text-xs font-semibold text-white">AI Collective Insight</span>
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 ml-auto">AI Powered</span>
                                                </div>
                                                {(poll.aiInsight || liveInsights[poll.id] || "").split("\n").map((line, i) => (
                                                    <p key={i} className="text-xs text-slate-300 mb-1 flex items-start gap-1.5">
                                                        <span className="text-amber-400 mt-0.5">•</span>{line.replace(/^[•\-]\s*/, "")}
                                                    </p>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Poll Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                        <motion.div className="relative w-full max-w-md glass-strong rounded-2xl p-6"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-amber-400" />
                                    <h3 className="text-base font-bold text-white">Create Smart Poll</h3>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            {/* Space selector */}
                            <div className="mb-3">
                                <label className="text-xs text-slate-400 mb-1.5 block">Post to Space</label>
                                <select value={selectedSpaceId} onChange={e => setSelectedSpaceId(Number(e.target.value) || "")}
                                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white appearance-none outline-none focus:border-amber-500/50 transition-all cursor-pointer hover:border-white/20">
                                    <option value="">— Select a space —</option>
                                    {mySpaces.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name} ({s.type})</option>)}
                                </select>
                            </div>
                            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Poll question..."
                                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all mb-3" />
                            <div className="space-y-2 mb-3">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex gap-2">
                                        <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                                            placeholder={`Option ${i + 1}`}
                                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all" />
                                        {options.length > 2 && (
                                            <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                ))}
                                {options.length < 5 && (
                                    <button onClick={() => setOptions([...options, ""])} className="text-xs text-slate-500 hover:text-white transition-colors">+ Add Option</button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleCreate}
                                    disabled={!question.trim() || !selectedSpaceId || options.filter(o => o.trim()).length < 2}
                                    className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl disabled:opacity-40 transition-all">
                                    Create Poll
                                </button>
                                <button onClick={() => setShowCreate(false)} className="px-4 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
