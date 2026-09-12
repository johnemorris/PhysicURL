/**
 * WizardQuestionFlow
 *
 * The left-column progress rail + question stack shared by both wizards.
 * All questions are rendered up front and toggled visible/hidden by CSS
 * (`.wizard-q.visible` / `.wizard-q.hidden`) rather than mounted one at a
 * time, matching the chemistry wizard's original approach so transitions
 * stay smooth.
 *
 * Props:
 * - questions: [{ id, title, subtitle, options: [{ id, icon, label, sub }] }]
 * - answers:   { [questionId]: optionId | null }
 * - step:      index of the currently visible question
 * - complete:  true once every question has an answer
 * - onAnswer:  (questionId, optionId) => void — called when an option is picked
 * - onStepChange: (index) => void — called for Back/Next/progress-rail clicks
 * - onReset:   () => void — called by "Start Over" on the final question
 */
export default function WizardQuestionFlow({ questions, answers, step, complete, onAnswer, onStepChange, onReset }) {
  return (
    <>
      <div className="wizard-progress">
        {questions.map((q, i) => (
          <div
            key={q.id}
            className={`wp-step ${i === step ? 'active' : ''} ${answers[q.id] ? 'done' : ''}`}
            onClick={() => answers[q.id] && onStepChange(i)}
          >
            <span className="wp-num">{i + 1}</span>
            <span className="wp-label">{q.title.split(' ').slice(0, 3).join(' ')}</span>
          </div>
        ))}
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className={`wizard-q ${i === step ? 'visible' : 'hidden'}`}>
          <div className="wq-header">
            <div className="wq-num">Question {i + 1} / {questions.length}</div>
            <div className="wq-title">{q.title}</div>
            <div className="wq-sub">{q.subtitle}</div>
          </div>
          <div className="wq-options">
            {q.options.map(opt => (
              <button
                key={opt.id}
                className={`wq-option ${answers[q.id] === opt.id ? 'selected' : ''}`}
                onClick={() => onAnswer(q.id, opt.id)}
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
            {i > 0 && <button className="btn-secondary" onClick={() => onStepChange(i - 1)}>&larr; Back</button>}
            {i < questions.length - 1 && answers[q.id] && (
              <button className="btn-primary" onClick={() => onStepChange(i + 1)}>Next &rarr;</button>
            )}
            {i === questions.length - 1 && complete && (
              <button className="btn-secondary" onClick={onReset}>Start Over</button>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
