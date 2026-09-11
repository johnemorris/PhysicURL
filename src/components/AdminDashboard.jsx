import { useState, useEffect } from 'react';

const API = '__PORT_5000__';

// In-memory auth (preview iframe blocks browser storage APIs).
const AUTH = {
  get() { return (typeof window !== 'undefined' && window.__PHY_TOK) || null; },
  set(v) { if (typeof window !== 'undefined') window.__PHY_TOK = v; },
  clear() { if (typeof window !== 'undefined') delete window.__PHY_TOK; },
};

export default function AdminDashboard() {
  const [token, setToken] = useState(typeof window !== 'undefined' ? AUTH.get() : null);
  const [password, setPassword] = useState('');
  const [loginErr, setLoginErr] = useState('');
  const [tab, setTab] = useState('submissions');
  const [submissions, setSubmissions] = useState([]);
  const [resources, setResources] = useState([]);
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [busy, setBusy] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkMsg, setBulkMsg] = useState('');
  const [editingIdx, setEditingIdx] = useState(-1);
  const [editForm, setEditForm] = useState(null);

  const authFetch = async (path, opts = {}) => {
    const headers = { ...(opts.headers || {}), 'x-admin-token': token };
    if (opts.body && typeof opts.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    const r = await fetch(API + path, { ...opts, headers });
    if (r.status === 401) {
      logout();
      throw new Error('session expired');
    }
    return r.json();
  };

  const login = async (e) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const r = await fetch(API + '/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'login failed');
      AUTH.set(j.token);
      setToken(j.token);
    } catch (err) {
      setLoginErr(err.message);
    }
  };

  const logout = () => {
    AUTH.clear();
    setToken(null);
  };

  const loadStats = async () => {
    try {
      const r = await fetch(API + '/api/stats');
      setStats(await r.json());
    } catch {}
  };

  const loadSubmissions = async () => {
    try {
      const j = await authFetch('/api/admin/submissions');
      setSubmissions(j.submissions || []);
    } catch {}
  };

  const loadResources = async () => {
    try {
      const j = await authFetch('/api/admin/resources');
      setResources(j.resources || []);
    } catch {}
  };

  useEffect(() => {
    if (!token) return;
    loadStats();
    if (tab === 'submissions') loadSubmissions();
    if (tab === 'resources') loadResources();
  }, [token, tab]);

  const act = async (id, action) => {
    setBusy(true);
    try {
      await authFetch(`/api/admin/submissions/${id}`, { method: 'POST', body: { action } });
      await loadSubmissions();
      await loadStats();
    } finally {
      setBusy(false);
    }
  };

  const runBulk = async () => {
    setBulkMsg('');
    try {
      const items = JSON.parse(bulkText);
      if (!Array.isArray(items)) throw new Error('must be a JSON array');
      setBusy(true);
      const j = await authFetch('/api/admin/bulk-import', { method: 'POST', body: { items } });
      setBulkMsg(`Added ${j.added} resources.`);
      setBulkText('');
      await loadStats();
    } catch (err) {
      setBulkMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const runHealth = async () => {
    setHealth({ running: true });
    try {
      const j = await authFetch('/api/admin/health-check?limit=100', { method: 'POST' });
      setHealth({ running: false, ...j });
    } catch (err) {
      setHealth({ running: false, error: err.message });
    }
  };

  const startEdit = (idx) => {
    setEditingIdx(idx);
    setEditForm({ ...resources[idx] });
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await authFetch(`/api/admin/resources/${editingIdx}`, { method: 'PUT', body: editForm });
      await loadResources();
      setEditingIdx(-1);
      setEditForm(null);
    } finally {
      setBusy(false);
    }
  };

  const deleteResource = async (idx) => {
    if (!confirm('Delete this resource?')) return;
    setBusy(true);
    try {
      await authFetch(`/api/admin/resources/${idx}`, { method: 'DELETE' });
      await loadResources();
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <div className="admin-login">
        <form onSubmit={login}>
          <h2>Admin Login</h2>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} autoFocus />
          <button type="submit">Sign in</button>
          {loginErr && <div className="err">{loginErr}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="stat"><div className="stat-num">{stats.total_resources}</div><div className="stat-label">Total</div></div>
          <div className="stat"><div className="stat-num">{stats.verified}</div><div className="stat-label">Verified</div></div>
          <div className="stat"><div className="stat-num">{stats.under_review}</div><div className="stat-label">Under Review</div></div>
          <div className="stat"><div className="stat-num">{stats.pending_submissions}</div><div className="stat-label">Pending</div></div>
        </div>
      )}

      <div className="admin-tabs">
        {['submissions', 'resources', 'bulk-import', 'health-check'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === 'submissions' && (
        <div className="admin-panel">
          <h3>Submissions ({submissions.length})</h3>
          {submissions.length === 0 && <div className="empty">No submissions yet.</div>}
          {submissions.map(s => (
            <div key={s.id} className={`admin-row status-${s.status}`}>
              <div>
                <div className="row-title">{s.name} <span className="status-pill">{s.status}</span></div>
                <div className="row-meta">{s.science} · {s.subdiscipline} · <a href={s.url} target="_blank">{s.url}</a></div>
                {s.description && <div className="row-desc">{s.description}</div>}
                <div className="row-meta">Submitted {new Date(s.submitted_at).toLocaleDateString()} {s.submitter_email && `· ${s.submitter_email}`}</div>
              </div>
              {s.status === 'pending' && (
                <div className="row-actions">
                  <button disabled={busy} onClick={() => act(s.id, 'approve')} className="btn-primary">Approve</button>
                  <button disabled={busy} onClick={() => act(s.id, 'reject')} className="btn-secondary">Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'resources' && (
        <div className="admin-panel">
          <h3>Resources ({resources.length})</h3>
          <div className="resources-table">
            {resources.slice(0, 100).map((r, i) => (
              <div key={i} className="admin-row">
                {editingIdx === i ? (
                  <div style={{ flex: 1 }}>
                    <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} placeholder="Name" />
                    <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="URL" />
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={!!editForm.verified} onChange={e => setEditForm({ ...editForm, verified: e.target.checked })} /> Verified
                    </label>
                    <div className="row-actions">
                      <button onClick={saveEdit} disabled={busy} className="btn-primary">Save</button>
                      <button onClick={() => { setEditingIdx(-1); setEditForm(null); }} className="btn-secondary">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="row-title">{r.name} {r.verified && <span className="status-pill verified">✓</span>}</div>
                      <div className="row-meta">{r.science} · {r.subdiscipline} · <a href={r.url} target="_blank">{r.url}</a></div>
                    </div>
                    <div className="row-actions">
                      <button onClick={() => startEdit(i)} className="btn-secondary">Edit</button>
                      <button onClick={() => deleteResource(i)} className="btn-danger">Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {resources.length > 100 && <div className="empty">Showing first 100 of {resources.length}.</div>}
          </div>
        </div>
      )}

      {tab === 'bulk-import' && (
        <div className="admin-panel">
          <h3>Bulk Import</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Paste a JSON array. Required fields per item: <code>name</code>, <code>url</code>, <code>science</code>.</p>
          <textarea
            rows="14"
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder='[{"name":"Example","url":"https://example.com","description":"...","science":"Physics","subdiscipline":"Quantum Mechanics","access":"open","resource_type":"reference","tags":["quantum"],"verified":false}]'
            style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: 12 }}
          />
          <div className="row-actions">
            <button onClick={runBulk} disabled={busy || !bulkText} className="btn-primary">Import</button>
          </div>
          {bulkMsg && <div className="modal-msg">{bulkMsg}</div>}
        </div>
      )}

      {tab === 'health-check' && (
        <div className="admin-panel">
          <h3>URL Health Check</h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Runs HEAD requests against the first 100 resource URLs.</p>
          <div className="row-actions">
            <button onClick={runHealth} disabled={busy || health?.running} className="btn-primary">
              {health?.running ? 'Checking…' : 'Run health check'}
            </button>
          </div>
          {health && !health.running && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>Checked {health.checked} URLs.</div>
              <div style={{ maxHeight: 400, overflow: 'auto', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {(health.results || []).map((r, i) => (
                  <div key={i} style={{ color: r.ok ? 'var(--color-emerald)' : 'var(--color-amber)', padding: '2px 0' }}>
                    [{r.status || 'ERR'}] {r.url}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
