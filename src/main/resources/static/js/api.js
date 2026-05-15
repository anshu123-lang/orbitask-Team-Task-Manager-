// ============================================================
// api.js — Centralized API client
// ============================================================
const API_BASE = '/api';

const api = {
  token: null,

  setToken(t) { this.token = t; localStorage.setItem('jwt', t); },
  clearToken() { this.token = null; localStorage.removeItem('jwt'); localStorage.removeItem('user'); },
  loadToken() { this.token = localStorage.getItem('jwt'); return this.token; },

  headers() {
    const h = { 'Content-Type': 'application/json' };
    if (this.token) h['Authorization'] = 'Bearer ' + this.token;
    return h;
  },

  async request(method, path, body) {
    const opts = { method, headers: this.headers() };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(API_BASE + path, opts);
    if (res.status === 204) return null;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  },

  get(path)         { return this.request('GET', path); },
  post(path, body)  { return this.request('POST', path, body); },
  put(path, body)   { return this.request('PUT', path, body); },
  patch(path, body) { return this.request('PATCH', path, body); },
  delete(path)      { return this.request('DELETE', path); },

  // Auth
  login(email, password)       { return this.post('/auth/login',  { email, password }); },
  signup(name, email, password){ return this.post('/auth/signup', { name, email, password }); },

  // Dashboard
  getDashboard() { return this.get('/dashboard/stats'); },

  // Projects
  getProjects()              { return this.get('/projects'); },
  getProject(id)             { return this.get(`/projects/${id}`); },
  createProject(data)        { return this.post('/projects', data); },
  updateProject(id, data)    { return this.put(`/projects/${id}`, data); },
  deleteProject(id)          { return this.delete(`/projects/${id}`); },
  addMember(pid, userId)     { return this.post(`/projects/${pid}/members`, { userId }); },
  removeMember(pid, uid)     { return this.delete(`/projects/${pid}/members/${uid}`); },

  // Tasks
  getTasks(projectId)        { return this.get(`/projects/${projectId}/tasks`); },
  createTask(projectId, data){ return this.post(`/projects/${projectId}/tasks`, data); },
  updateTask(id, data)       { return this.put(`/tasks/${id}`, data); },
  updateTaskStatus(id, status){ return this.patch(`/tasks/${id}/status`, { status }); },
  deleteTask(id)             { return this.delete(`/tasks/${id}`); },

  // Users
  getUsers()                 { return this.get('/users'); },
  getMe()                    { return this.get('/users/me'); },
  updateUserRole(id, role)   { return this.patch(`/users/${id}/role`, { role }); },
  deleteUser(id)             { return this.delete(`/users/${id}`); },
};
