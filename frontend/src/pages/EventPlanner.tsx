import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CalendarDays, Sparkles, GripVertical, UserCircle, Clock, Plus, Wand2, X, Globe, Lock, ChevronDown
} from "lucide-react";
import { useAuth, SpaceEvent } from "../App";

const columns = [
    { key: "todo" as const, label: "To Do", color: "bg-slate-500" },
    { key: "in_progress" as const, label: "In Progress", color: "bg-amber-500" },
    { key: "done" as const, label: "Done", color: "bg-emerald-500" },
];

const categoryColors: Record<string, string> = {
    Logistics: "bg-blue-500/15 text-blue-400",
    Marketing: "bg-pink-500/15 text-pink-400",
    Tech: "bg-violet-500/15 text-violet-400",
    Finance: "bg-emerald-500/15 text-emerald-400",
    Planning: "bg-amber-500/15 text-amber-400",
    General: "bg-slate-500/15 text-slate-400",
};

export default function EventPlanner() {
    const { events, addEvent, updateTaskStatus, user, joinedSpaces, spaces } = useAuth();
    const [showCreate, setShowCreate] = useState(false);
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [date, setDate] = useState("");
    const [budget, setBudget] = useState("");
    const [attendees, setAttendees] = useState("");
    const [selectedSpaceId, setSelectedSpaceId] = useState<number | "">("");
    const [generating, setGenerating] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<SpaceEvent | null>(null);
    const [filterSpace, setFilterSpace] = useState<number | "all">("all");

    const mySpaces = spaces.filter(s => joinedSpaces.includes(s.id));
    const visibleEvents = events.filter(e => {
        if (filterSpace !== "all") return e.spaceId === filterSpace;
        return joinedSpaces.includes(e.spaceId);
    });

    const currentEvent = selectedEvent ? events.find(e => e.id === selectedEvent.id) || selectedEvent : null;

    const handleCreate = () => {
        if (!title.trim() || !date || !selectedSpaceId) return;
        setGenerating(true);
        setTimeout(() => {
            addEvent({
                spaceId: selectedSpaceId as number,
                title: title.trim(),
                description: desc.trim(),
                date,
                budget: budget ? Number(budget) : undefined,
                attendees: attendees ? Number(attendees) : 50,
                createdBy: user?.name || "Student",
                tasks: [
                    { id: Date.now() + 1, title: "Book venue / location", status: "todo", assignee: user?.name || "TBD", priority: "high" },
                    { id: Date.now() + 2, title: "Design promotional material", status: "todo", assignee: "TBD", priority: "medium" },
                    { id: Date.now() + 3, title: "Setup registration form", status: "todo", assignee: "TBD", priority: "high" },
                    { id: Date.now() + 4, title: "Send invites / announcements", status: "todo", assignee: "TBD", priority: "medium" },
                    { id: Date.now() + 5, title: "Arrange refreshments", status: "todo", assignee: "TBD", priority: "low" },
                    { id: Date.now() + 6, title: "Prepare evaluation criteria", status: "todo", assignee: "TBD", priority: "medium" },
                ],
            });
            setTitle(""); setDesc(""); setDate(""); setBudget(""); setAttendees(""); setSelectedSpaceId("");
            setShowCreate(false); setGenerating(false);
        }, 1800);
    };

    const getSpaceName = (id: number) => {
        const s = spaces.find(sp => sp.id === id);
        return s ? `${s.icon} ${s.name}` : "Unknown";
    };
    const getSpaceColor = (id: number) => spaces.find(sp => sp.id === id)?.color || "from-slate-500 to-slate-600";

    // Kanban for selected event
    if (currentEvent) {
        return (
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <button onClick={() => setSelectedEvent(null)} className="text-xs text-slate-400 hover:text-white transition-colors mb-2 flex items-center gap-1">
                            ← All Events
                        </button>
                        <h1 className="text-xl font-bold text-white">{currentEvent.title}</h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {getSpaceName(currentEvent.spaceId)} · {currentEvent.date}
                            {currentEvent.budget ? ` · ₹${currentEvent.budget.toLocaleString()}` : ""}
                            {` · ${currentEvent.attendees} attendees`}
                        </p>
                    </div>
                </div>
                {/* Progress */}
                <div className="glass rounded-xl p-4 mb-5 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                            <span>Overall Progress</span>
                            <span className="font-medium text-white">
                                {currentEvent.tasks.filter(t => t.status === "done").length}/{currentEvent.tasks.length} tasks done
                            </span>
                        </div>
                        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all"
                                style={{ width: `${currentEvent.tasks.length > 0 ? Math.round((currentEvent.tasks.filter(t => t.status === "done").length / currentEvent.tasks.length) * 100) : 0}%` }} />
                        </div>
                    </div>
                </div>
                {/* Kanban */}
                <div className="grid md:grid-cols-3 gap-4">
                    {columns.map(col => {
                        const colTasks = currentEvent.tasks.filter(t => t.status === col.key);
                        return (
                            <div key={col.key} className="glass rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                                        <span className="text-sm font-semibold text-white">{col.label}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">{colTasks.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {colTasks.map((task, i) => (
                                        <motion.div key={task.id}
                                            className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 hover:bg-white/[0.06] transition-all group"
                                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                                            <div className="flex items-start gap-2">
                                                <GripVertical className="w-4 h-4 text-slate-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-white mb-2">{task.title}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoryColors.General}`}>General</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 mt-1.5">
                                                        <UserCircle className="w-3.5 h-3.5 text-slate-500" />
                                                        <span className="text-xs text-slate-400">{task.assignee}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {col.key !== "todo" && (
                                                    <button onClick={() => updateTaskStatus(currentEvent.id, task.id, col.key === "done" ? "in_progress" : "todo")}
                                                        className="flex-1 text-[10px] py-1 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all">← Back</button>
                                                )}
                                                {col.key !== "done" && (
                                                    <button onClick={() => updateTaskStatus(currentEvent.id, task.id, col.key === "todo" ? "in_progress" : "done")}
                                                        className="flex-1 text-[10px] py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all">Next →</button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                    {col.key === "todo" && <button className="w-full py-2.5 rounded-xl border border-dashed border-white/10 text-sm text-slate-500 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> Add Task</button>}
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
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CalendarDays className="w-6 h-6 text-emerald-400" /> Smart Event Planner
                    </h1>
                    <p className="text-slate-400 text-sm mt-0.5">Smart Event Planning with Kanban · Scoped to your spaces</p>
                </div>
                <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all text-sm font-medium border border-emerald-500/20">
                    <Plus className="w-4 h-4" /> Plan Event
                </button>
            </div>

            {/* Space filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                <button onClick={() => setFilterSpace("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterSpace === "all" ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                    All Spaces
                </button>
                {mySpaces.map(s => (
                    <button key={s.id} onClick={() => setFilterSpace(s.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${filterSpace === s.id ? "bg-white/10 text-white border border-white/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                        {s.icon} {s.name}
                    </button>
                ))}
            </div>

            {/* Events list */}
            {visibleEvents.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                    <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No events in your spaces yet.</p>
                    <button onClick={() => setShowCreate(true)} className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Plan the first event →</button>
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                    {visibleEvents.map((ev, i) => {
                        const done = ev.tasks.filter(t => t.status === "done").length;
                        const pct = ev.tasks.length > 0 ? Math.round((done / ev.tasks.length) * 100) : 0;
                        return (
                            <motion.div key={ev.id}
                                className={`glass rounded-2xl overflow-hidden hover:bg-white/[0.08] transition-all cursor-pointer group`}
                                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                onClick={() => setSelectedEvent(ev)}>
                                <div className={`h-1.5 bg-gradient-to-r ${getSpaceColor(ev.spaceId)}`} />
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <span className="text-xs text-slate-500">{getSpaceName(ev.spaceId)}</span>
                                            <h3 className="text-sm font-bold text-white mt-0.5">{ev.title}</h3>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors ml-2 rotate-[-90deg]" />
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">
                                        {ev.date} · {ev.attendees} people{ev.budget ? ` · ₹${ev.budget.toLocaleString()}` : ""}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                                        <span>Tasks</span>
                                        <span>{done}/{ev.tasks.length} done ({pct}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="flex gap-1 mt-3">
                                        {[columns[0], columns[1], columns[2]].map(col => (
                                            <span key={col.key} className={`text-[10px] px-2 py-0.5 rounded-full ${col.key === "done" ? "bg-emerald-500/10 text-emerald-400" : col.key === "in_progress" ? "bg-amber-500/10 text-amber-400" : "bg-slate-500/10 text-slate-400"
                                                }`}>
                                                {ev.tasks.filter(t => t.status === col.key).length} {col.label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Create Event Modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                        <motion.div className="relative w-full max-w-md glass-strong rounded-2xl p-6"
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Wand2 className="w-4 h-4 text-violet-400" />
                                    <h3 className="text-base font-bold text-white">Plan an Event</h3>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="space-y-3">
                                {/* Space selector */}
                                <div>
                                    <label className="text-xs text-slate-400 mb-1.5 block">Space / Club / Hub</label>
                                    <select value={selectedSpaceId} onChange={e => setSelectedSpaceId(Number(e.target.value) || "")}
                                        className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white appearance-none outline-none focus:border-violet-500/50 transition-all cursor-pointer hover:border-white/20">
                                        <option value="">— Select space —</option>
                                        {mySpaces.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.icon} {s.name} ({s.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Event title"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description (optional)"
                                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all resize-none h-16" />
                                <div className="grid grid-cols-3 gap-2">
                                    <input value={date} onChange={e => setDate(e.target.value)} type="date"
                                        className="col-span-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-violet-500/50 transition-all" />
                                    <input value={attendees} onChange={e => setAttendees(e.target.value)} type="number" placeholder="Attendees"
                                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                                    <input value={budget} onChange={e => setBudget(e.target.value)} type="number" placeholder="Budget ₹"
                                        className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-violet-500/50 transition-all" />
                                </div>
                                <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15">
                                    <Sparkles className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-slate-400">The planner will auto-generate a Kanban task board for your event.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCreate}
                                        disabled={!title.trim() || !date || !selectedSpaceId || generating}
                                        className="flex-1 py-2.5 text-sm font-semibold bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                                        {generating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        {generating ? "Building task plan..." : "Create + Auto Plan"}
                                    </button>
                                    <button onClick={() => setShowCreate(false)} className="px-4 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
