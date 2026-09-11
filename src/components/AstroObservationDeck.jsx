import { useMemo, useState } from 'react';
import { CATALOG, kitTotal, itemCount } from '../lib/astroWizard.js';

// Live Observation Deck: telescope silhouette + starfield that updates by answer.
export default function AstroObservationDeck({ answers, kit }) {
  const { target, environment, experience, budget } = answers || {};
  const [paused, setPaused] = useState(false);
  const total = useMemo(() => kitTotal(kit), [kit]);
  const gearCount = itemCount(kit);

  const cyan = '#38BDF8';
  const purple = '#A855F7';
  const amber = '#F59E0B';
  const emerald = '#10B981';

  // Starfield — deterministic random layout
  const stars = useMemo(() => {
    const s = [];
    const seed = (n) => Math.sin(n * 9301 + 49297) * 233280;
    const rand = (n) => ((seed(n) % 1) + 1) % 1;
    const count = environment === 'backyard' ? 30 : environment === 'travel' ? 60 : 90;
    for (let i = 0; i < count; i++) {
      s.push({
        cx: rand(i + 1) * 400,
        cy: rand(i + 100) * 180,
        r: rand(i + 200) * 1.1 + 0.3,
        delay: rand(i + 300) * 4,
      });
    }
    return s;
  }, [environment]);

  const ota = kit?.otaKind || '';
  const targetLabel = target === 'planets' ? 'Moon & Planets' : target === 'deepsky' ? 'Galaxies & Nebulae' : target === 'astrophoto' ? 'Astrophotography' : 'Awaiting Target';

  return (
    <div className="obs-deck">
      <div className="obs-toolbar">
        <div className="obs-title">Live Observation Deck</div>
        <button className="pause-btn" onClick={() => setPaused(p => !p)} aria-label="Toggle animation">
          {paused ? '\u25B6' : '\u2016'}
        </button>
      </div>

      <div className={`obs-canvas ${paused ? 'paused' : ''}`}>
        <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Night sky preview">
          {/* Sky gradient */}
          <defs>
            <radialGradient id="sky" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <radialGradient id="nebula" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(168,85,247,0.7)" />
              <stop offset="60%" stopColor="rgba(56,189,248,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id="moon" cx="35%" cy="35%" r="55%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="400" height="200" fill="url(#sky)" />

          {/* Ground horizon */}
          <rect x="0" y="200" width="400" height="60" fill="#020617" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(56,189,248,0.15)" strokeWidth="1" />

          {/* Stars */}
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#e2e8f0"
              className="star"
              style={{ animationDelay: `${s.delay}s` }}
            />
          ))}

          {/* Target-specific celestial object */}
          {target === 'planets' && (
            <g className="fade-in">
              {/* Moon */}
              <circle cx="310" cy="60" r="26" fill="url(#moon)" />
              <circle cx="303" cy="55" r="3" fill="rgba(0,0,0,0.15)" />
              <circle cx="318" cy="65" r="4" fill="rgba(0,0,0,0.12)" />
              <circle cx="308" cy="72" r="2.5" fill="rgba(0,0,0,0.15)" />
              {/* Distant planet ring */}
              <ellipse cx="90" cy="55" rx="10" ry="10" fill={amber} opacity="0.9" />
              <ellipse cx="90" cy="55" rx="18" ry="4" fill="none" stroke={amber} strokeWidth="1.2" opacity="0.7" transform="rotate(-15 90 55)" />
            </g>
          )}

          {target === 'deepsky' && (
            <g className="fade-in">
              {/* Nebula cloud */}
              <ellipse cx="200" cy="80" rx="90" ry="45" fill="url(#nebula)" className="glow" />
              <ellipse cx="200" cy="80" rx="45" ry="22" fill="rgba(168,85,247,0.4)" />
              <circle cx="180" cy="72" r="1.6" fill="#fff" />
              <circle cx="220" cy="88" r="2" fill="#fff" />
              <circle cx="200" cy="80" r="1.8" fill="#fff" />
              {/* Galaxy spiral */}
              <g transform="translate(70,50)" className="spin-slow">
                <ellipse cx="0" cy="0" rx="18" ry="5" fill="rgba(56,189,248,0.5)" />
                <ellipse cx="0" cy="0" rx="10" ry="3" fill="rgba(255,255,255,0.7)" />
              </g>
            </g>
          )}

          {target === 'astrophoto' && (
            <g className="fade-in">
              {/* Wide field: moon + nebula + galaxy corners */}
              <ellipse cx="260" cy="70" rx="60" ry="30" fill="url(#nebula)" className="glow" />
              <circle cx="80" cy="45" r="14" fill="url(#moon)" />
              <g transform="translate(340,130)">
                <ellipse cx="0" cy="0" rx="24" ry="6" fill="rgba(56,189,248,0.4)" transform="rotate(-20)" />
                <ellipse cx="0" cy="0" rx="12" ry="3" fill="#fff" transform="rotate(-20)" />
              </g>
              {/* Star-trail hint */}
              <g stroke="rgba(56,189,248,0.35)" strokeWidth="0.6" fill="none">
                <path d="M40 150 Q120 130 200 150" />
                <path d="M40 160 Q120 140 200 160" />
                <path d="M40 170 Q120 150 200 170" />
              </g>
            </g>
          )}

          {/* Telescope silhouette on ground */}
          {ota && (
            <g className="fade-in telescope">
              {ota === 'dob' && (
                // Dobsonian: big cylinder on square base
                <g>
                  <rect x="140" y="220" width="90" height="14" fill="#1e293b" stroke={cyan} strokeWidth="1.2" />
                  <rect x="150" y="234" width="70" height="6" fill="#0f172a" />
                  <rect x="165" y="175" width="40" height="55" rx="4" fill="#0f172a" stroke={cyan} strokeWidth="1.2" />
                  <line x1="185" y1="175" x2="185" y2="165" stroke={cyan} strokeWidth="1.2" />
                  {/* Aperture opening */}
                  <ellipse cx="185" cy="176" rx="18" ry="4" fill={cyan} opacity="0.3" />
                </g>
              )}
              {ota === 'mak' && (
                // Mak-Cassegrain: short fat tube on fork mount
                <g>
                  <rect x="170" y="228" width="30" height="12" fill="#1e293b" stroke={cyan} strokeWidth="1" />
                  <line x1="185" y1="228" x2="185" y2="220" stroke={cyan} strokeWidth="1" />
                  <rect x="163" y="192" width="45" height="30" rx="6" fill="#0f172a" stroke={cyan} strokeWidth="1.2" />
                  <circle cx="185" cy="207" r="5" fill={cyan} opacity="0.3" />
                  {/* Eyepiece */}
                  <rect x="210" y="200" width="10" height="14" fill="#0f172a" stroke={cyan} strokeWidth="1" />
                </g>
              )}
              {(ota === 'refractor' || ota === 'apo') && (
                // Refractor: long thin tube on tripod
                <g>
                  <line x1="185" y1="240" x2="170" y2="215" stroke={cyan} strokeWidth="1.2" />
                  <line x1="185" y1="240" x2="200" y2="215" stroke={cyan} strokeWidth="1.2" />
                  <line x1="185" y1="240" x2="185" y2="230" stroke={cyan} strokeWidth="1.2" />
                  <rect x="140" y="200" width="90" height="14" rx="5" fill="#0f172a" stroke={cyan} strokeWidth="1.2" />
                  <circle cx="140" cy="207" r="7" fill={cyan} opacity="0.3" />
                  {/* Focuser + eyepiece */}
                  <rect x="228" y="203" width="16" height="8" fill="#0f172a" stroke={cyan} strokeWidth="1" />
                  {ota === 'apo' && <text x="185" y="215" textAnchor="middle" fill={emerald} fontSize="6" fontFamily="ui-monospace, monospace">APO TRIPLET</text>}
                </g>
              )}
              {ota === 'smart' && (
                // Smart robotic telescope: sleek pod
                <g>
                  <rect x="170" y="220" width="30" height="18" rx="3" fill="#1e293b" stroke={cyan} strokeWidth="1" />
                  <rect x="160" y="185" width="50" height="38" rx="10" fill="#0f172a" stroke={cyan} strokeWidth="1.4" />
                  <circle cx="185" cy="200" r="6" fill={cyan} opacity="0.5" className="pulse" />
                  <rect x="176" y="215" width="18" height="4" rx="1" fill={emerald} opacity="0.7" />
                </g>
              )}
            </g>
          )}

          {/* Backpack (backcountry) */}
          {environment === 'backcountry' && ota && (
            <g className="fade-in">
              <rect x="248" y="215" width="24" height="26" rx="4" fill="#0f172a" stroke={amber} strokeWidth="1" />
              <rect x="252" y="220" width="16" height="10" fill={amber} opacity="0.3" />
              <text x="260" y="252" textAnchor="middle" fill={amber} fontSize="6" fontFamily="ui-monospace, monospace">FIELD KIT</text>
            </g>
          )}

          {/* Idle */}
          {!target && (
            <g>
              <text x="200" y="120" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">select a target</text>
              <text x="200" y="136" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">to reveal your rig</text>
            </g>
          )}
        </svg>
      </div>

      {/* Metrics */}
      <div className="obs-metrics">
        <div className="metric">
          <div className="metric-label">Estimated Total</div>
          <div className="metric-value primary">${total.toLocaleString()} USD</div>
        </div>
        <div className="metric">
          <div className="metric-label">Gear Count</div>
          <div className="metric-value">{gearCount} Items</div>
        </div>
        <div className="metric">
          <div className="metric-label">Current Target</div>
          <div className="metric-value accent">{targetLabel}</div>
        </div>
      </div>

      {/* Inventory cards spawning */}
      <div className="obs-inventory">
        {kit && kit.ota.length > 0 && (
          <InventoryGroup label="Optical Tube" items={kit.ota} tone="cyan" />
        )}
        {kit && kit.mount.length > 0 && (
          <InventoryGroup label="Mount & Base" items={kit.mount} tone="emerald" />
        )}
        {kit && kit.ap.length > 0 && (
          <InventoryGroup label="Astrophotography" items={kit.ap} tone="purple" />
        )}
      </div>
    </div>
  );
}

function InventoryGroup({ label, items, tone }) {
  return (
    <div className={`inv-group tone-${tone}`}>
      <div className="inv-label">{label}</div>
      <div className="inv-items">
        {items.map(id => {
          const it = CATALOG[id];
          if (!it) return null;
          return (
            <div key={id} className="inv-item">
              <div className="inv-name">{it.name}</div>
              {it.spec && <div className="inv-spec">{it.spec}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
