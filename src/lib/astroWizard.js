// Astronomy Telescope & Gear Wizard — catalog + rules engine

export const CATALOG = {
  // ===== Optical Tube Assemblies =====
  ota_mak_beg: { name: 'Celestron NexStar 4SE Maksutov-Cassegrain (102 mm)', category: 'ota', price: 549, url: 'https://www.amazon.com/s?k=celestron+nexstar+4se', vendor: 'Amazon', spec: 'Compact catadioptric — planets & Moon' },
  ota_mak_int: { name: 'Sky-Watcher Skymax 127 Maksutov-Cassegrain', category: 'ota', price: 415, url: 'https://www.highpointscientific.com/skymax-127', vendor: 'High Point Scientific', spec: '127 mm apochromat-like planetary tube' },
  ota_refractor_beg: { name: 'Celestron Inspire 100AZ Refractor', category: 'ota', price: 249, url: 'https://www.amazon.com/s?k=celestron+inspire+100az', vendor: 'Amazon', spec: '100 mm achromatic refractor' },
  ota_refractor_int: { name: 'Explore Scientific ED 102 Refractor', category: 'ota', price: 799, url: 'https://www.agenaastro.com/explore-scientific-ed102', vendor: 'Agena Astro', spec: 'Doublet ED refractor — planetary detail' },
  ota_dob_8: { name: 'Sky-Watcher Classic 8" Dobsonian Reflector', category: 'ota', price: 549, url: 'https://www.highpointscientific.com/sky-watcher-8-classic-dob', vendor: 'High Point Scientific', spec: '203 mm f/6 Newtonian on Dob base' },
  ota_dob_10: { name: 'Apertura AD10 10" Dobsonian Reflector', category: 'ota', price: 869, url: 'https://www.highpointscientific.com/apertura-ad10', vendor: 'High Point Scientific', spec: '254 mm f/4.7 with 2-speed focuser' },
  ota_apo_triplet: { name: 'William Optics GT81 IV Apochromatic Triplet', category: 'ota', price: 1699, url: 'https://www.highpointscientific.com/william-optics-gt81', vendor: 'High Point Scientific', spec: '81 mm triplet APO — astrophotography' },
  ota_smart: { name: 'Unistellar eQuinox 2 Smart Robotic Telescope', category: 'ota', price: 2499, url: 'https://www.amazon.com/s?k=unistellar+equinox+2', vendor: 'Amazon', spec: 'Auto-tracking imaging telescope, app-controlled' },
  ota_tabletop_dob: { name: 'Zhumell Z130 Tabletop Dobsonian', category: 'ota', price: 259, url: 'https://www.amazon.com/s?k=zhumell+z130', vendor: 'Amazon', spec: '130 mm Newtonian — portable' },

  // ===== Mounts =====
  mount_az_basic: { name: 'Alt-Azimuth Manual Mount', category: 'mount', price: 129, url: 'https://www.amazon.com/s?k=alt+azimuth+telescope+mount', vendor: 'Amazon', spec: 'Intuitive up/down/left/right' },
  mount_az_goto: { name: 'Celestron SkyProdigy AZ GoTo Mount', category: 'mount', price: 449, url: 'https://www.highpointscientific.com/celestron-goto-mount', vendor: 'High Point Scientific', spec: 'Computerized StarSense target finder' },
  mount_eq_goto: { name: 'Sky-Watcher HEQ5 Pro German Equatorial GoTo', category: 'mount', price: 1749, url: 'https://www.highpointscientific.com/sky-watcher-heq5-pro', vendor: 'High Point Scientific', spec: 'Counterweighted tracking mount for AP' },
  mount_eq_advanced: { name: 'Celestron CGX-L Equatorial Mount', category: 'mount', price: 3599, url: 'https://www.highpointscientific.com/celestron-cgx-l', vendor: 'High Point Scientific', spec: 'Heavy-payload observatory-class EQ' },
  mount_field: { name: 'Ultra-lightweight Carbon Fiber Field Tripod', category: 'mount', price: 189, url: 'https://www.amazon.com/s?k=carbon+fiber+field+tripod+telescope', vendor: 'Amazon', spec: 'Collapsible backpack-ready base' },

  // ===== Eyepieces / magnification =====
  eyepiece_kit: { name: 'Celestron 1.25" Eyepiece & Filter Accessory Kit', category: 'optics', price: 129, url: 'https://www.amazon.com/s?k=celestron+eyepiece+filter+kit', vendor: 'Amazon', spec: '5 Plossl eyepieces + 2x Barlow + filters' },
  eyepiece_premium: { name: 'Explore Scientific 82° Waterproof Eyepiece Set', category: 'optics', price: 379, url: 'https://www.agenaastro.com/explore-scientific-82-set', vendor: 'Agena Astro', spec: '11/18/24 mm wide-field premium set' },
  barlow_2x: { name: 'Astro Essentials 2x Barlow Lens (1.25")', category: 'optics', price: 39, url: 'https://www.amazon.com/s?k=2x+barlow+lens', vendor: 'Amazon', spec: 'Doubles magnification of every eyepiece' },
  diagonal: { name: 'Star Diagonal, 1.25" 90\u00b0 dielectric', category: 'optics', price: 79, url: 'https://www.amazon.com/s?k=star+diagonal+1.25+dielectric', vendor: 'Amazon', spec: 'Comfortable viewing angle for refractors/Maks' },
  finder_redot: { name: 'Telrad Reflex Finder Sight', category: 'optics', price: 44, url: 'https://www.amazon.com/s?k=telrad+finder', vendor: 'Amazon', spec: 'Zero-magnification red-dot target locator' },
  collimator: { name: 'Astromania Laser Collimator', category: 'optics', price: 39, url: 'https://www.amazon.com/s?k=laser+collimator+telescope', vendor: 'Amazon', spec: 'Aligns reflector mirrors' },

  // ===== Filters =====
  moon_filter: { name: 'Variable Polarizing Moon Filter', category: 'filters', price: 22, url: 'https://www.amazon.com/s?k=variable+moon+filter', vendor: 'Amazon', spec: 'Dial in Moon brightness' },
  lpr_filter: { name: 'Astronomik CLS Light-Pollution Filter', category: 'filters', price: 89, url: 'https://www.agenaastro.com/astronomik-cls', vendor: 'Agena Astro', spec: 'Cuts sodium & mercury sky glow' },
  uhc_filter: { name: 'Astronomik UHC Nebula Filter', category: 'filters', price: 139, url: 'https://www.agenaastro.com/astronomik-uhc', vendor: 'Agena Astro', spec: 'Boosts H-\u03b1/OIII emission on nebulae' },

  // ===== Dark-sky / comfort essentials =====
  red_light: { name: 'Celestron Night Vision Red LED Flashlight', category: 'darksky', price: 18, url: 'https://www.amazon.com/s?k=red+astronomy+flashlight+celestron', vendor: 'Amazon', spec: 'Preserves dark-adapted vision' },
  planisphere: { name: 'David Chandler Waterproof Planisphere / Star Wheel', category: 'darksky', price: 14, url: 'https://www.amazon.com/s?k=waterproof+planisphere', vendor: 'Amazon', spec: 'All-weather sky map, no batteries' },
  star_atlas: { name: 'Sky & Telescope Pocket Sky Atlas (spiral, jumbo)', category: 'darksky', price: 32, url: 'https://www.amazon.com/s?k=pocket+sky+atlas+jumbo', vendor: 'Amazon', spec: 'Deep-sky navigation charts' },
  observer_chair: { name: 'Stardust Adjustable Observing Chair', category: 'darksky', price: 149, url: 'https://www.highpointscientific.com/observing-chair', vendor: 'High Point Scientific', spec: 'Height-adjustable eyepiece-level seat' },

  // ===== Astrophotography =====
  dew_heater: { name: 'Celestron Smart DewHeater Ring', category: 'ap', price: 79, url: 'https://www.amazon.com/s?k=celestron+dew+heater', vendor: 'Amazon', spec: 'Prevents dew on optics during long sessions' },
  bahtinov: { name: 'Bahtinov Focusing Mask', category: 'ap', price: 24, url: 'https://www.amazon.com/s?k=bahtinov+focusing+mask', vendor: 'Amazon', spec: 'Precise focus for star imaging' },
  t_ring: { name: 'T-Ring & 1.25" Camera Adapter', category: 'ap', price: 22, url: 'https://www.amazon.com/s?k=t-ring+camera+adapter+telescope', vendor: 'Amazon', spec: 'Attaches DSLR/mirrorless body to focuser' },
  guide_scope: { name: 'Orion 50 mm Guide Scope + StarShoot Autoguider', category: 'ap', price: 429, url: 'https://www.highpointscientific.com/orion-guide-scope', vendor: 'High Point Scientific', spec: 'Locks tracking on a guide star' },
  power_bank: { name: 'Celestron PowerTank Lithium Pro', category: 'ap', price: 259, url: 'https://www.amazon.com/s?k=celestron+powertank+lithium+pro', vendor: 'Amazon', spec: '12V field power for mounts + cameras' },
};

