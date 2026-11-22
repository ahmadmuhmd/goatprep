"use client";
import {ArrowRight, Check, Clock, Lock, Play, RotateCcw} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {totalScore} from '../site/context';

const STAGES = ['Reading and Writing · Module 1', 'Reading and Writing · Module 2', 'On break', 'Math · Module 1', 'Math · Module 2'];

export default function Practice({ctx}: {ctx: AppCtx}) {
 const slots = Math.max(12, ...ctx.tests.map(t => t.number));
 const finished = ctx.attempts.filter(a => a.completed_at);
 const active = ctx.attempts.find(a => !a.completed_at);
 const doneIds = new Set(finished.map(a => a.test_id));
 const next = ctx.tests.find(t => !doneIds.has(t.id)) ?? ctx.tests[0];
 const best = finished.length ? Math.max(...finished.map(a => totalScore(a) ?? 0)) : null;
 const featured = active ? ctx.tests.find(t => t.id === active.test_id) : next;
 return <>
  <div className="page-head"><div><span className="label">{finished.length} of {slots} completed{best ? ' · best ' + best : ''}</span><h1>Tests</h1></div></div>

  {featured && <section className="next-test rise">
   <div className="nt-num">{String(featured.number).padStart(2, '0')}</div>
   <div className="nt-body">
    <span className="label" style={{color: 'rgba(250,247,240,.7)'}}>{active ? 'In progress' : 'Up next'}</span>
    <h2>{featured.title}</h2>
    <p>{active ? STAGES[active.stage] + ' · your answers and time are saved' : 'Reading and Writing, a 10-minute break, then Math.'}</p>
    <div className="nt-facts"><span><Clock size={15}/> 2h 14m</span><span>98 questions</span><span>Adaptive</span><span>Desmos + reference</span></div>
   </div>
   <button className="btn btn-lg nt-btn" onClick={() => active ? ctx.openAttempt(active.id) : ctx.beginTest(featured)}><Play size={18}/> {active ? 'Resume' : 'Start test'}</button>
  </section>}

  <section className="section">
   <div className="section-head"><h2>All tests</h2></div>
   <div className="test-tiles">
    {Array.from({length: slots}, (_, i) => {
     const n = i + 1, t = ctx.tests.find(x => x.number === n);
     const mine = t ? ctx.attempts.filter(a => a.test_id === t.id) : [];
     const run = mine.find(a => !a.completed_at), done = mine.find(a => a.completed_at);
     const score = done ? totalScore(done) : null;
     const state = !t ? 'locked' : run ? 'active' : done ? 'done' : 'new';
     const open = () => !t ? undefined : run ? ctx.openAttempt(run.id) : done ? ctx.openAttempt(done.id) : ctx.beginTest(t);
     return <div key={n} className={'tile-test rise s-' + state} style={{'--i': i % 6} as React.CSSProperties}>
      <button className="tt-main" disabled={!t} onClick={open}>
       <span className="tt-n">{String(n).padStart(2, '0')}</span>
       <span className="tt-info">
        <b>Test {n}</b>
        <span>{state === 'locked' ? 'Coming soon' : state === 'active' ? STAGES[run!.stage] : state === 'done' ? `R&W ${done!.rw_score} · Math ${done!.math_score}` : 'Not started'}</span>
       </span>
       <span className="tt-end">{state === 'done' ? <span className="tt-score">{score}</span> : state === 'active' ? <span className="chip chip-warn">Resume</span> : state === 'locked' ? <Lock size={16}/> : <ArrowRight size={18}/>}</span>
      </button>
      {state === 'done' && <button className="tt-retake" onClick={() => ctx.beginTest(t!)} aria-label={'Retake test ' + n}><RotateCcw size={14}/> Retake</button>}
     </div>;
    })}
   </div>
   <p className="muted" style={{marginTop: 14, fontSize: 14, display: 'flex', gap: 14, flexWrap: 'wrap'}}>
    <span><Check size={14} style={{display: 'inline', verticalAlign: -2}}/> Click a finished test to see its score report.</span>
    {!ctx.user && <span><button className="link" onClick={ctx.login}>Sign in with Google</button> to save scores and resume tests.</span>}
   </p>
  </section>
 </>;
}
