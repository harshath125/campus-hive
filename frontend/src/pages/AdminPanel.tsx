import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  apiAdminStats, apiAdminListUsers, apiAdminUpdateUser,
  apiAdminDeleteUser, apiAdminLogs, apiAdminIncidents,
  apiAdminUpdateIncident, apiAdminDbHealth,
  apiAdminUploadCsv, apiGetAnnouncements, apiCreateAnnouncement, apiDeleteAnnouncement,
  apiGetResources, apiCreateResource, apiDeleteResource,
} from '../api';

type Tab = 'overview' | 'users' | 'incidents' | 'logs' | 'database' | 'announcements' | 'resources';
const validTabs: Tab[] = ['overview', 'users', 'incidents', 'logs', 'database', 'announcements', 'resources'];

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (validTabs.includes(searchParams.get('tab') as Tab) ? searchParams.get('tab') : 'overview') as Tab;
  const setTab = (t: Tab) => setSearchParams({ tab: t }, { replace: false });
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [dbHealth, setDbHealth] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ branch: '', year: '', section: '', role: '', search: '' });
  const [editUser, setEditUser] = useState<any>(null);
  const [choices, setChoices] = useState<any>({ branches: [], sections: [], years: [] });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  // Load stats on mount
  useEffect(() => {
    setLoading(true);
    apiAdminStats()
      .then(data => {
        setStats(data);
        setChoices(data.choices || { branches: [], sections: [], years: [] });
        setLoading(false);
      })
      .catch(e => { setError(e.error || 'Failed to load stats'); setLoading(false); });
  }, [refreshKey]);

  // Load tab-specific data
  useEffect(() => {
    if (currentTab === 'users') {
      const f: Record<string, string> = {};
      if (filters.branch) f.branch = filters.branch;
      if (filters.year) f.year = filters.year;
      if (filters.section) f.section = filters.section;
      if (filters.role) f.role = filters.role;
      if (filters.search) f.search = filters.search;
      apiAdminListUsers(f).then(d => setUsers(d.users)).catch(() => {});
    }
    if (currentTab === 'logs') {
      apiAdminLogs(undefined, 50).then(d => setLogs(d.logs)).catch(() => {});
    }
    if (currentTab === 'incidents') {
      apiAdminIncidents().then(d => setIncidents(d.incidents)).catch(() => {});
    }
    if (currentTab === 'database') {
      apiAdminDbHealth().then(d => setDbHealth(d)).catch(() => {});
    }
    if (currentTab === 'announcements') {
      apiGetAnnouncements().then(d => setAnnouncements(d.announcements)).catch(() => {});
    }
    if (currentTab === 'resources') {
      apiGetResources().then(d => setResources(d.resources)).catch(() => {});
    }
  }, [currentTab, filters, refreshKey]);

  const handleUpdateUser = async (userId: number, data: Record<string, any>) => {
    try {
      await apiAdminUpdateUser(userId, data);
      setEditUser(null);
      refresh();
    } catch (e: any) {
      alert(e.error || 'Update failed');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await apiAdminDeleteUser(userId);
      refresh();
    } catch (e: any) {
      alert(e.error || 'Deactivation failed');
    }
  };

  const handleUpdateIncident = async (id: number, status: string) => {
    try {
      await apiAdminUpdateIncident(id, { status });
      refresh();
    } catch (e: any) {
      alert(e.error || 'Update failed');
    }
  };

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-full text-violet-400">
      <div className="text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <div className="text-xl">Loading Admin Dashboard...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="p-10 text-red-500 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <div className="text-lg">{error}</div>
      <div className="mt-2 text-slate-500 text-sm">Admin access required. Login as admin@campushive.com</div>
    </div>
  );

  return (
    <div className="px-4 pb-6 md:px-6 lg:px-8 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-200 flex items-center gap-2">
            <span className="text-3xl">🛡️</span> Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">
            Real-time monitoring • Live database operations • Full CRUD control
          </p>
        </div>
        <button onClick={refresh}
          className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-700 border-none rounded-lg text-white cursor-pointer text-sm font-semibold self-start sm:self-auto">
          ↻ Refresh
        </button>
      </div>

      {/* Tab Navigation — scrollable on mobile */}
      <div className="flex gap-1 mb-6 bg-[rgba(30,30,50,0.6)] rounded-xl p-1 border border-violet-600/20 overflow-x-auto scrollbar-hide">
        {([
          { id: 'overview', icon: '📊', label: 'Overview' },
          { id: 'users', icon: '👥', label: 'Users' },
          { id: 'announcements', icon: '📢', label: 'Announce' },
          { id: 'resources', icon: '📚', label: 'Resources' },
          { id: 'incidents', icon: '🚨', label: 'Incidents' },
          { id: 'logs', icon: '📋', label: 'Activity' },
          { id: 'database', icon: '🗄️', label: 'DB' },
        ] as { id: Tab; icon: string; label: string }[]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-shrink-0 px-3 py-2.5 border-none rounded-lg cursor-pointer text-xs sm:text-sm font-medium transition-all whitespace-nowrap min-w-[80px] ${
              currentTab === t.id
                ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold'
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {currentTab === 'overview' && stats && <OverviewTab stats={stats} />}
      {currentTab === 'users' && (
        <UsersTab users={users} choices={choices} filters={filters}
          setFilters={setFilters} editUser={editUser} setEditUser={setEditUser}
          onUpdate={handleUpdateUser} onDeactivate={handleDeactivateUser} onRefresh={refresh} />
      )}
      {currentTab === 'incidents' && (
        <IncidentsTab incidents={incidents} onUpdate={handleUpdateIncident} />
      )}
      {currentTab === 'logs' && <LogsTab logs={logs} />}
      {currentTab === 'database' && <DatabaseTab dbHealth={dbHealth} />}
      {currentTab === 'announcements' && <AnnouncementsTab announcements={announcements} onRefresh={refresh} />}
      {currentTab === 'resources' && <ResourcesTab resources={resources} onRefresh={refresh} />}
    </div>
  );
}

/* ── Card Component ────────────────────────────────────── */
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(30,30,50,0.7)', borderRadius: 12, padding: 20,
      border: '1px solid rgba(124,58,237,0.15)', ...style,
    }}>{children}</div>
  );
}

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: number | string; sub?: string; color?: string;
}) {
  return (
    <Card style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || '#a78bfa', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

/* ── Overview Tab ──────────────────────────────────────── */
function OverviewTab({ stats }: { stats: any }) {
  return (
    <div>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon="👥" label="Total Users" value={stats.users.total} sub={`${stats.users.new_this_week} this week`} />
        <StatCard icon="📊" label="Groups" value={stats.groups.total} color="#34d399" />
        <StatCard icon="🗳️" label="Polls / Votes" value={`${stats.polls.total} / ${stats.polls.total_votes}`} color="#fbbf24" />
        <StatCard icon="📅" label="Events" value={stats.events.total} sub={`${stats.events.tasks_done}/${stats.events.tasks_total} tasks done`} color="#38bdf8" />
        <StatCard icon="🚨" label="Incidents" value={stats.incidents.total} sub={`${stats.incidents.pending} pending`} color="#f87171" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Users by Branch */}
        <Card>
          <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>📊 Users by Branch</h3>
          {stats.users.by_branch.map((b: any) => (
            <div key={b.branch} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <div style={{ width: 50, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{b.branch}</div>
              <div style={{ flex: 1, height: 22, background: 'rgba(124,58,237,0.15)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(b.count / stats.users.total) * 100}%`,
                  background: 'linear-gradient(90deg, #7c3aed, #a78bfa)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  fontSize: 11, fontWeight: 700, color: '#fff', minWidth: 30,
                }}>{b.count}</div>
              </div>
            </div>
          ))}
        </Card>

        {/* Users by Year */}
        <Card>
          <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>🎓 Users by Year</h3>
          {stats.users.by_year.map((y: any) => (
            <div key={y.year} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 60, fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>Year {y.year}</div>
              <div style={{ flex: 1, height: 28, background: 'rgba(52,211,153,0.15)', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(y.count / stats.users.total) * 100}%`,
                  background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', paddingLeft: 8,
                  fontSize: 12, fontWeight: 700, color: '#fff', minWidth: 30,
                }}>{y.count}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>

      {/* Incidents by Severity + Recent Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
        <Card>
          <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>🚨 Incident Severity</h3>
          {stats.incidents.by_severity.map((s: any) => {
            const colors: Record<string, string> = { green: '#10b981', yellow: '#fbbf24', orange: '#f97316', red: '#ef4444' };
            return (
              <div key={s.severity} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '6px 10px', borderRadius: 6, background: `${colors[s.severity]}20` }}>
                <span style={{ fontSize: 13, color: colors[s.severity], fontWeight: 700, textTransform: 'uppercase' }}>{s.severity}</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: colors[s.severity] }}>{s.count}</span>
              </div>
            );
          })}
        </Card>

        <Card>
          <h3 style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>📋 Recent Activity ({stats.activity.today} today)</h3>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            {stats.activity.recent.slice(0, 10).map((log: any) => (
              <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(124,58,237,0.1)', fontSize: 12 }}>
                <span style={{ color: '#a78bfa', fontWeight: 700, minWidth: 80 }}>{log.action}</span>
                <span style={{ color: '#94a3b8', flex: 1 }}>{log.user__name || 'System'}</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Users Tab ─────────────────────────────────────────── */
function UsersTab({ users, choices, filters, setFilters, editUser, setEditUser, onUpdate, onDeactivate, onRefresh }: any) {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await apiAdminUploadCsv(file);
      alert(res.message);
      if (res.errors?.length) alert('Errors:\n' + res.errors.join('\n'));
      onRefresh();
    } catch (err: any) {
      alert(err.error || 'Upload failed');
    }
  };

  return (
    <div>
      {/* Filters and Actions */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            placeholder="Search name/email..."
            value={filters.search}
            onChange={e => setFilters({ ...filters, search: e.target.value })}
            style={{
              flex: 1, minWidth: 200, padding: '8px 12px', background: 'rgba(15,15,35,0.8)',
              border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#e2e8f0', fontSize: 13,
              outline: 'none',
            }}
          />
          <select value={filters.branch} onChange={e => setFilters({ ...filters, branch: e.target.value })}
            style={selectStyle}>
            <option value="">All Branches</option>
            {choices.branches.map((b: any) => <option key={b.value} value={b.value}>{b.value} — {b.label}</option>)}
          </select>
          <select value={filters.year} onChange={e => setFilters({ ...filters, year: e.target.value })}
            style={selectStyle}>
            <option value="">All Years</option>
            {choices.years.map((y: any) => <option key={y.value} value={y.value}>{y.label}</option>)}
          </select>
          <select value={filters.section} onChange={e => setFilters({ ...filters, section: e.target.value })}
            style={selectStyle}>
            <option value="">All Sections</option>
            {choices.sections.map((s: any) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}
            style={selectStyle}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Admin</option>
            <option value="faculty">Faculty</option>
          </select>

          <div style={{ marginLeft: 'auto', position: 'relative' }}>
            <label style={{
              padding: '8px 16px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>
              <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
              📤 Bulk Import CSV
            </label>
          </div>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(124,58,237,0.3)' }}>
                {['Name', 'Email', 'Role', 'Branch', 'Sec', 'Year', 'Tags', 'Vibe', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => (
                <tr key={u.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.1)' }}>
                  <td style={tdStyle}><span style={{ fontWeight: 600, color: '#e2e8f0' }}>{u.name}</span></td>
                  <td style={tdStyle}><span style={{ color: '#94a3b8', fontSize: 11 }}>{u.email}</span></td>
                  <td style={tdStyle}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                      background: u.role === 'admin' ? '#7c3aed30' : '#10b98130',
                      color: u.role === 'admin' ? '#a78bfa' : '#34d399',
                    }}>{u.role}</span>
                  </td>
                  <td style={tdStyle}><span style={{ color: '#94a3b8', fontSize: 12 }}>{u.branch}</span></td>
                  <td style={tdStyle}><span style={{ color: '#94a3b8', fontSize: 12 }}>{u.section}</span></td>
                  <td style={tdStyle}><span style={{ color: '#94a3b8', fontSize: 12 }}>{u.year || '—'}</span></td>
                  <td style={{ ...tdStyle, maxWidth: 150 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {(u.tags || []).slice(0, 3).map((t: string) => (
                        <span key={t} style={{ padding: '1px 6px', borderRadius: 8, fontSize: 10, background: '#7c3aed20', color: '#a78bfa' }}>{t}</span>
                      ))}
                      {(u.tags || []).length > 3 && <span style={{ fontSize: 10, color: '#64748b' }}>+{u.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td style={tdStyle}><span style={{ fontWeight: 700, color: '#a78bfa' }}>{u.vibe_score}</span></td>
                  <td style={tdStyle}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                      background: u.is_active ? '#10b981' : '#ef4444',
                    }} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => setEditUser(u)} style={btnSmall}>✏️</button>
                      <button onClick={() => onDeactivate(u.id)} style={{ ...btnSmall, background: '#ef444430' }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>No users match filters</p>}
        </div>
      </Card>

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal user={editUser} choices={choices}
          onSave={(data: any) => onUpdate(editUser.id, data)}
          onClose={() => setEditUser(null)} />
      )}
    </div>
  );
}

/* ── Edit User Modal ───────────────────────────────────── */
function EditUserModal({ user, choices, onSave, onClose }: any) {
  const [form, setForm] = useState({
    name: user.name || '',
    role: user.role || 'student',
    branch: user.branch || '',
    section: user.section || '',
    year: user.year || '',
    tags: (user.tags || []).join(', '),
    is_active: user.is_active,
  });

  const handleSubmit = () => {
    onSave({
      name: form.name,
      role: form.role,
      branch: form.branch,
      section: form.section,
      year: form.year ? Number(form.year) : null,
      tags: form.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
      is_active: form.is_active,
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <Card style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 18 }}>✏️ Edit User: {user.name}</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <label style={labelStyle}>
            Name
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
          </label>
          <label style={labelStyle}>
            Role
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={inputStyle}>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
            </select>
          </label>
          <label style={labelStyle}>
            Branch
            <select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} style={inputStyle}>
              <option value="">Select Branch</option>
              {choices.branches.map((b: any) => <option key={b.value} value={b.value}>{b.value} — {b.label}</option>)}
            </select>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label style={labelStyle}>
              Section
              <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} style={inputStyle}>
                <option value="">Select</option>
                {choices.sections.map((s: any) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Year
              <select value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} style={inputStyle}>
                <option value="">Select</option>
                {choices.years.map((y: any) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </label>
          </div>
          <label style={labelStyle}>
            Tags (comma separated)
            <input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} style={inputStyle} placeholder="Python, AI/ML, React..." />
          </label>
          <label style={{ ...labelStyle, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: '#333', border: 'none', borderRadius: 8, color: '#ccc', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            padding: '8px 20px', background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700,
          }}>Save Changes</button>
        </div>
      </Card>
    </div>
  );
}

/* ── Incidents Tab ─────────────────────────────────────── */
function IncidentsTab({ incidents, onUpdate }: any) {
  const severityColors: Record<string, string> = { green: '#10b981', yellow: '#fbbf24', orange: '#f97316', red: '#ef4444' };
  const statusColors: Record<string, string> = { pending: '#f97316', investigating: '#3b82f6', resolved: '#10b981' };
  return (
    <div>
      {incidents.map((inc: any) => (
        <Card key={inc.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800,
                  background: `${severityColors[inc.severity]}20`, color: severityColors[inc.severity],
                  textTransform: 'uppercase',
                }}>{inc.severity}</span>
                <span style={{
                  padding: '2px 10px', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: `${statusColors[inc.status]}20`, color: statusColors[inc.status],
                }}>{inc.status}</span>
                {inc.location && <span style={{ color: '#64748b', fontSize: 11 }}>📍 {inc.location}</span>}
              </div>
              <p style={{ color: '#e2e8f0', margin: '4px 0', fontSize: 14 }}>{inc.description}</p>
              <span style={{ color: '#64748b', fontSize: 11 }}>{new Date(inc.created_at).toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {inc.status === 'pending' && (
                <button onClick={() => onUpdate(inc.id, 'investigating')} style={{ ...btnSmall, background: '#3b82f630', color: '#60a5fa' }}>🔍 Investigate</button>
              )}
              {inc.status !== 'resolved' && (
                <button onClick={() => onUpdate(inc.id, 'resolved')} style={{ ...btnSmall, background: '#10b98130', color: '#34d399' }}>✅ Resolve</button>
              )}
            </div>
          </div>
        </Card>
      ))}
      {incidents.length === 0 && <Card><p style={{ textAlign: 'center', color: '#64748b' }}>No incidents reported</p></Card>}
    </div>
  );
}

/* ── Activity Logs Tab ─────────────────────────────────── */
function LogsTab({ logs }: any) {
  const actionColors: Record<string, string> = {
    login: '#10b981', signup: '#34d399', logout: '#64748b',
    create_group: '#3b82f6', vote: '#fbbf24', vibe_match: '#a78bfa',
    create_poll: '#f97316', create_event: '#38bdf8', update_profile: '#94a3b8',
    report_incident: '#ef4444', update_task: '#6366f1',
  };
  return (
    <Card>
      <div style={{ maxHeight: 600, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(124,58,237,0.3)' }}>
              {['Time', 'User', 'Action', 'Details', 'IP'].map(h => (
                <th key={h} style={{ padding: '8px 6px', textAlign: 'left', color: '#94a3b8', fontSize: 12, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log.id} style={{ borderBottom: '1px solid rgba(124,58,237,0.08)' }}>
                <td style={tdStyle}><span style={{ color: '#64748b', fontSize: 11 }}>{new Date(log.timestamp).toLocaleString()}</span></td>
                <td style={tdStyle}><span style={{ color: '#e2e8f0', fontSize: 12 }}>{log.user_name}</span></td>
                <td style={tdStyle}>
                  <span style={{
                    padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                    background: `${actionColors[log.action] || '#666'}25`, color: actionColors[log.action] || '#888',
                  }}>{log.action}</span>
                </td>
                <td style={{ ...tdStyle, maxWidth: 300 }}><span style={{ color: '#94a3b8', fontSize: 11 }}>{log.details}</span></td>
                <td style={tdStyle}><span style={{ color: '#64748b', fontSize: 11, fontFamily: 'monospace' }}>{log.ip_address || '—'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Database Tab ──────────────────────────────────────── */
function DatabaseTab({ dbHealth }: any) {
  if (!dbHealth) return <Card><p style={{ textAlign: 'center', color: '#64748b' }}>Loading database info...</p></Card>;
  return (
    <div>
      {/* Connection Status */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>{dbHealth.status === 'connected' ? '🟢' : '🔴'}</span>
          <div>
            <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 20 }}>
              Database {dbHealth.status === 'connected' ? 'Connected' : 'Error'}
            </h3>
            <p style={{ margin: '4px 0 0', color: '#94a3b8', fontSize: 13 }}>
              Engine: <strong style={{ color: '#a78bfa' }}>{dbHealth.engine}</strong> •
              Total Records: <strong style={{ color: '#34d399' }}>{dbHealth.total_records}</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Table Stats */}
      <Card>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16, fontWeight: 700 }}>🗄️ Table Statistics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {Object.entries(dbHealth.tables).map(([table, count]) => (
            <div key={table} style={{
              padding: 16, borderRadius: 8, background: 'rgba(15,15,35,0.6)',
              border: '1px solid rgba(124,58,237,0.12)', textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#a78bfa' }}>{count as number}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace', marginTop: 4 }}>{table}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ── Announcements Tab ─────────────────────────────────── */
function AnnouncementsTab({ announcements, onRefresh }: any) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCreateAnnouncement({ title, content });
      setTitle(''); setContent(''); onRefresh();
    } catch (err: any) {
      alert(err.error || 'Failed to create announcement');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove announcement?')) return;
    await apiDeleteAnnouncement(id);
    onRefresh();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 16 }}>
      <Card>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16 }}>📢 New Announcement</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input required placeholder="Announcement Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <textarea required placeholder="Content..." value={content} onChange={e => setContent(e.target.value)} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
          <button type="submit" style={{ padding: '10px', background: '#38bdf8', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Publish Announcement</button>
        </form>
      </Card>
      
      <div>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16 }}>Active Announcements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {announcements.map((a: any) => (
            <Card key={a.id} style={{ position: 'relative' }}>
              <button onClick={() => handleDelete(a.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>❌</button>
              <h4 style={{ margin: '0 0 4px', color: '#38bdf8', fontSize: 16 }}>{a.title}</h4>
              <p style={{ margin: 0, color: '#cbd5e1', fontSize: 14 }}>{a.content}</p>
              <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>By {a.created_by} • {new Date(a.created_at).toLocaleString()}</div>
            </Card>
          ))}
          {announcements.length === 0 && <p style={{ color: '#64748b' }}>No active announcements.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Resources Tab ─────────────────────────────────────── */
function ResourcesTab({ resources, onRefresh }: any) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiCreateResource({ title, url, description: desc });
      setTitle(''); setUrl(''); setDesc(''); onRefresh();
    } catch (err: any) {
      alert(err.error || 'Failed to add resource');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remove resource?')) return;
    await apiDeleteResource(id);
    onRefresh();
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: 16 }}>
      <Card>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16 }}>📚 Add Resource (Link/Drive/PDF)</h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input required placeholder="Resource Title" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          <input required type="url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} style={inputStyle} />
          <input placeholder="Short Description (Optional)" value={desc} onChange={e => setDesc(e.target.value)} style={inputStyle} />
          <button type="submit" style={{ padding: '10px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Add Resource</button>
        </form>
      </Card>
      
      <div>
        <h3 style={{ margin: '0 0 16px', color: '#e2e8f0', fontSize: 16 }}>Shared Resources</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {resources.map((r: any) => (
            <Card key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
              <div>
                <h4 style={{ margin: '0 0 4px', color: '#10b981', fontSize: 16 }}>{r.title}</h4>
                {r.description && <p style={{ margin: '0 0 4px', color: '#94a3b8', fontSize: 13 }}>{r.description}</p>}
                <a href={r.url} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', fontSize: 13, textDecoration: 'none' }}>🔗 {r.url}</a>
              </div>
              <button onClick={() => handleDelete(r.id)} style={{ background: '#ef444430', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>🗑️ Delete</button>
            </Card>
          ))}
          {resources.length === 0 && <p style={{ color: '#64748b' }}>No resources available.</p>}
        </div>
      </div>
    </div>
  );
}

/* ── Shared Styles ─────────────────────────────────────── */
const tdStyle: React.CSSProperties = { padding: '8px 6px', fontSize: 13 };
const btnSmall: React.CSSProperties = {
  padding: '4px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
  fontSize: 12, background: 'rgba(124,58,237,0.2)', color: '#a78bfa',
};
const selectStyle: React.CSSProperties = {
  padding: '8px 10px', background: 'rgba(15,15,35,0.8)', border: '1px solid rgba(124,58,237,0.3)',
  borderRadius: 8, color: '#e2e8f0', fontSize: 12, outline: 'none', minWidth: 120,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 10px', background: 'rgba(15,15,35,0.8)',
  border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, color: '#e2e8f0',
  fontSize: 13, outline: 'none', boxSizing: 'border-box',
};
const labelStyle: React.CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 4, color: '#94a3b8', fontSize: 12, fontWeight: 600,
};
