import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../App";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signup(name, email, password);
            setSuccess(true);
            setTimeout(() => navigate("/login"), 1500);
        } catch {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-20 right-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px]" />
            <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center">
                        <Hexagon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">Campus Hive</span>
                </Link>
                <div className="glass-strong rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Join the Hive</h1>
                    <p className="text-slate-400 text-center mb-8">Create your student account</p>
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                            <p className="text-emerald-300 font-semibold text-sm">✅ Account created successfully!</p>
                            <p className="text-emerald-400/70 text-xs mt-1">Redirecting to login page...</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@anits.edu.in"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type={show ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters"
                                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 focus:bg-white/[0.08] transition-all outline-none" />
                                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 text-base font-semibold text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl hover:from-violet-600 hover:to-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Create Account</>}
                        </button>
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-slate-400">
                    Already have an account? <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link>
                </p>
            </motion.div>
        </div>
    );
}
