// Inline SVG diagrams for each science — decorative but informative

export const scienceDiagrams = {
  physics: `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="60" r="5" fill="#38BDF8"/>
      <ellipse cx="100" cy="60" rx="45" ry="18" stroke="#38BDF8" stroke-width="1.5"/>
      <ellipse cx="100" cy="60" rx="45" ry="18" stroke="#10B981" stroke-width="1.5" transform="rotate(60 100 60)"/>
      <ellipse cx="100" cy="60" rx="45" ry="18" stroke="#A855F7" stroke-width="1.5" transform="rotate(120 100 60)"/>
      <circle cx="145" cy="60" r="2.5" fill="#38BDF8"/>
      <circle cx="55" cy="42" r="2.5" fill="#10B981"/>
      <circle cx="100" cy="15" r="2.5" fill="#A855F7"/>
      <text x="100" y="110" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Quantum orbitals</text>
    </svg>`,
  chemistry: `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="55" r="20" fill="none" stroke="#38BDF8" stroke-width="2"/>
      <circle cx="70" cy="40" r="12" fill="none" stroke="#10B981" stroke-width="2"/>
      <circle cx="130" cy="40" r="12" fill="none" stroke="#10B981" stroke-width="2"/>
      <circle cx="85" cy="80" r="12" fill="none" stroke="#A855F7" stroke-width="2"/>
      <circle cx="115" cy="80" r="12" fill="none" stroke="#A855F7" stroke-width="2"/>
      <line x1="100" y1="55" x2="70" y2="40" stroke="#64748B" stroke-width="1.5"/>
      <line x1="100" y1="55" x2="130" y2="40" stroke="#64748B" stroke-width="1.5"/>
      <line x1="100" y1="55" x2="85" y2="80" stroke="#64748B" stroke-width="1.5"/>
      <line x1="100" y1="55" x2="115" y2="80" stroke="#64748B" stroke-width="1.5"/>
      <text x="100" y="110" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Molecular structure</text>
    </svg>`,
  astronomy: `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="60" r="40" fill="none" stroke="#38BDF8" stroke-width="1.5" stroke-dasharray="2 4"/>
      <circle cx="100" cy="60" r="28" fill="none" stroke="#10B981" stroke-width="1.5" stroke-dasharray="2 4"/>
      <circle cx="100" cy="60" r="15" fill="#38BDF8" opacity="0.8"/>
      <circle cx="140" cy="60" r="3" fill="#10B981"/>
      <circle cx="72" cy="32" r="2.5" fill="#A855F7"/>
      <circle cx="72" cy="88" r="2" fill="#F59E0B"/>
      <circle cx="30" cy="20" r="1.5" fill="#94A3B8"/>
      <circle cx="170" cy="100" r="1.5" fill="#94A3B8"/>
      <circle cx="180" cy="30" r="1" fill="#94A3B8"/>
      <circle cx="20" cy="90" r="1" fill="#94A3B8"/>
      <text x="100" y="110" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Orbital mechanics</text>
    </svg>`,
  'earth-sciences': `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="100" cy="60" r="45" fill="none" stroke="#38BDF8" stroke-width="1.5"/>
      <circle cx="100" cy="60" r="35" fill="none" stroke="#10B981" stroke-width="1.5"/>
      <circle cx="100" cy="60" r="22" fill="none" stroke="#A855F7" stroke-width="1.5"/>
      <circle cx="100" cy="60" r="10" fill="#F59E0B" opacity="0.6"/>
      <path d="M 55 60 Q 75 35 100 45 Q 125 35 145 60" fill="none" stroke="#10B981" stroke-width="1.5" opacity="0.6"/>
      <path d="M 60 70 Q 80 80 100 75 Q 120 80 140 70" fill="none" stroke="#38BDF8" stroke-width="1" opacity="0.4"/>
      <text x="100" y="115" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Earth's layers</text>
    </svg>`,
  biophysics: `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M 40 60 Q 55 30 70 60 Q 85 90 100 60 Q 115 30 130 60 Q 145 90 160 60" fill="none" stroke="#38BDF8" stroke-width="2"/>
      <path d="M 40 65 Q 55 35 70 65 Q 85 95 100 65 Q 115 35 130 65 Q 145 95 160 65" fill="none" stroke="#10B981" stroke-width="2"/>
      <line x1="40" y1="60" x2="40" y2="65" stroke="#64748B" stroke-width="1.5"/>
      <line x1="70" y1="60" x2="70" y2="65" stroke="#64748B" stroke-width="1.5"/>
      <line x1="100" y1="60" x2="100" y2="65" stroke="#64748B" stroke-width="1.5"/>
      <line x1="130" y1="60" x2="130" y2="65" stroke="#64748B" stroke-width="1.5"/>
      <line x1="160" y1="60" x2="160" y2="65" stroke="#64748B" stroke-width="1.5"/>
      <text x="100" y="110" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">DNA double helix</text>
    </svg>`,
  'materials-science': `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="#38BDF8" stroke-width="1.5" fill="none">
        <polygon points="70,25 100,15 130,25 130,55 100,65 70,55"/>
        <polygon points="100,65 130,55 160,65 160,95 130,105 100,95"/>
        <polygon points="40,55 70,25 70,55 40,85 10,75 10,45"/>
      </g>
      <circle cx="70" cy="25" r="3" fill="#10B981"/>
      <circle cx="100" cy="15" r="3" fill="#10B981"/>
      <circle cx="130" cy="25" r="3" fill="#10B981"/>
      <circle cx="100" cy="65" r="3" fill="#A855F7"/>
      <circle cx="130" cy="55" r="3" fill="#A855F7"/>
      <circle cx="70" cy="55" r="3" fill="#A855F7"/>
      <circle cx="40" cy="55" r="3" fill="#F59E0B"/>
      <text x="100" y="115" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Crystal lattice</text>
    </svg>`,
  'mathematical-physics': `
    <svg viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <text x="100" y="50" text-anchor="middle" fill="#38BDF8" font-size="28" font-family="serif" font-style="italic">E=mc²</text>
      <text x="100" y="80" text-anchor="middle" fill="#10B981" font-size="16" font-family="serif" font-style="italic">iℏ∂ψ/∂t=Ĥψ</text>
      <text x="100" y="110" text-anchor="middle" fill="#64748B" font-size="8" font-family="monospace">Fundamental equations</text>
    </svg>`,
};
