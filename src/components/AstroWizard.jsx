import { useMemo, useState } from 'react';
import { QUESTIONS, CATALOG, computeKit, kitTotal } from '../lib/astroWizard.js';
import { addReferralParams } from '../lib/referral.ts';
import AstroObservationDeck from './AstroObservationDeck.jsx';
import WizardIntro from './shared/WizardIntro.jsx';
import WizardQuestionFlow from './shared/WizardQuestionFlow.jsx';
import WizardSummary from './shared/WizardSummary.jsx';
import WizardChecklist from './shared/WizardChecklist.jsx';
import ChecklistSection from './shared/ChecklistSection.jsx';

const FEATURES = [
  { dot: 'primary', label: 'Live observation deck' },
  { dot: 'emerald', label: 'Rules-driven kit engine' },
  { dot: 'amber', label: 'Beginner-safe defaults' },
  { dot: 'purple', label: 'Budget-tuned vendor links' },
];

export default function AstroWizard() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ target: null, environment: null, experience: null, budget: null });

  const kit = useMemo(() => computeKit(answers), [answers]);
  const total = useMemo(() => kitTotal(kit), [kit]);
  const complete = answers.target && answers.environment && answers.experience && answers.budget;

  const onAnswer = (qid, oid) => {
    setAnswers(a => ({ ...a, [qid]: oid }));
    const idx = QUESTIONS.findIndex(q => q.id === qid);
    if (idx < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 220);
    }
  };

  const reset = () => {
    setAnswers({ target: null, environment: null, experience: null, budget: null });
    setStep(0);
  };

  if (!started) {
    return (
      <WizardIntro
        badge="Astronomy Lab · Interactive Wizard"
        title="Build Your Perfect Telescope Kit"
        description="Answer 4 quick questions. We'll design the perfect telescope build — optical tube, mount, eyepieces, filters, dark-sky essentials — with vendor links tuned to your budget."
        features={FEATURES}
        onStart={() => setStarted(true)}
      />
    );
  }

  return (
    <div className="wizard-workspace">
      <div className="wizard-col">
        <WizardQuestionFlow
          questions={QUESTIONS}
          answers={answers}
          step={step}
          complete={complete}
          onAnswer={onAnswer}
          onStepChange={setStep}
          onReset={reset}
        />

        {complete && (
          <WizardSummary
            title="Your Build Is Ready"
            metaParts={[
              labelFor('target', answers.target),
              labelFor('environment', answers.environment),
              `via ${kit.vendor}`,
            ]}
          />
        )}
      </div>

      <div className="preview-col">
        <AstroObservationDeck answers={answers} kit={kit} />
      </div>

      {complete && (
        <WizardChecklist
          title="Recommended Stargazing Kit"
          description={
            <>Curated for <strong>{labelFor('experience', answers.experience)}</strong> observers at a <strong>{labelFor('environment', answers.environment)}</strong> site, targeting <strong>{labelFor('target', answers.target)}</strong> with a <strong>{labelFor('budget', answers.budget)}</strong> budget.</>
          }
          banners={kit.banners}
        >
          <ChecklistSection title="Optical Tube Assembly" ids={kit.ota} catalog={CATALOG} tone="cyan" />
          <ChecklistSection title="Mount & Base" ids={kit.mount} catalog={CATALOG} tone="emerald" />
          <ChecklistSection title="Eyepieces & Optics" ids={kit.optics} catalog={CATALOG} tone="cyan" />
          <ChecklistSection title="Filters" ids={kit.filters} catalog={CATALOG} tone="purple" />
          <ChecklistSection title="Dark-Sky Essentials" ids={kit.darksky} catalog={CATALOG} tone="amber" />
          {kit.ap.length > 0 && <ChecklistSection title="Astrophotography Add-ons" ids={kit.ap} catalog={CATALOG} tone="purple" />}

          <div className="checklist-bundle">
            <div className="bundle-info">
              <div className="bundle-title">Preferred Vendor for Your Tier</div>
              <div className="bundle-sub">{kit.vendor} — cards above deep-link into each product on this marketplace.</div>
            </div>
            <div className="bundle-price">${total.toLocaleString()}</div>
            <a href={addReferralParams(vendorLink(kit.vendor))} target="_blank" rel="noopener nofollow sponsored" className="btn-primary">
              Open {kit.vendor} &rarr;
            </a>
          </div>
        </WizardChecklist>
      )}
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
    case 'High Point Scientific': return 'https://www.highpointscientific.com/telescopes';
    case 'Agena Astro': return 'https://www.agenaastro.com/telescopes.html';
    default: return 'https://www.amazon.com/s?k=telescope';
  }
}
