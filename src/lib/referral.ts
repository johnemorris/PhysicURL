export const AMAZON_ASSOCIATE_TAG = 'jem02e-20';

export const AMAZON_ASSOCIATE_DISCLOSURE = 'As an Amazon Associate I earn from qualifying purchases.';

const AMAZON_RETAIL_HOSTS = new Set(['amazon.com', 'www.amazon.com']);

function parseHttpUrl(value: string): URL | undefined {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : undefined;
  } catch {
    return undefined;
  }
}

export function isAmazonUrl(value: string): boolean {
  const url = parseHttpUrl(value);
  return url !== undefined && AMAZON_RETAIL_HOSTS.has(url.hostname.toLowerCase());
}

/**
 * Adds the configured Associates tag only to recognized Amazon retail URLs.
 * Non-Amazon and malformed inputs are returned unchanged.
 */
export function buildAmazonAffiliateUrl(productUrl: string): string {
  const url = parseHttpUrl(productUrl);
  if (!url || !AMAZON_RETAIL_HOSTS.has(url.hostname.toLowerCase())) return productUrl;
  url.searchParams.set('tag', AMAZON_ASSOCIATE_TAG);
  return url.toString();
}

/** Returns a safe product destination, or undefined when the inventory URL is unusable. */
export function buildProductPurchaseUrl(productUrl: string | undefined): string | undefined {
  if (!productUrl) return undefined;
  const url = parseHttpUrl(productUrl);
  if (!url) return undefined;
  return isAmazonUrl(url.href) ? buildAmazonAffiliateUrl(url.href) : url.href;
}

// Backward-compatible name used by existing resource rows.
export function addReferralParams(url: string): string {
  return buildAmazonAffiliateUrl(url);
}

export function isAffiliateUrl(url: string): boolean {
  return isAmazonUrl(url);
}
