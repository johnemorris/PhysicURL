import { useState, useEffect } from 'react';
import './AdminDashboard.scss';

const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

function formatCheckDate(value) {
  if (!value) return 'date unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'date unavailable' : date.toLocaleDateString();
}

function latestCheckText(check) {
  if (!check) return 'Not checked';
  const label = check.status === 'healthy' ? '✓ Healthy' : check.status.replaceAll('_', ' ');
  return `${label}${check.httpStatus ? ` — HTTP ${check.httpStatus}` : ''} — ${formatCheckDate(check.checkedAt)}`;
}

function ReviewStatusSummary({ reviewState, reviewConcern, lastCheck }) {
  if (reviewState !== 'under_review') return null;
  const recovered = lastCheck?.status === 'healthy';
  return (
    <div className="review-status-summary">
      <div className="review-status-line">
        <span>Original concern</span>
        <strong>{reviewConcern?.summary || 'Prior concern retained for review'}</strong>
        <small>{formatCheckDate(reviewConcern?.observedAt)}</small>
      </div>
      <div className={`review-status-line latest-${lastCheck?.status || 'unknown'}`}>
        <span>Latest check</span>
        <strong>{latestCheckText(lastCheck)}</strong>
      </div>
      {recovered && <div className="manual-review-note">Manual reactivation required</div>}
    </div>
  );
}

