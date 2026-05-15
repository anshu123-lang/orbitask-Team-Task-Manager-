// ============================================================
// app.js — Full application logic
// ============================================================

let currentUser = null;
let currentProjectId = null;
let currentProject = null;
let currentTaskId = null;
let allUsers = [];
let editingProjectId = null;
let editingTaskId = null;

// ── INIT ──────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  api.loadToken();
  const saved = localStorage.getItem('user');
  if (api.token && saved) {
    currentUser = JSON.parse(saved);
    showApp();
  } else {
    showAuth();
  }
});

// ── AUTH ──────────────────────────────────────────────────
function showAuth() {
  document.getElementById('auth-page').classList.add('active');
  document.getElementById('app-page').classList.remove('active');
}

function showApp() {
  document.getElementById('auth-page').classList.remove('active');
  document.getElementById('app-page').classList.add('active');
  initApp();
}

function switchAuthTab(tab) {
  document.getElementById('login-form').classList.toggle('active', tab === 'login');
  document.getElementById('signup-form').classList.toggle('active', tab === 'signup');
  document.getElementById('login-tab').classList.toggle('active', tab === 'login');
  document.getElementById('signup-tab').classList.toggle('active', tab === 'signup');
  const ind = document.getElementById('tab-indicator');
  ind.classList.toggle('right', tab === 'signup');
}

function togglePassword(id) {
  const el = document.getElementById(id);
  el.type = el.type === 'password' ? 'text' : 'password';
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Authenticating…';
  try {
    const res = await api.login(
      document.getElementById('login-email').value,
      document.getElementById('login-password').value
    );
    api.setToken(res.token);
    currentUser = { id: res.userId, name: res.name, email: res.email, role: res.role };
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials';
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Launch Mission';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.textContent = '';
  btn.disabled = true;
  btn.querySelector('span').textContent = 'Creating Account…';
  try {
    const res = await api.signup(
      document.getElementById('signup-name').value,
      document.getElementById('signup-email').value,
      document.getElementById('signup-password').value
    );
    api.setToken(res.token);
    currentUser = { id: res.userId, name: res.name, email: res.email, role: res.role };
    localStorage.setItem('user', JSON.stringify(currentUser));
    showApp();
  } catch (err) {
    errEl.textContent = err.message || 'Signup failed';
  } finally {
    btn.disabled = false;
    btn.querySelector('span').textContent = 'Join the Mission';
  }
}

function logout() {
  api.clearToken();
  currentUser = null;
  currentProjectId = null;
  document.getElementById('app-page').classList.remove('active');
  document.getElementById('auth-page').classList.add('active');
  toast('Logged out successfully', 'info');
}

// ── APP INIT ──────────────────────────────────────────────
function initApp() {
  // Sidebar user info
  document.getElementById('sidebar-name').textContent = currentUser.name;
  const roleEl = document.getElementById('sidebar-role');
  roleEl.textContent = currentUser.role;
  roleEl.className = 'user-role ' + currentUser.role;
  document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  // Show admin nav
  if (currentUser.role === 'ADMIN') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
  }

  // Greeting
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  document.getElementById('dashboard-greeting').textContent = `${greet}, ${currentUser.name.split(' ')[0]} 👋`;

  navigate('dashboard');
}

// ── NAVIGATION ────────────────────────────────────────────
function navigate(page) {
  document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pg = document.getElementById('page-' + page);
  if (pg) pg.classList.add('active');
  const nav = document.querySelector(`[data-page="${page}"]`);
  if (nav) nav.classList.add('active');

  if (page === 'dashboard') loadDashboard();
  else if (page === 'projects') loadProjects();
  else if (page === 'admin') loadAdmin();
}

