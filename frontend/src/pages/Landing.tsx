import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, ArrowRight, Globe, BarChart3, CalendarDays, Shield, Users, Sparkles, Zap } from "lucide-react";

const features = [
    { icon: Users, title: "Vibe Matcher", desc: "Find your people using smart similarity matching on shared interests and skills.", color: "from-violet-500 to-indigo-600" },
    { icon: BarChart3, title: "Smart Polls", desc: "Reasoned voting with collective insights after consensus is reached.", color: "from-amber-500 to-orange-500" },
    { icon: CalendarDays, title: "Event Planner", desc: "Describe an event and get an auto-generated Kanban task board instantly.", color: "from-emerald-500 to-teal-600" },
    { icon: Globe, title: "Spaces", desc: "Public/Private spaces for every club, team & class — with built-in polls and events.", color: "from-cyan-500 to-blue-600" },
    { icon: Shield, title: "Safety Shield", desc: "Fully anonymous incident reporting — no user ID, no session data attached.", color: "from-red-500 to-rose-600" },
    { icon: Sparkles, title: "Collective Insights", desc: "Automated summaries surface the key sentiments from student polls and discussions.", color: "from-fuchsia-500 to-purple-600" },
];

export default function Landing() {
    return (
        <div className="min-h-screen bg-[#020617] text-white overflow-hidden">
            {/* Orbs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-violet-500/10 rounded-full blur-[180px] pointer-events-none" />
            <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-amber-500/8 rounded-full blur-[120px] pointer-events-none" />

            {/* Nav */}
            <nav className="relative z-10 flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center shadow-lg">
                        <Hexagon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-bold leading-none">Campus Hive</span>
                        <span className="block text-[10px] text-amber-300/70 font-medium">ANITS</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/login" className="text-sm text-slate-300 hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-white/5">Sign In</Link>
                    <Link to="/signup" className="text-sm font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-[#020617] px-5 py-2 rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all">Join Free</Link>
                </div>
            </nav>

            {/* Hero */}
            <div className="relative z-10 text-center px-6 pt-20 pb-16">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-amber-300 mb-2">
                        <Zap className="w-4 h-4" /> Smart Campus Platform for ANITS
                    </div>
                    <h1 className="text-5xl sm:text-7xl font-black leading-none">
                        Your College,{" "}
                        <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-violet-400 bg-clip-text text-transparent">Unified</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Spaces for every club, team & class. Smart polls with collective insights. Events auto-planned with AI assistance.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-center pt-4">
                        <Link to="/signup" className="flex items-center gap-2 px-8 py-4 text-base font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-[#020617] rounded-2xl hover:from-amber-500 hover:to-amber-600 transition-all shadow-xl">
                            Get Started Free <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link to="/login" className="flex items-center gap-2 px-8 py-4 text-base font-medium glass rounded-2xl hover:bg-white/10 transition-all">
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Features Grid */}
            <div className="relative z-10 px-6 pb-24">
                <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((f, i) => (
                        <motion.div key={f.title} className="glass rounded-2xl p-6 hover:bg-white/[0.08] transition-all group"
                            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}>
                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <f.icon className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-base font-bold text-white mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Footer */}
            <footer className="relative z-10 text-center pb-8 text-sm text-slate-600">
                Campus Hive © 2026 · ANITS
                <span className="mx-3">·</span>
                <Link to="/admin/login" className="hover:text-violet-400 transition-colors">Admin Portal</Link>
            </footer>
        </div>
    );
}