function emptyResourceForm() {
  return {
    title: '',
    url: '',
    description: '',
    science: '',
    subdiscipline: '',
    resourceType: 'reference',
    access: 'free',
  };
}

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
  const [bulkPreview, setBulkPreview] = useState(null);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState(emptyResourceForm);
  const [createMsg, setCreateMsg] = useState('');
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
    if (token && token !== 'cookie') {
      headers['x-admin-token'] = token;
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
    const payload = await r.json().catch(() => ({ error: 'Invalid server response' }));
    if (!r.ok) throw new Error(payload.error || `Request failed (${r.status})`);
    return payload;
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
      const headers = token && token !== 'cookie' ? { 'x-admin-token': token } : undefined;
      await fetch(`${API}/api/admin/logout`, { method: 'POST', headers, credentials: 'include' });
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

  const previewBulk = async () => {
    setBulkMsg('');
    setBulkPreview(null);
    try {
      setBusy(true);
      const result = await authFetch('/api/admin/bulk-import/preview', { method: 'POST', body: { raw: bulkText } });
      setBulkPreview(result.preview);
      setBulkMsg(result.preview.canImport
        ? `${result.preview.ready} resources are ready for approval.`
        : `Resolve ${result.preview.invalid} invalid or duplicate rows before importing.`);
    } catch (err) {
      setBulkMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const approveBulk = async () => {
    if (!bulkPreview?.canImport) return;
    setBusy(true);
    try {
      const result = await authFetch('/api/admin/bulk-import', { method: 'POST', body: { items: bulkPreview.items } });
      setBulkMsg(`Added ${result.added} resources.`);
      setBulkText('');
      setBulkPreview(null);
      await loadStats();
    } catch (err) {
      setBulkMsg('Error: ' + err.message);
    } finally {
      setBusy(false);
    }
  };

  const loadBulkFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBulkText(await file.text());
    setBulkPreview(null);
    setBulkMsg('');
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
    const resource = resources[idx];
    setEditForm({
      ...resource,
      title: resource.title || resource.name || '',
      isVerified: resource.isVerified ?? resource.verified ?? false,
    });
  };

  const createResource = async (event) => {
    event.preventDefault();
    setBusy(true);
    setCreateMsg('');
    try {
      await authFetch('/api/admin/resources', { method: 'POST', body: createForm });
      setCreateForm(emptyResourceForm());
      setCreating(false);
      await loadResources();
      await loadStats();
    } catch (error) {
      setCreateMsg(`Error: ${error.message}`);
    } finally {
      setBusy(false);
    }
  };

  const setReviewState = async (idx, reviewState) => {
    setBusy(true);
    try {
      await authFetch(`/api/admin/resources/${idx}/review-state`, { method: 'POST', body: { reviewState } });
      await loadResources();
      await loadStats();
    } finally {
      setBusy(false);
    }
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
                <div className="row-meta">{s.science} · {s.subdiscipline} · <a href={s.url} target="_blank" rel="noopener">{s.url}</a></div>
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
          <div className="resource-panel-heading">
            <h3>Resources ({resources.length})</h3>
            <button
              className="btn-primary"
              onClick={() => { setCreating(!creating); setCreateMsg(''); }}
              disabled={busy}
            >
              {creating ? 'Cancel' : 'Add resource'}
            </button>
          </div>
          {creating && (
            <form className="resource-create-form" onSubmit={createResource}>
              <label>Title<input required value={createForm.title} onChange={event => setCreateForm({ ...createForm, title: event.target.value })} /></label>
              <label>URL<input required type="url" value={createForm.url} onChange={event => setCreateForm({ ...createForm, url: event.target.value })} /></label>
              <label>Science
                <select required value={createForm.science} onChange={event => setCreateForm({ ...createForm, science: event.target.value, subdiscipline: '' })}>
                  <option value="">Select science</option>
                  {[...new Set(resources.map(resource => resource.science))].sort().map(science => <option key={science} value={science}>{science}</option>)}
                </select>
              </label>
              <label>Subdiscipline
                <select required value={createForm.subdiscipline} onChange={event => setCreateForm({ ...createForm, subdiscipline: event.target.value })} disabled={!createForm.science}>
                  <option value="">Select subdiscipline</option>
                  {[...new Set(resources.filter(resource => resource.science === createForm.science).map(resource => resource.subdiscipline))].sort().map(subdiscipline => <option key={subdiscipline} value={subdiscipline}>{subdiscipline}</option>)}
                </select>
              </label>
              <label>Resource type
                <select value={createForm.resourceType} onChange={event => setCreateForm({ ...createForm, resourceType: event.target.value })}>
                  {[...new Set(resources.map(resource => resource.resourceType || resource.resource_type))].filter(Boolean).sort().map(resourceType => <option key={resourceType} value={resourceType}>{resourceType}</option>)}
                </select>
              </label>
              <label>Access
                <select value={createForm.access} onChange={event => setCreateForm({ ...createForm, access: event.target.value })}>
                  {[...new Set(resources.map(resource => resource.access))].filter(Boolean).sort().map(access => <option key={access} value={access}>{access}</option>)}
                </select>
              </label>
              <label className="resource-create-description">Description<textarea value={createForm.description} onChange={event => setCreateForm({ ...createForm, description: event.target.value })} /></label>
              <div className="row-actions resource-create-actions">
                <button type="submit" className="btn-primary" disabled={busy}>Create resource</button>
              </div>
              {createMsg && <div className="modal-msg resource-create-message">{createMsg}</div>}
            </form>
          )}
          <div className="resources-table">
            {resources.slice(0, 100).map((r, i) => (
              <div key={i} className="admin-row">
                {editingIdx === i ? (
                  <div style={{ flex: 1 }}>
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                    <input value={editForm.url} onChange={e => setEditForm({ ...editForm, url: e.target.value })} placeholder="URL" />
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="checkbox" checked={!!editForm.isVerified} onChange={e => setEditForm({ ...editForm, isVerified: e.target.checked })} /> Verified
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
                        {r.title || r.name}
                        {(r.isVerified ?? r.verified) && <span className="status-pill verified">✓</span>}
                        {r.health?.reviewState && r.health.reviewState !== 'active' && (
                          <span className={`status-pill health-${r.health.reviewState}`}>
                            {r.health.reviewState.replaceAll('_', ' ')}
                          </span>
                        )}
                      </div>
                      <div className="row-meta">{r.science} · {r.subdiscipline} · <a href={r.url} target="_blank" rel="noopener">{r.url}</a></div>
                      {r.health?.reviewState === 'under_review' ? (
                        <ReviewStatusSummary
                          reviewState={r.health.reviewState}
                          reviewConcern={r.health.reviewConcern}
                          lastCheck={r.health.lastCheck}
                        />
                      ) : r.health?.lastCheck && (
                        <div className="row-meta">
                          Last check: {r.health.lastCheck.status} · {r.health.lastCheck.reason.replaceAll('_', ' ')}
                          {r.health.lastCheck.httpStatus && ` · HTTP ${r.health.lastCheck.httpStatus}`}
                        </div>
                      )}
                    </div>
                    <div className="row-actions">
                      {r.health?.reviewState && r.health.reviewState !== 'active' && (
                        <button disabled={busy} onClick={() => setReviewState(i, 'active')} className="btn-primary">Reactivate</button>
                      )}
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
          <p className="bulk-import-help">Upload or paste a JSON array. Required fields: <code>title</code> (or <code>name</code>), <code>url</code>, <code>science</code>, and <code>subdiscipline</code>.</p>
          <input className="bulk-file-input" type="file" accept="application/json,.json" onChange={loadBulkFile} />
          <textarea
            rows="14"
            value={bulkText}
            onChange={e => { setBulkText(e.target.value); setBulkPreview(null); setBulkMsg(''); }}
            placeholder='[{"name":"Example","url":"https://example.com","description":"...","science":"Physics","subdiscipline":"Quantum Mechanics","access":"open","resource_type":"reference","tags":["quantum"],"verified":false}]'
            className="bulk-json-input"
          />
          <div className="row-actions">
            <button onClick={previewBulk} disabled={busy || !bulkText} className="btn-secondary">Preview and validate</button>
            <button onClick={approveBulk} disabled={busy || !bulkPreview?.canImport} className="btn-primary">
              Approve import{bulkPreview?.canImport ? ` (${bulkPreview.ready})` : ''}
            </button>
          </div>
          {bulkMsg && <div className="modal-msg">{bulkMsg}</div>}
          {bulkPreview && (
            <div className="bulk-preview" aria-live="polite">
              {bulkPreview.rows.map(row => (
                <div key={row.row} className={`bulk-preview-row status-${row.status}`}>
                  <strong>Row {row.row}: {row.item?.title || 'Invalid resource'}</strong>
                  {row.issues.map((issue, index) => <span key={`${issue.field}-${index}`}>{issue.field}: {issue.message}</span>)}
                  {row.status === 'ready' && <span>{row.item.url} · {row.item.science} / {row.item.subdiscipline}</span>}
                </div>
              ))}
            </div>
          )}
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
                    <div>
                      [{r.status}] {r.requestedUrl} · {r.reason.replaceAll('_', ' ')}
                      {r.httpStatus && ` · HTTP ${r.httpStatus}`} · {r.reviewState.replaceAll('_', ' ')}
                    </div>
                    <ReviewStatusSummary
                      reviewState={r.reviewState}
                      reviewConcern={r.reviewConcern}
                      lastCheck={r}
                    />
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
