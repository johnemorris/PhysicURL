import { useMemo, useState } from 'react';
import { QUESTIONS, CATALOG, computeKit, kitTotal } from '../lib/chemWizard.js';
import { buildProductPurchaseUrl } from '../lib/referral.ts';
import ChemLabPreview from './ChemLabPreview.jsx';
import WizardIntro from './shared/WizardIntro.jsx';
import WizardQuestionFlow from './shared/WizardQuestionFlow.jsx';
import WizardSummary from './shared/WizardSummary.jsx';
import WizardChecklist from './shared/WizardChecklist.jsx';
import ChecklistSection from './shared/ChecklistSection.jsx';

const FEATURES = [
  { dot: 'primary', label: 'Age-appropriate materials' },
  { dot: 'emerald', label: 'Space-safe recommendations' },
  { dot: 'amber', label: 'Focus-driven gear selection' },
  { dot: 'purple', label: 'Budget-tuned affiliate links' },
];

const MATERIAL_LABELS = {
  plastic: 'Shatterproof plastic',
  borosilicate: 'Borosilicate glass',
  jointed: 'Jointed 24/40 glassware',
};

function materialLabel(material) {
  return MATERIAL_LABELS[material] || 'Standard equipment';
}

export default function ChemWizard() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ user: null, space: null, focus: null, budget: null });

  const kit = useMemo(() => computeKit(answers), [answers]);
  const total = useMemo(() => kitTotal(kit), [kit]);
  const bundleDestination = buildProductPurchaseUrl(kit.bundle ? CATALOG[kit.bundle]?.url : undefined);
  const complete = answers.user && answers.space && answers.focus && answers.budget;

  const onAnswer = (qid, oid) => {
    setAnswers(a => ({ ...a, [qid]: oid }));
    const idx = QUESTIONS.findIndex(q => q.id === qid);
    if (idx < QUESTIONS.length - 1) {
      setTimeout(() => setStep(s => s + 1), 220);
    }
  };

  const reset = () => {
    setAnswers({ user: null, space: null, focus: null, budget: null });
    setStep(0);
  };

  if (!started) {
    return (
      <WizardIntro
        badge="Interactive Wizard"
        title="Build Your Perfect Home Chemistry Lab"
        description="Answer 4 quick questions to get a customized equipment checklist tailored to your age, budget, and safety constraints."
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
            title="Your Lab Is Configured"
            metaParts={[
              materialLabel(kit.material),
              kit.focusLabel,
              `via ${kit.vendor}`,
            ]}
          />
        )}
      </div>

      <div className="preview-col">
        <ChemLabPreview answers={answers} kit={kit} total={total} />
      </div>

      {complete && (
        <WizardChecklist
          title="Your Custom Shopping Checklist"
          description={
            <>Curated for a <strong>{answers.user}</strong> level in a <strong>{answers.space}</strong> space, focused on <strong>{kit.focusLabel.toLowerCase()}</strong> with a <strong>{answers.budget}</strong> budget.</>
          }
          banners={kit.banners}
        >
          <ChecklistSection title="Required Safety Gear" icon="\ud83e\uddba" ids={kit.safety} catalog={CATALOG} vendorLabel={kit.vendor} />
          <ChecklistSection title="Measurement & Core Tools" icon="\ud83d\udcd0" ids={kit.core} catalog={CATALOG} vendorLabel={kit.vendor} />
          <ChecklistSection title="Specialized Add-ons" icon="\ud83d\udd2c" ids={kit.specialized} catalog={CATALOG} vendorLabel={kit.vendor} />

          {kit.bundle && (
            <div className="checklist-bundle">
              <div className="bundle-info">
                <div className="bundle-title">{CATALOG[kit.bundle].name}</div>
                <div className="bundle-sub">Buy the pre-assembled bundle from {CATALOG[kit.bundle].vendor} instead of shopping individually.</div>
              </div>
              <div className="bundle-price">${CATALOG[kit.bundle].price}</div>
              {bundleDestination && (
                <a href={bundleDestination} target="_blank" rel="noopener nofollow sponsored" className="btn-primary" data-product-id={kit.bundle} data-placement="wizard-bundle">
                  Buy Kit &rarr;
                </a>
              )}
            </div>
          )}
        </WizardChecklist>
      )}
    </div>
  );
}
