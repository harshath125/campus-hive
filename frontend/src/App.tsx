import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { 
    apiLogin, apiSignup, apiLogout, getToken, getStoredUser, setStoredUser, apiGetMe, apiGetAnnouncements,
    apiCreateGroup, apiJoinGroup, apiGetGroupMembers, apiApproveGroupMember, apiFetch,
    apiListPolls, apiCreatePoll, apiVoteOnPoll
} from "./api";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import VibeMatcher from "./pages/VibeMatcher";
import SmartPolls from "./pages/SmartPolls";
import EventPlanner from "./pages/EventPlanner";
import Safety from "./pages/Safety";
import Spaces from "./pages/Spaces";
import Resources from "./pages/Resources";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";

// ── Types ──────────────────────────────────────────────────────────────────

export type SpacePoll = {
    id: number;
    spaceId: number;
    question: string;
    options: { id: number; label: string; votes: number }[];
    createdBy: string;
    createdAt: string;
    isActive: boolean;
    aiInsight?: string;
    userVote?: number; // option id
};

export type SpaceEvent = {
    id: number;
    spaceId: number;
    title: string;
    description: string;
    date: string;
    budget?: number;
    attendees: number;
    createdBy: string;
    tasks: { id: number; title: string; status: "todo" | "in_progress" | "done"; assignee: string; priority: string }[];
};

export type SpaceType = {
    id: number;
    name: string;
    members: number;
    type: "Public" | "Private" | "Mandatory";
    category: string;
    color: string;
    icon: string;
    description: string;
    adminId: string; // user email who created/owns the space
};

export type Post = {
    id: number | string;
    author: string;
    type: "interview" | "resource" | "announcement";
    title: string;
    content: string;
    tags: string[];
    likes: number;
    comments: number;
    date: string;
    url?: string;
};

export type UserProfile = {
    name: string;
    email: string;
    tags: string[];
    branch: string;
    section: string;
    year: number;
    avatar: string; // emoji
    bio: string;
};

type AuthContextType = {
    isLoggedIn: boolean;
    isAdmin: boolean;
    user: UserProfile | null;
    login: (email: string, password: string) => void;
    signup: (name: string, email: string, password: string) => void;
    adminLogin: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    updateProfile: (updates: Partial<UserProfile>) => void;
    // Spaces
    spaces: SpaceType[];
    addSpace: (space: Omit<SpaceType, "id" | "members">) => void;
    joinedSpaces: number[]; // space IDs
    pendingRequests: number[]; // space IDs the user has requested to join
    joinSpace: (spaceId: number) => void;
    requestJoin: (spaceId: number) => void;
    approveRequest: (spaceId: number, userEmail: string) => void;
    leaveSpace: (spaceId: number) => void;
    spaceRequests: Record<number, string[]>; // spaceId -> list of requestor emails
    // Polls
    polls: SpacePoll[];
    addPoll: (poll: Omit<SpacePoll, "id" | "createdAt">) => void;
    voteOnPoll: (pollId: number, optionId: number, reason?: string) => void;
    // Events
    events: SpaceEvent[];
    addEvent: (event: Omit<SpaceEvent, "id">) => void;
    updateTaskStatus: (eventId: number, taskId: number, status: "todo" | "in_progress" | "done") => void;
    // Posts
    posts: Post[];
    addPost: (post: Omit<Post, "id" | "likes" | "comments" | "date">) => void;
    // Announcements & Admin
    announcements: any[];
    addAnnouncement: (msg: string) => void;
    students: { name: string; email: string; section: string; branch: string }[];
    importStudents: (list: { name: string; email: string; section: string; branch: string }[]) => void;
};

// ── Default Data ───────────────────────────────────────────────────────────

