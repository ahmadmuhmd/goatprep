"use client";
import {useEffect, useState} from 'react';
import {ArrowRight, BookOpen, CalendarDays, ChevronRight, Flame, Languages, LogOut, Moon, PenLine, ShieldCheck, Star, Sun, Target, Trophy} from 'lucide-react';
import {WORDS} from '@/lib/vocab';
import type {AppCtx} from '../site/context';
import {daysUntil, firstName, totalScore} from '../site/context';
import {Mark} from '../brand/Logo';
import Onboarding from './Onboarding';

export default function Me({ctx}: {ctx: AppCtx}) {
 const [editing, setEditing] = useState(false);
 const [known, setKnown] = useState(0);
 const [theme, setTheme] = useState<'light' | 'dark'>('light');
 useEffect(() => {
  try {setKnown(JSON.parse(localStorage.getItem('goatprep-words') || '[]').length);} catch {}
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
 }, []);
 if (!ctx.user) return <div className="card card-pad" style={{maxWidth: 520, margin: '20px auto', textAlign: 'center'}}>
  <div style={{display: 'grid', placeItems: 'center', marginBottom: 14}}><Mark size={64}/></div>
  <h1 style={{fontSize: 32}}>Your space</h1>
  <p className="muted" style={{margin: '8px 0 20px'}}>Scores, goals, streaks and progress, saved to your account.</p>
  <button className="btn btn-primary btn-lg" onClick={ctx.login}>Sign in with Google</button>
 </div>;

 const p = ctx.profile, done = ctx.attempts.filter(a => a.completed_at).reverse();
 const scores = done.map(totalScore).filter((s): s is number => s !== null);
 const best = scores.length ? Math.max(...scores) : null;
 const days = daysUntil(p?.test_date);
 const toggleTheme = () => {const next = theme === 'light' ? 'dark' : 'light'; setTheme(next); document.documentElement.dataset.theme = next; try {localStorage.setItem('goatprep-theme', next);} catch {}};
 const avatar = ctx.user.user_metadata?.avatar_url as string | undefined;
 const domains = [...new Set(ctx.lessons.map(l => l.domain))];
 return <>
  <div className="me-head rise">
   <span className="avatar">{avatar ? <img src={avatar} alt="" referrerPolicy="no-referrer"/> : (firstName(ctx)[0] || 'G').toUpperCase()}</span>
   <div style={{flex: 1}}>
    <h1>{p?.display_name || firstName(ctx) || 'Student'}</h1>
    <div className="facts" style={{marginTop: 8}}>
     {p?.grade && <span className="chip">{p.grade}</span>}
     {p?.focus && <span className="chip chip-green">Focus: {p.focus === 'rw' ? 'Reading & Writing' : p.focus === 'math' ? 'Math' : 'Both'}</span>}
    </div>
   </div>
   <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}><PenLine size={15}/> Edit goals</button>
  </div>

  <div className="me-grid">
   <Stat i={0} icon={<Target size={18}/>} label="Target" value={p?.target_score ?? '—'} note={best && p?.target_score ? (best >= p.target_score ? 'Reached' : (p.target_score - best) + ' to go') : undefined}/>
   <Stat i={1} icon={<CalendarDays size={18}/>} label="Test day" value={days === null ? '—' : days < 0 ? 'Done' : days} note={p?.test_date ? new Date(p.test_date + 'T00:00:00').toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'}) + (days !== null && days >= 0 ? ' · days left' : '') : 'Not set'}/>
   <Stat i={2} icon={<Trophy size={18}/>} label="Best score" value={best ?? '—'} note={scores.length ? scores.length + ' test' + (scores.length > 1 ? 's' : '') + ' taken' : 'No tests yet'}/>
   <Stat i={3} icon={<Flame size={18}/>} label="Daily streak" value={ctx.daily?.streak ?? 0} note={ctx.daily ? ctx.daily.correct + ' / ' + ctx.daily.answered + ' correct' : undefined}/>
   <Stat i={4} icon={<BookOpen size={18}/>} label="Lessons" value={ctx.completed.length} note={'of ' + ctx.lessons.length}/>
   <Stat i={5} icon={<Languages size={18}/>} label="Words known" value={known} note={'of ' + WORDS.length}/>
  </div>


  <section className="section">
   <div className="section-head"><h2>Skill progress</h2></div>
   <div className="card card-pad domain-bars">
    {domains.map(d => {const all = ctx.lessons.filter(l => l.domain === d), f = all.filter(l => ctx.completed.includes(l.id)).length; return <div key={d}>
     <div className="top"><span>{d}</span><span className="muted">{f}/{all.length}</span></div>
     <div className="bar"><i style={{width: (f / Math.max(all.length, 1) * 100) + '%'}}/></div>
    </div>;})}
   </div>
  </section>

  <section className="section">
   <div className="section-head"><h2>Settings</h2></div>
   <div className="card" style={{padding: '4px 20px'}}>
    <div className="settings">
     <button className="set-row" onClick={toggleTheme}><span style={{display: 'flex', gap: 12, alignItems: 'center'}}>{theme === 'light' ? <Moon size={18}/> : <Sun size={18}/>} {theme === 'light' ? 'Dark mode' : 'Light mode'}</span><ChevronRight size={18}/></button>
     <button className="set-row" onClick={() => ctx.navigate('reviews')}><span style={{display: 'flex', gap: 12, alignItems: 'center'}}><Star size={18}/> Write a review</span><ChevronRight size={18}/></button>
     {ctx.admin && <button className="set-row" onClick={() => ctx.navigate('admin')}><span style={{display: 'flex', gap: 12, alignItems: 'center'}}><ShieldCheck size={18}/> Manage reviews</span><ChevronRight size={18}/></button>}
     <button className="set-row" onClick={ctx.logout}><span style={{display: 'flex', gap: 12, alignItems: 'center', color: 'var(--bad)'}}><LogOut size={18}/> Sign out</span><span className="muted" style={{fontSize: 13}}>{ctx.user.email}</span></button>
    </div>
   </div>
  </section>
  {editing && <Onboarding ctx={ctx} editing onClose={() => setEditing(false)}/>}
 </>;
}

