import assert from 'node:assert/strict';
import test from 'node:test';
import { URL } from 'node:url';
import { CATALOG as ASTRO_CATALOG, QUESTIONS as ASTRO_QUESTIONS, computeKit as computeAstroKit } from '../astroWizard.js';
import { CATALOG as CHEM_CATALOG, QUESTIONS as CHEM_QUESTIONS, computeKit as computeChemKit } from '../chemWizard.js';
import { buildProductPurchaseUrl, isAmazonUrl } from '../referral.ts';

function answerSets(questions) {
  return questions.reduce((sets, question) => (
    sets.flatMap(answers => question.options.map(option => ({ ...answers, [question.id]: option.id })))
  ), [{}]);
}

function recommendationIds(kit, sectionKeys) {
  const ids = sectionKeys.flatMap(key => Array.isArray(kit[key]) ? kit[key] : []);
  if (typeof kit.bundle === 'string') ids.push(kit.bundle);
  return ids;
}

function verifyWizard(catalog, questions, computeKit, sectionKeys) {
  for (const product of Object.values(catalog)) {
    if (product.banner) continue;
    const parsed = new URL(product.url);
    assert.ok(['http:', 'https:'].includes(parsed.protocol), `${product.name} has an invalid product URL`);
    const destination = buildProductPurchaseUrl(product.url);
    assert.ok(destination, `${product.name} has no usable purchase destination`);
    if (isAmazonUrl(product.url)) {
      assert.equal(new URL(destination).searchParams.get('tag'), 'jem02e-20');
    }
  }
  for (const answers of answerSets(questions)) {
    const kit = computeKit(answers);
    for (const id of recommendationIds(kit, sectionKeys)) {
      assert.ok(catalog[id], `Recommendation ${id} is missing from the controlled inventory`);
    }
  }
}

test('astronomy recommendations resolve to valid controlled inventory products', () => {
  verifyWizard(ASTRO_CATALOG, ASTRO_QUESTIONS, computeAstroKit, ['ota', 'mount', 'optics', 'filters', 'darksky', 'ap']);
});

test('chemistry recommendations resolve to valid controlled inventory products', () => {
  verifyWizard(CHEM_CATALOG, CHEM_QUESTIONS, computeChemKit, ['safety', 'core', 'specialized']);
});
