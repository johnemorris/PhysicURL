import { useEffect, useState } from 'react';

// Refined animated lab preview: richer environment context, better silhouettes,
// live stirring, flame flicker, water-flow condenser, cleaner molecule.
export default function ChemLabPreview({ answers, kit, total }) {
  const { user, space, focus, budget: _budget } = answers || {};
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0); // used for triggering steam wisps
  const gearCount = kit ? kit.safety.length + kit.core.length + kit.specialized.length : 0;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setTick(n => n + 1), 4200);
    return () => clearInterval(t);
  }, [paused]);

  // Palette
  const cyan = '#38BDF8';
  const emerald = '#10B981';
  const amber = '#F59E0B';
  const purple = '#A855F7';
  const rose = '#F43F5E';
  const slate = '#94A3B8';
  const glass = 'rgba(56, 189, 248, 0.14)';
  const glassStroke = 'rgba(56, 189, 248, 0.55)';

  const mode = focus || 'idle';
  const isRoundFlask = focus === 'compounds' && user !== 'junior';
  const heatOn = !!focus && user !== 'junior'; // junior = no flames
  const isShed = space === 'shed' && user === 'hobbyist';
  const isGarage = space === 'garage' && user === 'hobbyist';

  // Environment badge
  const envBadge = space === 'kitchen' ? 'KITCHEN LAB' : space === 'garage' ? 'GARAGE LAB' : space === 'shed' ? 'OUTDOOR SHED' : null;

  // Bubbles rising in the vessel
  const bubbles = Array.from({ length: 10 }, (_, i) => ({
    delay: (i * 0.32) % 3.2,
    x: 141 + (i % 4) * 6,
    r: 1.6 + (i % 3) * 0.8,
    dur: 2.4 + (i % 3) * 0.4,
  }));

  // Water molecule (H2O) — cleaner and chemically real
  const waterMolecule = [
    { cx: 260, cy: 120, r: 14, fill: rose, label: 'O', text: '#0b1220' },
    { cx: 230, cy: 100, r: 10, fill: '#e2e8f0', label: 'H', text: '#0b1220' },
    { cx: 290, cy: 100, r: 10, fill: '#e2e8f0', label: 'H', text: '#0b1220' },
  ];

  // Crystals (visual focus): angular polygons growing
  const crystals = [
    { cx: 260, cy: 205, points: '260,180 274,200 268,220 252,220 246,200', delay: 0 },
    { cx: 292, cy: 210, points: '292,188 304,206 298,224 286,224 280,206', delay: 0.4 },
    { cx: 232, cy: 208, points: '232,186 244,204 238,222 226,222 220,204', delay: 0.8 },
  ];

  return (
    <div className="lab-preview">
      <div className="lab-preview-toolbar">
        <div className="lab-title">Live Lab Preview</div>
        <div className="lab-tools">
          {envBadge && <span className="lab-badge">{envBadge}</span>}
          <button className="pause-btn" onClick={() => setPaused(p => !p)} aria-label="Toggle animation">
            {paused ? '▶' : '‖'}
          </button>
        </div>
      </div>

      <div className={`lab-canvas ${paused ? 'paused' : ''} mode-${mode}`}>
        <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Home chemistry lab preview">
          <defs>
            <linearGradient id="benchGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#111827" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <radialGradient id="flameCore" cx="50%" cy="70%" r="60%">
              <stop offset="0%" stopColor="#fff" />
              <stop offset="40%" stopColor="#fde68a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="rgba(245,158,11,0)" />
            </radialGradient>
            <radialGradient id="flameBlue" cx="50%" cy="80%" r="55%">
              <stop offset="0%" stopColor="#c4b5fd" />
              <stop offset="60%" stopColor="rgba(96,165,250,0.7)" />
              <stop offset="100%" stopColor="rgba(96,165,250,0)" />
            </radialGradient>
            <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={mode === 'visual' ? 'rgba(168,85,247,0.55)' : 'rgba(16,185,129,0.55)'} />
              <stop offset="100%" stopColor={mode === 'visual' ? 'rgba(168,85,247,0.3)' : 'rgba(16,185,129,0.3)'} />
            </linearGradient>
            <linearGradient id="liquidFlask" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgba(56,189,248,0.55)" />
              <stop offset="100%" stopColor="rgba(56,189,248,0.30)" />
            </linearGradient>
            <linearGradient id="glare" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.4" />
            </filter>
          </defs>

          {/* Environment backdrop */}
          <rect x="0" y="0" width="400" height="260" fill="#080C14" />

          {/* Kitchen: subtle tiled wall */}
          {space === 'kitchen' && (
            <g opacity="0.35" stroke="rgba(56,189,248,0.15)" strokeWidth="0.5" fill="none">
              {[...Array(6)].map((_, i) => <line key={'v'+i} x1={i * 80} y1="0" x2={i * 80} y2="180" />)}
              {[...Array(5)].map((_, i) => <line key={'h'+i} x1="0" y1={i * 40} x2="400" y2={i * 40} />)}
              {/* Faucet corner */}
              <rect x="330" y="150" width="50" height="30" fill="rgba(148,163,184,0.05)" />
            </g>
          )}

          {/* Garage: pegboard silhouette */}
          {isGarage && (
            <g opacity="0.35">
              <rect x="0" y="0" width="400" height="180" fill="rgba(56,189,248,0.02)" />
              {[...Array(6)].map((_, r) => [...Array(20)].map((_, c) => (
                <circle key={`${r}-${c}`} cx={20 + c * 20} cy={20 + r * 25} r="0.8" fill="rgba(148,163,184,0.4)" />
              )))}
              {/* Hanging tools */}
              <line x1="60" y1="15" x2="60" y2="55" stroke={slate} strokeWidth="1.2" />
              <rect x="55" y="52" width="10" height="14" fill="#1e293b" stroke={slate} strokeWidth="0.7" />
              <line x1="340" y1="15" x2="340" y2="60" stroke={slate} strokeWidth="1.2" />
              <circle cx="340" cy="65" r="6" fill="none" stroke={slate} strokeWidth="1" />
            </g>
          )}

          {/* Shed: wood-panel wall + window */}
          {space === 'shed' && (
            <g opacity="0.45">
              {[...Array(5)].map((_, i) => (
                <line key={i} x1="0" y1={30 + i * 30} x2="400" y2={30 + i * 30} stroke="rgba(120,90,60,0.35)" strokeWidth="0.6" />
              ))}
              <rect x="290" y="30" width="80" height="60" fill="rgba(56,189,248,0.05)" stroke="rgba(56,189,248,0.2)" strokeWidth="0.8" />
              <line x1="330" y1="30" x2="330" y2="90" stroke="rgba(56,189,248,0.2)" strokeWidth="0.6" />
              <line x1="290" y1="60" x2="370" y2="60" stroke="rgba(56,189,248,0.2)" strokeWidth="0.6" />
              {/* Ventilation fan */}
              <g transform="translate(60,50)" className="spin-slow" style={{ transformOrigin: 'center' }}>
                <circle r="14" fill="none" stroke={slate} strokeWidth="0.8" />
                <path d="M0,-10 L4,0 L-4,0 Z" fill={slate} opacity="0.4" />
                <path d="M0,-10 L4,0 L-4,0 Z" fill={slate} opacity="0.4" transform="rotate(120)" />
                <path d="M0,-10 L4,0 L-4,0 Z" fill={slate} opacity="0.4" transform="rotate(240)" />
              </g>
            </g>
          )}

          {/* Bench */}
          <rect x="0" y="230" width="400" height="30" fill="url(#benchGrad)" />
          <line x1="0" y1="230" x2="400" y2="230" stroke="rgba(56,189,248,0.25)" strokeWidth="1" />

          {/* Support stand (garage/shed) */}
          {(space === 'garage' || space === 'shed') && (
            <g className="fade-in">
              <rect x="176" y="228" width="60" height="4" fill="#334155" />
              <rect x="204" y="228" width="4" height="4" fill="#1e293b" />
              <line x1="206" y1="228" x2="206" y2="55" stroke="#475569" strokeWidth="3" />
              {/* Clamp for flask neck */}
              <g transform="translate(155,152)">
                <rect x="0" y="0" width="52" height="4" fill="#64748b" />
                <rect x="45" y="-1" width="7" height="6" fill="#334155" />
                {/* Clamp jaws */}
                <path d="M0 0 Q -6 5 0 10" fill="none" stroke="#94a3b8" strokeWidth="1.4" />
              </g>
            </g>
          )}

          {/* Thermal control base */}
          <g className="thermal">
            {(space === 'kitchen' && heatOn) && (
              // Mug warmer / hot plate
              <g>
                <rect x="120" y="205" width="70" height="18" rx="3" fill="#111827" stroke={amber} strokeWidth="1" />
                <rect x="124" y="209" width="62" height="10" rx="2" fill="url(#flameCore)" opacity="0.35" className="pulse" />
                <circle cx="180" cy="214" r="1.6" fill={emerald} className="pulse" />
                <text x="130" y="238" fill={slate} fontSize="6" fontFamily="ui-monospace, monospace">HOT PLATE</text>
              </g>
            )}
            {(isGarage && heatOn) && (
              // Larger magnetic stirrer hot plate
              <g>
                <rect x="115" y="200" width="82" height="24" rx="3" fill="#111827" stroke={amber} strokeWidth="1.2" />
                <rect x="119" y="204" width="74" height="12" rx="2" fill="url(#flameCore)" opacity="0.4" className="pulse-fast" />
                <circle cx="185" cy="216" r="2" fill={emerald} className="pulse" />
                <circle cx="175" cy="216" r="2" fill={rose} className="pulse" style={{ animationDelay: '0.5s' }} />
                <text x="118" y="238" fill={slate} fontSize="6" fontFamily="ui-monospace, monospace">STIRRER · HEAT</text>
              </g>
            )}
            {(isShed && heatOn) && (
              // Bunsen burner base + flame
              <g>
                <rect x="145" y="215" width="20" height="15" fill="#1e293b" stroke={slate} strokeWidth="0.8" />
                <rect x="151" y="200" width="8" height="18" fill="#0f172a" stroke={slate} strokeWidth="0.8" />
                {/* Air holes */}
                <circle cx="155" cy="220" r="0.8" fill={amber} />
                {/* Flame */}
                <path d="M147 200 Q155 155 163 200 Z" fill="url(#flameCore)" className="flame-flicker" style={{ transformOrigin: '155px 200px' }} />
                <path d="M150 200 Q155 175 160 200 Z" fill="url(#flameBlue)" className="flame-flicker" style={{ transformOrigin: '155px 200px', animationDelay: '0.15s' }} />
                <path d="M152 200 Q155 188 158 200 Z" fill="#fff" opacity="0.6" className="flame-flicker" style={{ transformOrigin: '155px 200px', animationDelay: '0.3s' }} />
                <text x="130" y="245" fill={slate} fontSize="6" fontFamily="ui-monospace, monospace">BUNSEN BURNER</text>
              </g>
            )}
            {(!heatOn && space) && (
              // Junior — plastic spill tray, no flame
              <g>
                <rect x="118" y="215" width="74" height="10" rx="3" fill="rgba(148,163,184,0.15)" stroke={slate} strokeWidth="0.8" strokeDasharray="3 2" />
                <text x="155" y="245" textAnchor="middle" fill={emerald} fontSize="6" fontFamily="ui-monospace, monospace">NO-FLAME · SPILL TRAY</text>
              </g>
            )}
          </g>

          {/* Reaction vessel */}
          {isRoundFlask ? (
            <g className="vessel">
              {/* Round-bottom flask */}
              <path d="M 140 170 L 140 155 L 170 155 L 170 170 A 30 30 0 1 1 140 170 Z"
                fill={glass} stroke={glassStroke} strokeWidth="1.5" strokeLinejoin="round" />
              {/* Liquid inside */}
              <path d="M 122 188 A 30 30 0 0 0 188 188 L 188 194 A 30 30 0 0 1 122 194 Z" fill="url(#liquidFlask)" />
              {/* Meniscus curve on liquid */}
              <path d="M 122 188 A 30 30 0 0 0 188 188" fill="none" stroke="rgba(56,189,248,0.85)" strokeWidth="0.8" />
              {/* Glare */}
              <ellipse cx="148" cy="175" rx="3" ry="10" fill="url(#glare)" opacity="0.5" />
              {/* Neck */}
              <rect x="146" y="140" width="18" height="20" fill={glass} stroke={glassStroke} strokeWidth="1" />
              <line x1="146" y1="142" x2="164" y2="142" stroke={glassStroke} strokeWidth="0.7" />
              {/* Boiling stone */}
              <circle cx="155" cy="203" r="1.4" fill={slate} />
            </g>
          ) : (
            <g className="vessel">
              {/* Beaker */}
              <path d="M 132 150 L 132 210 Q 132 220 142 220 L 168 220 Q 178 220 178 210 L 178 150"
                fill={glass} stroke={glassStroke} strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="132" y1="150" x2="178" y2="150" stroke={glassStroke} strokeWidth="1.5" />
              {/* Pour spout */}
              <path d="M132 150 L 126 146 L 130 152 Z" fill={glassStroke} />
              {/* Graduation marks */}
              {[170, 185, 200, 215].map((y, i) => (
                <g key={i}>
                  <line x1="132" y1={y} x2="139" y2={y} stroke={glassStroke} strokeWidth="0.5" opacity="0.7" />
                  <text x="127" y={y + 2} textAnchor="end" fill={slate} fontSize="4" fontFamily="ui-monospace, monospace">{[200, 150, 100, 50][i]}</text>
                </g>
              ))}
              {/* Liquid */}
              <path d="M 134 195 L 176 195 L 176 218 Q 176 220 174 220 L 136 220 Q 134 220 134 218 Z" fill="url(#liquid)" />
              {/* Meniscus */}
              <line x1="134" y1="195" x2="176" y2="195" stroke={mode === 'visual' ? purple : emerald} strokeWidth="0.7" />
              {/* Glare */}
              <rect x="137" y="155" width="3" height="55" fill="url(#glare)" opacity="0.6" />
              {/* Volume label */}
              <text x="155" y="140" textAnchor="middle" fill={cyan} fontSize="7" fontFamily="ui-monospace, monospace">250 mL BEAKER</text>
              {/* Magnetic stir bar (garage only) */}
              {isGarage && heatOn && (
                <ellipse cx="155" cy="217" rx="8" ry="1.6" fill="#e2e8f0" className="spin-bar" style={{ transformOrigin: '155px 217px' }} />
              )}
            </g>
          )}

          {/* Bubbles inside the vessel */}
          {focus && bubbles.map((b, i) => (
            <circle
              key={i}
              className="bubble"
              cx={b.x}
              cy={215}
              r={b.r}
              fill="rgba(56,189,248,0.65)"
              style={{ animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s` }}
            />
          ))}

          {/* Steam wisps rising when heat is on */}
          {heatOn && focus && (
            <g className="steam-group" filter="url(#softGlow)">
              {[0, 1, 2].map(i => (
                <path
                  key={`${tick}-${i}`}
                  d={`M ${145 + i * 5} 155 q -4 -10 2 -18 q 6 -8 -1 -18`}
                  fill="none"
                  stroke="rgba(226,232,240,0.55)"
                  strokeWidth="1.2"
                  className="steam"
                  style={{ animationDelay: `${i * 0.6}s` }}
                />
              ))}
            </g>
          )}

          {/* Distillation apparatus (compounds focus, non-junior) */}
          {focus === 'compounds' && user !== 'junior' && (
            <g className="fade-in">
              {/* Vapor path arrow */}
              <path d="M 165 155 Q 210 90 285 130 L 320 200"
                fill="none" stroke={cyan} strokeWidth="1.4" strokeDasharray="4 4" className="vapor" />
              {/* Liebig condenser (rotated tube with visible water jacket) */}
              <g transform="translate(210, 100) rotate(28)">
                <rect x="0" y="-2" width="90" height="20" rx="3" fill="rgba(56,189,248,0.1)" stroke={glassStroke} strokeWidth="1" />
                {/* Water jacket */}
                <rect x="4" y="3" width="82" height="10" fill="rgba(56,189,248,0.28)" />
                {/* Inner tube */}
                <line x1="0" y1="8" x2="90" y2="8" stroke={glassStroke} strokeWidth="0.6" opacity="0.6" />
                {/* Water flow inlet/outlet */}
                <circle cx="8" cy="-4" r="2.5" fill="#0f172a" stroke={cyan} strokeWidth="0.8" />
                <circle cx="82" cy="20" r="2.5" fill="#0f172a" stroke={cyan} strokeWidth="0.8" />
                {/* Flow dots animate along water jacket */}
                <circle cx="12" cy="8" r="1.4" fill={cyan} className="pulse" />
                <circle cx="32" cy="8" r="1.4" fill={cyan} className="pulse" style={{ animationDelay: '0.35s' }} />
                <circle cx="52" cy="8" r="1.4" fill={cyan} className="pulse" style={{ animationDelay: '0.7s' }} />
                <circle cx="72" cy="8" r="1.4" fill={cyan} className="pulse" style={{ animationDelay: '1.05s' }} />
                {/* Flow direction arrow */}
                <path d="M 20 -6 L 26 -6 L 24 -8 M 26 -6 L 24 -4" stroke={cyan} strokeWidth="0.8" fill="none" />
              </g>
              {/* Collection Erlenmeyer */}
              <g>
                <path d="M 305 200 L 315 175 L 315 165 L 335 165 L 335 175 L 345 200 Z"
                  fill={glass} stroke={glassStroke} strokeWidth="1.4" strokeLinejoin="round" />
                <path d="M 313 190 L 337 190 L 342 200 L 308 200 Z" fill="rgba(56,189,248,0.55)" />
                <line x1="313" y1="190" x2="337" y2="190" stroke={cyan} strokeWidth="0.7" />
              </g>
              <text x="325" y="220" textAnchor="middle" fill={slate} fontSize="7" fontFamily="ui-monospace, monospace">Collection</text>
              <text x="255" y="70" textAnchor="middle" fill={cyan} fontSize="7" fontFamily="ui-monospace, monospace">Liebig Condenser</text>
            </g>
          )}

          {/* Crystals (visual focus) */}
          {focus === 'visual' && crystals.map((c, i) => (
            <g key={i}>
              <polygon points={c.points} fill="rgba(168,85,247,0.55)" stroke={purple} strokeWidth="1"
                className="crystal-grow" style={{ transformOrigin: `${c.cx}px ${c.cy}px`, animationDelay: `${c.delay}s` }} />
              {/* Sparkle */}
              <circle cx={c.cx} cy={c.cy - 8} r="1" fill="#fff" className="pulse" style={{ animationDelay: `${c.delay + 0.6}s` }} />
            </g>
          ))}

          {/* Water molecule H2O (decor focus) */}
          {focus === 'decor' && (
            <g>
              <g className="molecule" style={{ transformOrigin: '260px 120px' }}>
                {/* Bonds */}
                <line x1="260" y1="120" x2="230" y2="100" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                <line x1="260" y1="120" x2="290" y2="100" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
                {/* Atoms */}
                {waterMolecule.map((a, i) => (
                  <g key={i}>
                    <circle cx={a.cx} cy={a.cy} r={a.r + 1.5} fill={a.fill} opacity="0.25" />
                    <circle cx={a.cx} cy={a.cy} r={a.r} fill={a.fill} />
                    <text x={a.cx} y={a.cy + 3.5} textAnchor="middle" fill={a.text} fontSize="10" fontWeight="800" fontFamily="ui-monospace, monospace">{a.label}</text>
                  </g>
                ))}
              </g>
              <text x="260" y="170" textAnchor="middle" fill={slate} fontSize="8" fontFamily="ui-monospace, monospace">H₂O</text>
            </g>
          )}

          {/* Junior safety: adult figure + goggles icon */}
          {user === 'junior' && focus && (
            <g className="fade-in">
              {/* Kid figure */}
              <circle cx="80" cy="215" r="4" fill={emerald} />
              <line x1="80" y1="219" x2="80" y2="232" stroke={emerald} strokeWidth="1.2" />
              <line x1="80" y1="224" x2="86" y2="228" stroke={emerald} strokeWidth="1" />
              <line x1="80" y1="232" x2="76" y2="240" stroke={emerald} strokeWidth="1" />
              <line x1="80" y1="232" x2="84" y2="240" stroke={emerald} strokeWidth="1" />
              {/* Adult figure */}
              <circle cx="60" cy="212" r="5" fill={amber} />
              <line x1="60" y1="217" x2="60" y2="235" stroke={amber} strokeWidth="1.4" />
              <line x1="60" y1="222" x2="75" y2="222" stroke={amber} strokeWidth="1.2" />
              <line x1="60" y1="235" x2="55" y2="245" stroke={amber} strokeWidth="1.2" />
              <line x1="60" y1="235" x2="65" y2="245" stroke={amber} strokeWidth="1.2" />
              <text x="70" y="255" textAnchor="middle" fill={amber} fontSize="6" fontFamily="ui-monospace, monospace">ADULT SUPERVISION</text>
              {/* Goggles icon */}
              <g transform="translate(80, 195)">
                <circle cx="-3" cy="0" r="2.6" fill="none" stroke={cyan} strokeWidth="0.9" />
                <circle cx="3" cy="0" r="2.6" fill="none" stroke={cyan} strokeWidth="0.9" />
                <line x1="-1" y1="0" x2="1" y2="0" stroke={cyan} strokeWidth="0.7" />
              </g>
            </g>
          )}

          {/* Vessel label (universal, non-idle) */}
          {focus && (
            <text x="155" y="253" textAnchor="middle" fill={cyan} fontSize="7" fontFamily="ui-monospace, monospace" opacity="0.6">
              {isRoundFlask ? 'Round-Bottom Flask' : 'Beaker'}
            </text>
          )}

          {/* Idle */}
          {!focus && (
            <g className="idle-hint">
              <circle cx="200" cy="130" r="60" fill="none" stroke="rgba(56,189,248,0.2)" strokeWidth="1" strokeDasharray="3 4" className="spin-slow" style={{ transformOrigin: '200px 130px' }} />
              <text x="200" y="126" textAnchor="middle" fill={slate} fontSize="10" fontFamily="ui-monospace, monospace">answer the questions</text>
              <text x="200" y="142" textAnchor="middle" fill={slate} fontSize="10" fontFamily="ui-monospace, monospace">to build your lab</text>
            </g>
          )}
        </svg>
      </div>

      {/* Metrics */}
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
          <div className="metric-value accent">{kit?.focusLabel || 'General Chemistry'}</div>
        </div>
      </div>
    </div>
  );
}