const defaultSpaces: SpaceType[] = [
    { id: 1, name: "Cinema Club", members: 42, type: "Public", category: "club", color: "from-pink-500 to-rose-600", icon: "🎬", description: "Watch, discuss, and celebrate cinema together!", adminId: "priya@anits.edu.in" },
    { id: 2, name: "AI Study Group", members: 18, type: "Private", category: "study", color: "from-violet-500 to-indigo-600", icon: "🤖", description: "Deep dives into ML/AI papers and projects.", adminId: "rahul@anits.edu.in" },
    { id: 3, name: "Fest Committee 2026", members: 35, type: "Public", category: "committee", color: "from-amber-500 to-orange-600", icon: "🎉", description: "Organizing the biggest fest ANITS has ever seen!", adminId: "ananya@anits.edu.in" },
    { id: 4, name: "Music Producers", members: 15, type: "Private", category: "club", color: "from-emerald-500 to-teal-600", icon: "🎵", description: "Producing beats and original music tracks.", adminId: "karthik@anits.edu.in" },
    { id: 5, name: "CSE 3-A Section", members: 60, type: "Mandatory", category: "class", color: "from-blue-500 to-cyan-600", icon: "📚", description: "Official section space for CSE 3rd Year Section A.", adminId: "admin@anits.edu.in" },
    { id: 6, name: "Basketball Team", members: 22, type: "Public", category: "sports", color: "from-red-500 to-orange-500", icon: "🏀", description: "ANITS Basketball team — practice updates and match schedules.", adminId: "priya@anits.edu.in" },
];

const defaultPolls: SpacePoll[] = [
    {
        id: 1, spaceId: 3, question: "Should the college fest be held in February or March?",
        options: [{ id: 1, label: "February", votes: 45 }, { id: 2, label: "March", votes: 30 }],
        createdBy: "Ananya P.", createdAt: "2026-02-15", isActive: true,
        aiInsight: "• Most prefer February due to fewer exams.\n• March supporters cite better weather.\n• Both sides want vendor options considered.",
    },
    {
        id: 2, spaceId: 5, question: "Preferred study room booking system?",
        options: [{ id: 3, label: "First-come, First-served", votes: 62 }, { id: 4, label: "Lottery System", votes: 50 }],
        createdBy: "Rahul V.", createdAt: "2026-02-12", isActive: false,
        aiInsight: "• First-come advocates argue for fairness.\n• Lottery supporters cite equity.\n• Both agree on a waitlist mechanism.",
    },
    {
        id: 3, spaceId: 1, question: "What genre should our monthly screening be?",
        options: [{ id: 5, label: "Thriller", votes: 18 }, { id: 6, label: "Sci-Fi", votes: 24 }, { id: 7, label: "Classic Drama", votes: 12 }],
        createdBy: "Priya S.", createdAt: "2026-02-20", isActive: true,
    },
];

const defaultEvents: SpaceEvent[] = [
    {
        id: 1, spaceId: 3, title: "Annual Hackathon 2026", description: "24-hour coding competition", date: "2026-03-15",
        budget: 25000, attendees: 100, createdBy: "Ananya P.",
        tasks: [
            { id: 1, title: "Book venue (Auditorium)", status: "done", assignee: "Priya S.", priority: "high" },
            { id: 2, title: "Design posters & banners", status: "in_progress", assignee: "Ananya P.", priority: "medium" },
            { id: 3, title: "Contact food vendors", status: "in_progress", assignee: "Rahul V.", priority: "medium" },
            { id: 4, title: "Setup registration form", status: "todo", assignee: "Karthik N.", priority: "high" },
            { id: 5, title: "Reach out to sponsors", status: "todo", assignee: "Sneha G.", priority: "high" },
        ],
    },
];

const defaultPosts: Post[] = [
    { id: 1, author: "Priya S.", type: "interview", title: "My TCS NQT Experience — March 2026", content: "I recently appeared for TCS NQT and here's my full experience covering aptitude, coding, and interview rounds...", tags: ["TCS", "Placement", "CSE"], likes: 34, comments: 12, date: "2026-02-14" },
    { id: 2, author: "Rahul V.", type: "resource", title: "DSA Roadmap for Placements", content: "A complete 60-day roadmap I followed for Data Structures & Algorithms preparation including resources and tips...", tags: ["DSA", "Placement", "Coding"], likes: 52, comments: 18, date: "2026-02-12" },
    { id: 3, author: "Admin", type: "announcement", title: "Mid-Semester Exam Schedule Released", content: "The mid-semester examination schedule for all branches has been published. Please check the academic portal for details.", tags: ["Exam", "Important"], likes: 15, comments: 5, date: "2026-02-15" },
    { id: 4, author: "Ananya P.", type: "interview", title: "Infosys InfyTQ Interview Experience", content: "Sharing my experience of InfyTQ certification + Infosys SP role interview. The process included online test, hands-on coding...", tags: ["Infosys", "Placement"], likes: 28, comments: 9, date: "2026-02-10" },
    { id: 5, author: "Karthik N.", type: "resource", title: "Best Free Resources for Web Development", content: "Curated list of free resources — FreeCodeCamp, The Odin Project, MDN Docs, and YouTube channels for MERN stack...", tags: ["WebDev", "Resources", "Free"], likes: 41, comments: 14, date: "2026-02-08" },
];

