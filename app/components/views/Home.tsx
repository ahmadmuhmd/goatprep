"use client";
import {ArrowRight, BookOpen, CalendarCheck, Flame, Languages, Play, Target, Timer} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {daysUntil, firstName, localDate, totalScore} from '../site/context';
import {useState} from 'react';
import type {Attempt} from '@/types/sat';
import {WORDS, wordOfTheDay} from '@/lib/vocab';
import Landing from './Landing';

export default function Home({ctx}: {ctx: AppCtx}) {
 return ctx.user ? <Dashboard ctx={ctx}/> : <Landing ctx={ctx}/>;
}

function Dashboard({ctx}: {ctx: AppCtx}) {
 const name = firstName(ctx);
 const finished = ctx.attempts.filter(a => a.completed_at);
 const latest = finished[0], active = ctx.attempts.find(a => !a.completed_at);
 const days = daysUntil(ctx.profile?.test_date);
 const target = ctx.profile?.target_score ?? null;
 const score = latest ? totalScore(latest) : null;
 const doneIds = new Set(finished.map(a => a.test_id));
 const nextTest = ctx.tests.find(t => !doneIds.has(t.id)) ?? ctx.tests[0];
 const nextLesson = ctx.lessons.find(l => !ctx.completed.includes(l.id) && (ctx.profile?.focus === 'math' ? l.section === 'math' : ctx.profile?.focus === 'rw' ? l.section === 'rw' : true));
 const word = wordOfTheDay();
 const answeredToday = !!ctx.daily?.days.includes(new Date().toISOString().slice(0, 10));
 const hour = new Date().getHours();
 const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
 const hist = [...finished].filter(a => totalScore(a) !== null).sort((x, y) => (x.completed_at! < y.completed_at! ? -1 : 1));
 const prev = hist.length > 1 ? totalScore(hist[hist.length - 2]) : null;
 const delta = score !== null && prev !== null ? score - prev : null;
 return <>
  <section className="banner dash-hero rise">
   <div className="banner-copy">
    <span className="label" style={{color: 'rgba(250,247,240,.7)'}}>{hello}</span>
    <h1>{name || 'Welcome back'}.</h1>
    <div className="banner-stats">
     <div><span className="big-num">{score ?? '—'}</span><small>Latest score{delta !== null && <em className={delta >= 0 ? 'up' : 'down'}> {delta >= 0 ? '+' : ''}{delta}</em>}</small></div>
     <div><span className="big-num">{target ?? '—'}</span><small>Goal</small></div>
     <div><span className="big-num">{days !== null && days >= 0 ? days : '—'}</span><small>Days to test</small></div>
     <div><span className="big-num">{ctx.daily?.streak ?? 0}</span><small>Day streak</small></div>
    </div>
    <GoalGap score={score} target={target} latest={latest ?? null} onSet={() => ctx.navigate('me')}/>
   </div>
   <ScoreJourney hist={hist} target={target} start={ctx.profile?.start_score ?? null} onStart={() => nextTest ? ctx.beginTest(nextTest) : ctx.navigate('practice')} onOpen={id => ctx.openAttempt(id)}/>
  </section>

  <div className="dash">
   {active ? <button className="action qa c-green rise" onClick={() => ctx.openAttempt(active.id)}>
    <span className="ico"><Play size={20}/></span>
    <span className="qa-text"><span className="label">Resume test</span><h3>{ctx.tests.find(t => t.id === active.test_id)?.title || 'Your test'}</h3></span>
    <ArrowRight size={18} className="qa-go"/>
   </button> : <button className="action qa c-green rise" onClick={() => nextTest ? ctx.beginTest(nextTest) : ctx.navigate('practice')}>
    <span className="ico"><Timer size={20}/></span>
    <span className="qa-text"><span className="label">Next test</span><h3>{nextTest?.title || 'Practice Test 1'}</h3></span>
    <ArrowRight size={18} className="qa-go"/>
   </button>}
   <button className="action qa c-orange rise" style={{'--i': 1} as React.CSSProperties} onClick={() => ctx.navigate('daily')}>
    <span className="ico"><Flame size={20}/></span>
    <span className="qa-text"><span className="label">Daily</span><h3>{answeredToday ? 'Done today' : '2 questions'}</h3></span>
    <ArrowRight size={18} className="qa-go"/>
   </button>
   {nextLesson && <button className="action qa c-blue rise" style={{'--i': 2} as React.CSSProperties} onClick={() => ctx.navigate('study', nextLesson.id)}>
    <span className="ico"><BookOpen size={20}/></span>
    <span className="qa-text"><span className="label">Next lesson</span><h3>{nextLesson.title}</h3></span>
    <ArrowRight size={18} className="qa-go"/>
   </button>}
   <button className="action qa c-purple rise" style={{'--i': 3} as React.CSSProperties} onClick={() => ctx.navigate('words', word.word)}>
    <span className="ico"><Languages size={20}/></span>
    <span className="qa-text"><span className="label">Word of the day</span><h3 className="serif-word">{word.word}</h3></span>
    <ArrowRight size={18} className="qa-go"/>
   </button>
  </div>

  <div className="insights">
   <WeekCard daily={ctx.daily} onGo={() => ctx.navigate('daily')}/>
   <StudyCard ctx={ctx}/>
   <SkillsCard latest={latest ?? null} onGo={() => latest ? ctx.openAttempt(latest.id) : ctx.navigate('practice')}/>
  </div>
 </>;
}

