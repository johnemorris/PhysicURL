// Home Chemistry Lab Wizard — catalog + rules engine
// Each item: id, name, category, price (usd), tier, notes, materialTag, url (amazon affiliate placeholder)

export const CATALOG = {
  // ===== Safety =====
  goggles_plastic: { name: 'Splash-Proof Safety Goggles (kids)', category: 'safety', price: 9, url: 'https://www.amazon.com/s?k=kids+lab+safety+goggles' },
  goggles_adult: { name: 'ANSI Z87.1 Chemical Splash Goggles', category: 'safety', price: 14, url: 'https://www.amazon.com/s?k=chemical+splash+goggles' },
  gloves_nitrile: { name: 'Nitrile Gloves (100 ct)', category: 'safety', price: 12, url: 'https://www.amazon.com/s?k=nitrile+gloves+lab' },
  apron: { name: 'PVC Chemical-Resistant Apron', category: 'safety', price: 15, url: 'https://www.amazon.com/s?k=chemical+lab+apron' },
  spill_tray: { name: 'Heavy-Duty Plastic Spill Tray', category: 'safety', price: 18, url: 'https://www.amazon.com/s?k=lab+spill+tray' },
  storage_tote: { name: 'Lockable Plastic Storage Tote', category: 'safety', price: 22, url: 'https://www.amazon.com/s?k=lockable+plastic+tote' },
  fire_blanket: { name: 'Fire Blanket (fiberglass)', category: 'safety', price: 24, url: 'https://www.amazon.com/s?k=fire+blanket+lab' },
  ventilation_fan: { name: 'Window Ventilation Fan', category: 'safety', price: 45, url: 'https://www.amazon.com/s?k=window+exhaust+fan' },
  adult_banner: { name: 'ADULT SUPERVISION REQUIRED', category: 'safety', price: 0, banner: true },

  // ===== Core measurement / tools =====
  beakers_plastic: { name: 'Plastic Beaker Set (50–1000 mL)', category: 'core', price: 14, url: 'https://www.amazon.com/s?k=plastic+beaker+set' },
  beakers_glass: { name: 'Borosilicate Beaker Set (50–1000 mL)', category: 'core', price: 28, url: 'https://www.amazon.com/s?k=borosilicate+beaker+set' },
  cylinders_plastic: { name: 'Plastic Graduated Cylinders (10/50/100 mL)', category: 'core', price: 12, url: 'https://www.amazon.com/s?k=plastic+graduated+cylinder+set' },
  cylinders_glass: { name: 'Borosilicate Graduated Cylinders (10/50/100 mL)', category: 'core', price: 24, url: 'https://www.amazon.com/s?k=borosilicate+graduated+cylinder' },
  scale_basic: { name: 'Pocket Digital Scale (0.01 g)', category: 'core', price: 15, url: 'https://www.amazon.com/s?k=pocket+digital+scale' },
  scale_analytical: { name: 'Digital Analytical Balance (0.001 g)', category: 'core', price: 145, url: 'https://www.amazon.com/s?k=analytical+balance+0.001g' },
  thermometer: { name: 'Alcohol Lab Thermometer (-10\u2013110 \u00b0C)', category: 'core', price: 8, url: 'https://www.amazon.com/s?k=alcohol+lab+thermometer' },
  ph_strips: { name: 'pH Test Strips (0\u201314)', category: 'core', price: 9, url: 'https://www.amazon.com/s?k=ph+test+strips' },
  stir_rods: { name: 'Glass Stirring Rods (5-pack)', category: 'core', price: 7, url: 'https://www.amazon.com/s?k=glass+stirring+rods' },
  funnel: { name: 'Plastic Filter Funnel Set', category: 'core', price: 10, url: 'https://www.amazon.com/s?k=lab+filter+funnel' },
  filter_paper: { name: 'Filter Paper (100 sheets)', category: 'core', price: 8, url: 'https://www.amazon.com/s?k=lab+filter+paper' },
  notebook: { name: 'Carbonless Laboratory Notebook', category: 'core', price: 16, url: 'https://www.amazon.com/s?k=carbonless+lab+notebook' },

  // ===== Heat =====
  mug_warmer: { name: 'Low-Temp Mug Warmer (safe kitchen heat)', category: 'heat', price: 12, url: 'https://www.amazon.com/s?k=mug+warmer' },
  alcohol_lamp: { name: 'Glass Alcohol Lamp', category: 'heat', price: 11, url: 'https://www.amazon.com/s?k=alcohol+lamp+lab' },
  hotplate_basic: { name: 'Ceramic Hot Plate (500 W)', category: 'heat', price: 42, url: 'https://www.amazon.com/s?k=lab+hot+plate' },
  hotplate_stirrer: { name: 'Digital Magnetic Hotplate Stirrer', category: 'heat', price: 129, url: 'https://www.amazon.com/s?k=magnetic+hotplate+stirrer' },
  heating_mantle: { name: 'Heating Mantle (250 mL)', category: 'heat', price: 155, url: 'https://www.amazon.com/s?k=heating+mantle+250ml' },
  bunsen_burner: { name: 'Bunsen Burner + Fuel Set', category: 'heat', price: 38, url: 'https://www.amazon.com/s?k=bunsen+burner+kit' },

  // ===== Reactions / crystals focus =====
  test_tubes_plastic: { name: 'Plastic Test Tubes + Rack (24 ct)', category: 'specialized', price: 14, url: 'https://www.amazon.com/s?k=plastic+test+tubes+rack' },
  test_tubes_glass: { name: 'Borosilicate Test Tubes + Rack (24 ct)', category: 'specialized', price: 22, url: 'https://www.amazon.com/s?k=borosilicate+test+tubes' },
  petri_dishes: { name: 'Petri Dishes (10-pack)', category: 'specialized', price: 12, url: 'https://www.amazon.com/s?k=petri+dishes+glass' },
  crystal_starter: { name: 'Alum / Copper Sulfate Crystal Growing Kit', category: 'specialized', price: 25, url: 'https://www.amazon.com/s?k=crystal+growing+kit' },

  // ===== Compounds / extraction focus =====
  round_flask: { name: 'Round-Bottom Flask, 24/40 (500 mL)', category: 'specialized', price: 32, url: 'https://www.amazon.com/s?k=round+bottom+flask+24+40' },
  condenser: { name: 'Liebig Condenser, 24/40', category: 'specialized', price: 48, url: 'https://www.amazon.com/s?k=liebig+condenser+24+40' },
  distill_adapter: { name: 'Distillation Adapter Set, 24/40', category: 'specialized', price: 36, url: 'https://www.amazon.com/s?k=distillation+adapter+24+40' },
  sep_funnel: { name: 'Separatory Funnel, 24/40 (500 mL)', category: 'specialized', price: 55, url: 'https://www.amazon.com/s?k=separatory+funnel+500ml' },
  support_stand: { name: 'Cast-Iron Support Stand + Multi-Clamps', category: 'specialized', price: 34, url: 'https://www.amazon.com/s?k=lab+support+stand+clamps' },

  // ===== Decor / molecular focus =====
  periodic_display: { name: 'Acrylic Periodic Table w/ Real Elements', category: 'specialized', price: 78, url: 'https://www.amazon.com/s?k=periodic+table+real+elements+acrylic' },
  molecule_kit: { name: 'Organic Molecular Model Kit', category: 'specialized', price: 32, url: 'https://www.amazon.com/s?k=organic+chemistry+model+kit' },
  wall_posters: { name: 'Vintage Chemistry Wall Art Set', category: 'specialized', price: 22, url: 'https://www.amazon.com/s?k=vintage+chemistry+poster' },

  // ===== Bundles =====
  bundle_amazon_starter: { name: 'Amazon Starter Chem Bundle', category: 'bundle', price: 49, url: 'https://www.amazon.com/s?k=home+chemistry+starter+kit', vendor: 'Amazon' },
  bundle_hst_intermediate: { name: 'Home Science Tools Beginner Chem Set', category: 'bundle', price: 129, url: 'https://www.homesciencetools.com/', vendor: 'Home Science Tools' },
  bundle_carolina_advanced: { name: 'Carolina Biological Advanced Chem Kit', category: 'bundle', price: 249, url: 'https://www.carolina.com/', vendor: 'Carolina Biological' },
};

