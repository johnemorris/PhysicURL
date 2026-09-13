import { useState, useEffect } from 'react';
import './AdminDashboard.scss';

const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

export default function AdminDashboard() {
  const [token, setToken] = useState(null);
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
  const [csrfToken, setCsrfToken] = useState('');

  const fetchCsrfToken = async () => {
    try {
      const r = await fetch(`${API}/api/csrf-token`, { credentials: 'include' });
      const j = await r.json();
      setCsrfToken(j.csrf_token);
    } catch {}
  };

  const authFetch = async (path, opts = {}) => {
    const headers = { ...(opts.headers || {}) };
    if (opts.body && typeof opts.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(opts.body);
    }
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
    const r = await fetch(`${API}${path}`, { ...opts, headers, credentials: 'include' });
    if (r.status === 401) {
      logout();
      throw new Error('session expired');
    }
    if (r.status === 403) {
      await fetchCsrfToken();
      throw new Error('CSRF token expired, retrying...');
    }
    return r.json();
  };

  const login = async (e) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const r = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include',
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'login failed');
      setToken(j.token);
      await fetchCsrfToken();
    } catch (err) {
      setLoginErr(err.message);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/api/admin/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    setToken(null);
    setCsrfToken('');
  };

  const loadStats = async () => {
    try {
      const r = await fetch(`${API}/api/stats`);
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
    loadStats();
    // Check if we have a valid session via cookie
    fetch(`${API}/api/admin/submissions`, { credentials: 'include' })
      .then(r => {
        if (r.ok) {
          setToken('cookie');
          fetchCsrfToken();
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!token) return;
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
      await loadStats();
      if (tab === 'resources') await loadResources();
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
          <div className="stat"><div className="stat-num">{stats.active}</div><div className="stat-label">Active</div></div>
          <div className="stat"><div className="stat-num">{stats.under_review}</div><div className="stat-label">Under Review</div></div>
          <div className="stat"><div className="stat-num">{stats.confirmed_broken}</div><div className="stat-label">Confirmed Broken</div></div>
          <div className="stat"><div className="stat-num">{stats.health_checked}</div><div className="stat-label">Health Checked</div></div>
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
                      <div className="row-title">
                        {r.name}
                        {r.verified && <span className="status-pill verified">✓</span>}
                        {r.health?.reviewState && r.health.reviewState !== 'active' && (
                          <span className={`status-pill health-${r.health.reviewState}`}>
                            {r.health.reviewState.replaceAll('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="row-meta">{r.science} · {r.subdiscipline} · <a href={r.url} target="_blank">{r.url}</a></div>
                      {r.health?.lastCheck && (
                        <div className="row-meta">
                          Last check: {r.health.lastCheck.status} · {r.health.lastCheck.reason.replaceAll('_', ' ')}
                          {r.health.lastCheck.httpStatus && ` · HTTP ${r.health.lastCheck.httpStatus}`}
                        </div>
                      )}
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
        <div className="admin-panel health-check-panel">
          <h3>URL Health Check</h3>
          <p className="health-check-description">Checks the first 100 resource URLs with safe redirects and GET confirmation when HEAD is inconclusive.</p>
          <div className="row-actions">
            <button onClick={runHealth} disabled={busy || health?.running} className="btn-primary">
              {health?.running ? 'Checking…' : 'Run health check'}
            </button>
          </div>
          {health && !health.running && (
            <div className="health-check-results">
              {health.error ? (
                <div className="health-check-error">{health.error}</div>
              ) : (
                <div className="health-check-summary">
                  Checked {health.checked} URLs: {health.summary?.healthy ?? 0} healthy,{' '}
                  {health.summary?.suspicious ?? 0} suspicious, {health.summary?.unreachable ?? 0} unreachable.
                </div>
              )}
              <div className="health-check-list">
                {(health.results || []).map((r, i) => (
                  <div key={i} className={`health-check-result status-${r.status}`}>
                    [{r.status}] {r.requestedUrl} · {r.reason.replaceAll('_', ' ')}
                    {r.httpStatus && ` · HTTP ${r.httpStatus}`} · {r.reviewState.replaceAll('_', ' ')}
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