/** Points left to the goal, split by section (goal is split evenly between the two sections). */
function GoalGap({score, target, latest, onSet}: {score: number | null; target: number | null; latest: Attempt | null; onSet: () => void}) {
 if (!target) return <button className="gap-empty" onClick={onSet}><Target size={16}/> Set a goal score to track your progress <ArrowRight size={15}/></button>;
 const left = score === null ? null : target - score;
 const half = target / 2;
 const rows: [string, number | null][] = [['Reading and Writing', latest?.rw_score ?? null], ['Math', latest?.math_score ?? null]];
 return <div className="gap">
  <p className="gap-head">{left === null ? <>Take a test to see how far you are from <b>{target}</b>.</> : left <= 0 ? <>You reached your goal of <b>{target}</b>. Time to aim higher.</> : <><b>{left} points</b> to your goal of {target}</>}</p>
  {rows.map(([label, v]) => <div className={'gap-row ' + (label === 'Math' ? 'k-math' : 'k-rw')} key={label}>
   <span>{label}</span>
   <div className="gap-bar" title={v === null ? 'No score yet' : `${v} of ${Math.round(half)} target`}>
    <i style={{width: v === null ? 0 : Math.min(100, (v - 200) / 600 * 100) + '%'}}/>
    <b style={{left: (half - 200) / 600 * 100 + '%'}}/>
   </div>
   <strong>{v ?? '—'}<small> / {Math.round(half)}</small></strong>
  </div>)}
 </div>;
}

