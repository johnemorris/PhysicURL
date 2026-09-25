# PhysicURL

An authoritative scientific reference directory indexing 500+ curated physics and natural science resources — laboratories, journals, simulators, databases, and university departments worldwide.

Live: [physicurl.pplx.app](https://physicurl.pplx.app)

## Stack

- **Astro 5** with React islands (SSG output)
- **SCSS** (nested, single source in `src/styles/global.scss`)
- **Express** backend (`server/server.js`) for submissions, admin, and health checks
- Deployable to Cloudflare Pages / Perplexity Sites / any static host + Node runtime

## Structure

```
src/
  layouts/          Astro layouts (DirectoryLayout with sidebar tree)
  pages/            File-routed pages: index, [science], [science]/[subdiscipline], admin
  components/       React islands: SubmitModal, AdminDashboard, ResourceExplorer, SidebarSearch
  lib/
    url-health/       Reusable URL-only diagnostics, safe redirects, and SSRF guard
    resource-health/  PhysicURL review workflow and atomic status persistence
    data.ts, scienceContent.js, scienceDiagrams.js
  styles/global.scss  Design system + all component styles
data/
  resources.json          541 curated resources
  seo_content.json        Per-science landing copy
  resource_status.json    Health-check state per URL
server/
  server.js         Express API — /api/submit, /api/admin/*, /api/health
```

## Design System

Deep Dark Matter / Quantum Terminal theme:

- Canvas `#080C14`, panels `#0D131F`, hover `#141C2E`
- Quantum cyan `#38BDF8`, emerald `#10B981`, amber `#F59E0B`, purple `#A855F7`
- Plus Jakarta Sans / Inter for UI, JetBrains Mono for metrics/DOIs/domains

## Develop

Node.js 22.18 or newer is required. The repository's `.nvmrc` pins the baseline development version, and npm rejects installs on unsupported Node releases.

```bash
nvm use
npm install
npm run dev         # Astro dev server
node server/server.js   # Express API (port 5000; Node 22.18+)
npm run build       # static build to dist/
```

When the static site and API use different production origins, set `PUBLIC_API_URL` for the build and add that exact frontend origin to the API's comma-separated `PHYSICURL_ALLOWED_ORIGINS` setting. Localhost origins are accepted automatically outside production.

## Admin

`/admin.html` — requires the `ADMIN_PASSWORD` environment variable; the API exits at startup when it is missing.

## Health check

The admin health check uses `src/lib/url-health/` to collect URL observations. It validates DNS and every redirect target against local/private address ranges, then gives Axios a custom Node agent that can connect only to those validated addresses. Redirects remain disabled in Axios and are revalidated manually. The checker tries HEAD first and confirms inconclusive responses with a size-limited GET. The reusable checker never assigns PhysicURL workflow states.

`src/lib/resource-health/` applies conservative PhysicURL rules and persists one record per URL in `data/resource_status.json` using atomic file replacement. Records separate `reviewState` (`active`, `under_review`, or `confirmed_broken`), the original `reviewConcern`, and the latest `lastCheck`. `consecutiveServerFailures` is used only for repeated temporary 5xx responses. Automated checks may enter or preserve `under_review`, but never assign `confirmed_broken` or automatically clear an existing review decision.

Legacy `dead`, `timeout`, `repurposed`, `details`, and related fields are normalized on read. Their prior review meaning and original JSON values are retained under `legacy`; the next status write atomically stores the normalized structure.

## Affiliate links and bulk import

Amazon product links are tagged centrally in `src/lib/referral.ts` with Associates ID `jem02e-20`; wizard selection logic remains independent of affiliate handling.

Bulk imports use a validate-and-preview step before explicit approval. The server derives IDs, dates, domains, and affiliate state, rejects duplicates or unknown taxonomy, and atomically replaces the resource JSON file only after the complete batch passes validation.
