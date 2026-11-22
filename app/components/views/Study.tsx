"use client";
import {useMemo, useState} from 'react';
import {ArrowLeft, Check, MessageCircle, Search, Sparkles, X} from 'lucide-react';
import {api} from '@/lib/client';
import type {StudyLesson} from '@/lib/study-schema';
import type {AppCtx} from '../site/context';
import MathText from '../MathText';
import {GoatGlyph} from '../brand/Logo';

export default function Study({ctx, lessonId}: {ctx: AppCtx; lessonId: string | null}) {
 const lesson = lessonId ? ctx.lessons.find(l => l.id === lessonId) : undefined;
 if (lesson) return <Reader ctx={ctx} lesson={lesson}/>;
 return <Library ctx={ctx}/>;
}

const PALETTE: Record<string, [string, string, string]> = {
 'Standard English Conventions': ['#127A4E', '#E3F3EA', '✎'], 'Expression of Ideas': ['#C2700A', '#FFF0D9', '❝'],
 'Craft and Structure': ['#2F5FB3', '#E6EEFC', '◆'], 'Information and Ideas': ['#9A3D86', '#F8E7F4', '✦'],
 'Algebra': ['#2F5FB3', '#E6EEFC', 'x'], 'Advanced Math': ['#9A3D86', '#F8E7F4', 'ƒ'],
 'Problem-Solving and Data Analysis': ['#C2700A', '#FFF0D9', '%'], 'Geometry and Trigonometry': ['#127A4E', '#E3F3EA', '△'],
};

function Library({ctx}: {ctx: AppCtx}) {
 const [section, setSection] = useState<'rw' | 'math'>(ctx.profile?.focus === 'math' ? 'math' : 'rw');
 const [query, setQuery] = useState('');
 const generated = new Set(ctx.lessons.filter(l => l.id.startsWith('resource-')).map(l => l.domain));
 const shownLessons = ctx.lessons.filter(l => l.id.startsWith('resource-') || !generated.has(l.domain));
 const list = shownLessons.filter(l => l.section === section && (l.title + ' ' + l.domain + ' ' + l.summary).toLowerCase().includes(query.toLowerCase()));
 const domains = [...new Set(shownLessons.filter(l => l.section === section).map(l => l.domain))];
 const done = shownLessons.filter(l => ctx.completed.includes(l.id)).length;
 return <>
  <div className="page-head">
   <div><span className="label">{done} of {shownLessons.length} done</span><h1>Study</h1></div>
   <div className="seg" role="group" aria-label="Section">
    <button aria-pressed={section === 'rw'} onClick={() => setSection('rw')}>Reading & Writing</button>
    <button aria-pressed={section === 'math'} onClick={() => setSection('math')}>Math</button>
   </div>
  </div>
  <div className="toolbar">
   <div style={{position: 'relative', flex: '1 1 240px', maxWidth: 320}}>
    <Search size={17} style={{position: 'absolute', left: 16, top: 13, color: 'var(--muted)'}}/>
    <input className="input" style={{paddingLeft: 42, maxWidth: 'none'}} placeholder="Find a skill" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search lessons"/>
   </div>
   <button className="btn btn-soft btn-sm" onClick={() => ctx.navigate('words')}>SAT words</button>
  </div>
  <div className="domains">
   {domains.map((d, i) => {
    const items = list.filter(l => l.domain === d);
    const all = shownLessons.filter(l => l.domain === d), finished = all.filter(l => ctx.completed.includes(l.id)).length;
    if (!items.length) return null;
    const [c, t, g] = PALETTE[d] ?? ['#127A4E', '#E3F3EA', '•'];
    return <section className="card domain rise" key={d} style={{'--i': i, '--dc': c, '--dt': t} as React.CSSProperties}>
     <div className="domain-band"><span className="domain-glyph">{g}</span><h2>{d}</h2><span className="domain-count">{finished}/{all.length}</span></div>
     <div className="bar domain-bar"><i style={{width: (finished / Math.max(all.length, 1) * 100) + '%'}}/></div>
     {items.map(l => <button key={l.id} className="lesson-row" onClick={() => ctx.navigate('study', l.id)}>
      <span className={'dot ' + (ctx.completed.includes(l.id) ? 'done' : '')}>{ctx.completed.includes(l.id) && <Check size={14} strokeWidth={3}/>}</span>
      <span>{l.title}</span>
      {l.goattrick && <span className="trick chip chip-green" title="Has a GOATTrick"><GoatGlyph size={13}/> Trick</span>}
     </button>)}
    </section>;
   })}
  </div>
  {!list.length && <p className="empty">No lessons match “{query}”.</p>}
 </>;
}

