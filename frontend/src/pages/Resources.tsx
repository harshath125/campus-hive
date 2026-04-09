import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Heart, MessageCircle, Plus, Search, Briefcase, FileText, Megaphone, X } from "lucide-react";
import { useAuth, Post } from "../App";
import { apiGetResources } from "../api";
import { useEffect } from "react";

const typeConfig = {
    interview: { icon: Briefcase, label: "Interview Experience", color: "bg-violet-500/15 text-violet-300" },
    resource: { icon: FileText, label: "Resource", color: "bg-amber-500/15 text-amber-300" },
    announcement: { icon: Megaphone, label: "Announcement", color: "bg-emerald-500/15 text-emerald-300" },
};

export default function Resources() {
    const { posts, addPost, user, announcements } = useAuth();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "interview" | "resource" | "announcement">("all");
    const [showCreate, setShowCreate] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newContent, setNewContent] = useState("");
    const [newType, setNewType] = useState<"interview" | "resource">("interview");
    const [newTags, setNewTags] = useState("");
    const [liked, setLiked] = useState<Record<number | string, boolean>>({});
    const [realResources, setRealResources] = useState<any[]>([]);

    useEffect(() => {
        apiGetResources().then(data => setRealResources(data.resources || [])).catch(() => {});
    }, []);

    const handleCreate = () => {
        if (!newTitle.trim() || !newContent.trim()) return;
        addPost({ author: user?.name || "Student", type: newType, title: newTitle.trim(), content: newContent.trim(), tags: newTags.split(",").map(t => t.trim()).filter(Boolean) });
        setNewTitle(""); setNewContent(""); setNewTags(""); setShowCreate(false);
    };

    const allPosts: Post[] = [
        ...posts,
        ...realResources.map((r: any) => ({
            id: `res_${r.id}`,
            author: r.created_by || "Admin",
            type: "resource" as const,
            title: r.title,
            content: r.description ? `${r.description} — Link: ${r.url}` : `Link: ${r.url}`,
            tags: ["Admin Resource"],
            likes: 0,
            comments: 0,
            date: new Date(r.created_at).toLocaleDateString(),
            url: r.url
        } as Post))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const filtered = allPosts.filter(p => {
        if (filter !== "all" && p.type !== filter) return false;
        if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2"><BookOpen className="w-6 h-6 text-blue-400" /> Resources Hub</h1>
                    <p className="text-slate-400 text-sm mt-0.5">Interview experiences, study materials & campus announcements</p>
                </div>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-xl hover:bg-blue-500/20 transition-all text-sm font-medium border border-blue-500/20">
                    <Plus className="w-4 h-4" /> Share Post
                </button>
            </div>

            {announcements.length > 0 && (
                <div className="mb-5 glass rounded-2xl p-4 border-l-4 border-amber-500">
                    <div className="flex items-center gap-2 mb-1">
                        <Megaphone className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-semibold text-amber-300">Latest Announcement</span>
                    </div>
                    <p className="text-sm text-white">{typeof announcements[0] === 'string' ? announcements[0] : (announcements[0] as any)?.title || 'New Update'}</p>
                    {typeof announcements[0] === 'object' && (announcements[0] as any)?.content && <p className="text-xs text-slate-400 mt-1">{(announcements[0] as any).content}</p>}
                </div>
            )}

            {showCreate && (
                <motion.div className="glass rounded-2xl p-5 mb-5" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-white">Share with ANITS</span>
                        <button onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex gap-3">
                            <select value={newType} onChange={e => setNewType(e.target.value as "interview" | "resource")}
                                className="px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-sm text-white appearance-none outline-none cursor-pointer hover:border-white/20 transition-all">
                                <option value="interview">Interview Experience</option>
                                <option value="resource">Study Resource</option>
                            </select>
                            <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title"
                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-all" />
                        </div>
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Share your experience or resource..."
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-all resize-none h-24" />
                        <input type="text" value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma separated: TCS, Placement, CSE)"
                            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 outline-none focus:border-blue-500/50 transition-all" />
                        <button onClick={handleCreate} disabled={!newTitle.trim() || !newContent.trim()}
                            className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg disabled:opacity-40 flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Publish Post
                        </button>
                    </div>
                </motion.div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:border-blue-500/40 transition-all outline-none" />
                </div>
                <div className="flex gap-1.5">
                    {(["all", "interview", "resource", "announcement"] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === f ? "bg-blue-500/15 text-blue-300 border border-blue-500/30" : "text-slate-500 hover:text-white hover:bg-white/5"}`}>
                            {f === "all" ? "All" : f === "interview" ? "Interviews" : f === "resource" ? "Resources" : "News"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {filtered.map((post, i) => {
                    const cfg = typeConfig[post.type];
                    return (
                        <motion.div key={post.id} className="glass rounded-2xl p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center text-xs font-bold text-white">{post.author.charAt(0)}</div>
                                <div>
                                    <p className="text-sm font-medium text-white">{post.author}</p>
                                    <p className="text-xs text-slate-500">{post.date}</p>
                                </div>
                                <span className={`ml-auto text-[10px] px-2.5 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <h3 className="text-base font-semibold text-white mb-2">{post.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed mb-3 line-clamp-3">
                                {post.content}
                            </p>
                            {post.url && <a href={post.url} target="_blank" rel="noreferrer" className="inline-block mb-3 text-blue-400 hover:text-blue-300 underline font-medium text-sm">Open Resource ↗</a>}
                            {post.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{post.tags.map(tag => <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-400">{tag}</span>)}</div>}
                            <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                                <button onClick={() => setLiked(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                                    className={`flex items-center gap-1.5 text-xs transition-colors ${liked[post.id] ? "text-red-400" : "text-slate-500 hover:text-red-400"}`}>
                                    <Heart className={`w-4 h-4 ${liked[post.id] ? "fill-current" : ""}`} />{post.likes + (liked[post.id] ? 1 : 0)}
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {filtered.length === 0 && <div className="text-center py-16 text-slate-500"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" /><p className="text-sm">No posts found.</p></div>}
        </div>
    );
}
