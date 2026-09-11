import { useState, useMemo } from 'react';

const ACCESS_OPTS = ['all', 'open', 'subscription', 'freemium', 'affiliate'];
const TYPE_OPTS = ['all', 'reference', 'journal', 'database', 'tool', 'youtube', 'simulator', 'software', 'university', 'supplies'];
const VERIFIED_OPTS = ['all', 'verified', 'unverified'];
const SORT_OPTS = ['relevance', 'name', 'rating', 'recent'];

export default function ResourceExplorer({ resources = [], scienceScope = null, statusMap = {} }) {
  const [q, setQ] = useState('');
  const [access, setAccess] = useState('all');
  const [type, setType] = useState('all');
  const [verified, setVerified] = useState('all');
  const [sort, setSort] = useState('relevance');

  const scoped = useMemo(() => {
    return scienceScope ? resources.filter(r => r.science === scienceScope) : resources;
  }, [resources, scienceScope]);

  const filtered = useMemo(() => {
    let out = scoped;
    if (q && q.length >= 1) {
      const term = q.toLowerCase();
      out = out.filter(r =>
        r.name.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.url || '').toLowerCase().includes(term) ||
        (r.tags || []).some(t => t.toLowerCase().includes(term)) ||
        (r.subdiscipline || '').toLowerCase().includes(term)
      );
    }
    if (access !== 'all') out = out.filter(r => (r.access || 'open') === access);
    if (type !== 'all') out = out.filter(r => (r.resource_type || 'reference') === type);
    if (verified !== 'all') out = out.filter(r => (verified === 'verified' ? r.verified : !r.verified));

    if (sort === 'name') out = [...out].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'rating') out = [...out].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'recent') out = [...out].sort((a, b) => (b.added || '').localeCompare(a.added || ''));
    return out;
  }, [scoped, q, access, type, verified, sort]);

  const groups = useMemo(() => {
    const m = {};
    for (const r of filtered) {
      const key = r.subdiscipline || 'General';
      (m[key] = m[key] || []).push(r);
    }
    return Object.entries(m).sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  const domain = (url) => {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
  };

  return (
    <div className="explorer">
      <div className="filter-bar">
        <input
          type="text"
          className="explorer-search"
          placeholder={scienceScope ? `Search ${scienceScope}…` : 'Search 541 resources…'}
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <div className="filter-group">
          <label>Access</label>
          <select value={access} onChange={e => setAccess(e.target.value)}>
            {ACCESS_OPTS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Access' : o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Type</label>
          <select value={type} onChange={e => setType(e.target.value)}>
            {TYPE_OPTS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Types' : o}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Verified</label>
          <select value={verified} onChange={e => setVerified(e.target.value)}>
            {VERIFIED_OPTS.map(o => <option key={o} value={o}>{o === 'all' ? 'All Status' : o}</option>)}
          </select>
        </div>
        <div className="filter-group sort-group">
          <label>Sort</label>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="result-count">{filtered.length} resource{filtered.length !== 1 ? 's' : ''}</div>
      </div>

      <div className="resource-list">
        {groups.length === 0 && (
          <div className="empty-state">No resources match your filters.</div>
        )}
        {groups.map(([sub, items]) => (
          <div key={sub} className="resource-section">
            <div className="resource-section-title">{sub} <span style={{ opacity: 0.5 }}>({items.length})</span></div>
            {items.map((r, i) => {
              const st = statusMap[r.url] || {};
              const underReview = st.under_review;
              return (
                <div key={i} className={`resource-row ${underReview ? 'under-review' : ''}`}>
                  <div className="resource-title-line">
                    <a
                      href={underReview ? '#' : r.url}
                      target="_blank"
                      rel="noopener"
                      className={`resource-title ${underReview ? 'disabled-link' : ''}`}
                    >
                      {r.name}
                    </a>
                    {r.verified && <span className="verified-badge">✓ Verified</span>}
                    {underReview && <span className="review-badge">⚠ Under Review</span>}
                    {r.access === 'affiliate' && <span className="affiliate-badge">Affiliate</span>}
                    <span className="resource-domain">{domain(r.url)}</span>
                  </div>
                  {r.description && <div className="resource-description">{r.description}</div>}
                  {r.tags && r.tags.length > 0 && (
                    <div className="resource-tags">
                      {r.tags.slice(0, 6).map((t, j) => <span key={j} className="resource-tag">#{t}</span>)}
                    </div>
                  )}
                  <div className="resource-meta">
                    <span>{r.access || 'open'}</span>
                    {r.rating && <span>★ {r.rating}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
