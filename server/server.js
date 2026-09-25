// PhysicURL API server — handles submissions, admin login, CRUD
// Static files are served from S3; only /api/* routes hit this server.
import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import {
  checkResources,
  getResourceHealthStats,
  loadResourceStatusFile,
  setResourceReviewState,
} from '../src/lib/resource-health/index.ts';
import {
  commitResourceImport,
  parseResourceImportJson,
  previewResourceImport,
  ResourceImportInputError,
  ResourceImportValidationError,
  writeJsonFileAtomic,
} from '../src/lib/resource-import/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const CONFIGURED_ORIGINS = new Set(
  String(process.env.PHYSICURL_ALLOWED_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
);

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const localDevelopmentOrigin = process.env.NODE_ENV !== 'production'
    && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
  if (origin && (CONFIGURED_ORIGINS.has(origin) || localDevelopmentOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Token, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Data paths (writable at runtime in sandbox)
const DATA_DIR = process.env.PHYSICURL_DATA_DIR
  ? path.resolve(process.env.PHYSICURL_DATA_DIR)
  : path.join(__dirname, '..', 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const RESOURCES_FILE = path.join(DATA_DIR, 'resources.json');
const STATUS_FILE = path.join(DATA_DIR, 'resource_status.json');
const SESSIONS = new Map(); // token -> expiry
const SUBMISSION_RATE_LIMIT = new Map(); // ip -> { count, resetTime }
const LOGIN_RATE_LIMIT = new Map(); // ip -> { count, resetTime }

// Admin password (hashed at boot) - REQUIRED env var in production
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
if (!ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD environment variable is required');
  process.exit(1);
}
const ADMIN_HASH = crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

// CSRF token store (in production, use a proper store)
const CSRF_TOKENS = new Map(); // token -> expiry

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  writeJsonFileAtomic(file, data);
}

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.cookies?.['admin_token'];
  const exp = SESSIONS.get(token);
  if (!exp || exp < Date.now()) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

function rateLimitAdminLogin(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const record = LOGIN_RATE_LIMIT.get(ip);
  if (!record || record.resetTime < now) {
    LOGIN_RATE_LIMIT.set(ip, { count: 1, resetTime: now + 15 * 60 * 1000 });
    return next();
  }
  if (record.count >= 10) {
    return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
  }
  record.count += 1;
  next();
}

function importErrorResponse(res, error) {
  if (error instanceof ResourceImportInputError) {
    return res.status(400).json({ error: error.message, code: error.code });
  }
  if (error instanceof ResourceImportValidationError) {
    return res.status(422).json({ error: error.message, preview: error.preview });
  }
  console.error('[resource-import] failed', error instanceof Error ? error.message : error);
  return res.status(500).json({ error: 'Resource import failed without changing the directory.' });
}

// Rate limiting for public submission endpoint
function rateLimitSubmissions(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 10; // 10 per hour per IP

  const record = SUBMISSION_RATE_LIMIT.get(ip);
  if (!record || record.resetTime < now) {
    SUBMISSION_RATE_LIMIT.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  if (record.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
  }
  record.count++;
  next();
}

// CSRF protection middleware
function requireCsrf(req, res, next) {
  const csrfToken = req.headers['x-csrf-token'] || req.body?.csrf_token;
  if (!csrfToken || !CSRF_TOKENS.has(csrfToken) || CSRF_TOKENS.get(csrfToken) < Date.now()) {
    return res.status(403).json({ error: 'Invalid or expired CSRF token' });
  }
  next();
}

function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex');
  CSRF_TOKENS.set(token, Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return token;
}

// Health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

// CSRF token endpoint (for admin UI)
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrf_token: generateCsrfToken() });
});

// Stats
app.get('/api/stats', (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const submissions = readJson(SUBMISSIONS_FILE, []);
  const status = loadResourceStatusFile(STATUS_FILE);
  const pending = submissions.filter(s => s.status === 'pending').length;
  const healthStats = getResourceHealthStats(resources.map(resource => resource.url), status);
  const verified = resources.filter(r => r.isVerified ?? r.verified).length;
  const bySci = {};
  for (const r of resources) {
    bySci[r.science] = (bySci[r.science] || 0) + 1;
  }
  res.json({
    total_resources: resources.length,
    verified,
    active: healthStats.active,
    under_review: healthStats.underReview,
    confirmed_broken: healthStats.confirmedBroken,
    health_checked: healthStats.checked,
    pending_submissions: pending,
    by_science: bySci,
  });
});

