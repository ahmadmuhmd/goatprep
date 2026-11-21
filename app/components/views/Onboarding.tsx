"use client";
import {useState} from 'react';
import {ArrowLeft, ArrowRight, X} from 'lucide-react';
import {api} from '@/lib/client';
import type {Profile} from '@/types/sat';
import type {AppCtx} from '../site/context';
import {Mark} from '../brand/Logo';

const GRADES = ['9th grade', '10th grade', '11th grade', '12th grade', 'Gap year / other'];

export default function Onboarding({ctx, onClose, editing = false}: {ctx: AppCtx; onClose: () => void; editing?: boolean}) {
 const p = ctx.profile;
 const [step, setStep] = useState(0), [busy, setBusy] = useState(false), [error, setError] = useState('');
 const [name, setName] = useState(p?.display_name || ctx.user?.user_metadata?.full_name || '');
 const [grade, setGrade] = useState(p?.grade || '');
 const [date, setDate] = useState(p?.test_date || ''), [noDate, setNoDate] = useState(!!p?.onboarded_at && !p?.test_date);
 const [target, setTarget] = useState(p?.target_score || 1400);
 const [start, setStart] = useState<number | null>(p?.start_score ?? null), [noStart, setNoStart] = useState(!!p?.onboarded_at && p?.start_score == null);
 const [focus, setFocus] = useState(p?.focus || '');
 const steps = [
  {q: 'What should we call you?', ok: name.trim().length > 0, body: <input className="input" autoFocus maxLength={40} value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={{marginTop: 18}}/>},
  {q: 'Which grade are you in?', ok: !!grade, body: <div className="ob-opts">{GRADES.map(g => <button key={g} aria-pressed={grade === g} onClick={() => setGrade(g)}>{g}</button>)}</div>},
  {q: 'When is your SAT?', ok: noDate || !!date, body: <div className="ob-opts">
   <input className="input" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => {setDate(e.target.value); setNoDate(false);}}/>
   <button aria-pressed={noDate} onClick={() => {setNoDate(!noDate); setDate('');}}>Not booked yet</button>
  </div>},
  {q: 'Your target score', ok: true, body: <div style={{margin: '18px 0'}}>
   <div className="ob-score">{target}</div>
   <input className="range" type="range" min={800} max={1600} step={10} value={target} onChange={e => setTarget(+e.target.value)} aria-label="Target score"/>
   <div className="goal-scale"><span>800</span><span>1600</span></div>
  </div>},
  {q: 'Any score so far?', ok: noStart || start !== null, body: <div style={{margin: '18px 0'}}>
   {!noStart && <><div className="ob-score">{start ?? 1000}</div>
   <input className="range" type="range" min={400} max={1600} step={10} value={start ?? 1000} onChange={e => setStart(+e.target.value)} aria-label="Current score"/></>}
   <div className="ob-opts"><button aria-pressed={noStart} onClick={() => {setNoStart(!noStart); if (!noStart) setStart(null); else setStart(1000);}}>Not yet</button></div>
  </div>},
  {q: 'What needs the most work?', ok: !!focus, body: <div className="ob-opts">{[['rw', 'Reading & Writing'], ['math', 'Math'], ['both', 'Both equally']].map(([v, l]) => <button key={v} aria-pressed={focus === v} onClick={() => setFocus(v)}>{l}</button>)}</div>},
 ];
 const s = steps[step];
 async function save() {
  setBusy(true); setError('');
  const profile: Profile = {display_name: name.trim().slice(0, 40), grade, test_date: noDate ? null : date || null, target_score: target, start_score: noStart ? null : start ?? 1000, focus, onboarded_at: p?.onboarded_at || new Date().toISOString()};
  try {const x = await api<{profile: Profile}>('me', {profile}); ctx.setProfile(x.profile); onClose();}
  catch (e) {setError((e as Error).message);} finally {setBusy(false);}
 }
 return <div className="scrim" role="dialog" aria-modal="true" aria-label="Set up your goals">
  <div className="sheet">
   {editing && <button className="sheet-close" onClick={onClose} aria-label="Close"><X size={18}/></button>}
   {step === 0 && !editing && <div style={{marginBottom: 16}}><Mark size={48}/></div>}
   <div className="ob-steps">{steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''}/>)}</div>
   <div key={step} className="rise">
    <div className="ob-q">{s.q}</div>
    {s.body}
   </div>
   {error && <p className="chip chip-bad" style={{margin: '8px 0'}}>{error}</p>}
   <div className="ob-nav">
    {step > 0 ? <button className="btn btn-ghost" onClick={() => setStep(step - 1)}><ArrowLeft size={17}/> Back</button> : <span/>}
    {step < steps.length - 1
     ? <button className="btn btn-primary" disabled={!s.ok} onClick={() => setStep(step + 1)}>Next <ArrowRight size={17}/></button>
     : <button className="btn btn-primary" disabled={!s.ok || busy} onClick={save}>{busy ? 'Saving…' : editing ? 'Save' : 'Start studying'}</button>}
   </div>
  </div>
 </div>;
}
