import { useMemo, useState } from 'react';
import { QUESTIONS, CATALOG, computeKit, kitTotal } from '../lib/chemWizard.js';
import { addReferralParams } from '../lib/referral.ts';
import ChemLabPreview from './ChemLabPreview.jsx';

export default function ChemWizard() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ user: null, space: null, focus: null, budget: null });

  const kit = useMemo(() => computeKit(answers), [answers]);
  const total = useMemo(() => kitTotal(kit), [kit]);
  const complete = answers.user && answers.space && answers.focus && answers.budget;

  const setAnswer = (qid, oid) => {
    setAnswers(a => ({ ...a, [qid]: oid }));
    // Advance
    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 220);
    }
  };

  const reset = () => {
    setAnswers({ user: null, space: null, focus: null, budget: null });
    setStep(0);
  };

  // ===== Intro screen =====
  if (!started) {
    return (
      <div className="wizard-intro">
        <div className="wizard-intro-inner">
          <div className="wizard-intro-badge">Interactive Wizard</div>
          <h1>Build Your Perfect Home Chemistry Lab</h1>
          <p>Answer 4 quick questions to get a customized equipment checklist tailored to your age, budget, and safety constraints.</p>
          <button className="btn-primary btn-lg" onClick={() => setStarted(true)}>
            Start the Wizard <span>&rarr;</span>
          </button>
          <ul className="wizard-intro-list">
            <li><span className="dot" style={{background:'#38BDF8'}} /> Age-appropriate materials</li>
            <li><span className="dot" style={{background:'#10B981'}} /> Space-safe recommendations</li>
            <li><span className="dot" style={{background:'#F59E0B'}} /> Focus-driven gear selection</li>
            <li><span className="dot" style={{background:'#A855F7'}} /> Budget-tuned affiliate links</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard-workspace">
      <div className="wizard-col">
        {/* Progress rail */}
        <div className="wizard-progress">
          {QUESTIONS.map((q, i) => (
            <div key={q.id} className={`wp-step ${i === step ? 'active' : ''} ${answers[q.id] ? 'done' : ''}`} onClick={() => setStep(i)}>
              <span className="wp-num">{i + 1}</span>
              <span className="wp-label">{q.title.split(' ').slice(0, 3).join(' ')}</span>
            </div>
          ))}
        </div>

        {/* Question */}
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className={`wizard-q ${i === step ? 'visible' : 'hidden'}`}>
            <div className="wq-header">
              <div className="wq-num">Question {i + 1} / 4</div>
              <div className="wq-title">{q.title}</div>
              <div className="wq-sub">{q.subtitle}</div>
            </div>
            <div className="wq-options">
              {q.options.map(opt => (
                <button
                  key={opt.id}
                  className={`wq-option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => setAnswer(q.id, opt.id)}
                >
                  <span className="wq-icon">{opt.icon}</span>
                  <span className="wq-body">
                    <span className="wq-label">{opt.label}</span>
                    <span className="wq-sublabel">{opt.sub}</span>
                  </span>
                </button>
              ))}
            </div>
            <div className="wq-nav">
              {i > 0 && <button className="btn-secondary" onClick={() => setStep(i - 1)}>&larr; Back</button>}
              {i < QUESTIONS.length - 1 && answers[q.id] && (
                <button className="btn-primary" onClick={() => setStep(i + 1)}>Next &rarr;</button>
              )}
              {i === QUESTIONS.length - 1 && complete && (
                <button className="btn-secondary" onClick={reset}>Start Over</button>
              )}
            </div>
          </div>
        ))}

        {/* Completion strip */}
        {complete && (
          <div className="wizard-summary">
            <div className="ws-title">Your Lab Is Configured</div>
            <div className="ws-meta">
              <span>{kit.material === 'plastic' ? 'Shatterproof plastic' : kit.material === 'borosilicate' ? 'Borosilicate glass' : 'Jointed 24/40 glassware'}</span>
              <span>&middot;</span>
              <span>{kit.focusLabel}</span>
              <span>&middot;</span>
              <span>via {kit.vendor}</span>
            </div>
          </div>
        )}
      </div>

      <div className="preview-col">
        <ChemLabPreview answers={answers} kit={kit} total={total} />
      </div>

      {/* Shopping list — appears beneath both columns once complete */}
      {complete && (
        <div className="wizard-checklist">
          <div className="checklist-head">
            <h2>Your Custom Shopping Checklist</h2>
            <p>Curated for a <strong>{answers.user}</strong> level in a <strong>{answers.space}</strong> space, focused on <strong>{kit.focusLabel.toLowerCase()}</strong> with a <strong>{answers.budget}</strong> budget.</p>
          </div>

          {kit.banners.length > 0 && (
            <div className="checklist-banner">
              {kit.banners.map((b, i) => <span key={i}>&#9888; {b}</span>)}
            </div>
          )}

          <ChecklistSection title="Required Safety Gear" icon="\ud83e\uddba" items={kit.safety} vendor={kit.vendor} />
          <ChecklistSection title="Measurement & Core Tools" icon="\ud83d\udcd0" items={kit.core} vendor={kit.vendor} />
          <ChecklistSection title="Specialized Add-ons" icon="\ud83d\udd2c" items={kit.specialized} vendor={kit.vendor} />

          {kit.bundle && (
            <div className="checklist-bundle">
              <div className="bundle-info">
                <div className="bundle-title">{CATALOG[kit.bundle].name}</div>
                <div className="bundle-sub">Buy the pre-assembled bundle from {CATALOG[kit.bundle].vendor} instead of shopping individually.</div>
              </div>
              <div className="bundle-price">${CATALOG[kit.bundle].price}</div>
              <a href={addReferralParams(CATALOG[kit.bundle].url)} target="_blank" rel="noopener sponsored" className="btn-primary">
                Buy Kit &rarr;
              </a>
            </div>
          )}

          <div className="checklist-legal">
            As part of helping you build your lab, some of the links provided above are affiliate links. If you make a purchase through them, we may earn a small commission at no additional cost to you.
          </div>
        </div>
      )}
    </div>
  );
}

function ChecklistSection({ title, icon, items, vendor }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="checklist-section">
      <div className="cs-title"><span className="cs-icon">{icon}</span> {title}</div>
      <div className="cs-items">
        {items.map(id => {
          const item = CATALOG[id];
          if (!item) return null;
          const finalUrl = addReferralParams(item.url);
          return (
            <div key={id} className="cs-row">
              <div className="cs-name">
                <span className="cs-label">{item.name}</span>
              </div>
              <div className="cs-price">${item.price}</div>
              <a href={finalUrl} target="_blank" rel="noopener sponsored" className="cs-link">
                View on {vendor} &#8599;
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