// Submit new resource (public) - with rate limiting
app.post('/api/submit', rateLimitSubmissions, (req, res) => {
  const { name, url, description, science, subdiscipline, submitter_email, access, resource_type } = req.body || {};
  if (!name || !url || !science || !subdiscipline) {
    return res.status(400).json({ error: 'name, url, science, and subdiscipline are required' });
  }
  const resources = readJson(RESOURCES_FILE, []);
  let candidate;
  try {
    const preview = previewResourceImport([req.body], resources);
    if (!preview.canImport || !preview.items[0]) {
      return res.status(422).json({ error: 'Submission validation failed', issues: preview.rows[0]?.issues ?? [] });
    }
    candidate = preview.items[0];
  } catch (error) {
    return importErrorResponse(res, error);
  }
  const submissions = readJson(SUBMISSIONS_FILE, []);
  const submission = {
    id: crypto.randomUUID(),
    name: candidate.title,
    url: candidate.url,
    description: candidate.description,
    science: candidate.science,
    subdiscipline: candidate.subdiscipline,
    submitter_email: String(submitter_email || '').slice(0, 200),
    access: String(access || 'open'),
    resource_type: String(resource_type || 'reference'),
    status: 'pending',
    submitted_at: new Date().toISOString(),
  };
  submissions.push(submission);
  writeJson(SUBMISSIONS_FILE, submissions);
  res.json({ ok: true, id: submission.id });
});

// Admin login
app.post('/api/admin/login', rateLimitAdminLogin, (req, res) => {
  const { password } = req.body || {};
  const hash = crypto.createHash('sha256').update(String(password || '')).digest('hex');
  if (hash !== ADMIN_HASH) {
    return res.status(401).json({ error: 'invalid password' });
  }
  LOGIN_RATE_LIMIT.delete(req.ip || req.connection.remoteAddress || 'unknown');
  const token = crypto.randomBytes(32).toString('hex');
  SESSIONS.set(token, Date.now() + 8 * 60 * 60 * 1000); // 8 hours
  
  // Set HttpOnly cookie as alternative to header
  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  });
  
  res.json({ ok: true, token });
});

// Admin logout
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'] || req.cookies?.['admin_token'];
  if (token) SESSIONS.delete(token);
  res.clearCookie('admin_token');
  res.json({ ok: true });
});

// Admin: list submissions
app.get('/api/admin/submissions', requireAuth, (req, res) => {
  const submissions = readJson(SUBMISSIONS_FILE, []);
  res.json({ submissions });
});

// Admin: approve/reject submission - with CSRF
app.post('/api/admin/submissions/:id', requireAuth, requireCsrf, (req, res) => {
  const { action } = req.body || {}; // 'approve' | 'reject'
  const submissions = readJson(SUBMISSIONS_FILE, []);
  const idx = submissions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const sub = submissions[idx];
  if (action === 'approve') {
    const resources = readJson(RESOURCES_FILE, []);
    try {
      commitResourceImport([sub], resources, { write: next => writeJson(RESOURCES_FILE, next) });
    } catch (error) {
      return importErrorResponse(res, error);
    }
    sub.status = 'approved';
  } else if (action === 'reject') {
    sub.status = 'rejected';
  }
  submissions[idx] = sub;
  writeJson(SUBMISSIONS_FILE, submissions);
  res.json({ ok: true, submission: sub });
});

// Admin: list resources
app.get('/api/admin/resources', requireAuth, (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const status = loadResourceStatusFile(STATUS_FILE);
  res.json({
    resources: resources.map(resource => ({
      ...resource,
      health: status[resource.url] ?? { reviewState: 'active', consecutiveServerFailures: 0 },
    })),
  });
});

// Admin: create one resource through the shared validation and atomic persistence path.
app.post('/api/admin/resources', requireAuth, requireCsrf, (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  try {
    const [resource] = commitResourceImport([req.body], resources, { write: next => writeJson(RESOURCES_FILE, next) });
    res.status(201).json({ ok: true, resource });
  } catch (error) {
    return importErrorResponse(res, error);
  }
});

