import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Globe, Lock, Users, Plus, Search, BarChart3, CalendarDays, X,
    ChevronRight, Check, Crown, UserPlus, LogOut as LeaveIcon, Clock,
    Shield, ArrowLeft, Send, Bot, ThumbsUp, MessageSquare, Wand2, Sparkles, Bell
} from "lucide-react";
import { useAuth, SpaceType, SpacePoll, SpaceEvent } from "../App";

// ── Helpers ────────────────────────────────────────────────────────────────

const CategoryBadge = ({ cat }: { cat: string }) => {
    const map: Record<string, string> = {
        club: "bg-pink-500/15 text-pink-300",
        study: "bg-violet-500/15 text-violet-300",
        committee: "bg-amber-500/15 text-amber-300",
        class: "bg-blue-500/15 text-blue-300",
        sports: "bg-red-500/15 text-red-300",
        hub: "bg-emerald-500/15 text-emerald-300",
    };
    return <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${map[cat] || "bg-white/10 text-slate-400"}`}>{cat}</span>;
};

// ── In-Space: Polls Tab ────────────────────────────────────────────────────

function SpacePolls({ space }: { space: SpaceType }) {
    const { polls, addPoll, voteOnPoll, user } = useAuth();
    const spacePolls = polls.filter(p => p.spaceId === space.id);
    const [showCreate, setShowCreate] = useState(false);
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [reason, setReason] = useState("");
    const [showAI, setShowAI] = useState<number | null>(null);
    const [voting, setVoting] = useState<number | null>(null); // poll id being voted

    const handleCreate = () => {
        const validOpts = options.filter(o => o.trim());
        if (!question.trim() || validOpts.length < 2) return;
        addPoll({
            spaceId: space.id,
            question: question.trim(),
            options: validOpts.map((label, i) => ({ id: Date.now() + i, label: label.trim(), votes: 0 })),
            createdBy: user?.name || "Student",
            isActive: true,
        });
        setQuestion(""); setOptions(["", ""]); setShowCreate(false);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white">Polls ({spacePolls.length})</span>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> New Poll
                </button>
            </div>

            {/* Create Poll */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div className="glass rounded-xl p-4 mb-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <p className="text-xs font-semibold text-white mb-3">Create Smart Poll</p>
                        <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Poll question..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all mb-3" />
                        {options.map((opt, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }}
                                    placeholder={`Option ${i + 1}`}
                                    className="flex-1 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all" />
                                {options.length > 2 && (
                                    <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400 transition-colors"><X className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                        {options.length < 5 && (
                            <button onClick={() => setOptions([...options, ""])} className="text-xs text-slate-500 hover:text-white mb-3 transition-colors">+ Add Option</button>
                        )}
                        <div className="flex gap-2">
                            <button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
                                className="flex-1 py-1.5 text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg disabled:opacity-40 transition-all">
                                Create Poll
                            </button>
                            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Poll List */}
            {spacePolls.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No polls yet. Create one!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {spacePolls.map(poll => {
                        const total = poll.options.reduce((s, o) => s + o.votes, 0);
                        const isVoting = voting === poll.id;
                        return (
                            <motion.div key={poll.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-500">{poll.createdBy} · {poll.createdAt}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${poll.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                                        {poll.isActive ? "Active" : "Closed"}
                                    </span>
                                </div>
                                <p className="text-sm font-semibold text-white mb-3">{poll.question}</p>
                                {/* Options */}
                                <div className="space-y-2 mb-3">
                                    {poll.options.map(opt => {
                                        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
                                        const isUserVote = poll.userVote === opt.id;
                                        return (
                                            <div key={opt.id} className="relative overflow-hidden rounded-lg">
                                                <div className="absolute inset-0 rounded-lg" style={{ background: `linear-gradient(90deg, rgba(245,158,11,0.15) ${pct}%, transparent ${pct}%)` }} />
                                                <div className="relative flex items-center justify-between px-3 py-2 cursor-pointer group"
                                                    onClick={() => poll.isActive && !poll.userVote && setVoting(poll.id === voting ? null : poll.id)}>
                                                    <div className="flex items-center gap-2">
                                                        {isUserVote && <Check className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />}
                                                        <span className="text-sm text-white">{opt.label}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-slate-400">{opt.votes}</span>
                                                        <span className="text-xs font-bold text-white">{pct}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Vote area */}
                                {poll.isActive && !poll.userVote && (
                                    <div className="space-y-2">
                                        <input value={reason} onChange={e => setReason(e.target.value)} placeholder="Share your reason (req.)..."
                                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder:text-slate-500 outline-none focus:border-amber-500/50 transition-all" />
                                        <div className="flex gap-2 flex-wrap">
                                            {poll.options.map(opt => (
                                                <button key={opt.id} onClick={() => { if (reason.length >= 5) voteOnPoll(poll.id, opt.id, reason); }}
                                                    disabled={reason.length < 5}
                                                    className="flex-1 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-all disabled:opacity-40 whitespace-nowrap">
                                                    Vote: {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                        {reason.length < 5 && reason.length > 0 && <p className="text-[10px] text-slate-500">Reason must be at least 5 chars</p>}
                                    </div>
                                )}
                                {poll.userVote && <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Voted!</p>}
                                {/* AI Insight */}
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs text-slate-500">{total} votes</span>
                                    {poll.aiInsight && (
                                        <button onClick={() => setShowAI(showAI === poll.id ? null : poll.id)}
                                            className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors">
                                            <Bot className="w-3.5 h-3.5" /> AI Insight
                                        </button>
                                    )}
                                </div>
                                <AnimatePresence>
                                    {showAI === poll.id && poll.aiInsight && (
                                        <motion.div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15"
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                                            <div className="flex items-center gap-1 mb-2"><Sparkles className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs font-medium text-amber-300">AI Collective Insight</span></div>
                                            {poll.aiInsight.split("\n").map((line, i) => <p key={i} className="text-xs text-slate-300 mb-1">{line}</p>)}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── In-Space: Events Tab ───────────────────────────────────────────────────

function SpaceEvents({ space }: { space: SpaceType }) {
    const { events, addEvent, updateTaskStatus, user } = useAuth();
    const spaceEvents = events.filter(e => e.spaceId === space.id);
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [date, setDate] = useState("");
    const [budget, setBudget] = useState("");
    const [attendees, setAttendees] = useState("");
    const [generating, setGenerating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<SpaceEvent | null>(null);

    const handleCreate = () => {
        if (!title.trim() || !date) return;
        setGenerating(true);
        setTimeout(() => {
            addEvent({
                spaceId: space.id,
                title: title.trim(),
                description: desc.trim(),
                date,
                budget: budget ? Number(budget) : undefined,
                attendees: attendees ? Number(attendees) : 50,
                createdBy: user?.name || "Student",
                tasks: [
                    { id: Date.now() + 1, title: "Book venue", status: "todo", assignee: user?.name || "TBD", priority: "high" },
                    { id: Date.now() + 2, title: "Design promotional material", status: "todo", assignee: "TBD", priority: "medium" },
                    { id: Date.now() + 3, title: "Setup registration form", status: "todo", assignee: "TBD", priority: "high" },
                    { id: Date.now() + 4, title: "Contact participants", status: "todo", assignee: "TBD", priority: "medium" },
                    { id: Date.now() + 5, title: "Arrange refreshments", status: "todo", assignee: "TBD", priority: "low" },
                ],
            });
            setTitle(""); setDesc(""); setDate(""); setBudget(""); setAttendees("");
            setShowCreate(false); setGenerating(false);
        }, 1500);
    };

    const columns = [
        { key: "todo" as const, label: "To Do", color: "bg-slate-500" },
        { key: "in_progress" as const, label: "In Progress", color: "bg-amber-500" },
        { key: "done" as const, label: "Done", color: "bg-emerald-500" },
    ];

    if (selectedEvent) {
        return (
            <div>
                <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
                </button>
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-base font-bold text-white">{selectedEvent.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">{selectedEvent.date} · {selectedEvent.attendees} attendees{selectedEvent.budget ? ` · ₹${selectedEvent.budget.toLocaleString()}` : ""}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    {columns.map(col => {
                        const colTasks = selectedEvent.tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className="glass rounded-xl p-3">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <div className={`w-2 h-2 rounded-full ${col.color}`} />
                                    <span className="text-xs font-semibold text-white">{col.label}</span>
                                    <span className="text-[10px] text-slate-500 ml-auto">{colTasks.length}</span>
                                </div>
                                <div className="space-y-2">
                                    {colTasks.map(task => (
                                        <div key={task.id} className="bg-white/[0.03] border border-white/5 rounded-lg p-2.5 group">
                                            <p className="text-xs font-medium text-white mb-1">{task.title}</p>
                                            <p className="text-[10px] text-slate-500 mb-2">{task.assignee}</p>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {col.key !== "todo" && (
                                                    <button onClick={() => updateTaskStatus(selectedEvent.id, task.id, col.key === "done" ? "in_progress" : "todo")}
                                                        className="flex-1 text-[9px] py-1 rounded bg-white/5 text-slate-400 hover:text-white transition-all">← Back</button>
                                                )}
                                                {col.key !== "done" && (
                                                    <button onClick={() => updateTaskStatus(selectedEvent.id, task.id, col.key === "todo" ? "in_progress" : "done")}
                                                        className="flex-1 text-[9px] py-1 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">Next →</button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-white">Events ({spaceEvents.length})</span>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-all">
                    <Plus className="w-3.5 h-3.5" /> New Event
                </button>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <motion.div className="glass rounded-xl p-4 mb-4" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <div className="flex items-center gap-1.5 mb-3">
                            <Wand2 className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-semibold text-white">AI Event Planner</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event Title" className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                            <input value={date} onChange={e => setDate(e.target.value)} type="date" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-violet-500/50 transition-all" />
                            <input value={attendees} onChange={e => setAttendees(e.target.value)} type="number" placeholder="Attendees" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                            <input value={budget} onChange={e => setBudget(e.target.value)} type="number" placeholder="Budget (₹)" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                            <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCreate} disabled={!title.trim() || !date || generating}
                                className="flex-1 py-2 text-xs font-medium bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg disabled:opacity-40 transition-all flex items-center justify-center gap-1.5">
                                {generating ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                {generating ? "Generating tasks..." : "Create + AI Tasks"}
                            </button>
                            <button onClick={() => setShowCreate(false)} className="px-3 text-xs text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-all">Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {spaceEvents.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">No events yet. Plan one!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {spaceEvents.map(ev => {
                        const done = ev.tasks.filter(t => t.status === "done").length;
                        const pct = ev.tasks.length > 0 ? Math.round((done / ev.tasks.length) * 100) : 0;
                        return (
                            <motion.div key={ev.id} className="bg-white/[0.03] border border-white/5 rounded-xl p-4 hover:bg-white/[0.06] transition-all cursor-pointer group"
                                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                onClick={() => setSelectedEvent(ev)}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white mb-1">{ev.title}</p>
                                        <p className="text-xs text-slate-400">{ev.date} · {ev.attendees} people{ev.budget ? ` · ₹${ev.budget.toLocaleString()}` : ""}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors mt-1 ml-2" />
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                        <span>Tasks: {done}/{ev.tasks.length}</span><span>{pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
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

// ── Space Detail Modal ─────────────────────────────────────────────────────

function SpaceDetail({ space, onClose }: { space: SpaceType; onClose: () => void }) {
    const { user, joinedSpaces, pendingRequests, joinSpace, requestJoin, leaveSpace, polls, events, spaceRequests, approveRequest } = useAuth();
    const [activeTab, setActiveTab] = useState<"about" | "polls" | "events" | "requests">("about");

    const isMember = joinedSpaces.includes(space.id);
    const isPending = pendingRequests.includes(space.id);
    const isAdmin = user?.email === space.adminId;
    const spacePolls = polls.filter(p => p.spaceId === space.id);
    const spaceEvents = events.filter(e => e.spaceId === space.id);
    const requests = spaceRequests[space.id] || [];

    const handleJoinAction = () => {
        if (isMember) { leaveSpace(space.id); return; }
        if (space.type === "Public") { joinSpace(space.id); }
        else if (space.type === "Private" && !isPending) { requestJoin(space.id); }
    };

    const tabs = [
        { key: "about" as const, label: "About" },
        { key: "polls" as const, label: `Polls (${spacePolls.length})`, show: isMember },
        { key: "events" as const, label: `Events (${spaceEvents.length})`, show: isMember },
        ...(isAdmin && requests.length > 0 ? [{ key: "requests" as const, label: `Requests (${requests.length})`, show: true }] : []),
    ].filter(t => t.show !== false);

    return (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <motion.div className="relative w-full max-w-2xl max-h-[90vh] glass-strong rounded-2xl overflow-hidden flex flex-col"
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                {/* Header */}
                <div className={`h-28 bg-gradient-to-br ${space.color} relative flex-shrink-0`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                        <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-4 left-5 flex items-end gap-3">
                        <div className="text-4xl">{space.icon}</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-white">{space.name}</h2>
                                {isAdmin && <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-200 border border-amber-500/30"><Crown className="w-2.5 h-2.5" /> Admin</span>}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 text-xs text-white/70">
                                    {space.type === "Private" ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                    {space.type}
                                </span>
                                <span className="text-white/40">·</span>
                                <span className="text-xs text-white/70 flex items-center gap-1"><Users className="w-3 h-3" />{space.members} members</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions bar */}
                <div className="px-5 py-3 flex items-center justify-between border-b border-white/5 flex-shrink-0">
                    <div className="flex gap-1">
                        {tabs.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === t.key ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {/* Join / Request / Leave button */}
                    {space.type !== "Mandatory" && (
                        <button onClick={handleJoinAction}
                            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${isMember
                                ? "bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                                : isPending
                                    ? "bg-amber-500/10 text-amber-400 cursor-default"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                                }`}>
                            {isMember ? <><LeaveIcon className="w-3.5 h-3.5" /> Leave</> :
                                isPending ? <><Clock className="w-3.5 h-3.5" /> Pending…</> :
                                    space.type === "Public" ? <><UserPlus className="w-3.5 h-3.5" /> Join</> :
                                        <><Bell className="w-3.5 h-3.5" /> Request</>}
                        </button>
                    )}
                    {space.type === "Mandatory" && (
                        <span className="flex items-center gap-1 text-xs text-blue-400"><Shield className="w-3.5 h-3.5" /> Mandatory</span>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {activeTab === "about" && (
                        <div>
                            <p className="text-sm text-slate-300 mb-4">{space.description}</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[{ label: "Members", value: space.members.toString(), icon: Users },
                                { label: "Polls", value: spacePolls.length.toString(), icon: BarChart3 },
                                { label: "Events", value: spaceEvents.length.toString(), icon: CalendarDays }].map(stat => (
                                    <div key={stat.label} className="glass rounded-xl p-3 text-center">
                                        <stat.icon className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                                        <p className="text-lg font-bold text-white">{stat.value}</p>
                                        <p className="text-xs text-slate-500">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                            {!isMember && space.type !== "Mandatory" && (
                                <div className="mt-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 text-center">
                                    <p className="text-sm text-slate-400 mb-3">
                                        {space.type === "Public" ? "Join to participate in polls and events!" : "Request to join — admin will review."}
                                    </p>
                                    <button onClick={handleJoinAction}
                                        className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${isPending ? "bg-amber-500/10 text-amber-400 cursor-default" :
                                            "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                                            }`}>
                                        {isPending ? "Request Pending…" : space.type === "Public" ? "Join Now" : "Request to Join"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    {activeTab === "polls" && isMember && <SpacePolls space={space} />}
                    {activeTab === "events" && isMember && <SpaceEvents space={space} />}
                    {activeTab === "requests" && isAdmin && (
                        <div>
                            <p className="text-xs text-slate-500 mb-3">Pending join requests for {space.name}</p>
                            {requests.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center py-8">No pending requests</p>
                            ) : requests.map(email => (
                                <div key={email} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">
                                            {email.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm text-white">{email}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => approveRequest(space.id, email)}
                                            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs hover:bg-emerald-500/20 transition-all">
                                            <Check className="w-3 h-3" /> Approve
                                        </button>
                                        <button className="flex items-center gap-1 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-xs hover:bg-red-500/20 transition-all">
                                            <X className="w-3 h-3" /> Decline
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Spaces Page ────────────────────────────────────────────────────────────

const categoryOptions = ["club", "study", "committee", "sports", "hub", "other"];
const gradients = [
    "from-pink-500 to-rose-600", "from-violet-500 to-indigo-600", "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600", "from-blue-500 to-cyan-600", "from-red-500 to-orange-500",
    "from-fuchsia-500 to-purple-600", "from-lime-500 to-green-600",
];
const iconOpts = ["🎯", "📊", "🚀", "🎨", "⚡", "🌟", "🔬", "🏆", "🌿", "🎮", "📸", "🎵"];

export default function Spaces() {
    const { spaces, addSpace, joinedSpaces, pendingRequests, user } = useAuth();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "joined" | "public" | "private">("all");
    const [showCreate, setShowCreate] = useState(false);
    const [selected, setSelected] = useState<SpaceType | null>(null);
    // New space form
    const [newName, setNewName] = useState("");
    const [newType, setNewType] = useState<"Public" | "Private">("Public");
    const [newCategory, setNewCategory] = useState("club");
    const [newDesc, setNewDesc] = useState("");
    const [newIcon, setNewIcon] = useState("🎯");

    const handleCreate = () => {
        if (!newName.trim()) return;
        addSpace({
            name: newName.trim(),
            type: newType,
            category: newCategory,
            color: gradients[spaces.length % gradients.length],
            icon: newIcon,
            description: newDesc.trim() || `Welcome to ${newName.trim()}!`,
            adminId: user?.email || "",
        });
        setNewName(""); setNewDesc(""); setNewIcon("🎯"); setShowCreate(false);
    };

    const filtered = spaces.filter(s => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
        if (!matchSearch) return false;
        if (filter === "joined") return joinedSpaces.includes(s.id);
        if (filter === "public") return s.type === "Public";
        if (filter === "private") return s.type === "Private";
        return true;
    });

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Globe className="w-6 h-6 text-cyan-400" /> Spaces
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Clubs, Study Groups, Teams — all with built-in Polls & Events</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium border border-emerald-500/20">
                    <Plus className="w-4 h-4" /> Create Space
                </button>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spaces..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-cyan-500/40 transition-all outline-none" />
                </div>
                <div className="flex gap-2">
                    {(["all", "joined", "public", "private"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${filter === f ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {[{ label: "All Spaces", value: spaces.length, color: "text-white" },
                { label: "Joined", value: joinedSpaces.length, color: "text-emerald-400" },
                { label: "Pending", value: pendingRequests.length, color: "text-amber-400" },
                ].map(s => (
                    <div key={s.label} className="glass rounded-xl p-3 text-center">
                        <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Spaces Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((space, i) => {
                    const isMember = joinedSpaces.includes(space.id);
                    const isPending = pendingRequests.includes(space.id);
                    const isSpaceAdmin = user?.email === space.adminId;
                    return (
                        <motion.div key={space.id}
                            className="glass rounded-2xl overflow-hidden hover:bg-white/[0.08] transition-all cursor-pointer group"
                            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            onClick={() => setSelected(space)}>
                            {/* Color bar */}
                            <div className={`h-1.5 w-full bg-gradient-to-r ${space.color}`} />
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="text-3xl">{space.icon}</div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${space.type === "Public" ? "bg-emerald-500/10 text-emerald-400" :
                                            space.type === "Private" ? "bg-slate-500/15 text-slate-400" : "bg-blue-500/10 text-blue-400"
                                            }`}>
                                            {space.type === "Private" ? <Lock className="w-2.5 h-2.5" /> : space.type === "Public" ? <Globe className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                                            {space.type}
                                        </div>
                                        {isSpaceAdmin && <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300"><Crown className="w-2 h-2" /> Admin</span>}
                                    </div>
                                </div>
                                <h3 className="text-sm font-bold text-white mb-1">{space.name}</h3>
                                <p className="text-xs text-slate-500 mb-3 line-clamp-2">{space.description}</p>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{space.members}</span>
                                    <CategoryBadge cat={space.category} />
                                </div>
                                {/* Status */}
                                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs">
                                        {isMember ? (
                                            <span className="flex items-center gap-1 text-emerald-400"><Check className="w-3 h-3" /> Joined</span>
                                        ) : isPending ? (
                                            <span className="flex items-center gap-1 text-amber-400"><Clock className="w-3 h-3" /> Pending</span>
                                        ) : (
                                            <span className="text-slate-500">{space.type === "Public" ? "Open to join" : "Request required"}</span>
                                        )}
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                    <Globe className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No spaces found.</p>
                </div>
            )}

            {/* Create Space Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                        <motion.div className="relative w-full max-w-md glass-strong rounded-2xl p-6"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-white">Create New Space</h3>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            {/* Icon picker */}
                            <p className="text-xs text-slate-500 mb-2">Pick an icon</p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {iconOpts.map(ic => (
                                    <button key={ic} onClick={() => setNewIcon(ic)}
                                        className={`text-xl p-1.5 rounded-lg transition-all ${newIcon === ic ? "bg-amber-500/20 ring-2 ring-amber-500/50" : "hover:bg-white/10"}`}>
                                        {ic}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-3">
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Space name"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-all" />
                                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Description (optional)"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/50 transition-all resize-none h-20" />
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={newType} onChange={e => setNewType(e.target.value as "Public" | "Private")}
                                        className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white appearance-none outline-none focus:border-emerald-500/50 cursor-pointer transition-all hover:border-white/20">
                                        <option value="Public">Public — Open</option>
                                        <option value="Private">Private — Request</option>
                                    </select>
                                    <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                                        className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white appearance-none outline-none focus:border-emerald-500/50 capitalize cursor-pointer transition-all hover:border-white/20">
                                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <p className="text-xs text-slate-500">You'll be the Space Admin. Polls & Events auto-provisioned.</p>
                                <div className="flex gap-2">
                                    <button onClick={handleCreate} disabled={!newName.trim()}
                                        className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl disabled:opacity-40 transition-all">
                                        Create Space
                                    </button>
                                    <button onClick={() => setShowCreate(false)} className="px-4 py-2.5 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Space Detail Modal */}
            <AnimatePresence>
                {selected && <SpaceDetail space={selected} onClose={() => setSelected(null)} />}
            </AnimatePresence>
        </div>
    );
}
