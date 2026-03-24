/**
 * API service for Campus Hive frontend.
 * - Render.com: Set VITE_API_URL env var to backend URL
 * - Docker: Uses /api (nginx proxies to backend container)
 * - Local dev: Uses http://localhost:8000/api
 */

function getApiBase(): string {
  // 1. Check for explicit env var (set in Render dashboard)
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl) return envUrl;
  // 2. Local development
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8000/api";
  }
  // 3. Docker or same-origin production
  return "/api";
}

const API_BASE = getApiBase();

function getToken(): string | null {
  return localStorage.getItem("ch_token");
}

function setToken(token: string) {
  localStorage.setItem("ch_token", token);
}

function clearToken() {
  localStorage.removeItem("ch_token");
  localStorage.removeItem("ch_user");
}

function getStoredUser() {
  const u = localStorage.getItem("ch_user");
  return u ? JSON.parse(u) : null;
}

function setStoredUser(user: any) {
  localStorage.setItem("ch_user", JSON.stringify(user));
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };
  
  // Only append application/json if we are not sending FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw { status: res.status, ...data };
  }
  return data;
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function apiSignup(name: string, email: string, password: string, extra?: Record<string, any>) {
  const data = await apiFetch("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password, ...extra }),
  });
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setToken(data.access_token);
  setStoredUser(data.user);
  return data;
}

export async function apiGetMe() {
  return apiFetch("/auth/me");
}

export async function apiUpdateProfile(updates: Record<string, any>) {
  return apiFetch("/auth/me/update", {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export function apiLogout() {
  clearToken();
}

export { getToken, getStoredUser, setStoredUser };

// ── Groups ──────────────────────────────────────────────────────────────────

export async function apiListGroups(type?: string) {
  const query = type ? `?type=${type}` : "";
  return apiFetch(`/groups/${query}`);
}

export async function apiCreateGroup(data: Record<string, any>) {
  return apiFetch("/groups/create", { method: "POST", body: JSON.stringify(data) });
}

export async function apiGetGroup(id: number) {
  return apiFetch(`/groups/${id}`);
}

export async function apiUpdateGroup(id: number, data: Record<string, any>) {
  return apiFetch(`/groups/${id}/update`, { method: "PUT", body: JSON.stringify(data) });
}

export async function apiDeleteGroup(id: number) {
  return apiFetch(`/groups/${id}/delete`, { method: "DELETE" });
}

// ── Polls ────────────────────────────────────────────────────────────────────

export async function apiListPolls(groupId: number) {
  return apiFetch(`/polls/group/${groupId}`);
}

export async function apiCreatePoll(data: Record<string, any>) {
  return apiFetch("/polls/", { method: "POST", body: JSON.stringify(data) });
}

export async function apiGetPoll(pollId: number) {
  return apiFetch(`/polls/${pollId}`);
}

export async function apiVoteOnPoll(pollId: number, optionId: number, reason: string) {
  return apiFetch(`/polls/${pollId}/vote`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId, reason }),
  });
}

// ── Events ──────────────────────────────────────────────────────────────────

export async function apiListEvents(groupId: number) {
  return apiFetch(`/events/group/${groupId}`);
}

export async function apiCreateEvent(data: Record<string, any>) {
  return apiFetch("/events/", { method: "POST", body: JSON.stringify(data) });
}

export async function apiGetEvent(eventId: number) {
  return apiFetch(`/events/${eventId}`);
}

export async function apiAddTask(eventId: number, data: Record<string, any>) {
  return apiFetch(`/events/${eventId}/tasks`, { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateTaskStatus(taskId: number, status: string, assignedTo?: number) {
  return apiFetch(`/events/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status, assigned_to: assignedTo }),
  });
}

// ── Vibe Matcher ────────────────────────────────────────────────────────────

export async function apiVibeMatches() {
  return apiFetch("/vibe/matches");
}

export async function apiVibeScore() {
  return apiFetch("/vibe/score");
}

export async function apiUpdateTags(tags: string[]) {
  return apiFetch("/vibe/tags", {
    method: "POST",
    body: JSON.stringify({ tags }),
  });
}

// ── Incidents ───────────────────────────────────────────────────────────────

export async function apiReportIncident(data: Record<string, any>) {
  return apiFetch("/incidents/report", { method: "POST", body: JSON.stringify(data) });
}

export async function apiListIncidents(status?: string) {
  const query = status ? `?status=${status}` : "";
  return apiFetch(`/incidents/${query}`);
}

export async function apiUpdateIncidentStatus(id: number, status: string) {
  return apiFetch(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

// ── Admin Dashboard API ─────────────────────────────────────────────────────

export async function apiAdminStats() {
  return apiFetch("/admin-api/stats");
}

export async function apiAdminListUsers(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters || {});
  const query = params.toString() ? `?${params}` : "";
  return apiFetch(`/admin-api/users${query}`);
}

export async function apiAdminUpdateUser(userId: number, data: Record<string, any>) {
  return apiFetch(`/admin-api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiAdminDeleteUser(userId: number) {
  return apiFetch(`/admin-api/users/${userId}/delete`, { method: "DELETE" });
}

export async function apiAdminLogs(action?: string, limit?: number) {
  const params = new URLSearchParams();
  if (action) params.set("action", action);
  if (limit) params.set("limit", String(limit));
  const query = params.toString() ? `?${params}` : "";
  return apiFetch(`/admin-api/logs${query}`);
}

export async function apiAdminIncidents(filters?: Record<string, string>) {
  const params = new URLSearchParams(filters || {});
  const query = params.toString() ? `?${params}` : "";
  return apiFetch(`/admin-api/incidents${query}`);
}

export async function apiAdminUpdateIncident(incidentId: number, data: Record<string, any>) {
  return apiFetch(`/admin-api/incidents/${incidentId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function apiAdminDbHealth() {
  return apiFetch("/admin-api/db-health");
}

// ── Phase 8: Extended Admin & Notifications ─────────────────────────────────

export async function apiAdminUploadCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return apiFetch("/admin-api/upload-users", {
    method: "POST",
    body: formData,
  });
}

export async function apiGetAnnouncements() {
  return apiFetch("/announcements/");
}

export async function apiCreateAnnouncement(data: { title: string; content: string }) {
  return apiFetch("/announcements/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteAnnouncement(id: number) {
  return apiFetch(`/announcements/${id}`, { method: "DELETE" });
}

export async function apiGetResources() {
  return apiFetch("/resources/");
}

export async function apiCreateResource(data: { title: string; description?: string; url: string }) {
  return apiFetch("/resources/", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteResource(id: number) {
  return apiFetch(`/resources/${id}`, { method: "DELETE" });
}

export async function apiAdminCreateEvent(data: Record<string, any>) {
  return apiFetch("/admin-api/create-event", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiAdminCreateGroup(data: Record<string, any>) {
  return apiFetch("/admin-api/create-group", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiAdminCreatePoll(data: Record<string, any>) {
  return apiFetch("/admin-api/create-poll", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
