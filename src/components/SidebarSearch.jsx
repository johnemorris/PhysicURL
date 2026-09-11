import { useState, useEffect } from 'react';

export default function SidebarSearch({ resources = [] }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const term = q.toLowerCase();
    const matches = resources
      .filter(r =>
        r.name.toLowerCase().includes(term) ||
        (r.description || '').toLowerCase().includes(term) ||
        (r.url || '').toLowerCase().includes(term) ||
        (r.tags || []).some(t => t.toLowerCase().includes(term))
      )
      .slice(0, 12);
    setResults(matches);
  }, [q, resources]);

  return (
    <div className="sidebar-search-wrap">
      <input
        type="text"
        className="sidebar-search-input"
        placeholder="Search resources…"
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      {results.length > 0 && (
        <div className="sidebar-search-results">
          {results.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener" className="sidebar-search-result">
              <div className="ssr-title">{r.name}</div>
              <div className="ssr-meta">{r.science} · {r.subdiscipline || ''}</div>
            </a>
          ))}
        </div>
      )}
      {q.length >= 2 && results.length === 0 && (
        <div className="sidebar-search-empty">No matches</div>
      )}
    </div>
  );
}
