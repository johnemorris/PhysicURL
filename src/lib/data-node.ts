import type { Resource, ScienceConfig, SEOContent, TreeScience, Submission } from './types';
import { readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'data');

export const SCIENCES: ScienceConfig[] = [
  { slug: 'physics', name: 'Physics', description: 'The fundamental science of matter, energy, space, and time. Browse databases, simulators, university programs, and research portals.', icon: 'atom' },
  { slug: 'chemistry', name: 'Chemistry', description: 'The science of matter — composition, structure, properties, and transformations. Browse databases, molecular tools, and educational platforms.', icon: 'flask' },
  { slug: 'astronomy', name: 'Astronomy', description: 'The science of celestial objects and the physical universe. Browse observatories, sky surveys, telescope archives, and cosmology research.', icon: 'telescope' },
  { slug: 'earth-sciences', name: 'Earth Sciences', description: 'Geology, meteorology, oceanography, and environmental science. Browse USGS data, NOAA archives, GIS tools, and climate resources.', icon: 'globe' },
  { slug: 'biophysics', name: 'Biophysics', description: 'Physics applied to biological systems. Browse structural databases, molecular visualization tools, and research organizations.', icon: 'dna' },
  { slug: 'materials-science', name: 'Materials Science', description: 'Properties and applications of materials. Browse crystallography databases, simulation tools, and nanotechnology resources.', icon: 'crystal' },
  { slug: 'mathematical-physics', name: 'Mathematical Physics', description: 'Mathematical methods for physics. Browse computational tools, reference databases, and educational resources.', icon: 'sigma' },
];

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

export function loadResources(): Resource[] {
  const raw = readFileSync(join(DATA_DIR, 'resources.json'), 'utf-8');
  const data = JSON.parse(raw);
  return data.map(normalizeResource);
}

export function loadSubmissions(): Submission[] {
  try {
    const raw = readFileSync(join(DATA_DIR, 'submissions.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function loadSEOContent(): Record<string, SEOContent> {
  try {
    const raw = readFileSync(join(DATA_DIR, 'seo_content.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function loadStatusMap(): Record<string, { status: string; details: string }> {
  try {
    const raw = readFileSync(join(DATA_DIR, 'resource_status.json'), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
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