function navigateToProject(id) {
  currentProjectId = id;
  document.querySelectorAll('.content-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = document.querySelector('[data-page="projects"]');
  if (nav) nav.classList.add('active');
  document.getElementById('page-project-detail').classList.add('active');
  loadProjectDetail(id);
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('collapsed');
}

// ── DASHBOARD ─────────────────────────────────────────────
async function loadDashboard() {
  try {
    const stats = await api.getDashboard();
    renderStats(stats);
    renderRecentTasks(stats.recentTasks || []);
    renderStatusChart(stats.tasksByStatus || {});
    renderDashboardProjects(stats.recentProjects || []);
  } catch (err) {
    toast('Failed to load dashboard', 'error');
  }
}

function renderStats(stats) {
  const cards = [
    { value: stats.totalProjects, label: 'Total Projects', icon: '◈', color: 'var(--cyan)' },
    { value: stats.activeTasks, label: 'Active Tasks', icon: '◉', color: 'var(--amber)' },
    { value: stats.overdueTasks, label: 'Overdue Tasks', icon: '⚠', color: 'var(--red)' },
    { value: stats.totalUsers, label: 'Team Members', icon: '◎', color: 'var(--purple)' },
  ];
  document.getElementById('stats-grid').innerHTML = cards.map(c => `
    <div class="stat-card" style="--stat-color:${c.color}">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-value">${c.value}</div>
      <div class="stat-label">${c.label}</div>
    </div>
  `).join('');
}

function renderRecentTasks(tasks) {
  const el = document.getElementById('recent-tasks-list');
  if (!tasks.length) { el.innerHTML = emptyState('No tasks assigned yet'); return; }
  el.innerHTML = tasks.slice(0, 6).map(t => `
    <div class="task-mini-item" onclick="openTaskDetailFromDash(${t.projectId}, ${t.id})">
      <span class="badge badge-${t.priority}">${t.priority}</span>
      <span class="task-mini-title">${esc(t.title)}</span>
      <span class="task-mini-project">${esc(t.projectName || '')}</span>
      <span class="badge badge-${t.status}">${fmtStatus(t.status)}</span>
    </div>
  `).join('');
}

function renderStatusChart(byStatus) {
  const colors = { TODO: '#6b7280', IN_PROGRESS: '#f59e0b', IN_REVIEW: '#a855f7', DONE: '#10b981' };
  const labels = { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' };
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(colors);

  // Build SVG donut
  let offset = 0;
  const r = 60, cx = 80, cy = 80, stroke = 22;
  const circumference = 2 * Math.PI * r;
  let segments = '';

  entries.forEach(([key, color]) => {
    const val = byStatus[key] || 0;
    const pct = val / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    segments += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}"
      stroke-width="${stroke}" stroke-dasharray="${dash} ${gap}"
      stroke-dashoffset="${-offset * circumference}"
      transform="rotate(-90 ${cx} ${cy})" opacity="0.85"/>`;
    offset += pct;
  });

  document.getElementById('status-chart').innerHTML = `
    <svg class="donut-chart-svg" width="160" height="160" viewBox="0 0 160 160">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="${stroke}"/>
      ${segments}
      <text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#e2eaf4" font-size="22" font-weight="800" font-family="Exo 2,sans-serif">${total}</text>
      <text x="${cx}" y="${cy + 14}" text-anchor="middle" fill="#8ca0bc" font-size="10" font-family="Nunito,sans-serif">TASKS</text>
    </svg>`;

  document.getElementById('status-legend').innerHTML = entries.map(([key, color]) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${color}"></span>
      <span class="legend-label">${labels[key]}</span>
      <span class="legend-count">${byStatus[key] || 0}</span>
    </div>`).join('');
}

function renderDashboardProjects(projects) {
  const el = document.getElementById('dashboard-projects');
  if (!projects.length) { el.innerHTML = emptyState('No projects yet'); return; }
  el.innerHTML = projects.slice(0, 6).map(p => {
    const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
    return `
      <div class="dash-project-item" onclick="navigateToProject(${p.id})">
        <div class="dash-project-name">${esc(p.name)}</div>
        <div class="dash-project-progress"><div class="dash-project-bar" style="width:${pct}%"></div></div>
        <div class="dash-project-stats">${p.completedTasks}/${p.totalTasks} tasks · ${pct}% done</div>
      </div>`;
  }).join('');
}

async function openTaskDetailFromDash(projectId, taskId) {
  currentProjectId = projectId;
  navigateToProject(projectId);
  setTimeout(() => openTaskDetail(taskId), 600);
}

// ── PROJECTS ──────────────────────────────────────────────
async function loadProjects() {
  document.getElementById('projects-grid').innerHTML = '<div class="loading-placeholder">Loading projects...</div>';
  try {
    const projects = await api.getProjects();
    renderProjectsGrid(projects);
  } catch (err) {
    toast('Failed to load projects', 'error');
  }
}

function renderProjectsGrid(projects) {
  const el = document.getElementById('projects-grid');
  if (!projects.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">◈</div><p>No projects yet. Create your first mission!</p></div>`;
    return;
  }
  el.innerHTML = projects.map(p => {
    const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
    const avatars = (p.members || []).slice(0, 4).map(m =>
      `<div class="member-av" title="${esc(m.name)}">${m.name.charAt(0).toUpperCase()}</div>`
    ).join('');
    return `
      <div class="project-card" onclick="navigateToProject(${p.id})">
        <div class="project-card-header">
          <div class="project-card-name">${esc(p.name)}</div>
          <span class="badge badge-${p.status.toLowerCase()}">${p.status}</span>
        </div>
        <div class="project-card-desc">${esc(p.description || 'No description provided.')}</div>
        <div class="project-progress"><div class="project-progress-fill" style="width:${pct}%"></div></div>
        <div class="project-meta">
          <span class="project-task-count">◉ ${p.totalTasks} tasks · ${pct}% done</span>
          <div class="member-avatars">${avatars}</div>
        </div>
        <div class="project-card-actions" onclick="event.stopPropagation()">
          <button class="btn-secondary" style="font-size:0.78rem;padding:6px 12px" onclick="openEditProjectModal(${p.id}, event)">Edit</button>
          <button class="btn-icon danger" onclick="confirmDeleteProject(${p.id}, event)">🗑</button>
        </div>
      </div>`;
  }).join('');
}

// ── PROJECT DETAIL ─────────────────────────────────────────
async function loadProjectDetail(id) {
  document.getElementById('project-detail-name').textContent = 'Loading…';
  document.getElementById('project-detail-desc').textContent = '';
  document.getElementById('kanban-board').style.opacity = '0.5';
  try {
    currentProject = await api.getProject(id);
    const tasks = await api.getTasks(id);
    renderProjectHeader(currentProject);
    renderKanban(tasks);
    document.getElementById('kanban-board').style.opacity = '1';
  } catch (err) {
    toast('Failed to load project', 'error');
  }
}

function renderProjectHeader(p) {
  document.getElementById('project-detail-name').textContent = p.name;
  document.getElementById('project-detail-desc').textContent = p.description || '';

  const avatars = (p.members || []).slice(0, 5).map(m =>
    `<div class="member-av" title="${esc(m.name)}">${m.name.charAt(0).toUpperCase()}</div>`
  ).join('');

  document.getElementById('project-meta-bar').innerHTML = `
    <div class="meta-item"><span class="badge badge-${p.status.toLowerCase()}">${p.status}</span></div>
    <div class="meta-sep"></div>
    <div class="meta-item">◈ Owner: <strong>${esc(p.owner?.name || '—')}</strong></div>
    <div class="meta-sep"></div>
    <div class="meta-item">◉ ${p.totalTasks} Tasks</div>
    <div class="meta-sep"></div>
    <div class="meta-item">✓ ${p.completedTasks} Done</div>
    <div class="meta-sep"></div>
    <div class="meta-item">Team: <div class="member-avatars" style="margin-left:6px">${avatars}</div></div>
  `;
}

function renderKanban(tasks) {
  const cols = { TODO: [], IN_PROGRESS: [], IN_REVIEW: [], DONE: [] };
  tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

  Object.entries(cols).forEach(([status, items]) => {
    document.getElementById('count-' + status).textContent = items.length;
    document.getElementById('cards-' + status).innerHTML = items.length
      ? items.map(t => renderTaskCard(t)).join('')
      : `<div style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:20px;opacity:0.5">Drop tasks here</div>`;
  });
}

function renderTaskCard(t) {
  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE';
  const dueText = t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
  return `
    <div class="task-card" draggable="true" id="task-${t.id}"
      ondragstart="dragStart(event, ${t.id})"
      ondragend="dragEnd(event)"
      onclick="openTaskDetail(${t.id})">
      <div class="task-card-title">${esc(t.title)}</div>
      <div class="task-card-meta">
        <span class="badge badge-${t.priority}">${t.priority}</span>
        ${isOverdue ? '<span class="badge badge-overdue">OVERDUE</span>' : ''}
      </div>
      <div class="task-card-footer">
        <div class="assignee-chip">
          ${t.assignee ? `<div class="av">${t.assignee.name.charAt(0).toUpperCase()}</div><span>${esc(t.assignee.name.split(' ')[0])}</span>` : '<span style="color:var(--text-muted)">Unassigned</span>'}
        </div>
        ${dueText ? `<div class="due-chip ${isOverdue ? 'overdue' : ''}">📅 ${dueText}</div>` : ''}
      </div>
    </div>`;
}

// ── DRAG & DROP ───────────────────────────────────────────
let draggedTaskId = null;

function dragStart(e, taskId) {
  draggedTaskId = taskId;
  document.getElementById('task-' + taskId).classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}
function dragEnd(e) {
  if (draggedTaskId) document.getElementById('task-' + draggedTaskId)?.classList.remove('dragging');
}
function allowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
async function drop(e, newStatus) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  if (!draggedTaskId) return;
  try {
    await api.updateTaskStatus(draggedTaskId, newStatus);
    loadProjectDetail(currentProjectId);
    toast('Task moved to ' + fmtStatus(newStatus), 'success');
  } catch (err) {
    toast('Failed to update task', 'error');
  }
  draggedTaskId = null;
}

// Remove drag-over on dragleave
document.addEventListener('dragleave', e => {
  if (e.target.classList?.contains('kanban-cards')) e.target.classList.remove('drag-over');
});

// ── TASK DETAIL MODAL ─────────────────────────────────────
async function openTaskDetail(taskId) {
  currentTaskId = taskId;
  const tasks = await api.getTasks(currentProjectId);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById('task-detail-title').textContent = task.title;
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  document.getElementById('task-detail-body').innerHTML = `
    <div class="task-detail-grid">
      <div>
        <div class="task-detail-desc">${esc(task.description || 'No description provided.')}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span class="badge badge-${task.status}">${fmtStatus(task.status)}</span>
          <span class="badge badge-${task.priority}">${task.priority}</span>
          ${isOverdue ? '<span class="badge badge-overdue">OVERDUE</span>' : ''}
        </div>
      </div>
      <div class="task-detail-meta">
        <div class="meta-row"><label>Assignee</label><span>${task.assignee ? esc(task.assignee.name) : 'Unassigned'}</span></div>
        <div class="meta-row"><label>Due Date</label><span>${task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '—'}</span></div>
        <div class="meta-row"><label>Created by</label><span>${esc(task.creator?.name || '—')}</span></div>
        <div class="meta-row"><label>Created</label><span>${task.createdAt ? new Date(task.createdAt).toLocaleDateString() : '—'}</span></div>
      </div>
    </div>`;

  openModal('modal-task-detail');
}

function editCurrentTask() {
  closeModal('modal-task-detail');
  openEditTaskModal(currentTaskId);
}

async function deleteCurrentTask() {
  if (!confirm('Delete this task?')) return;
  try {
    await api.deleteTask(currentTaskId);
    closeModal('modal-task-detail');
    loadProjectDetail(currentProjectId);
    toast('Task deleted', 'success');
  } catch (err) {
    toast('Failed to delete task', 'error');
  }
}

// ── PROJECT MODALS ────────────────────────────────────────
function openCreateProjectModal() {
  editingProjectId = null;
  document.getElementById('project-modal-title').textContent = 'New Project';
  document.getElementById('project-name-input').value = '';
  document.getElementById('project-desc-input').value = '';
  document.getElementById('project-status-input').value = 'ACTIVE';
  openModal('modal-project');
}

async function openEditProjectModal(id, e) {
  if (e) e.stopPropagation();
  editingProjectId = id;
  try {
    const p = await api.getProject(id);
    document.getElementById('project-modal-title').textContent = 'Edit Project';
    document.getElementById('project-name-input').value = p.name;
    document.getElementById('project-desc-input').value = p.description || '';
    document.getElementById('project-status-input').value = p.status;
    openModal('modal-project');
  } catch (err) {
    toast('Failed to load project', 'error');
  }
}

async function handleSaveProject(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('project-name-input').value,
    description: document.getElementById('project-desc-input').value,
    status: document.getElementById('project-status-input').value,
  };
  try {
    if (editingProjectId) {
      await api.updateProject(editingProjectId, data);
      toast('Project updated!', 'success');
    } else {
      await api.createProject(data);
      toast('Project created!', 'success');
    }
    closeModal('modal-project');
    loadProjects();
  } catch (err) {
    toast(err.message || 'Failed to save project', 'error');
  }
}

