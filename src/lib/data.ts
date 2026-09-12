/**
 * data.ts — shared constants and pure utility functions.
 *
 * This module is imported by BOTH server-side Astro pages (via data-node.ts)
 * AND client-side React components (e.g. SubmitModal). Keep it free of any
 * Node.js imports (fs, path) so it is safe to bundle in the browser.
 *
 * Node-only data-loading functions (loadResources, loadSubmissions, etc.) live
 * in data-node.ts, which is only imported from Astro build-time code.
 */

import type { Resource, ScienceConfig, SEOContent, TreeScience, Submission } from './types';

// ---------------------------------------------------------------------------
// Science catalogue — single source of truth
// ---------------------------------------------------------------------------
export const SCIENCES: ScienceConfig[] = [
  { slug: 'physics', name: 'Physics', description: 'The fundamental science of matter, energy, space, and time. Browse databases, simulators, university programs, and research portals.', icon: 'atom' },
  { slug: 'chemistry', name: 'Chemistry', description: 'The science of matter — composition, structure, properties, and transformations. Browse databases, molecular tools, and educational platforms.', icon: 'flask' },
  { slug: 'astronomy', name: 'Astronomy', description: 'The science of celestial objects and the physical universe. Browse observatories, sky surveys, telescope archives, and cosmology research.', icon: 'telescope' },
  { slug: 'earth-sciences', name: 'Earth Sciences', description: 'Geology, meteorology, oceanography, and environmental science. Browse USGS data, NOAA archives, GIS tools, and climate resources.', icon: 'globe' },
  { slug: 'biophysics', name: 'Biophysics', description: 'Physics applied to biological systems. Browse structural databases, molecular visualization tools, and research organizations.', icon: 'dna' },
  { slug: 'materials-science', name: 'Materials Science', description: 'Properties and applications of materials. Browse crystallography databases, simulation tools, and nanotechnology resources.', icon: 'crystal' },
  { slug: 'mathematical-physics', name: 'Mathematical Physics', description: 'Mathematical methods for physics. Browse computational tools, reference databases, and educational resources.', icon: 'sigma' },
];

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  portal: 'Portal', database: 'Database', journal: 'Journal', tool: 'Tool',
  reference: 'Reference', educational: 'Educational', tutorial: 'Tutorial',
  organization: 'Organization', book: 'Book', kit: 'Kit', equipment: 'Equipment',
  course: 'Course', video: 'Video', supply: 'Supply',
  portal_lab: 'Portal / Lab',
};

export const ACCESS_LABELS: Record<string, string> = {
  free: 'Free', paid: 'Paid', freemium: 'Freemium', open_access: 'Open Access', open: 'Open', subscription: 'Subscription',
};

// ---------------------------------------------------------------------------
// Pure utility functions — safe in both browser and Node
// ---------------------------------------------------------------------------

/** Normalise a raw JSON record into a typed Resource object. */
export function normalizeResource(r: any): Resource {
  return {
    id: r.id,
    title: r.name || r.title,
    url: r.url,
    domain: r.domain || new URL(r.url).hostname,
    description: r.description || '',
    science: r.science,
    subdiscipline: r.subdiscipline || 'General',
    resourceType: r.resourceType || r.resource_type || 'reference',
    access: r.access || 'free',
    rating: r.rating ?? null,
    yearEstablished: r.yearEstablished || r.added?.slice(0, 4) || '',
    tags: r.tags || [],
    isVerified: r.isVerified ?? r.verified ?? false,
    isCurated: r.isCurated ?? true,
    featured: r.featured ?? false,
    isAffiliate: r.isAffiliate ?? false,
    addedDate: r.addedDate || r.added,
  };
}

export function slugify(name: string): string {
  return name.toLowerCase().replace(' & ', '-').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function groupByScience(resources: Resource[]): Record<string, Resource[]> {
  const map: Record<string, Resource[]> = {};
  for (const r of resources) {
    if (!map[r.science]) map[r.science] = [];
    map[r.science].push(r);
  }
  return map;
}

export function groupByScienceSub(resources: Resource[]): Record<string, Record<string, Resource[]>> {
  const map: Record<string, Record<string, Resource[]>> = {};
  for (const r of resources) {
    if (!map[r.science]) map[r.science] = {};
    if (!map[r.science][r.subdiscipline]) map[r.science][r.subdiscipline] = [];
    map[r.science][r.subdiscipline].push(r);
  }
  return map;
}

export function buildTree(resources: Resource[]): TreeScience[] {
  const bySci = groupByScience(resources);
  const bySub = groupByScienceSub(resources);
  return SCIENCES.map(sci => ({
    slug: sci.slug,
    name: sci.name,
    icon: sci.icon,
    count: bySci[sci.slug]?.length || 0,
    subdisciplines: Object.entries(bySub[sci.slug] || {})
      .map(([name, items]) => ({ name, slug: slugify(name), count: items.length }))
      .sort((a, b) => b.count - a.count),
  }));
}

// ---------------------------------------------------------------------------
// Client-safe stubs — these only work in Astro build context (server-side).
// They exist here so client bundles can import this file without breaking,
// but must never actually be called in the browser.
// ---------------------------------------------------------------------------

export function loadResources(): Resource[] {
  throw new Error('loadResources() can only be used in Astro build context (server-side)');
}

export function loadSubmissions(): Submission[] {
  throw new Error('loadSubmissions() can only be used in Astro build context (server-side)');
}

export function loadSEOContent(): Record<string, SEOContent> {
  throw new Error('loadSEOContent() can only be used in Astro build context (server-side)');
}

export function loadStatusMap(): Record<string, { status: string; details: string }> {
  throw new Error('loadStatusMap() can only be used in Astro build context (server-side)');
}