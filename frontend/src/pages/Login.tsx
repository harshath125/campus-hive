import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Hexagon, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../App";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => { login(email, password); navigate("/dashboard"); }, 800);
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-20 left-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px]" />
            <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-violet-500 flex items-center justify-center">
                        <Hexagon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">Campus Hive</span>
                </Link>
                <div className="glass-strong rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Welcome Back</h1>
                    <p className="text-slate-400 text-center mb-8">Sign in to your hive</p>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@anits.edu.in"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:bg-white/[0.08] transition-all outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type={show ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500/50 focus:bg-white/[0.08] transition-all outline-none" />
                                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                                    {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 text-base font-semibold text-[#020617] bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl hover:from-amber-500 hover:to-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <div className="w-5 h-5 border-2 border-[#020617]/30 border-t-[#020617] rounded-full animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Sign In</>}
                        </button>
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-slate-400">
                    No account? <Link to="/signup" className="text-amber-400 hover:text-amber-300 font-medium">Create one</Link>
                </p>
                <p className="mt-2 text-center text-xs text-slate-600">
                    <Link to="/admin/login" className="hover:text-violet-400 transition-colors">Admin? Sign in here</Link>
                </p>
            </motion.div>
        </div>
    );
}
