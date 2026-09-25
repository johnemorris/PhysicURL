import { buildProductPurchaseUrl } from '../../lib/referral.ts';

/**
 * ChecklistSection
 *
 * Renders one grouped block of a wizard's shopping checklist (e.g. "Required
 * Safety Gear" or "Optical Tube Assembly"): a title plus a list of catalog
 * items with price and vendor link.
 *
 * Shared by ChemWizard and AstroWizard so both wizards render checklist rows
 * with identical markup/CSS classes (`.checklist-section`, `.cs-row`, ...),
 * defined once in global.scss. All outbound links go through
 * buildProductPurchaseUrl so affiliate tagging stays consistent everywhere.
 *
 * Props:
 * - title:  section heading, plain text (e.g. "Mount & Base").
 * - ids:    array of catalog item ids to render. Section is omitted entirely
 *           when this is empty/undefined.
 * - catalog: lookup object of { [id]: { name, spec?, price, url, vendor } }.
 * - icon:   optional emoji/glyph shown before the title (chem wizard).
 * - tone:   optional accent color for the title — 'cyan' (default) | 'emerald' | 'purple' | 'amber'.
 * - vendorLabel: optional override for the link text shown on every row
 *           (astro wizard shows each item's own vendor when omitted).
 */
export default function ChecklistSection({ title, ids, catalog, icon, tone, vendorLabel }) {
  if (!ids || ids.length === 0) return null;

  return (
    <div className={`checklist-section${tone ? ` tone-${tone}` : ''}`}>
      <div className="cs-title">
        {icon && <span className="cs-icon">{icon}</span>}
        {title}
      </div>
      <div className="cs-items">
        {ids.map(id => {
          const item = catalog[id];
          if (!item) return null;
          const linkLabel = vendorLabel ? `View on ${vendorLabel}` : item.vendor;
          const destination = buildProductPurchaseUrl(item.url);
          return (
            <div key={id} className="cs-row">
              <div className="cs-name">
                <span className="cs-label">{item.name}</span>
                {item.spec && <span className="cs-spec">{item.spec}</span>}
              </div>
              <div className="cs-price">${item.price}</div>
              {destination ? (
                <a
                  className="cs-link"
                  href={destination}
                  target="_blank"
                  rel="noopener nofollow sponsored"
                  data-product-id={id}
                  data-placement="wizard-checklist"
                >
                  {linkLabel} &rarr;
                </a>
              ) : <span className="cs-link-unavailable">Purchase link unavailable</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
