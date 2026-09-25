import { AMAZON_ASSOCIATE_DISCLOSURE } from '../../lib/referral.ts';

/**
 * WizardChecklist
 *
 * The shared shell around a wizard's results: heading + description,
 * optional warning banners, then whatever checklist sections / bundle
 * callout the caller renders as children, followed by the standard
 * affiliate-link disclosure.
 *
 * Props:
 * - title: heading text.
 * - description: optional paragraph under the heading (can include JSX,
 *   e.g. <strong> highlights of the user's answers).
 * - banners: optional array of warning strings.
 */
export default function WizardChecklist({ title, description, banners, children }) {
  return (
    <div className="wizard-checklist">
      <div className="checklist-head">
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>

      {banners && banners.length > 0 && (
        <div className="checklist-banner">
          {banners.map((b, i) => <span key={i}>&#9888; {b}</span>)}
        </div>
      )}

      {children}

      <div className="checklist-legal">
        {AMAZON_ASSOCIATE_DISCLOSURE} Affiliate links do not affect which products are recommended.
      </div>
    </div>
  );
}
