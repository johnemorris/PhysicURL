/**
 * WizardIntro
 *
 * The "before you start" screen shown by both wizards: a small badge, a
 * heading, a one-paragraph pitch, a 2x2 grid of colored-dot feature bullets,
 * and a CTA button. Visuals are identical between subjects — only the copy
 * and dot colors change — matching the chemistry wizard's original look.
 *
 * Props:
 * - badge: small eyebrow label above the heading.
 * - title: heading text.
 * - description: one paragraph beneath the heading.
 * - features: array of { label, dot } where dot is one of
 *             'primary' | 'emerald' | 'amber' | 'purple'.
 * - ctaLabel: button text (defaults to "Start the Wizard").
 * - onStart: click handler for the CTA button.
 */
export default function WizardIntro({ badge, title, description, features, ctaLabel = 'Start the Wizard', onStart }) {
  return (
    <div className="wizard-intro">
      <div className="wizard-intro-inner">
        <div className="wizard-intro-badge">{badge}</div>
        <h1>{title}</h1>
        <p>{description}</p>
        <button className="btn-primary btn-lg" onClick={onStart}>
          {ctaLabel} <span>&rarr;</span>
        </button>
        {features && features.length > 0 && (
          <ul className="wizard-intro-list">
            {features.map((f, i) => (
              <li key={i}><span className={`dot dot-${f.dot}`} /> {f.label}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