function Reader({ctx, lesson}: {ctx: AppCtx; lesson: StudyLesson}) {
 const [choice, setChoice] = useState<number | null>(null);
 const [busy, setBusy] = useState(false);
 const done = ctx.completed.includes(lesson.id);
 const siblings = useMemo(() => ctx.lessons.filter(l => l.section === lesson.section), [ctx.lessons, lesson.section]);
 const next = siblings[siblings.findIndex(l => l.id === lesson.id) + 1];
 async function toggle() {
  if (!ctx.user) {ctx.login(); return;}
  setBusy(true);
  try {await api('progress', {id: lesson.id, completed: !done}); ctx.setCompleted(c => done ? c.filter(id => id !== lesson.id) : [...c, lesson.id]);}
  catch (e) {ctx.notify((e as Error).message);} finally {setBusy(false);}
 }
 return <article className="reader">
  <button className="link" onClick={() => ctx.navigate('study')}><ArrowLeft size={17}/> Study</button>
  <div style={{marginTop: 18}}><span className="chip">{lesson.domain}</span></div>
  <h1>{lesson.title}</h1>
  <p className="lead">{lesson.summary}</p>

  <section className="block rise"><h2>The idea</h2><p>{lesson.concept}</p></section>
  <section className="block rise" style={{'--i': 1} as React.CSSProperties}><h2>Method</h2><ol className="steps">{lesson.steps.map(s => <li key={s}><span>{s}</span></li>)}</ol></section>
  <section className="block rise" style={{'--i': 2} as React.CSSProperties}>
   <h2>Worked example</h2>
   <div className="example"><div className="q-passage"><MathText text={lesson.example}/></div><p style={{fontSize: 16}}><MathText text={lesson.explanation}/></p></div>
  </section>
  {lesson.goattrick && <section className="block rise" style={{'--i': 3} as React.CSSProperties}>
   <div className="goattrick">
    <span className="tag"><GoatGlyph size={16} color="#fff"/> GOATTrick · {lesson.goattrick.tool}</span>
    <h3>{lesson.goattrick.title}</h3>
    <ol className="steps">{lesson.goattrick.steps.map(s => <li key={s}><span>{s}</span></li>)}</ol>
    <p className="caution"><b>Watch out:</b> {lesson.goattrick.caution}</p>
   </div>
  </section>}
  <section className="block">
   <h2>Quick check</h2>
   <div className="card q-card">
    <div className="q-prompt"><MathText text={lesson.quiz.prompt}/></div>
    <div className="opts">{lesson.quiz.options.map((o, i) => {
     const cls = choice === null ? '' : i === lesson.quiz.answer ? 'right' : choice === i ? 'wrong' : '';
     return <button key={o} className={'opt ' + cls} disabled={choice !== null} onClick={() => setChoice(i)}>
      <span className="l">{cls === 'right' ? <Check size={15}/> : cls === 'wrong' ? <X size={15}/> : String.fromCharCode(65 + i)}</span><span><MathText text={o}/></span>
     </button>;
    })}</div>
    {choice !== null && <div className={'feedback ' + (choice === lesson.quiz.answer ? 'good' : 'bad')}><strong>{choice === lesson.quiz.answer ? 'Correct.' : 'Not quite.'}</strong><MathText text={lesson.quiz.feedback}/>{choice !== lesson.quiz.answer && <div style={{marginTop: 10}}><button className="link" onClick={() => setChoice(null)}>Try again</button></div>}</div>}
   </div>
  </section>
  <div className="reader-actions">
   <button className={'btn ' + (done ? 'btn-ghost' : 'btn-primary')} disabled={busy} onClick={toggle}><Check size={17}/> {done ? 'Completed' : 'Mark complete'}</button>
   <button className="btn btn-ghost" onClick={() => ctx.askJerry('Explain "' + lesson.title + '" with a new example, then give me one practice question.')}><MessageCircle size={17}/> Ask Jerry</button>
   {next && <button className="btn btn-soft" onClick={() => ctx.navigate('study', next.id)}><Sparkles size={16}/> Next: {next.title}</button>}
  </div>
 </article>;
}
