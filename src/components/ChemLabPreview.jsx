import { useEffect, useRef, useState } from 'react';

// Animated lab preview that reacts to wizard state.
// Uses inline SVG with plain CSS keyframes (no external deps).
export default function ChemLabPreview({ answers, kit, total }) {
  const { user, space, focus, budget } = answers || {};
  const [paused, setPaused] = useState(false);
  const gearCount = (kit ? kit.safety.length + kit.core.length + kit.specialized.length : 0);

  // Palette
  const cyan = '#38BDF8';
  const emerald = '#10B981';
  const amber = '#F59E0B';
  const purple = '#A855F7';
  const glass = 'rgba(56, 189, 248, 0.15)';
  const glassStroke = 'rgba(56, 189, 248, 0.5)';

  // Which visual mode?
  const mode = focus || 'idle';

  // Bubble particles (visual mode: reaction vessel bubbling)
  const bubbles = Array.from({ length: 8 }, (_, i) => ({
    delay: i * 0.35,
    x: 148 + (i % 3) * 6 - 6,
    size: 3 + (i % 3),
  }));

  // Molecule atoms (decor mode)
  const atoms = [
    { cx: 260, cy: 120, r: 12, fill: cyan, label: 'C' },
    { cx: 300, cy: 90, r: 10, fill: amber, label: 'O' },
    { cx: 300, cy: 150, r: 10, fill: emerald, label: 'H' },
    { cx: 220, cy: 90, r: 10, fill: purple, label: 'N' },
    { cx: 220, cy: 150, r: 10, fill: emerald, label: 'H' },
  ];

  // Crystals (visual mode alt): angular polygons growing
  const crystals = [
    { cx: 260, cy: 205, points: '260,180 274,200 268,220 252,220 246,200', delay: 0 },
    { cx: 290, cy: 210, points: '290,190 302,208 296,225 284,225 278,208', delay: 0.4 },
    { cx: 232, cy: 208, points: '232,188 244,206 238,223 226,223 220,206', delay: 0.8 },
  ];

  return (
    <div className="lab-preview">
      <div className="lab-preview-toolbar">
        <div className="lab-title">Live Lab Preview</div>
        <button className="pause-btn" onClick={() => setPaused(p => !p)} aria-label="Toggle animation">
          {paused ? '\u25B6' : '\u2016'}
        </button>
      </div>

      <div className={`lab-canvas ${paused ? 'paused' : ''} mode-${mode}`}>
        <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home chemistry lab preview">
          {/* Bench line */}
          <line x1="20" y1="230" x2="380" y2="230" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />

          {/* Support stand (appears once garage/shed) */}
          {(space === 'garage' || space === 'shed') && (
            <g className="fade-in">
              <line x1="200" y1="230" x2="200" y2="60" stroke="#64748b" strokeWidth="3" />
              <rect x="170" y="228" width="60" height="4" fill="#64748b" />
              <rect x="196" y="120" width="30" height="3" fill="#94a3b8" />
            </g>
          )}

          {/* Thermal control base (mode-specific) */}
          <g className="thermal">
            {(space === 'kitchen' && user !== 'junior') && (
              <>
                <rect x="120" y="205" width="70" height="18" rx="3" fill="#1f2937" stroke={amber} strokeWidth="1" />
                <circle cx="155" cy="214" r="3" fill={amber} className="pulse" />
              </>
            )}
            {(space === 'garage' && user === 'hobbyist') && (
              <>
                <rect x="115" y="200" width="80" height="24" rx="3" fill="#111827" stroke={amber} strokeWidth="1" />
                <circle cx="155" cy="213" r="3" fill={amber} className="pulse" />
              </>
            )}
            {(space === 'shed' && user === 'hobbyist') && (
              <>
                {/* Heating mantle bowl */}
                <path d="M 128 210 Q 155 240 182 210 L 178 200 Q 155 218 132 200 Z" fill="#1f2937" stroke={amber} strokeWidth="1.2" />
                <circle cx="155" cy="215" r="4" fill={amber} className="pulse-fast" />
              </>
            )}
            {(space === 'shed' && user !== 'hobbyist') && (
              <>
                <rect x="120" y="205" width="70" height="18" rx="3" fill="#1f2937" stroke={amber} strokeWidth="1" />
                <circle cx="155" cy="214" r="3" fill={amber} className="pulse" />
              </>
            )}
          </g>

          {/* Reaction vessel — a beaker or round-bottom flask */}
          {focus === 'compounds' && user !== 'junior' ? (
            // Round-bottom flask
            <g className="vessel">
              <path d="M 140 170 L 140 155 L 170 155 L 170 170 A 30 30 0 1 1 140 170 Z"
                fill={glass} stroke={glassStroke} strokeWidth="1.5" />
              {/* Liquid inside */}
              <path d="M 128 195 A 30 30 0 0 0 182 195 L 182 200 A 30 30 0 0 1 128 200 Z" fill="rgba(16,185,129,0.4)" />
              {/* Neck */}
              <rect x="146" y="140" width="18" height="20" fill={glass} stroke={glassStroke} strokeWidth="1" />
            </g>
          ) : (
            // Beaker
            <g className="vessel">
              <path d="M 132 150 L 132 210 Q 132 220 142 220 L 168 220 Q 178 220 178 210 L 178 150"
                fill={glass} stroke={glassStroke} strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="132" y1="150" x2="178" y2="150" stroke={glassStroke} strokeWidth="1.5" />
              {/* Spout */}
              <path d="M 132 150 L 128 148 L 130 152 Z" fill={glassStroke} />
              {/* Liquid */}
              <rect x="134" y="195" width="42" height="24" fill={mode === 'visual' ? 'rgba(168,85,247,0.45)' : 'rgba(16,185,129,0.4)'} />
              <text x="155" y="184" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="ui-monospace, monospace">250 mL</text>
            </g>
          )}

          {/* Bubbles (all modes when user answered focus) */}
          {focus && bubbles.map((b, i) => (
            <circle
              key={i}
              className="bubble"
              cx={b.x}
              cy={210}
              r={b.size}
              fill="rgba(56,189,248,0.55)"
              style={{ animationDelay: `${b.delay}s` }}
            />
          ))}

          {/* Vapor path when compounds focus */}
          {focus === 'compounds' && user !== 'junior' && (
            <>
              <path d="M 170 155 Q 220 90 285 130 L 320 200"
                fill="none" stroke={cyan} strokeWidth="1.4" strokeDasharray="4 4" className="vapor" />
              {/* Condenser column */}
              <g transform="translate(220, 100) rotate(28)">
                <rect x="0" y="0" width="80" height="16" rx="3" fill="rgba(56,189,248,0.10)" stroke={glassStroke} strokeWidth="1" />
                <rect x="0" y="4" width="80" height="8" fill="rgba(56,189,248,0.20)" />
                <circle cx="10" cy="8" r="1.6" fill={cyan} className="pulse" />
                <circle cx="30" cy="8" r="1.6" fill={cyan} className="pulse" style={{ animationDelay: '0.4s' }} />
                <circle cx="50" cy="8" r="1.6" fill={cyan} className="pulse" style={{ animationDelay: '0.8s' }} />
                <circle cx="70" cy="8" r="1.6" fill={cyan} className="pulse" style={{ animationDelay: '1.2s' }} />
              </g>
              {/* Collection Erlenmeyer */}
              <g>
                <path d="M 305 200 L 315 175 L 315 165 L 335 165 L 335 175 L 345 200 Z"
                  fill={glass} stroke={glassStroke} strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M 313 190 L 337 190 L 342 200 L 308 200 Z" fill="rgba(56,189,248,0.5)" />
              </g>
              <text x="325" y="220" textAnchor="middle" fill="#94a3b8" fontSize="7" fontFamily="ui-monospace, monospace">Collection</text>
            </>
          )}

          {/* Crystals (visual focus) */}
          {focus === 'visual' && crystals.map((c, i) => (
            <polygon key={i} points={c.points} fill="rgba(168,85,247,0.55)" stroke={purple} strokeWidth="1"
              className="crystal-grow" style={{ transformOrigin: `${c.cx}px ${c.cy}px`, animationDelay: `${c.delay}s` }} />
          ))}

          {/* Molecule (decor focus) */}
          {focus === 'decor' && (
            <g className="molecule" style={{ transformOrigin: '260px 120px' }}>
              {/* Bonds */}
              <line x1="260" y1="120" x2="300" y2="90" stroke="#64748b" strokeWidth="2" />
              <line x1="260" y1="120" x2="300" y2="150" stroke="#64748b" strokeWidth="2" />
              <line x1="260" y1="120" x2="220" y2="90" stroke="#64748b" strokeWidth="2" />
              <line x1="260" y1="120" x2="220" y2="150" stroke="#64748b" strokeWidth="2" />
              {atoms.map((a, i) => (
                <g key={i}>
                  <circle cx={a.cx} cy={a.cy} r={a.r} fill={a.fill} opacity="0.9" />
                  <text x={a.cx} y={a.cy + 3} textAnchor="middle" fill="#0b1220" fontSize="9" fontWeight="700" fontFamily="ui-monospace, monospace">{a.label}</text>
                </g>
              ))}
            </g>
          )}

          {/* Labels */}
          {focus && (
            <>
              <text x="155" y="140" textAnchor="middle" fill={cyan} fontSize="8" fontFamily="ui-monospace, monospace">Reaction Vessel</text>
              {(user !== 'junior') && <text x="155" y="255" textAnchor="middle" fill={amber} fontSize="7" fontFamily="ui-monospace, monospace">Thermal Control</text>}
              {focus === 'compounds' && <text x="260" y="72" textAnchor="middle" fill={cyan} fontSize="7" fontFamily="ui-monospace, monospace">Condenser</text>}
            </>
          )}

          {/* Idle state */}
          {!focus && (
            <g className="idle-hint">
              <circle cx="200" cy="130" r="60" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="3 4" className="spin-slow" />
              <text x="200" y="128" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">answer the questions</text>
              <text x="200" y="144" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="ui-monospace, monospace">to build your lab</text>
            </g>
          )}
        </svg>
      </div>

      {/* Metrics bar */}
      <div className="lab-metrics">
        <div className="metric">
          <div className="metric-label">Estimated Total</div>
          <div className="metric-value primary">${total || 0} USD</div>
        </div>
        <div className="metric">
          <div className="metric-label">Gear Count</div>
          <div className="metric-value">{gearCount} Items</div>
        </div>
        <div className="metric">
          <div className="metric-label">Current Focus</div>
          <div className="metric-value accent">
            {kit?.focusLabel || 'General Chemistry'}
          </div>
        </div>
      </div>
    </div>
  );
}
