import { useState } from 'react';
import { SCIENCES } from '../lib/data';

const ACCESS = ['open', 'subscription', 'freemium', 'affiliate'];
const TYPES = ['reference', 'journal', 'database', 'tool', 'youtube', 'simulator', 'software', 'university', 'supplies'];

const API = import.meta.env.PUBLIC_API_URL || 'http://localhost:5000';

export default function SubmitModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: '', url: '', description: '', science: 'Physics',
    subdiscipline: '', submitter_email: '', access: 'open', resource_type: 'reference'
  });
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setMsg('');
    try {
      const r = await fetch(`${API}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || 'Submission failed');
      setStatus('ok');
      setMsg('Thanks — your submission is queued for review.');
      setForm({ name: '', url: '', description: '', science: 'Physics', subdiscipline: '', submitter_email: '', access: 'open', resource_type: 'reference' });
    } catch (err) {
      setStatus('err');
      setMsg(err.message);
    }
  };

  return (
    <>
      <button className="submit-btn" onClick={() => setOpen(true)}>+ Submit resource</button>
      {open && (
        <div className="modal-overlay" onClick={() => setOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Submit a resource</h2>
              <button className="modal-close" onClick={() => setOpen(false)}>×</button>
            </div>
            <form onSubmit={submit} className="modal-form">
              <label>Name <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
              <label>URL <input required type="url" placeholder="https://…" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></label>
              <label>Description <textarea rows="3" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
              <div className="modal-row">
                <label>Science
                  <select value={form.science} onChange={e => setForm({ ...form, science: e.target.value })}>
                    {SCIENCES.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                  </select>
                </label>
                <label>Subdiscipline <input value={form.subdiscipline} onChange={e => setForm({ ...form, subdiscipline: e.target.value })} placeholder="e.g. Quantum Mechanics" /></label>
              </div>
              <div className="modal-row">
                <label>Access
                  <select value={form.access} onChange={e => setForm({ ...form, access: e.target.value })}>
                    {ACCESS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </label>
                <label>Type
                  <select value={form.resource_type} onChange={e => setForm({ ...form, resource_type: e.target.value })}>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <label>Your email (optional) <input type="email" value={form.submitter_email} onChange={e => setForm({ ...form, submitter_email: e.target.value })} /></label>
              {msg && <div className={`modal-msg ${status}`}>{msg}</div>}
              <div className="modal-actions">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={status === 'sending'} className="btn-primary">
                  {status === 'sending' ? 'Sending…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}