type Metric = 'total' | 'rw' | 'math';
const COL: Record<Metric, string> = {total: '#127A4E', rw: '#3B6FE0', math: '#E8743B'};
/** Interactive line chart of every finished test. Hover or tap a point for details. */
function ScoreJourney({hist, target, start, onStart, onOpen}: {hist: Attempt[]; target: number | null; start: number | null; onStart: () => void; onOpen: (id: string) => void}) {
 const [metric, setMetric] = useState<Metric>('total');
 const [hover, setHover] = useState<number | null>(null);
 if (!hist.length) return <div className="journey empty">
  <span className="label">Score journey</span>
  <h3>Your scores will appear here</h3>
  <p>Finish a full practice test and we&apos;ll chart every score, section by section, against your goal.</p>
  <button className="btn btn-primary" onClick={onStart}>Start a practice test <ArrowRight size={16}/></button>
 </div>;
 const val = (a: Attempt) => metric === 'total' ? totalScore(a)! : metric === 'rw' ? a.rw_score! : a.math_score!;
 const goal = target ? (metric === 'total' ? target : Math.round(target / 2)) : null;
 const base = start && metric === 'total' ? start : null;
 const [floor, ceil] = metric === 'total' ? [400, 1600] : [200, 800];
 const vals = hist.map(val);
 const all = [...vals, ...(goal ? [goal] : []), ...(base ? [base] : [])];
 const lo = Math.max(floor, Math.floor((Math.min(...all) - 60) / 100) * 100), hi = Math.min(ceil, Math.ceil((Math.max(...all) + 60) / 100) * 100);
 const W = 520, H = 210, L = 44, R = 16, T = 16, B = 30;
 const n = vals.length;
 const x = (i: number) => n === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (n - 1);
 const y = (v: number) => T + (hi - v) / (hi - lo || 1) * (H - T - B);
 const ticks = Array.from({length: 5}, (_, i) => Math.round(lo + (hi - lo) * i / 4));
 const path = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
 const area = `${path} L${x(n - 1)},${H - B} L${x(0)},${H - B} Z`;
 const best = Math.max(...vals);
 const h = hover ?? n - 1, ha = hist[h];
 return <div className={'journey m-' + metric}>
  <div className="journey-top">
   <span className="label">Score journey</span>
   <div className="seg" role="tablist">{([['total', 'Total'], ['rw', 'R&W'], ['math', 'Math']] as const).map(([k, l]) =>
    <button key={k} role="tab" aria-selected={metric === k} className={metric === k ? 'on' : ''} onClick={() => setMetric(k)}>{l}</button>)}</div>
  </div>
  <div className="journey-read">
   <div><b>{vals[h]}</b><small>{hist[h] && (n > 1 ? `Test ${h + 1} of ${n}` : 'Latest test')} · {new Date(ha.completed_at!).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</small></div>
   <div><b>{best}</b><small>Best</small></div>
   {goal && <div><b>{goal}</b><small>Goal</small></div>}
  </div>
  <svg viewBox={`0 0 ${W} ${H}`} className="journey-svg" onMouseLeave={() => setHover(null)}>
   <defs><linearGradient id="jg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={COL[metric]} stopOpacity=".28"/><stop offset="1" stopColor={COL[metric]} stopOpacity="0"/></linearGradient></defs>
   {ticks.map(t => <g key={t}><line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid"/><text x={L - 8} y={y(t) + 4} textAnchor="end">{t}</text></g>)}
   {goal && goal >= lo && goal <= hi && <g><line x1={L} x2={W - R} y1={y(goal)} y2={y(goal)} className="goal"/><text x={W - R} y={y(goal) - 6} textAnchor="end" className="goal-t">Goal {goal}</text></g>}
   {base && base >= lo && base <= hi && <g><line x1={L} x2={W - R} y1={y(base)} y2={y(base)} className="base"/><text x={W - R} y={y(base) + 14} textAnchor="end" className="base-t">Starting point {base}</text></g>}
   {n > 1 && <path d={area} fill="url(#jg)"/>}
   {n > 1 && <path d={path} className="line"/>}
   <line x1={x(h)} x2={x(h)} y1={T} y2={H - B} className="cursor"/>
   {vals.map((v, i) => <g key={hist[i].id}>
    <circle cx={x(i)} cy={y(v)} r={i === h ? 7 : 5} className={'pt' + (i === h ? ' on' : '')}/>
    <rect x={x(i) - (W - L - R) / Math.max(2, n) / 2} y={T} width={(W - L - R) / Math.max(2, n)} height={H - T - B} fill="transparent" style={{cursor: 'pointer'}}
     onMouseEnter={() => setHover(i)} onClick={() => hover === i || n === 1 ? onOpen(hist[i].id) : setHover(i)}/>
    <text x={x(i)} y={H - 10} textAnchor="middle">{i + 1}</text>
   </g>)}
  </svg>
  <button className="journey-link" onClick={() => onOpen(ha.id)}>Open this score report <ArrowRight size={15}/></button>
 </div>;
}

function WeekCard({daily, onGo}: {daily: AppCtx['daily']; onGo: () => void}) {
 const done = new Set(daily?.days ?? []);
 const today = new Date();
 const week = Array.from({length: 7}, (_, i) => {const d = new Date(today); d.setDate(today.getDate() - 6 + i); return d;});
 const acc = daily && daily.answered ? Math.round(daily.correct / daily.answered * 100) : null;
 return <button className="insight" onClick={onGo}>
  <span className="label"><CalendarCheck size={15}/> Last 7 days</span>
  <div className="week">{week.map(d => {const k = localDate(d); return <div key={k} className={'day' + (done.has(k) ? ' on' : '') + (k === localDate(today) ? ' today' : '')} title={d.toDateString() + (done.has(k) ? ' · practiced' : '')}>
   <i/><small>{d.toLocaleDateString(undefined, {weekday: 'narrow'})}</small></div>;})}</div>
  <div className="insight-stats"><div><b>{daily?.streak ?? 0}</b><small>day streak</small></div><div><b>{acc === null ? '—' : acc + '%'}</b><small>daily accuracy</small></div><div><b>{daily?.answered ?? 0}</b><small>answered</small></div></div>
 </button>;
}

function StudyCard({ctx}: {ctx: AppCtx}) {
 const sec = (s: 'rw' | 'math') => {const all = ctx.lessons.filter(l => l.section === s); return {all: all.length, done: all.filter(l => ctx.completed.includes(l.id)).length};};
 const rw = sec('rw'), m = sec('math');
 const Ring = ({done, all, label, color}: {done: number; all: number; label: string; color: string}) => {const p = all ? done / all : 0, c = 2 * Math.PI * 26;
  return <div className="ring"><svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" className="track"/><circle cx="32" cy="32" r="26" className="fill" style={{stroke: color}} strokeDasharray={c} strokeDashoffset={c * (1 - p)}/></svg>
   <b>{Math.round(p * 100)}%</b><small>{label}<br/>{done}/{all} lessons</small></div>;};
 return <button className="insight" onClick={() => ctx.navigate('study')}>
  <span className="label"><BookOpen size={15}/> Study progress</span>
  <div className="rings"><Ring {...rw} label="Reading & Writing" color="#3B6FE0"/><Ring {...m} label="Math" color="#E8743B"/></div>
 </button>;
}

function SkillsCard({latest, onGo}: {latest: Attempt | null; onGo: () => void}) {
 const total = latest ? totalScore(latest) : null;
 return <button className="insight" onClick={onGo}>
  <span className="label"><Target size={15}/> Section split</span>
  {total === null ? <p className="muted-p">Finish a practice test to see your Reading and Writing and Math split.</p> : <>
   <div className="split">
    <div style={{flex: latest!.rw_score!}}><b>{latest!.rw_score}</b><small>R&amp;W</small></div>
    <div style={{flex: latest!.math_score!}}><b>{latest!.math_score}</b><small>Math</small></div>
   </div>
   <p className="muted-p">{latest!.rw_score! === latest!.math_score! ? 'Both sections are even.' : `${latest!.rw_score! > latest!.math_score! ? 'Math' : 'Reading and Writing'} is your bigger opportunity: ${Math.abs(latest!.rw_score! - latest!.math_score!)} points behind.`} Open the report for skill-by-skill detail.</p>
  </>}
 </button>;
}
