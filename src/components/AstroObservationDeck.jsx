import { useEffect, useMemo, useState } from 'react';
import { CATALOG, kitTotal, itemCount } from '../lib/astroWizard.js';
import { AMAZON_ASSOCIATE_DISCLOSURE } from '../lib/referral.ts';

// Live Observation Deck: refined animated night-sky preview + reactive inventory.
export default function AstroObservationDeck({ answers, kit }) {
  const { target, environment, experience: _experience, budget: _budget } = answers || {};
  const [paused, setPaused] = useState(false);
  const total = useMemo(() => kitTotal(kit), [kit]);
  const gearCount = itemCount(kit);

  const cyan = '#38BDF8';
  const amber = '#F59E0B';
  const emerald = '#10B981';
  const slate = '#94A3B8';

  // Star field density scales inversely with light pollution.
  const stars = useMemo(() => {
    const s = [];
    const seed = (n) => Math.sin(n * 9301 + 49297) * 233280;
    const rand = (n) => ((seed(n) % 1) + 1) % 1;
    const count = environment === 'backyard' ? 40 : environment === 'travel' ? 90 : 140;
    for (let i = 0; i < count; i++) {
      const r = rand(i + 200) * 1.2 + 0.25;
      s.push({
        cx: rand(i + 1) * 400,
        cy: rand(i + 100) * 175,
        r,
        // Brighter, larger stars twinkle less
        opacity: 0.35 + rand(i + 400) * 0.55,
        delay: rand(i + 300) * 4,
        dur: 2.2 + rand(i + 500) * 3,
      });
    }
    return s;
  }, [environment]);

  // Constellation vertices (Orion-like) — subtle, only drawn when the sky is dark enough.
  const constellation = useMemo(() => {
    if (environment === 'backyard') return null;
    return {
      points: [
        [55, 40], [78, 55], [95, 82], [110, 108], [138, 118],
        [160, 92], [175, 62], [148, 45], [100, 30],
      ],
      edges: [[0,1],[1,2],[2,3],[3,4],[2,5],[5,6],[6,7],[7,8],[8,0]],
    };
  }, [environment]);

  // Shooting-star trigger every few seconds when unpaused
  const [shooter, setShooter] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setShooter(n => n + 1), 6500);
    return () => clearInterval(t);
  }, [paused]);

  const ota = kit?.otaKind || '';
  const hasGoto = kit?.mount?.some(id => id.includes('goto') || id.includes('eq'));
  const targetLabel = target === 'planets' ? 'Moon & Planets' : target === 'deepsky' ? 'Galaxies & Nebulae' : target === 'astrophoto' ? 'Astrophotography' : 'Awaiting Target';

  // Light-pollution glow intensity for horizon
  const glowOpacity = environment === 'backyard' ? 0.55 : environment === 'travel' ? 0.15 : 0.05;

  return (
    <div className="obs-deck">
      <div className="obs-toolbar">
        <div className="obs-title">Live Observation Deck</div>
        <div className="obs-tools">
          {environment && (
            <span className="obs-badge">
              {environment === 'backyard' ? 'CITY SKY' : environment === 'travel' ? 'DARK SKY' : 'WILDERNESS'}
            </span>
          )}
          <button className="pause-btn" onClick={() => setPaused(p => !p)} aria-label="Toggle animation">
            {paused ? '\u25B6' : '\u2016'}
          </button>
        </div>
      </div>

      <div className={`obs-canvas ${paused ? 'paused' : ''}`}>
        <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Night sky preview">
          <defs>
            <radialGradient id="skyGrad" cx="50%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#0b1224" />
              <stop offset="70%" stopColor="#04070f" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>
            <linearGradient id="cityGlow" x1="0" x2="0" y1="1" y2="0">
              <stop offset="0%" stopColor="rgba(245,158,11,0.55)" />
              <stop offset="60%" stopColor="rgba(245,158,11,0.10)" />
              <stop offset="100%" stopColor="rgba(245,158,11,0)" />
            </linearGradient>
            <radialGradient id="nebula" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="rgba(168,85,247,0.80)" />
              <stop offset="45%" stopColor="rgba(56,189,248,0.35)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>
            <radialGradient id="moon" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#475569" />
            </radialGradient>
            <linearGradient id="ground" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0a0f1c" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.2" />
            </filter>
          </defs>

          <rect x="0" y="0" width="400" height="200" fill="url(#skyGrad)" />

          {/* Light pollution horizon glow */}
          <rect x="0" y="140" width="400" height="60" fill="url(#cityGlow)" opacity={glowOpacity} />

          {/* Constellation (only in darker skies) */}
          {constellation && (
            <g opacity="0.55">
              {constellation.edges.map(([a, b], i) => {
                const [x1, y1] = constellation.points[a];
                const [x2, y2] = constellation.points[b];
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={cyan} strokeWidth="0.4" strokeDasharray="1 2" />;
              })}
              {constellation.points.map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r="1.3" fill="#fff" />
              ))}
            </g>
          )}

          {/* Star field */}
          {stars.map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.r}
              fill="#e2e8f0"
              className="star"
              style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s`, opacity: s.opacity }}
            />
          ))}

          {/* Shooting star */}
          {!paused && environment !== 'backyard' && (
            <g key={shooter} className="shooter-wrap">
              <line x1="380" y1="20" x2="300" y2="70" stroke="#e2e8f0" strokeWidth="1" strokeLinecap="round" className="shooter" />
              <circle cx="300" cy="70" r="1.2" fill="#fff" className="shooter" />
            </g>
          )}

          {/* Target-specific celestial subject */}
          {target === 'planets' && (
            <g className="fade-in">
              <circle cx="315" cy="55" r="28" fill="url(#moon)" filter="url(#starGlow)" />
              <circle cx="315" cy="55" r="28" fill="url(#moon)" />
              {/* Craters */}
              <circle cx="308" cy="50" r="3" fill="rgba(0,0,0,0.18)" />
              <circle cx="322" cy="63" r="4" fill="rgba(0,0,0,0.14)" />
              <circle cx="312" cy="70" r="2.2" fill="rgba(0,0,0,0.16)" />
              <circle cx="325" cy="47" r="1.8" fill="rgba(0,0,0,0.12)" />
              {/* Saturn-like planet */}
              <g className="drift-slow">
                <ellipse cx="85" cy="60" rx="11" ry="11" fill={amber} />
                <ellipse cx="85" cy="60" rx="20" ry="4" fill="none" stroke={amber} strokeWidth="1.4" opacity="0.85" transform="rotate(-18 85 60)" />
                <ellipse cx="85" cy="60" rx="20" ry="4" fill="none" stroke="rgba(245,158,11,0.4)" strokeWidth="1" transform="rotate(-18 85 60) translate(0,2)" />
              </g>
            </g>
          )}

          {target === 'deepsky' && (
            <g className="fade-in">
              <ellipse cx="200" cy="80" rx="100" ry="50" fill="url(#nebula)" className="nebula-pulse" />
              <ellipse cx="200" cy="80" rx="55" ry="26" fill="rgba(168,85,247,0.35)" />
              <circle cx="180" cy="72" r="1.8" fill="#fff" />
              <circle cx="222" cy="88" r="2.2" fill="#fff" />
              <circle cx="200" cy="80" r="2" fill="#fff" />
              <circle cx="192" cy="92" r="1.4" fill="#fff" />
              {/* Andromeda-like spiral */}
              <g transform="translate(70,52) rotate(-15)" className="spin-slow">
                <ellipse rx="24" ry="6" fill="rgba(56,189,248,0.45)" />
                <ellipse rx="14" ry="3.5" fill="rgba(255,255,255,0.65)" />
                <ellipse rx="5" ry="1.4" fill="#fff" />
              </g>
            </g>
          )}

          {target === 'astrophoto' && (
            <g className="fade-in">
              <ellipse cx="260" cy="70" rx="70" ry="34" fill="url(#nebula)" className="nebula-pulse" />
              <circle cx="80" cy="45" r="14" fill="url(#moon)" />
              <g transform="translate(340,120) rotate(-20)" className="spin-slow">
                <ellipse rx="24" ry="6" fill="rgba(56,189,248,0.4)" />
                <ellipse rx="12" ry="3" fill="#fff" />
              </g>
              {/* Star trails hint */}
              <g stroke="rgba(56,189,248,0.35)" strokeWidth="0.5" fill="none">
                <path d="M40 145 Q120 128 200 145" />
                <path d="M40 155 Q120 138 200 155" />
                <path d="M40 165 Q120 148 200 165" />
              </g>
            </g>
          )}

          {/* Tracking arc for GoTo/EQ mounts */}
          {hasGoto && ota && (
            <g className="fade-in">
              <path d="M110 190 Q200 90 290 190" fill="none" stroke={emerald} strokeWidth="0.7" strokeDasharray="2 3" opacity="0.6" />
              <circle r="2.5" fill={emerald} className="track-dot">
                <animateMotion dur="8s" repeatCount="indefinite" path="M110 190 Q200 90 290 190" />
              </circle>
            </g>
          )}

          {/* Ground */}
          <rect x="0" y="200" width="400" height="60" fill="url(#ground)" />
          <line x1="0" y1="200" x2="400" y2="200" stroke="rgba(56,189,248,0.2)" strokeWidth="1" />

          {/* City skyline silhouette when in backyard */}
          {environment === 'backyard' && (
            <g fill="#020617" stroke="rgba(245,158,11,0.4)" strokeWidth="0.5">
              <rect x="10" y="184" width="20" height="16" />
              <rect x="34" y="176" width="14" height="24" />
              <rect x="52" y="188" width="10" height="12" />
              <rect x="66" y="180" width="18" height="20" />
              <rect x="320" y="182" width="16" height="18" />
              <rect x="340" y="174" width="20" height="26" />
              <rect x="364" y="186" width="12" height="14" />
              {/* Window lights */}
              <rect x="38" y="182" width="2" height="2" fill={amber} opacity="0.9" />
              <rect x="42" y="186" width="2" height="2" fill={amber} opacity="0.7" />
              <rect x="344" y="180" width="2" height="2" fill={amber} opacity="0.9" />
              <rect x="352" y="188" width="2" height="2" fill={amber} opacity="0.6" />
            </g>
          )}

          {/* Mountain silhouette for backcountry */}
          {environment === 'backcountry' && (
            <g fill="#020617" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5">
              <polygon points="0,200 60,150 110,190 150,160 210,200" />
              <polygon points="220,200 260,165 300,185 340,150 400,200" />
            </g>
          )}

          {/* Trees for travel (dark sky park) */}
          {environment === 'travel' && (
            <g fill="#020617" stroke="rgba(56,189,248,0.2)" strokeWidth="0.4">
              <polygon points="20,200 10,180 30,180" />
              <polygon points="45,200 33,175 57,175" />
              <polygon points="360,200 348,182 372,182" />
              <polygon points="385,200 375,178 395,178" />
            </g>
          )}

          {/* Telescope on ground */}
          {ota && (
            <g className="fade-in telescope">
              <Telescope kind={ota} target={target} hasGoto={hasGoto} cyan={cyan} emerald={emerald} amber={amber} />
              {/* Astronomer figure */}
              <g stroke={slate} strokeWidth="1" fill="none">
                <circle cx="115" cy="220" r="3" fill={slate} />
                <line x1="115" y1="223" x2="115" y2="235" />
                <line x1="115" y1="228" x2="120" y2="232" />
                <line x1="115" y1="235" x2="112" y2="245" />
                <line x1="115" y1="235" x2="118" y2="245" />
              </g>
              {/* Red flashlight beam */}
              <line x1="120" y1="230" x2="150" y2="238" stroke="#ef4444" strokeWidth="0.8" opacity="0.7" className="beam" />

              {/* Backpack for backcountry */}
              {environment === 'backcountry' && (
                <g>
                  <rect x="94" y="235" width="14" height="16" rx="2" fill="#0f172a" stroke={amber} strokeWidth="0.8" />
                  <rect x="97" y="238" width="8" height="5" fill={amber} opacity="0.35" />
                </g>
              )}
            </g>
          )}

          {/* Idle */}
          {!target && (
            <g>
              <text x="200" y="120" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="ui-monospace, monospace">select a target</text>
              <text x="200" y="136" textAnchor="middle" fill="#475569" fontSize="10" fontFamily="ui-monospace, monospace">to reveal your rig</text>
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

      <div className="obs-disclosure">
        {AMAZON_ASSOCIATE_DISCLOSURE}
      </div>
    </div>
  );
}

function Telescope({ kind, target, hasGoto, cyan, emerald, amber: _amber }) {
  // Tripod legs (default position)
  const Tripod = ({ cx = 185, top = 210 }) => (
    <g stroke={cyan} strokeWidth="1.2" fill="none">
      <line x1={cx} y1={top} x2={cx - 22} y2={top + 30} />
      <line x1={cx} y1={top} x2={cx + 22} y2={top + 30} />
      <line x1={cx} y1={top} x2={cx} y2={top + 30} />
      <line x1={cx - 15} y1={top + 20} x2={cx + 15} y2={top + 20} strokeWidth="0.8" opacity="0.6" />
    </g>
  );

  if (kind === 'dob') {
    return (
      <g>
        {/* Dob rocker box */}
        <rect x="150" y="228" width="70" height="14" fill="#111827" stroke={cyan} strokeWidth="1.2" />
        <line x1="150" y1="235" x2="220" y2="235" stroke={cyan} strokeWidth="0.4" opacity="0.5" />
        {/* OTA */}
        <g transform="rotate(-15 185 210)">
          <rect x="167" y="168" width="36" height="70" rx="4" fill="#0f172a" stroke={cyan} strokeWidth="1.3" />
          <line x1="167" y1="185" x2="203" y2="185" stroke={cyan} strokeWidth="0.4" opacity="0.6" />
          <line x1="167" y1="220" x2="203" y2="220" stroke={cyan} strokeWidth="0.4" opacity="0.6" />
          {/* Aperture opening */}
          <ellipse cx="185" cy="170" rx="16" ry="3" fill={cyan} opacity="0.35" />
          {/* Finder */}
          <rect x="205" y="175" width="4" height="14" fill="#0f172a" stroke={cyan} strokeWidth="0.6" />
          {/* Focuser */}
          <rect x="203" y="200" width="10" height="6" fill="#0f172a" stroke={cyan} strokeWidth="0.6" />
        </g>
      </g>
    );
  }

  if (kind === 'mak') {
    return (
      <g>
        <Tripod />
        {/* Fork mount */}
        <rect x="176" y="200" width="18" height="12" fill="#111827" stroke={cyan} strokeWidth="0.9" />
        {hasGoto && <circle cx="185" cy="206" r="1.5" fill={emerald} className="pulse" />}
        {/* Compact tube */}
        <rect x="160" y="180" width="50" height="24" rx="6" fill="#0f172a" stroke={cyan} strokeWidth="1.2" />
        <circle cx="185" cy="192" r="6" fill={cyan} opacity="0.35" />
        <circle cx="185" cy="192" r="2" fill="#0f172a" />
        {/* Diagonal + eyepiece */}
        <rect x="207" y="188" width="8" height="10" fill="#0f172a" stroke={cyan} strokeWidth="0.7" />
        <rect x="213" y="182" width="8" height="10" fill="#0f172a" stroke={cyan} strokeWidth="0.7" />
      </g>
    );
  }

  if (kind === 'refractor' || kind === 'apo') {
    return (
      <g>
        <Tripod />
        {/* Mount head */}
        <rect x="176" y="200" width="18" height="10" fill="#111827" stroke={cyan} strokeWidth="0.9" />
        {hasGoto && <circle cx="185" cy="205" r="1.5" fill={emerald} className="pulse" />}
        {/* Long refractor tube */}
        <rect x="130" y="192" width="110" height="14" rx="6" fill="#0f172a" stroke={cyan} strokeWidth="1.2" />
        {/* Dew shield */}
        <rect x="120" y="190" width="14" height="18" rx="2" fill="#0f172a" stroke={cyan} strokeWidth="1" />
        {/* Objective lens */}
        <ellipse cx="127" cy="199" rx="3" ry="7" fill={cyan} opacity="0.4" />
        {/* Focuser + eyepiece */}
        <rect x="240" y="196" width="14" height="7" fill="#0f172a" stroke={cyan} strokeWidth="0.7" />
        <rect x="250" y="188" width="9" height="18" fill="#0f172a" stroke={cyan} strokeWidth="0.7" />
        {kind === 'apo' && (
          <>
            <text x="185" y="203" textAnchor="middle" fill={emerald} fontSize="5" fontFamily="ui-monospace, monospace">APO TRIPLET</text>
            {target === 'astrophoto' && (
              <g>
                {/* Camera body on top */}
                <rect x="170" y="176" width="30" height="14" rx="2" fill="#111827" stroke={purpleFallback()} strokeWidth="0.8" />
                <rect x="180" y="172" width="10" height="4" fill="#111827" stroke={purpleFallback()} strokeWidth="0.6" />
                <circle cx="185" cy="184" r="2" fill={purpleFallback()} opacity="0.5" />
              </g>
            )}
          </>
        )}
      </g>
    );
  }

  if (kind === 'smart') {
    return (
      <g>
        <Tripod />
        <rect x="170" y="200" width="30" height="14" rx="2" fill="#111827" stroke={cyan} strokeWidth="0.9" />
        {/* Sleek pod */}
        <rect x="158" y="172" width="54" height="34" rx="12" fill="#0f172a" stroke={cyan} strokeWidth="1.3" />
        <circle cx="185" cy="187" r="7" fill={cyan} opacity="0.4" className="pulse" />
        <circle cx="185" cy="187" r="2.5" fill="#0f172a" />
        {/* Status LED */}
        <rect x="176" y="200" width="18" height="3" rx="1" fill={emerald} opacity="0.8" className="pulse" />
        {/* Wi-Fi glyph */}
        <path d="M204 176 q3 -3 6 0 M202 179 q5 -5 10 0" stroke={emerald} strokeWidth="0.6" fill="none" />
      </g>
    );
  }

  return null;
}

function purpleFallback() { return '#A855F7'; }

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