async function confirmDeleteProject(id, e) {
  if (e) e.stopPropagation();
  if (!confirm('Delete this project and all its tasks?')) return;
  try {
    await api.deleteProject(id);
    toast('Project deleted', 'success');
    loadProjects();
  } catch (err) {
    toast('Failed to delete project', 'error');
  }
}

// ── TASK MODALS ───────────────────────────────────────────
async function openCreateTaskModal() {
  editingTaskId = null;
  document.getElementById('task-modal-title').textContent = 'New Task';
  document.getElementById('task-title-input').value = '';
  document.getElementById('task-desc-input').value = '';
  document.getElementById('task-status-input').value = 'TODO';
  document.getElementById('task-priority-input').value = 'MEDIUM';
  document.getElementById('task-due-input').value = '';
  await populateAssignees();
  openModal('modal-task');
}

async function openEditTaskModal(taskId) {
  editingTaskId = taskId;
  const tasks = await api.getTasks(currentProjectId);
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;
  document.getElementById('task-modal-title').textContent = 'Edit Task';
  document.getElementById('task-title-input').value = task.title;
  document.getElementById('task-desc-input').value = task.description || '';
  document.getElementById('task-status-input').value = task.status;
  document.getElementById('task-priority-input').value = task.priority;
  document.getElementById('task-due-input').value = task.dueDate || '';
  await populateAssignees(task.assignee?.id);
  openModal('modal-task');
}

