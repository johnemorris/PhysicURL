/**
 * WizardSummary
 *
 * The compact "you're done" strip shown beneath the question stack once a
 * wizard is complete: a title plus a middot-separated line of chosen values.
 *
 * Props:
 * - title: e.g. "Your Lab Is Configured" / "Your Build Is Ready".
 * - metaParts: array of strings to join with a middot separator.
 */
export default function WizardSummary({ title, metaParts }) {
  return (
    <div className="wizard-summary">
      <div className="ws-title">{title}</div>
      <div className="ws-meta">
        {metaParts.map((part, i) => (
          <span key={i}>{i > 0 && '\u00B7 '}{part}</span>
        ))}
      </div>
    </div>
  );
}
