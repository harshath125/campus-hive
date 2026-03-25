import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, Send, Eye, EyeOff, Lock, CheckCircle, Loader } from "lucide-react";
import { apiReportIncident } from "../api";

const severityLevels = [
    { level: 1, label: "Low", color: "bg-yellow-500", desc: "Verbal discomfort or mild intimidation", value: "yellow" },
    { level: 2, label: "Medium", color: "bg-orange-500", desc: "Repeated harassment or targeted bullying", value: "orange" },
    { level: 3, label: "High", color: "bg-red-500", desc: "Physical threat, assault, or severe abuse", value: "red" },
];

export default function Safety() {
    const [severity, setSeverity] = useState<number>(1);
    const [content, setContent] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [stealthMode, setStealthMode] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (content.length < 20) return;
        
        setLoading(true);
        setErrorMsg("");
        try {
            const levelObj = severityLevels.find(s => s.level === severity);
            const severityValue = levelObj ? levelObj.value : "yellow";
            
            await apiReportIncident({ severity: severityValue, description: content, location: "Campus" });
            setSubmitted(true);
        } catch (err: any) {
            setErrorMsg(err.message || "Failed to submit report. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-red-400" /> Safety Shield</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Anonymous incident reporting with true technical anonymity</p>
                </div>
                <button onClick={() => setStealthMode(!stealthMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${stealthMode ? "bg-violet-500/15 text-violet-300 border border-violet-500/20" : "glass text-slate-400"}`}>
                    {stealthMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    Stealth {stealthMode ? "ON" : "OFF"}
                </button>
            </div>

            <div className="glass rounded-2xl p-4 mb-5">
                <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-white mb-1">Your Identity is Protected</p>
                        <p className="text-xs text-slate-400 leading-relaxed">This endpoint bypasses authentication middleware. No user ID, token or session data is attached. Reports are stored with minimal metadata. IP rate limiting prevents spam while preserving anonymity.</p>
                    </div>
                </div>
            </div>

            {!submitted ? (
                <motion.form onSubmit={handleSubmit} className="glass rounded-2xl p-6"
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-white mb-3">Severity Level</label>
                        <div className="grid grid-cols-3 gap-3">
                            {severityLevels.map(s => (
                                <button key={s.level} type="button" onClick={() => setSeverity(s.level)}
                                    className={`p-3.5 rounded-xl border text-left transition-all ${severity === s.level ? "border-white/20 bg-white/[0.08]" : "border-white/5 bg-white/[0.02] hover:bg-white/[0.05]"}`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                                        <span className="text-sm font-semibold text-white">{s.label}</span>
                                    </div>
                                    <p className="text-xs text-slate-400">{s.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-5">
                        <label className="block text-sm font-semibold text-white mb-2">Describe the Incident</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)}
                            placeholder="Please describe what happened in detail..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-red-500/50 transition-all outline-none resize-none h-28" />
                        <p className="text-xs text-slate-500 mt-1">{content.length}/20 minimum characters</p>
                    </div>
                    
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {errorMsg}
                        </div>
                    )}

                    {severity === 3 && (
                        <div className="mb-5 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-300">Immediate Escalation</p>
                                <p className="text-xs text-red-400/80 mt-1">Level 3 reports trigger an urgent alert to the Dean's office via SMS.</p>
                            </div>
                        </div>
                    )}
                    <button type="submit" disabled={content.length < 20 || loading}
                        className="w-full py-3.5 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 rounded-xl hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-40">
                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 
                        {loading ? "Submitting..." : "Submit Anonymous Report"}
                    </button>
                </motion.form>
            ) : (
                <motion.div className="glass rounded-2xl p-8 text-center" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Report Submitted Safely</h3>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">Your report has been received. No identifying information has been linked to this submission.</p>
                    <button onClick={() => { setSubmitted(false); setContent(""); setSeverity(1); setErrorMsg(""); }}
                        className="px-6 py-2.5 text-sm font-medium glass rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all">
                        Submit Another Report
                    </button>
                </motion.div>
            )}
        </div>
    );
}
