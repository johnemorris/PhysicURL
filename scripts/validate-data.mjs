import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

const DATA_DIR = join(process.cwd(), 'data');
const RESOURCES_FILE = join(DATA_DIR, 'resources.json');

function validateResource(r, idx) {
  const errors = [];
  
  if (!r.id) errors.push('Missing id');
  if (!r.title) errors.push('Missing title');
  if (!r.url) errors.push('Missing url');
  if (!r.domain) errors.push('Missing domain');
  if (!r.description) errors.push('Missing description');
  if (!r.science) errors.push('Missing science');
  if (!r.subdiscipline) errors.push('Missing subdiscipline');
  if (!r.resourceType && !r.resource_type) errors.push('Missing resourceType');
  if (!r.access) errors.push('Missing access');
  if (r.rating !== null && r.rating !== undefined && (typeof r.rating !== 'number' || r.rating < 0 || r.rating > 5)) {
    errors.push('Invalid rating (must be 0-5 or null)');
  }
  if (!r.tags || !Array.isArray(r.tags)) errors.push('Missing or invalid tags');
  if (typeof r.isVerified !== 'boolean') errors.push('isVerified must be boolean');
  if (typeof r.isCurated !== 'boolean') errors.push('isCurated must be boolean');
  if (typeof r.featured !== 'boolean') errors.push('featured must be boolean');
  if (typeof r.isAffiliate !== 'boolean') errors.push('isAffiliate must be boolean');
  
  // Validate URL format
  try {
    new URL(r.url);
  } catch {
    errors.push('Invalid URL format');
  }
  
  // Validate domain matches URL
  try {
    const urlDomain = new URL(r.url).hostname;
    if (r.domain && r.domain !== urlDomain && !r.domain.includes(urlDomain)) {
      errors.push(`Domain mismatch: ${r.domain} vs ${urlDomain}`);
    }
  } catch {}
  
  return errors;
}

function main() {
  console.log('Validating resources.json...');
  
  const raw = readFileSync(RESOURCES_FILE, 'utf-8');
  const resources = JSON.parse(raw);
  
  let hasErrors = false;
  let fixedCount = 0;
  
  const normalized = resources.map((r, idx) => {
    const errors = validateResource(r, idx);
    if (errors.length > 0) {
      console.error(`Resource ${idx} (${r.id || 'no-id'}): ${errors.join(', ')}`);
      hasErrors = true;
    }
    
    // Normalize fields
    const normalized = {
      id: r.id || crypto.randomUUID(),
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
    
    // Check if any normalization changed the data
    const changed = JSON.stringify(r) !== JSON.stringify(normalized);
    if (changed) fixedCount++;
    
    return normalized;
  });
  
  if (fixedCount > 0) {
    console.log(`Normalized ${fixedCount} resources`);
    writeFileSync(RESOURCES_FILE, JSON.stringify(normalized, null, 2));
    console.log('Updated resources.json with normalized data');
  }
  
  if (hasErrors) {
    console.error('Validation failed with errors');
    process.exit(1);
  } else {
    console.log(`Validation passed: ${resources.length} resources`);
  }
}

main();