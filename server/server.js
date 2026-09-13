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
} from '../src/lib/resource-health/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token || req.cookies?.['admin_token'];
  const exp = SESSIONS.get(token);
  if (!exp || exp < Date.now()) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
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
  const verified = resources.filter(r => r.verified).length;
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
  if (!name || !url || !science) {
    return res.status(400).json({ error: 'name, url, and science are required' });
  }
  // URL validation
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'invalid URL' });
  }
  const submissions = readJson(SUBMISSIONS_FILE, []);
  const submission = {
    id: crypto.randomUUID(),
    name: String(name).slice(0, 200),
    url: String(url).slice(0, 500),
    description: String(description || '').slice(0, 1000),
    science: String(science),
    subdiscipline: String(subdiscipline || 'General'),
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
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body || {};
  const hash = crypto.createHash('sha256').update(String(password || '')).digest('hex');
  if (hash !== ADMIN_HASH) {
    return res.status(401).json({ error: 'invalid password' });
  }
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
    resources.push({
      name: sub.name,
      url: sub.url,
      description: sub.description,
      science: sub.science,
      subdiscipline: sub.subdiscipline,
      access: sub.access,
      resource_type: sub.resource_type,
      verified: false,
      tags: [],
      rating: null,
      added: new Date().toISOString().slice(0, 10),
    });
    writeJson(RESOURCES_FILE, resources);
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
      health: status[resource.url] ?? { reviewState: 'active', consecutiveFailures: 0 },
    })),
  });
});

// Admin: update resource - with CSRF
app.put('/api/admin/resources/:index', requireAuth, requireCsrf, (req, res) => {
  const resources = readJson(RESOURCES_FILE, []);
  const idx = parseInt(req.params.index, 10);
  if (isNaN(idx) || idx < 0 || idx >= resources.length) {
    return res.status(404).json({ error: 'not found' });
  }
  resources[idx] = { ...resources[idx], ...req.body };
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

// Admin: bulk import - with CSRF
app.post('/api/admin/bulk-import', requireAuth, requireCsrf, (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be array' });
  const resources = readJson(RESOURCES_FILE, []);
  let added = 0;
  for (const item of items) {
    if (!item.name || !item.url || !item.science) continue;
    resources.push({
      name: item.name,
      url: item.url,
      description: item.description || '',
      science: item.science,
      subdiscipline: item.subdiscipline || 'General',
      access: item.access || 'open',
      resource_type: item.resource_type || 'reference',
      verified: !!item.verified,
      tags: Array.isArray(item.tags) ? item.tags : [],
      rating: item.rating || null,
      added: new Date().toISOString().slice(0, 10),
    });
    added++;
  }
  writeJson(RESOURCES_FILE, resources);
  res.json({ ok: true, added });
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
