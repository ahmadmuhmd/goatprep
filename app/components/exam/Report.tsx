"use client";
import {useMemo, useState} from 'react';
import {X} from 'lucide-react';
import type {Attempt, Question} from '@/types/sat';
import MathText from '../MathText';
import {Mark} from '../brand/Logo';
import {domainBand} from '@/lib/scoringEngine';

export type ReviewItem = Question & {correct: boolean};
const DOMAINS: Record<'rw' | 'math', {name: string; share: string}[]> = {
 rw: [
  {name: 'Information and Ideas', share: '26% of test section, 12 - 14 questions'},
  {name: 'Craft and Structure', share: '28% of test section, 13 - 15 questions'},
  {name: 'Expression of Ideas', share: '20% of test section, 8 - 12 questions'},
  {name: 'Standard English Conventions', share: '26% of test section, 11 - 15 questions'},
 ],
 math: [
  {name: 'Algebra', share: '35% of test section, 13 - 15 questions'},
  {name: 'Advanced Math', share: '35% of test section, 13 - 15 questions'},
  {name: 'Problem-Solving and Data Analysis', share: '15% of test section, 5 - 7 questions'},
  {name: 'Geometry and Trigonometry', share: '15% of test section, 5 - 7 questions'},
 ],
};
const ORDER = ['rw1', 'rw2easy', 'rw2hard', 'math1', 'math2easy', 'math2hard'];
const slug = (s: string) => 'resource-' + s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Report({attempt, review, name, onExit, onStudy}: {attempt: Attempt; review: ReviewItem[]; name: string; onExit: () => void; onStudy: (id: string) => void}) {
 const [tab, setTab] = useState<'all' | 'rw' | 'math'>('all');
 const [showKey, setShowKey] = useState(false), [per, setPer] = useState<10 | 30 | 0>(10), [page, setPage] = useState(0);
 const [open, setOpen] = useState<number | null>(null), [explain, setExplain] = useState(false);
 const date = new Date(attempt.completed_at!).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'});
 const testNo = attempt.test_id.replace(/\D/g, '');
 const rows = useMemo(() => {
  const sorted = [...review].sort((x, y) => ORDER.indexOf(x.module) - ORDER.indexOf(y.module) || x.position - y.position);
  let rw = 0, m = 0;
  return sorted.map(q => ({q, n: q.module.startsWith('rw') ? ++rw : ++m, section: q.module.startsWith('rw') ? 'rw' as const : 'math' as const, answer: attempt.responses[q.id]?.answer ?? ''}));
 }, [review, attempt.responses]);
 const shown = rows.filter(r => tab === 'all' || r.section === tab);
 const total = (attempt.rw_score ?? 200) + (attempt.math_score ?? 200);
 const correct = shown.filter(r => r.q.correct).length;
 const pages = per ? Math.max(1, Math.ceil(shown.length / per)) : 1;
 const visible = per ? shown.slice(page * per, page * per + per) : shown;
 const current = open !== null ? shown[open] : null;
 const route = {rw: attempt.route_rw, math: attempt.route_math};
 return <div className="rp">
  <div className="rp-top"><span style={{display: 'flex', alignItems: 'center', gap: 10}}><Mark size={30}/><b>GOATPrep Practice</b></span><button className="bb-btn ghost" style={{height: 38}} onClick={onExit}>Back to Practice</button></div>
  <section className="rp-hero"><div className="rp-hero-in">
   <h1>Score Details</h1>
   <p>Practice Test {testNo} · {date}</p>
   <div className="rp-actions">
    <button onClick={() => {setTab('all'); setOpen(0);}}>Review All Questions</button>
    <button onClick={() => {const weak = weakest(rows); if (weak) onStudy(slug(weak));}}>Study My Weakest Skill</button>
    <button onClick={onExit}>All Practice Tests</button>
   </div>
  </div></section>
  <div className="rp-in">
   <div className="rp-scores">
    <div className="rp-card">
     <div className="rp-card-top"><b>SAT</b><small>Practice {testNo} · {date} · {name}</small></div>
     <div className="rp-total"><span>TOTAL SCORE</span><strong>{total}</strong><small>400-1600</small></div>
     <div className="rp-sec">
      <div><span><b>Reading and Writing</b><small>200-800</small></span><strong>{attempt.rw_score}</strong></div>
      <div><span><b>Math</b><small>200-800</small></span><strong>{attempt.math_score}</strong></div>
     </div>
    </div>
    <div>
     <div className="rp-tabs" role="tablist">{(['all', 'rw', 'math'] as const).map(t => <button key={t} aria-pressed={tab === t} onClick={() => {setTab(t); setPage(0);}}>{t === 'all' ? 'All Questions' : t === 'rw' ? 'Reading and Writing' : 'Math'}</button>)}</div>
     <h2>Knowledge and Skills</h2>
     <p style={{margin: 0}}>Your performance across the 8 content domains measured on the SAT.</p>
     {(['rw', 'math'] as const).filter(s => tab === 'all' || tab === s).map(s => <div key={s}>
      <h3>{s === 'rw' ? 'Reading and Writing' : 'Math'}</h3>
      <div className="rp-ks">{DOMAINS[s].map(d => {
       const items = rows.filter(r => r.section === s && r.q.domain === d.name && r.q.scored);
       const band = domainBand(items.map(r => ({difficulty: r.q.difficulty, correct: r.q.correct})), route[s]);
       return <div key={d.name}>
        <b>{d.name}</b><small>({d.share})</small>
        <div className="rp-segs" aria-label={'Performance ' + band + ' of 7'}>{Array.from({length: 7}, (_, i) => <i key={i} className={i < band ? 'on' : ''}/>)}</div>
        <div className="rp-level">Second module: <u>{route[s] === 'hard' ? 'Harder' : 'Easier'}</u> · {items.filter(r => r.q.correct).length}/{items.length} scored correct</div>
       </div>;
      })}</div>
     </div>)}
    </div>
   </div>

   <h2 style={{marginTop: 40}}>Questions Overview</h2>
   <p style={{margin: 0}}>Review your results for each question from this practice test.</p>
   <div className="rp-stats"><div><strong>{shown.length}</strong><span>Total Questions</span></div><div><strong>{correct}</strong><span>Correct Answers</span></div><div><strong>{shown.length - correct}</strong><span>Incorrect Answers</span></div></div>
   <div className="rp-toolbar">
    <button className="rp-switch" aria-pressed={showKey} onClick={() => setShowKey(!showKey)}><i/> Show Correct Answers</button>
    <span>View: {([10, 30, 0] as const).map(v => <button key={v} style={{margin: '0 6px', fontWeight: per === v ? 800 : 400, textDecoration: per === v ? 'none' : 'underline', color: per === v ? '#1e1e1e' : '#0b57d0'}} onClick={() => {setPer(v); setPage(0);}}>{v || 'All'}</button>)}</span>
   </div>
   <div style={{overflowX: 'auto'}}><table className="rp-table">
    <thead><tr><th>Question</th><th>Section</th><th>Correct Answer</th><th>Your Answer</th><th>Actions</th><th>Domain</th></tr></thead>
    <tbody>{visible.map(r => {const i = shown.indexOf(r); const status = !r.answer ? 'Omitted' : r.q.correct ? 'Correct' : 'Incorrect'; return <tr key={r.q.id}>
     <td>{r.n}</td><td>{r.section === 'rw' ? 'Reading and Writing' : 'Math'}</td>
     <td className="key">{showKey ? (r.q.answer ?? []).join(' or ') : ''}</td>
     <td className={status === 'Correct' ? 'ok' : status === 'Omitted' ? 'om' : 'no'}>{status}{showKey && r.answer && !r.q.correct ? ' (' + r.answer + ')' : ''}</td>
     <td><button onClick={() => {setOpen(i); setExplain(false);}}>Review</button></td><td>{r.q.domain}</td>
    </tr>;})}</tbody>
   </table></div>
   {per > 0 && pages > 1 && <div style={{display: 'flex', gap: 6, justifyContent: 'center', marginTop: 16}}>
    {Array.from({length: pages}, (_, p) => <button key={p} onClick={() => setPage(p)} style={{width: 34, height: 34, border: '1px solid #ccc', background: p === page ? '#e3e3e3' : '#fff', fontWeight: 700}}>{p + 1}</button>)}
   </div>}
   <p className="rp-note">GOATPrep scores use an item-response model with College Board&apos;s published structure (adaptive modules, unscored pretest questions, 200–800 per section). They are realistic estimates, not official scores.</p>
  </div>

  {current && <div className="rp-modal" onClick={e => e.target === e.currentTarget && setOpen(null)}><div role="dialog" aria-modal="true">
   <button className="x" aria-label="Close" onClick={() => setOpen(null)}><X size={20}/></button>
   <header><b>Practice Test {testNo} · {date}</b><span>Knowledge and Skills: {current.q.domain}</span></header>
   <div className="cols">
    <div>
     <h5>{current.section === 'rw' ? 'Reading and Writing' : 'Math'}: Question {current.n}</h5>
     {current.q.passage && <div style={{whiteSpace: 'pre-wrap', marginBottom: 12}}><MathText text={current.q.passage}/></div>}
     <div><MathText text={current.q.prompt}/></div>
     {current.q.options.length > 0 && <div className="rp-opts">{current.q.options.map(o => <div key={o.letter}>{o.letter}. <MathText text={o.text}/></div>)}</div>}
    </div>
    <div>{explain && <>
     <h5>Answer</h5>
     <div className={'ans ' + (current.q.correct ? 'ok' : 'no')}>{current.answer ? `You ${current.q.options.length ? 'selected answer' : 'entered'} ${current.answer}.` : 'You did not answer.'} The correct answer is {(current.q.answer ?? []).join(' or ')}.</div>
     <h5>Rationale</h5>
     <div style={{whiteSpace: 'pre-wrap'}}><MathText text={current.q.explanation ?? ''}/></div>
     <button className="bb-btn ghost" style={{marginTop: 16, height: 38}} onClick={() => onStudy(slug(current.q.skill))}>Study: {current.q.skill}</button>
    </>}</div>
   </div>
   <footer>
    <label><input type="checkbox" checked={explain} onChange={e => setExplain(e.target.checked)}/> Show correct answer and explanation</label>
    <span style={{display: 'flex', gap: 10}}>
     <button className="bb-btn" disabled={open === 0} onClick={() => setOpen(o => Math.max(0, (o ?? 0) - 1))}>Previous</button>
     <button className="bb-btn" disabled={open === shown.length - 1} onClick={() => setOpen(o => Math.min(shown.length - 1, (o ?? 0) + 1))}>Next</button>
    </span>
   </footer>
  </div></div>}
 </div>;
}

function weakest(rows: {q: ReviewItem}[]) {
 const by = new Map<string, {n: number; c: number}>();
 for (const r of rows) if (r.q.scored) {const s = by.get(r.q.skill) ?? {n: 0, c: 0}; s.n++; if (r.q.correct) s.c++; by.set(r.q.skill, s);}
 let best: string | null = null, rate = 2;
 for (const [k, v] of by) {const x = v.c / v.n; if (v.n >= 2 && x < rate) {rate = x; best = k;}}
 return best;
}
