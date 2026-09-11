import { CATALOG, computeKit, kitTotal, itemCount, QUESTIONS } from '../src/lib/astroWizard.js';

const targets = ['planets', 'deepsky', 'astrophoto'];
const envs = ['backyard', 'travel', 'backcountry'];
const exps = ['beginner', 'intermediate', 'advanced'];
const budgets = ['entry', 'serious', 'elite'];

const rows = [];
const failures = [];
const mustHave = ['red_light', 'planisphere']; // dark-sky safety per master prompt

for (const t of targets) for (const env of envs) for (const exp of exps) for (const b of budgets) {
  const kit = computeKit({ target: t, environment: env, experience: exp, budget: b });
  const total = kitTotal(kit);
  const count = itemCount(kit);
  const allIds = [...kit.ota, ...kit.mount, ...kit.optics, ...kit.filters, ...kit.darksky, ...kit.ap];
  const missingCatalog = allIds.filter(id => !CATALOG[id]);
  const missingSafety = mustHave.filter(id => !kit.darksky.includes(id));
  const noOTA = kit.ota.length === 0;
  const noMount = kit.mount.length === 0;
  const errs = [];
  if (missingCatalog.length) errs.push('missing_catalog:' + missingCatalog.join(','));
  if (missingSafety.length) errs.push('missing_safety:' + missingSafety.join(','));
  if (noOTA) errs.push('no_ota');
  if (noMount) errs.push('no_mount');

  // Astrophotography-specific requirements per master prompt
  if (t === 'astrophoto') {
    if (!kit.ap.includes('dew_heater')) errs.push('astrophoto_needs_dew_heater');
    if (!kit.ap.includes('bahtinov')) errs.push('astrophoto_needs_bahtinov');
  }

  // Backcountry must be ultra-portable
  if (env === 'backcountry' && !kit.mount.includes('mount_field')) errs.push('backcountry_needs_field_tripod');

  // Deep-sky should have a Dobsonian (light gathering)
  if (t === 'deepsky') {
    const dobIds = ['ota_dob_8', 'ota_dob_10', 'ota_tabletop_dob'];
    if (!dobIds.some(id => kit.ota.includes(id))) errs.push('deepsky_needs_dob');
  }

  // Reflectors need collimator
  const hasDob = ['ota_dob_8', 'ota_dob_10', 'ota_tabletop_dob'].some(id => kit.ota.includes(id));
  if (hasDob && !kit.optics.includes('collimator')) errs.push('dob_needs_collimator');

  if (errs.length) failures.push({ target: t, env, exp, budget: b, errs, count, total });
  rows.push({ combo: `${t}/${env}/${exp}/${b}`, ota: kit.ota[0] || '-', mount: kit.mount[0] || '-', vendor: kit.vendor, count, total });
}

console.log('=== SUMMARY ===');
console.log('Total combos: ' + rows.length);
console.log('Failures: ' + failures.length);
if (failures.length) {
  console.log('\n=== FAILURES ===');
  for (const f of failures) console.log(JSON.stringify(f));
}
console.log('\n=== SAMPLE ROWS ===');
for (const r of rows.slice(0, 6)) console.log(r.combo.padEnd(50), 'ota=' + r.ota.padEnd(22), 'mount=' + r.mount.padEnd(20), 'vendor=' + r.vendor.padEnd(22), 'items=' + r.count, '$' + r.total);
console.log('...');
for (const r of rows.slice(-6)) console.log(r.combo.padEnd(50), 'ota=' + r.ota.padEnd(22), 'mount=' + r.mount.padEnd(20), 'vendor=' + r.vendor.padEnd(22), 'items=' + r.count, '$' + r.total);

// Vendor distribution
const byVendor = {};
for (const r of rows) byVendor[r.vendor] = (byVendor[r.vendor] || 0) + 1;
console.log('\n=== VENDOR DISTRIBUTION ===');
console.log(byVendor);

// Total range
const totals = rows.map(r => r.total).sort((a,b)=>a-b);
console.log('\n=== PRICE RANGE ===');
console.log('min=$' + totals[0], 'median=$' + totals[Math.floor(totals.length/2)], 'max=$' + totals[totals.length-1]);