async function populateAssignees(selectedId) {
  try {
    allUsers = await api.getUsers();
    const sel = document.getElementById('task-assignee-input');
    sel.innerHTML = '<option value="">Unassigned</option>' +
      allUsers.map(u => `<option value="${u.id}" ${u.id == selectedId ? 'selected' : ''}>${esc(u.name)}</option>`).join('');
  } catch (e) {}
}

async function handleSaveTask(e) {
  e.preventDefault();
  const dueVal = document.getElementById('task-due-input').value;
  const data = {
    title: document.getElementById('task-title-input').value,
    description: document.getElementById('task-desc-input').value,
    status: document.getElementById('task-status-input').value,
    priority: document.getElementById('task-priority-input').value,
    dueDate: dueVal || null,
    assigneeId: document.getElementById('task-assignee-input').value
      ? parseInt(document.getElementById('task-assignee-input').value) : null,
  };
  try {
    if (editingTaskId) {
      await api.updateTask(editingTaskId, data);
      toast('Task updated!', 'success');
    } else {
      await api.createTask(currentProjectId, data);
      toast('Task created!', 'success');
    }
    closeModal('modal-task');
    loadProjectDetail(currentProjectId);
  } catch (err) {
    toast(err.message || 'Failed to save task', 'error');
  }
}