export const QUESTIONS = [
  {
    id: 'user',
    title: 'Who is using the lab?',
    subtitle: 'Experience & materials filter',
    options: [
      { id: 'junior', label: 'Junior Scientist', sub: 'Ages 8\u201313', icon: '\ud83e\uddd2' },
      { id: 'student', label: 'Student / Beginner', sub: 'Ages 14+', icon: '\ud83c\udf92' },
      { id: 'hobbyist', label: 'Independent Hobbyist', sub: 'Adult', icon: '\ud83d\udd2c' },
    ],
  },
  {
    id: 'space',
    title: 'Where will you run experiments?',
    subtitle: 'Safety & ventilation filter',
    options: [
      { id: 'kitchen', label: 'Kitchen Counter or Table', sub: 'Shared indoor space', icon: '\ud83c\udf73' },
      { id: 'garage', label: 'Garage or Spare Room', sub: 'Dedicated bench', icon: '\ud83d\ude97' },
      { id: 'shed', label: 'Ventilated Shed / Workshop', sub: 'Full ventilation', icon: '\ud83c\udfe1' },
    ],
  },
  {
    id: 'focus',
    title: 'What is your primary focus?',
    subtitle: 'Specialized gear filter',
    options: [
      { id: 'visual', label: 'Visual Reactions & Crystals', sub: 'Color changes, growth', icon: '\ud83c\udf0b' },
      { id: 'compounds', label: 'Compounds & Extractions', sub: 'Distillation, purification', icon: '\ud83e\uddea' },
      { id: 'decor', label: 'Decor & Molecular Study', sub: 'Display, models, art', icon: '\ud83c\udfa8' },
    ],
  },
  {
    id: 'budget',
    title: 'What is your starting budget?',
    subtitle: 'Affiliate vendor engine',
    options: [
      { id: 'micro', label: 'Micro-Budget', sub: 'Under $50', icon: '\ud83e\ude99' },
      { id: 'starter', label: 'Standard Starter', sub: '$50 \u2013 $150', icon: '\ud83d\udcb5' },
      { id: 'serious', label: 'Serious Setup', sub: '$150+', icon: '\ud83d\udcb3' },
    ],
  },
];

