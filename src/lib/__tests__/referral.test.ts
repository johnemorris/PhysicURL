import assert from 'node:assert/strict';
import test from 'node:test';
import {
  AMAZON_ASSOCIATE_TAG,
  buildAmazonAffiliateUrl,
  buildProductPurchaseUrl,
  isAmazonUrl,
} from '../referral.ts';

test('Amazon URLs receive the configured Associates tag', () => {
  const result = new URL(buildAmazonAffiliateUrl('https://www.amazon.com/dp/B012345678'));
  assert.equal(AMAZON_ASSOCIATE_TAG, 'jem02e-20');
  assert.equal(result.searchParams.get('tag'), 'jem02e-20');
});

test('an existing tag is replaced without duplication and other parameters survive', () => {
  const result = new URL(buildAmazonAffiliateUrl('https://www.amazon.com/dp/B012345678?tag=wrong-20&ref_=abc&tag=duplicate'));
  assert.deepEqual(result.searchParams.getAll('tag'), ['jem02e-20']);
  assert.equal(result.searchParams.get('ref_'), 'abc');
});

test('non-Amazon and deceptive hostnames are not modified', () => {
  const normal = 'https://example.com/product?tag=keep';
  const deceptive = 'https://www.amazon.com.evil.example/product';
  assert.equal(buildAmazonAffiliateUrl(normal), normal);
  assert.equal(buildAmazonAffiliateUrl(deceptive), deceptive);
  assert.equal(isAmazonUrl(deceptive), false);
});

test('invalid purchase URLs fail gracefully', () => {
  assert.equal(buildProductPurchaseUrl('javascript:alert(1)'), undefined);
  assert.equal(buildProductPurchaseUrl(undefined), undefined);
});