// ── MEMBER MODAL ──────────────────────────────────────────
async function openAddMemberModal() {
  try {
    allUsers = await api.getUsers();
    const members = currentProject?.members || [];
    const memberIds = new Set(members.map(m => m.userId));
    const nonMembers = allUsers.filter(u => !memberIds.has(u.id));
    const sel = document.getElementById('member-user-select');
    sel.innerHTML = '<option value="">Choose a user...</option>' +
      nonMembers.map(u => `<option value="${u.id}">${esc(u.name)} (${u.email})</option>`).join('');
    openModal('modal-member');
  } catch (err) {
    toast('Failed to load users', 'error');
  }
}

async function handleAddMember() {
  const userId = parseInt(document.getElementById('member-user-select').value);
  if (!userId) { toast('Please select a user', 'error'); return; }
  try {
    await api.addMember(currentProjectId, userId);
    closeModal('modal-member');
    loadProjectDetail(currentProjectId);
    toast('Member added!', 'success');
  } catch (err) {
    toast(err.message || 'Failed to add member', 'error');
  }
}

// ── ADMIN ─────────────────────────────────────────────────
async function loadAdmin() {
  document.getElementById('users-table-container').innerHTML = '<div class="loading-placeholder">Loading users...</div>';
  try {
    const users = await api.getUsers();
    renderUsersTable(users);
  } catch (err) {
    toast('Failed to load users', 'error');
  }
}