// The rules engine. Returns { safety, core, specialized, bundle, banners, focusLabel, vendor }
export function computeKit({ user, space, focus, budget }) {
  const out = { safety: [], core: [], specialized: [], bundle: null, banners: [], focusLabel: '', vendor: 'Amazon', material: 'plastic' };
  if (!user || !space || !focus || !budget) return out;

  // Material tier based on user
  if (user === 'junior') {
    out.material = 'plastic';
    out.banners.push(CATALOG.adult_banner.name);
    out.safety.push('goggles_plastic', 'gloves_nitrile');
    out.core.push('beakers_plastic', 'cylinders_plastic', 'thermometer', 'ph_strips', 'funnel', 'filter_paper');
  } else if (user === 'student') {
    out.material = 'borosilicate';
    out.safety.push('goggles_adult', 'gloves_nitrile', 'apron');
    out.core.push('beakers_glass', 'cylinders_glass', 'thermometer', 'ph_strips', 'stir_rods', 'funnel', 'filter_paper', 'notebook');
  } else if (user === 'hobbyist') {
    out.material = 'jointed-glass';
    out.safety.push('goggles_adult', 'gloves_nitrile', 'apron', 'fire_blanket');
    out.core.push('beakers_glass', 'cylinders_glass', 'thermometer', 'ph_strips', 'stir_rods', 'funnel', 'filter_paper', 'notebook');
  }

  // Space rules
  if (space === 'kitchen') {
    out.safety.push('spill_tray', 'storage_tote');
    if (user !== 'junior') out.core.push('mug_warmer');
  } else if (space === 'garage') {
    out.safety.push('spill_tray', 'ventilation_fan');
    out.core.push('support_stand');
    if (user === 'student') out.core.push('alcohol_lamp');
    if (user === 'hobbyist') out.core.push('hotplate_basic');
  } else if (space === 'shed') {
    out.safety.push('ventilation_fan', 'fire_blanket');
    out.core.push('support_stand');
    if (user === 'hobbyist') out.core.push('heating_mantle', 'bunsen_burner');
    else if (user === 'student') out.core.push('hotplate_basic');
    else out.core.push('mug_warmer');
  }

  // Focus rules
  if (focus === 'visual') {
    out.focusLabel = 'Visual Reactions & Crystals';
    out.specialized.push(user === 'junior' ? 'test_tubes_plastic' : 'test_tubes_glass');
    out.specialized.push('petri_dishes', 'crystal_starter');
    if (user !== 'junior') out.specialized.push('stir_rods');
  } else if (focus === 'compounds') {
    out.focusLabel = 'Compounds & Extractions';
    if (user === 'junior') {
      // Junior can't do organic — swap to safer alternative
      out.specialized.push('test_tubes_plastic', 'crystal_starter');
    } else {
      out.specialized.push('round_flask', 'condenser', 'distill_adapter');
      if (user === 'hobbyist') out.specialized.push('sep_funnel');
    }
  } else if (focus === 'decor') {
    out.focusLabel = 'Decor & Molecular Study';
    out.specialized.push('periodic_display', 'molecule_kit', 'wall_posters');
  }

  // Budget → vendor + optional upgrades / bundle
  if (budget === 'micro') {
    out.vendor = 'Amazon';
    out.bundle = 'bundle_amazon_starter';
  } else if (budget === 'starter') {
    out.vendor = 'Home Science Tools';
    out.bundle = 'bundle_hst_intermediate';
    if (user !== 'junior' && !out.core.includes('hotplate_basic') && !out.core.includes('heating_mantle')) {
      out.core.push('hotplate_basic');
    }
  } else if (budget === 'serious') {
    out.vendor = 'Carolina Biological';
    out.bundle = 'bundle_carolina_advanced';
    if (user !== 'junior') {
      out.core.push('scale_analytical');
      if (!out.core.includes('hotplate_stirrer')) out.core.push('hotplate_stirrer');
    }
  } else if (user !== 'junior') {
    out.core.push('scale_basic');
  }

  // Dedupe
  out.safety = [...new Set(out.safety)];
  out.core = [...new Set(out.core)];
  out.specialized = [...new Set(out.specialized)];
  return out;
}

export function kitTotal(kit) {
  const ids = [...kit.safety, ...kit.core, ...kit.specialized];
  return ids.reduce((sum, id) => sum + (CATALOG[id]?.price || 0), 0);
}
