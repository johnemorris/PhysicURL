import { useMemo, useState } from 'react';
import { QUESTIONS, CATALOG, computeKit, kitTotal } from '../lib/astroWizard.js';
import { addReferralParams } from '../lib/referral.ts';
import AstroObservationDeck from './AstroObservationDeck.jsx';

export default function AstroWizard() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ target: null, environment: null, experience: null, budget: null });

  const kit = useMemo(() => computeKit(answers), [answers]);
  const complete = answers.target && answers.environment && answers.experience && answers.budget;

  const q = QUESTIONS[step];

  const pick = (optId) => {
    const next = { ...answers, [q.id]: optId };
    setAnswers(next);
    if (step < QUESTIONS.length - 1) setStep(step + 1);
  };

  const resetAll = () => { setAnswers({ target: null, environment: null, experience: null, budget: null }); setStep(0); };

  if (!started) {
    return (
      <div className="astro-wizard-page">
        <div className="wizard-intro">
          <div className="intro-badge">Astronomy Lab · Interactive Wizard</div>
          <h1>The Stargazer's Telescope &amp; Gear Wizard</h1>
          <p className="lede">Answer 4 quick questions. We'll design the perfect telescope build — optical tube, mount, eyepieces, filters, dark-sky essentials — with vendor links tuned to your budget.</p>
          <div className="intro-features">
            <span>✦ Live observation deck</span>
            <span>✦ Rules-driven kit engine</span>
            <span>✦ Beginner-safe defaults</span>
          </div>
          <button className="start-btn" onClick={() => setStarted(true)}>Begin your build →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="astro-wizard-page">
      <div className="wizard-workspace astro">
        {/* LEFT COLUMN */}
        <section className="wizard-left">
          <div className="wizard-progress">
            {QUESTIONS.map((qq, i) => (
              <div
                key={qq.id}
                className={`step ${i === step ? 'active' : ''} ${answers[qq.id] ? 'done' : ''}`}
                onClick={() => answers[qq.id] && setStep(i)}
              >
                <div className="step-num">{i + 1}</div>
                <div className="step-label">{qq.subtitle}</div>
              </div>
            ))}
          </div>

          <div className="wizard-q">
            <div className="wq-title">{q.title}</div>
            <div className="wq-sub">Question {step + 1} of {QUESTIONS.length}</div>
            <div className="wq-options">
              {q.options.map(opt => (
                <button
                  key={opt.id}
                  className={`wq-option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                  onClick={() => pick(opt.id)}
                >
                  <span className="opt-icon">{opt.icon}</span>
                  <span className="opt-body">
                    <span className="opt-label">{opt.label}</span>
                    <span className="opt-sub">{opt.sub}</span>
                  </span>
                  <span className="opt-arrow">→</span>
                </button>
              ))}
            </div>

            <div className="wq-nav">
              <button className="btn ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>← Back</button>
              <button className="btn ghost" onClick={resetAll}>Reset</button>
              <button className="btn ghost" onClick={() => setStep(Math.min(QUESTIONS.length - 1, step + 1))} disabled={step === QUESTIONS.length - 1 || !answers[q.id]}>Next →</button>
            </div>
          </div>

          <div className="wizard-summary">
            <div className="ws-row"><span>Target</span><span>{labelFor('target', answers.target)}</span></div>
            <div className="ws-row"><span>Environment</span><span>{labelFor('environment', answers.environment)}</span></div>
            <div className="ws-row"><span>Experience</span><span>{labelFor('experience', answers.experience)}</span></div>
            <div className="ws-row"><span>Budget</span><span>{labelFor('budget', answers.budget)}</span></div>
          </div>
        </section>

        {/* RIGHT COLUMN */}
        <section className="wizard-right">
          <AstroObservationDeck answers={answers} kit={kit} />
        </section>

        {/* CHECKLIST — full-width row */}
        {complete && (
          <section className="wizard-checklist">
            <div className="checklist-header">
              <div>
                <div className="ch-eyebrow">Your Build</div>
                <h2>Recommended Stargazing Kit</h2>
              </div>
              <div className="ch-total">
                <div className="tot-label">Estimated Total</div>
                <div className="tot-value">${kitTotal(kit).toLocaleString()} USD</div>
              </div>
            </div>

            {kit.banners.length > 0 && (
              <div className="checklist-banner amber">
                {kit.banners.map((b, i) => <div key={i}>\u26A0 {b}</div>)}
              </div>
            )}

            <ChecklistSection title="Optical Tube Assembly" ids={kit.ota} tone="cyan" />
            <ChecklistSection title="Mount &amp; Base" ids={kit.mount} tone="emerald" />
            <ChecklistSection title="Eyepieces &amp; Optics" ids={kit.optics} tone="cyan" />
            <ChecklistSection title="Filters" ids={kit.filters} tone="purple" />
            <ChecklistSection title="Dark-Sky Essentials" ids={kit.darksky} tone="amber" />
            {kit.ap.length > 0 && <ChecklistSection title="Astrophotography Add-ons" ids={kit.ap} tone="purple" />}

            <div className="checklist-bundle">
              <div className="bundle-title">Preferred Vendor for Your Tier</div>
              <div className="bundle-vendor">{kit.vendor}</div>
              <a className="bundle-btn" href={vendorLink(kit.vendor)} target="_blank" rel="nofollow noopener sponsored">
                Open {kit.vendor} →
              </a>
              <div className="bundle-note">Cards below deep-link into each product on your preferred marketplace.</div>
            </div>

            <div className="checklist-legal">
              As part of helping you build your rig, some of the links provided above are affiliate links. If you make a purchase through them, we may earn a small commission at no additional cost to you.
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function labelFor(qid, aid) {
  if (!aid) return '\u2014';
  const q = QUESTIONS.find(x => x.id === qid);
  return q?.options.find(o => o.id === aid)?.label || '\u2014';
}

function vendorLink(v) {
  switch (v) {
    case 'High Point Scientific': return addReferralParams('https://www.highpointscientific.com/telescopes');
    case 'Agena Astro': return addReferralParams('https://www.agenaastro.com/telescopes.html');
    default: return addReferralParams('https://www.amazon.com/s?k=telescope');
  }
}

function ChecklistSection({ title, ids, tone }) {
  if (!ids || ids.length === 0) return null;
  return (
    <div className={`cs-section tone-${tone}`}>
      <div className="cs-title" dangerouslySetInnerHTML={{ __html: title }} />
      <div className="cs-rows">
        {ids.map(id => {
          const it = CATALOG[id];
          if (!it) return null;
          return (
            <div key={id} className="cs-row">
              <div className="cs-main">
                <div className="cs-name">{it.name}</div>
                {it.spec && <div className="cs-spec">{it.spec}</div>}
              </div>
              <div className="cs-price">${it.price}</div>
              <a className="cs-link" href={addReferralParams(it.url)} target="_blank" rel="nofollow noopener sponsored">{it.vendor} →</a>
            </div>
          );
        })}
      </div>
    </div>
  );
}