export const QUESTIONS = [
  {
    id: 'target',
    title: 'What do you want to observe?',
    subtitle: 'Target filter',
    options: [
      { id: 'planets', label: 'Moon & Planets', sub: 'High magnification', icon: '\ud83c\udf19' },
      { id: 'deepsky', label: 'Galaxies, Nebulae & Deep Space', sub: 'Light gathering', icon: '\ud83c\udf0c' },
      { id: 'astrophoto', label: 'Astrophotography', sub: 'Long exposures & imaging', icon: '\ud83d\udcf8' },
    ],
  },
  {
    id: 'environment',
    title: 'Where will you stargaze most?',
    subtitle: 'Environment & portability',
    options: [
      { id: 'backyard', label: 'Light-Polluted City / Backyard', sub: 'Fairly fixed', icon: '\ud83c\udfe1' },
      { id: 'travel', label: 'Dark Sky Park / Travel', sub: 'Fits in a trunk', icon: '\ud83d\ude97' },
      { id: 'backcountry', label: 'Backcountry Hiking', sub: 'Ultra-portable backpack', icon: '\ud83e\udd7e' },
    ],
  },
  {
    id: 'experience',
    title: 'How much experience do you have?',
    subtitle: 'Aligning and tracking',
    options: [
      { id: 'beginner', label: 'Total Beginner', sub: 'Manual point-and-shoot', icon: '\ud83d\udd0d' },
      { id: 'intermediate', label: 'Intermediate Tech-Lover', sub: 'Computerized GoTo trackers', icon: '\ud83d\udef0' },
      { id: 'advanced', label: 'Advanced Operator', sub: 'Equatorial + tracking software', icon: '\u2699' },
    ],
  },
  {
    id: 'budget',
    title: 'Target starting investment?',
    subtitle: 'Affiliate vendor engine',
    options: [
      { id: 'entry', label: 'Entry Explorer', sub: 'Under $150', icon: '\ud83e\ude99' },
      { id: 'serious', label: 'Serious Intermediate', sub: '$150 \u2013 $500', icon: '\ud83d\udcb5' },
      { id: 'elite', label: 'Elite Observatory', sub: '$500+', icon: '\ud83d\udcb3' },
    ],
  },
];