const gradients = [
    "from-pink-500 to-rose-600", "from-violet-500 to-indigo-600", "from-amber-500 to-orange-600",
    "from-emerald-500 to-teal-600", "from-blue-500 to-cyan-600", "from-red-500 to-orange-500",
    "from-fuchsia-500 to-purple-600", "from-lime-500 to-green-600", "from-sky-500 to-blue-600",
];
const icons = ["🎯", "📊", "🚀", "🎨", "⚡", "🌟", "🔬", "🏆", "🌿"];

// ── Context ────────────────────────────────────────────────────────────────

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

// ── App Component ──────────────────────────────────────────────────────────

export default function App() {
    const [isLoggedIn, setIsLoggedIn] = useState(!!getToken());
    const [isAdmin, setIsAdmin] = useState(false);
    const [user, setUser] = useState<UserProfile | null>(getStoredUser());
    const [spaces, setSpaces] = useState<SpaceType[]>(defaultSpaces);
    const [joinedSpaces, setJoinedSpaces] = useState<number[]>([1, 3, 5]);
    const [pendingRequests, setPendingRequests] = useState<number[]>([]);
    const [spaceRequests, setSpaceRequests] = useState<Record<number, string[]>>({});
    const [polls, setPolls] = useState<SpacePoll[]>(defaultPolls);
    const [events, setEvents] = useState<SpaceEvent[]>(defaultEvents);
    const [posts, setPosts] = useState<Post[]>(defaultPosts);
    const [announcements, setAnnouncements] = useState<any[]>([]);
    const [students, setStudents] = useState([
        { name: "Priya Sharma", email: "priya@anits.edu.in", section: "3-A", branch: "CSE" },
        { name: "Rahul Verma", email: "rahul@anits.edu.in", section: "3-A", branch: "CSE" },
        { name: "Ananya Patel", email: "ananya@anits.edu.in", section: "3-B", branch: "CSE" },
        { name: "Karthik Nair", email: "karthik@anits.edu.in", section: "2-A", branch: "ECE" },
    ]);

    // Restore session from localStorage on mount
    useEffect(() => {
        const token = getToken();
        const storedUser = getStoredUser();
        if (token && storedUser) {
            setUser(storedUser);
            setIsLoggedIn(true);
            setIsAdmin(storedUser.role === "admin");
        }
    }, []);

    // Load Announcements and Spaces when logged in
    useEffect(() => {
        if (isLoggedIn) {
            apiGetAnnouncements()
                .then(data => setAnnouncements(data.announcements || []))
                .catch(() => {});
            
            apiFetch("/groups/")
                .then(data => {
                    if (data.groups) {
                        setSpaces(prev => {
                            // Merge backend spaces with default spaces for demo purposes
                            // In production, you would completely replace `prev` with the backend data
                            const beSpaces = data.groups.map((g: any) => ({
                                id: g.id,
                                name: g.name,
                                members: g.member_count,
                                type: g.privacy === "public" ? "Public" : g.privacy === "private" ? "Private" : "Mandatory",
                                category: g.type || "club",
                                color: g.color || "from-violet-500 to-indigo-600",
                                icon: g.icon || "📚",
                                description: g.description || "",
                                adminId: g.admin_id?.toString() || "" // We'll map admin ID to string for now
                            }));
                            const newIds = beSpaces.map((s: SpaceType) => s.id);
                            return [...beSpaces, ...prev.filter(p => !newIds.includes(p.id))];
                        });
                    }
                })
                .catch(() => {});
        }
    }, [isLoggedIn]);

    const login = async (email: string, pw: string) => {
        try {
            const data = await apiLogin(email, pw);
            const u = data.user;
            const profile: UserProfile = { name: u.name, email: u.email, tags: u.tags || [], branch: u.branch || "", section: u.section || "", year: u.year || 1, avatar: u.avatar || "👾", bio: "" };
            setUser(profile);
            setStoredUser(profile);
            setIsLoggedIn(true);
            setIsAdmin(u.role === "admin");
        } catch (err: any) {
            // Fallback to local login for demo
            const profile: UserProfile = { name: email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, c => c.toUpperCase()), email, tags: ["Python", "AI/ML", "Hackathons", "Night Owl"], branch: "CSE", section: "3-A", year: 3, avatar: "👾", bio: "Passionate about tech!" };
            setUser(profile);
            setStoredUser(profile);
            setIsLoggedIn(true);
            setIsAdmin(false);
        }
    };

    const signup = async (name: string, email: string, pw: string) => {
        try {
            await apiSignup(name, email, pw);
            // Account created — do NOT auto-login. User will be redirected to /login.
        } catch (err: any) {
            // Fallback: account "created" locally for demo mode
            // Still do NOT auto-login
        }
    };

    const adminLogin = async (email: string, pw: string): Promise<boolean> => {
        try {
            const data = await apiLogin(email, pw);
            if (data.user && (data.user.role === "admin" || data.user.is_staff)) {
                const profile: UserProfile = {
                    name: data.user.name, email: data.user.email,
                    tags: data.user.tags || [], branch: data.user.branch || "Admin",
                    section: data.user.section || "", year: data.user.year || 0,
                    avatar: "🛡️", bio: "Campus Hive Administrator",
                };
                setUser(profile);
                setStoredUser(profile);
                setIsLoggedIn(true);
                setIsAdmin(true);
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    const logout = () => { apiLogout(); setUser(null); setIsLoggedIn(false); setIsAdmin(false); };

    const updateProfile = useCallback((updates: Partial<UserProfile>) => {
        setUser(prev => prev ? { ...prev, ...updates } : prev);
    }, []);

    const addSpace = useCallback(async (space: Omit<SpaceType, "id" | "members">) => {
        try {
            const data = await apiCreateGroup({
                name: space.name,
                type: space.category,
                privacy: space.type.toLowerCase(),
                description: space.description,
                icon: space.icon,
                color: space.color
            });
            if (data.group) {
                const g = data.group;
                const newSpace: SpaceType = {
                    id: g.id, name: g.name, members: g.member_count,
                    type: g.privacy === "public" ? "Public" : g.privacy === "private" ? "Private" : "Mandatory",
                    category: g.type || "club", color: g.color || "from-violet-500 to-indigo-600",
                    icon: g.icon || "📚", description: g.description || "", adminId: user?.email || ""
                };
                setSpaces(prev => [newSpace, ...prev]);
                setJoinedSpaces(j => [...j, newSpace.id]);
            }
        } catch (e) { console.error("Failed to create space", e); }
    }, [user]);

    const joinSpace = useCallback(async (spaceId: number) => {
        try {
            await apiJoinGroup(spaceId);
            setJoinedSpaces(prev => prev.includes(spaceId) ? prev : [...prev, spaceId]);
            setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, members: s.members + 1 } : s));
        } catch (e) { console.error("Failed to join space", e); }
    }, []);

    const requestJoin = useCallback(async (spaceId: number) => {
        try {
            await apiJoinGroup(spaceId);
            setPendingRequests(prev => [...prev, spaceId]);
            setSpaceRequests(prev => ({
                ...prev,
                [spaceId]: [...(prev[spaceId] || []), user?.email || "unknown"]
            }));
        } catch (e) { console.error("Failed to request join", e); }
    }, [user]);

    const approveRequest = useCallback(async (spaceId: number, userEmail: string) => {
        try {
            // Note: If userEmail does not map easily to a user ID, we might need to adjust this later!
            // In a real app we'd pass the actual user ID. For this demo we'll just mock the state update on success.
            // await apiApproveGroupMember(spaceId, userId, "approve"); 
            setSpaceRequests(prev => ({
                ...prev,
                [spaceId]: (prev[spaceId] || []).filter(e => e !== userEmail)
            }));
            setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, members: s.members + 1 } : s));
        } catch (e) { }
    }, []);

    const leaveSpace = useCallback(async (spaceId: number) => {
        try {
            // Mocking leave space API call since we don't have an explicit one yet
            setJoinedSpaces(prev => prev.filter(id => id !== spaceId));
            setSpaces(prev => prev.map(s => s.id === spaceId ? { ...s, members: Math.max(0, s.members - 1) } : s));
        } catch (e) { }
    }, []);

    const addPoll = useCallback(async (poll: Omit<SpacePoll, "id" | "createdAt">) => {
        try {
            const data = await apiCreatePoll({
                group_id: poll.spaceId,
                question: poll.question,
                options: poll.options.map(o => o.label)
            });
            if (data.poll) {
                const p = data.poll;
                setPolls(prev => [{
                    id: p.id, spaceId: poll.spaceId, question: p.question,
                    options: p.options.map((o: any) => ({ id: o.id, label: o.text, votes: o.votes })),
                    createdBy: poll.createdBy, createdAt: new Date().toISOString().split("T")[0],
                    isActive: p.is_active,
                }, ...prev]);
            }
        } catch (e) { console.error("Failed to create poll", e); }
    }, []);

    const voteOnPoll = useCallback(async (pollId: number, optionId: number, reason: string = "I like this option") => {
        try {
            const data = await apiVoteOnPoll(pollId, optionId, reason);
            if (data.poll) {
                const p = data.poll;
                setPolls(prev => prev.map(oldPoll => {
                    if (oldPoll.id !== pollId) return oldPoll;
                    return {
                        ...oldPoll,
                        userVote: optionId,
                        aiInsight: p.ai_insight || oldPoll.aiInsight,
                        options: p.options.map((o: any) => ({ id: o.id, label: o.text, votes: o.votes }))
                    };
                }));
            }
        } catch (e) {
            console.error("Failed to vote", e);
            // Fallback optimistic update if API fails for demo presentation
            setPolls(prev => prev.map(p => p.id === pollId ? {
                ...p, userVote: optionId, options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1} : o)
            } : p));
        }
    }, []);

    const addEvent = useCallback((event: Omit<SpaceEvent, "id">) => {
        setEvents(prev => [{ ...event, id: Date.now() }, ...prev]);
    }, []);

    const updateTaskStatus = useCallback((eventId: number, taskId: number, status: "todo" | "in_progress" | "done") => {
        setEvents(prev => prev.map(e => e.id !== eventId ? e : {
            ...e, tasks: e.tasks.map(t => t.id === taskId ? { ...t, status } : t)
        }));
    }, []);

    const addPost = useCallback((post: Omit<Post, "id" | "likes" | "comments" | "date">) => {
        setPosts(prev => [{ ...post, id: Date.now(), likes: 0, comments: 0, date: new Date().toISOString().split("T")[0] }, ...prev]);
    }, []);

    const addAnnouncement = useCallback((msg: string) => {
        setAnnouncements(prev => [msg, ...prev]);
    }, []);

    const importStudents = useCallback((list: typeof students) => {
        setStudents(prev => [...prev, ...list]);
    }, []);

    return (
        <AuthContext.Provider value={{
            isLoggedIn, isAdmin, user, login, signup, adminLogin, logout, updateProfile,
            spaces, addSpace, joinedSpaces, pendingRequests, joinSpace, requestJoin, approveRequest, leaveSpace, spaceRequests,
            polls, addPoll, voteOnPoll,
            events, addEvent, updateTaskStatus,
            posts, addPost,
            announcements, addAnnouncement,
            students, importStudents,
        }}>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/login" element={isLoggedIn ? <Navigate to={isAdmin ? "/admin" : "/dashboard"} /> : <Login />} />
                    <Route path="/signup" element={isLoggedIn ? <Navigate to="/dashboard" /> : <Signup />} />
                    <Route path="/admin/login" element={isAdmin ? <Navigate to="/admin" /> : <AdminLogin />} />
                    <Route path="/admin" element={isAdmin ? <AdminPanel /> : <Navigate to="/admin/login" />} />
                    <Route path="/dashboard" element={isLoggedIn && !isAdmin ? <Dashboard /> : <Navigate to="/login" />}>
                        <Route index element={<VibeMatcher />} />
                        <Route path="vibe-matcher" element={<VibeMatcher />} />
                        <Route path="polls" element={<SmartPolls />} />
                        <Route path="events" element={<EventPlanner />} />
                        <Route path="safety" element={<Safety />} />
                        <Route path="spaces" element={<Spaces />} />
                        <Route path="resources" element={<Resources />} />
                    </Route>
                </Routes>
            </Router>
        </AuthContext.Provider>
    );
}

// Export helpers for use in components
export { gradients, icons };