// Admin: update resource - with CSRF
app.put('/api/admin/resources/:index', requireAuth, requireCsrf, (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= resources.length) {
    return res.status(404).json({ error: 'not found' });
  }
  const existing = resources[idx];
  const update = {
    title: req.body?.title ?? req.body?.name ?? existing.title ?? existing.name,
    url: req.body?.url ?? existing.url,
    description: req.body?.description ?? existing.description,
    science: req.body?.science ?? existing.science,
    subdiscipline: req.body?.subdiscipline ?? existing.subdiscipline,
    resourceType: req.body?.resourceType ?? req.body?.resource_type ?? existing.resourceType ?? existing.resource_type,
    access: req.body?.access ?? existing.access,
    rating: req.body?.rating ?? existing.rating,
    yearEstablished: req.body?.yearEstablished ?? existing.yearEstablished,
    tags: req.body?.tags ?? existing.tags,
  };
  const preview = previewResourceImport([update], resources.filter((_, resourceIndex) => resourceIndex !== idx));
  if (!preview.canImport || !preview.items[0]) {
    return res.status(422).json({ error: 'Resource validation failed', issues: preview.rows[0]?.issues ?? [] });
  }
  resources[idx] = {
    id: existing.id ?? crypto.randomUUID(),
    ...preview.items[0],
    isVerified: Boolean(req.body?.isVerified ?? req.body?.verified ?? existing.isVerified ?? existing.verified),
    isCurated: Boolean(existing.isCurated ?? true),
    featured: Boolean(req.body?.featured ?? existing.featured),
    addedDate: existing.addedDate ?? existing.added ?? new Date().toISOString().slice(0, 10),
  };
  writeJson(RESOURCES_FILE, resources);
  res.json({ ok: true, resource: resources[idx] });
});

// Admin: delete resource - with CSRF
app.delete('/api/admin/resources/:index', requireAuth, requireCsrf, (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= resources.length) {
    return res.status(404).json({ error: 'not found' });
  }
  const removed = resources.splice(idx, 1)[0];
  writeJson(RESOURCES_FILE, resources);
  res.json({ ok: true, removed });
});

// Admin: validate a JSON upload before explicit approval.
app.post('/api/admin/bulk-import/preview', requireAuth, requireCsrf, (req, res) => {
  try {
    const items = parseResourceImportJson(String(req.body?.raw ?? ''));
    const resources = readJson(RESOURCES_FILE, []);
    res.json({ ok: true, preview: previewResourceImport(items, resources) });
  } catch (error) {
    return importErrorResponse(res, error);
  }
});

// Admin: bulk import an already-previewed batch - with CSRF
app.post('/api/admin/bulk-import', requireAuth, requireCsrf, (req, res) => {
  const { items } = req.body || {};
  const resources = readJson(RESOURCES_FILE, []);
  try {
    const created = commitResourceImport(items, resources, { write: next => writeJson(RESOURCES_FILE, next) });
    res.json({ ok: true, added: created.length, resources: created });
  } catch (error) {
    return importErrorResponse(res, error);
  }
});

app.post('/api/admin/resources/:index/review-state', requireAuth, requireCsrf, async (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const idx = Number.parseInt(req.params.index, 10);
  if (!Number.isInteger(idx) || idx < 0 || idx >= resources.length) {
    return res.status(404).json({ error: 'not found' });
  }
  const reviewState = req.body?.reviewState;
  if (!['active', 'under_review', 'confirmed_broken'].includes(reviewState)) {
    return res.status(400).json({ error: 'invalid reviewState' });
  }
  try {
    const status = await setResourceReviewState(STATUS_FILE, resources[idx].url, reviewState);
    res.json({ ok: true, health: status[resources[idx].url] });
  } catch (error) {
    console.error('[resource-health] review state update failed', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'review state update failed' });
  }
});

// Admin: URL health check - with CSRF
app.post('/api/admin/health-check', requireAuth, requireCsrf, async (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const requestedLimit = Number.parseInt(String(req.query.limit ?? '50'), 10);
  const limit = Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 50, resources.length, 500);
  try {
    const run = await checkResources(resources, {
      statusFile: STATUS_FILE,
      limit,
      concurrency: 5,
    });
    res.json({
      ok: true,
      checked: run.results.length,
      summary: run.summary,
      results: run.results,
    });
  } catch (error) {
    console.error('[url-health] check run failed', error instanceof Error ? error.message : error);
    res.status(500).json({ error: 'health check failed' });
  }
});

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`PhysicURL API listening on ${PORT}`);
});

app.use((error, _req, res, next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ error: 'Malformed JSON request body.' });
  }
  next(error);
});