export function computeKit({ target, environment, experience, budget }) {
  const out = {
    ota: [], mount: [], optics: [], filters: [], darksky: [], ap: [],
    bundle: null, banners: [], focusLabel: '', vendor: 'Amazon', otaKind: '',
  };
  if (!target || !environment || !experience || !budget) return out;

  // ===== Optical tube selection =====
  if (target === 'planets') {
    out.focusLabel = 'Moon & Planets';
    if (budget === 'entry') { out.ota.push('ota_refractor_beg'); out.otaKind = 'refractor'; }
    else if (budget === 'serious') { out.ota.push('ota_mak_beg'); out.otaKind = 'mak'; }
    else { out.ota.push('ota_mak_int'); out.otaKind = 'mak'; }
  } else if (target === 'deepsky') {
    out.focusLabel = 'Galaxies & Nebulae';
    if (environment === 'backcountry') { out.ota.push('ota_tabletop_dob'); out.otaKind = 'dob'; }
    else if (budget === 'entry') { out.ota.push('ota_tabletop_dob'); out.otaKind = 'dob'; }
    else if (budget === 'serious') { out.ota.push('ota_dob_8'); out.otaKind = 'dob'; }
    else { out.ota.push('ota_dob_10'); out.otaKind = 'dob'; }
  } else if (target === 'astrophoto') {
    out.focusLabel = 'Astrophotography';
    if (budget === 'entry') { out.ota.push('ota_refractor_beg'); out.otaKind = 'refractor'; out.banners.push('Full astrophotography rigs typically start above $500 — plan to upgrade the OTA soon.'); }
    else if (budget === 'serious') { out.ota.push('ota_smart'); out.otaKind = 'smart'; }
    else { out.ota.push('ota_apo_triplet'); out.otaKind = 'apo'; }
  }

  // ===== Mount selection =====
  if (environment === 'backcountry') {
    out.mount.push('mount_field');
  } else if (target === 'astrophoto' || experience === 'advanced') {
    if (budget === 'elite') out.mount.push('mount_eq_advanced');
    else out.mount.push('mount_eq_goto');
  } else if (experience === 'beginner' || environment === 'backyard') {
    if (experience === 'intermediate') out.mount.push('mount_az_goto');
    else out.mount.push('mount_az_basic');
  } else if (experience === 'intermediate') {
    out.mount.push('mount_az_goto');
  } else {
    out.mount.push('mount_az_basic');
  }

  // ===== Optics / eyepieces =====
  if (budget === 'entry') {
    out.optics.push('barlow_2x', 'finder_redot');
  } else if (budget === 'serious') {
    out.optics.push('eyepiece_kit', 'finder_redot');
    if (out.otaKind === 'refractor' || out.otaKind === 'mak' || out.otaKind === 'apo') out.optics.push('diagonal');
  } else {
    out.optics.push('eyepiece_premium', 'barlow_2x', 'finder_redot');
    if (out.otaKind === 'refractor' || out.otaKind === 'mak' || out.otaKind === 'apo') out.optics.push('diagonal');
  }
  if (out.otaKind === 'dob') out.optics.push('collimator');

  // ===== Filters =====
  out.filters.push('moon_filter');
  if (environment === 'backyard') out.filters.push('lpr_filter');
  if (target === 'deepsky' && budget !== 'entry') out.filters.push('uhc_filter');

  // ===== Dark-sky essentials =====
  out.darksky.push('red_light', 'planisphere');
  if (target === 'deepsky' && budget !== 'entry') out.darksky.push('star_atlas');
  if (budget === 'elite' && environment !== 'backcountry') out.darksky.push('observer_chair');

  // ===== Astrophotography =====
  if (target === 'astrophoto') {
    out.ap.push('dew_heater', 'bahtinov', 't_ring');
    if (budget !== 'entry') out.ap.push('power_bank');
    if (budget === 'elite') out.ap.push('guide_scope');
  }

  // ===== Vendor routing =====
  if (budget === 'entry') out.vendor = 'Amazon';
  else if (budget === 'serious') out.vendor = 'High Point Scientific';
  else out.vendor = 'Agena Astro';

  // Dedupe
  for (const k of ['ota', 'mount', 'optics', 'filters', 'darksky', 'ap']) {
    out[k] = [...new Set(out[k])];
  }
  return out;
}

export function kitTotal(kit) {
  const ids = [...kit.ota, ...kit.mount, ...kit.optics, ...kit.filters, ...kit.darksky, ...kit.ap];
  return ids.reduce((sum, id) => sum + (CATALOG[id]?.price || 0), 0);
}

export function itemCount(kit) {
  return kit.ota.length + kit.mount.length + kit.optics.length + kit.filters.length + kit.darksky.length + kit.ap.length;
}