function renderUsersTable(users) {
  document.getElementById('users-table-container').innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="user-avatar" style="width:28px;height:28px;font-size:0.75rem">${u.name.charAt(0).toUpperCase()}</div>
                ${esc(u.name)}
              </div>
            </td>
            <td style="color:var(--text-secondary)">${esc(u.email)}</td>
            <td><span class="badge badge-${u.role}">${u.role}</span></td>
            <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
            <td>
              <div style="display:flex;gap:6px">
                ${u.id !== currentUser.id ? `
                  <button class="btn-secondary" style="font-size:0.75rem;padding:5px 10px"
                    onclick="toggleRole(${u.id},'${u.role}')">
                    ${u.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                  </button>
                  <button class="btn-icon danger" onclick="confirmDeleteUser(${u.id})">🗑</button>
                ` : '<span style="color:var(--text-muted);font-size:0.8rem">You</span>'}
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

async function toggleRole(id, currentRole) {
  const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN';
  try {
    await api.updateUserRole(id, newRole);
    loadAdmin();
    toast(`Role updated to ${newRole}`, 'success');
  } catch (err) {
    toast('Failed to update role', 'error');
  }
}

async function confirmDeleteUser(id) {
  if (!confirm('Delete this user?')) return;
  try {
    await api.deleteUser(id);
    loadAdmin();
    toast('User deleted', 'success');
  } catch (err) {
    toast(err.message || 'Failed to delete user', 'error');
  }
}

// ── MODAL HELPERS ─────────────────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// ── TOAST ─────────────────────────────────────────────────
function toast(msg, type = 'info') {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${esc(msg)}</span>`;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(20px)'; el.style.transition = '0.3s'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── UTILS ─────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtStatus(s) {
  return { TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done' }[s] || s;
}

function emptyState(msg) {
  return `<div class="empty-state"><div class="empty-icon">◎</div><p>${msg}</p></div>`;
}

// Close modals on ESC
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
});
