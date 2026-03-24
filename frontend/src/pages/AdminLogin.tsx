import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Mail, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../App";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { adminLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError("");
        try {
            const ok = await adminLogin(email, password);
            if (ok) navigate("/admin");
            else { setError("Login failed — admin role required"); setLoading(false); }
        } catch (err: any) {
            setError(err.error || "Login failed"); setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center px-6 relative overflow-hidden">
            <div className="absolute top-20 left-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px]" />
            <motion.div className="w-full max-w-md relative" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Link to="/" className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold text-white">Admin Portal</span>
                </Link>
                <div className="glass-strong rounded-2xl p-8">
                    <h1 className="text-2xl font-bold text-white text-center mb-2">Admin Access</h1>
                    <p className="text-slate-400 text-center mb-8">ANITS Campus Hive Administration</p>
                    {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Admin Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@anits.edu.in"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 transition-all outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:border-violet-500/50 transition-all outline-none" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-700 rounded-xl hover:from-violet-700 hover:to-violet-800 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Sign In as Admin</>}
                        </button>
                    </form>
                </div>
                <p className="mt-6 text-center text-sm text-slate-400">
                    Student? <Link to="/login" className="text-amber-400 hover:text-amber-300 font-medium">Sign in here</Link>
                </p>
            </motion.div>
        </div>
    );
}