function Stat({icon, label, value, note, i}: {icon: React.ReactNode; label: string; value: React.ReactNode; note?: string; i: number}) {
 return <div className="card stat rise" style={{'--i': i} as React.CSSProperties}>
  <span className="label" style={{display: 'flex', gap: 8, alignItems: 'center'}}>{icon} {label}</span>
  <span className="big-num">{value}</span>
  {note && <span className="muted" style={{fontSize: 13.5}}>{note}</span>}
 </div>;
}

function ScoreChart({scores, goal, start}: {scores: number[]; goal: number | null; start: number | null}) {
 const W = 640, H = 220, pad = 34;
 const pts = start ? [start, ...scores] : scores;
 const lo = Math.max(400, Math.floor((Math.min(...pts, goal ?? 1600) - 60) / 100) * 100);
 const hi = Math.min(1600, Math.ceil((Math.max(...pts, goal ?? 400) + 40) / 100) * 100);
 const x = (i: number) => pad + (pts.length === 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / (pts.length - 1));
 const y = (v: number) => H - pad - (v - lo) / Math.max(hi - lo, 1) * (H - 2 * pad);
 const ticks = Array.from({length: 4}, (_, i) => Math.round((lo + (hi - lo) * i / 3) / 10) * 10);
 return <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score history chart">
  {ticks.map(t => <g key={t}><line className="grid" x1={pad} x2={W - pad} y1={y(t)} y2={y(t)}/><text x={0} y={y(t) + 4}>{t}</text></g>)}
  {goal && <><line className="goal" x1={pad} x2={W - pad} y1={y(goal)} y2={y(goal)}/><text x={W - pad - 60} y={y(goal) - 8}>Goal {goal}</text></>}
  <polyline className="line" points={pts.map((v, i) => x(i) + ',' + y(v)).join(' ')}/>
  {pts.map((v, i) => <g key={i}><circle cx={x(i)} cy={y(v)} r={5.5}/><text x={x(i) - 14} y={y(v) - 12} style={{fill: 'var(--ink)'}}>{v}</text></g>)}
 </svg>;
}
