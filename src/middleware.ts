import { defineMiddleware } from 'astro:middleware';

/**
 * Keep /index as the public directory URL during local development. Static
 * Cloudflare deployments perform the same internal rewrite in public/_redirects.
 */
export const onRequest = defineMiddleware((context, next) => {
  if (context.url.pathname === '/index' || context.url.pathname === '/index/') {
    return context.rewrite('/resources-index');
  }

  return next();
});
