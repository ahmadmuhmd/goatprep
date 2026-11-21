"use client";
import {ArrowRight, Clock, Lock, Play, RotateCcw} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {totalScore} from '../site/context';

const STAGES = ['R&W · Module 1', 'R&W · Module 2', 'On break', 'Math · Module 1', 'Math · Module 2'];

export default function Practice({ctx}: {ctx: AppCtx}) {
 const slots = Math.max(12, ...ctx.tests.map(t => t.number));
 const finished = ctx.attempts.filter(a => a.completed_at);
 return <>
  <div className="page-head">
   <div><span className="label">Bluebook-style · adaptive</span><h1>Practice tests</h1></div>
   <div className="facts">
    <span className="chip"><Clock size={14}/> 2h 14m + break</span>
    <span className="chip">98 questions</span>
    <span className="chip">Desmos built in</span>
   </div>
  </div>
  <div className="tests">
   {Array.from({length: slots}, (_, i) => {
    const n = i + 1, t = ctx.tests.find(x => x.number === n);
    const mine = t ? ctx.attempts.filter(a => a.test_id === t.id) : [];
    const active = mine.find(a => !a.completed_at), best = mine.filter(a => a.completed_at)[0];
    const score = best ? totalScore(best) : null;
    return <article key={n} className={'test rise ' + (!t ? 'locked ' : '') + (best && !active ? 'done' : '')} style={{'--i': i % 8} as React.CSSProperties}>
     <div className="test-top"><b>Test {String(n).padStart(2, '0')}</b>{!t ? <Lock size={16}/> : active ? <span className="chip chip-warn">In progress</span> : best ? <span className="chip" style={{background: 'rgba(255,255,255,.18)', color: '#fff'}}>Done</span> : null}</div>
     <div className="test-body">
      {score !== null && best ? <>
       <div className="test-score"><span className="big-num">{score}</span><span className="muted">/ 1600</span></div>
       <div className="test-split"><div><span>R&W</span>{best.rw_score}</div><div><span>Math</span>{best.math_score}</div></div>
      </> : active ? <p className="muted">{STAGES[active.stage] || 'Saved'}</p> : <p className="muted">{t ? 'Not started' : 'Coming soon'}</p>}
      {t && (active
       ? <button className="btn btn-primary" onClick={() => ctx.openAttempt(active.id)}><Play size={16}/> Resume</button>
       : best
        ? <div style={{display: 'grid', gap: 8, marginTop: 'auto'}}>
           <button className="btn btn-ink" onClick={() => ctx.openAttempt(best.id)}>Score details</button>
           <button className="btn btn-ghost btn-sm" onClick={() => ctx.beginTest(t)}><RotateCcw size={15}/> Retake</button>
          </div>
        : <button className="btn btn-primary" onClick={() => ctx.beginTest(t)}><Play size={16}/> Start</button>)}
     </div>
    </article>;
   })}
  </div>
  {ctx.user && finished.length > 0 && <section className="section">
   <div className="section-head"><h2>History</h2></div>
   <div className="history">{finished.map(a => <button key={a.id} className="hist-row" onClick={() => ctx.openAttempt(a.id)}>
    <span><b>{ctx.tests.find(t => t.id === a.test_id)?.title || a.test_id}</b><br/><span className="muted" style={{fontSize: 14}}>{new Date(a.completed_at!).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</span></span>
    <span className="big-num">{totalScore(a)}</span><ArrowRight size={18}/>
   </button>)}</div>
  </section>}
  {!ctx.user && <p className="muted" style={{marginTop: 20}}><button className="link" onClick={ctx.login}>Sign in with Google</button> to save scores and resume tests.</p>}
 </>;
}
