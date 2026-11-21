"use client";
import {useEffect, useState} from 'react';
import {ArrowRight, Check, X} from 'lucide-react';
import {api} from '@/lib/client';
import type {DailyQuestion, DailyResult, DailyStats} from '@/types/sat';
import MathText from '../MathText';
import {localDate} from '../site/context';

export type DailyPayload = {date: string; items: DailyQuestion[]; answers: Partial<Record<'rw' | 'math', DailyResult>>; stats: DailyStats | null};
const cache = new Map<string, Promise<DailyPayload>>();
export function loadDaily(date = localDate(), fresh = false) {
 if (fresh || !cache.has(date)) {
  const p = api<DailyPayload>('daily?date=' + date);
  p.catch(() => cache.delete(date));
  cache.set(date, p);
 }
 return cache.get(date)!;
}
export function forgetDaily() { cache.clear(); }

const LABEL = {rw: 'Reading & Writing', math: 'Math'} as const;
const LEVEL = ['', 'Easy', 'Medium', 'Hard'];

export default function DailyCard({section, compact = false, onAnswered}: {section: 'rw' | 'math'; compact?: boolean; onAnswered?: (r: DailyResult) => void}) {
 const [q, setQ] = useState<DailyQuestion | null>(null);
 const [result, setResult] = useState<DailyResult | null>(null);
 const [choice, setChoice] = useState('');
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 const [open, setOpen] = useState(!compact);

 useEffect(() => {
  let live = true;
  loadDaily().then(d => {
   if (!live) return;
   const item = d.items.find(i => i.section === section) ?? null;
   setQ(item);
   const r = d.answers[section];
   if (r) {setResult(r); setChoice(r.answer);}
  }).catch(e => live && setError((e as Error).message));
  return () => {live = false;};
 }, [section]);

 async function check() {
  if (!q || !choice.trim() || busy) return;
  setBusy(true); setError('');
  try {
   const r = await api<DailyResult>('daily', {date: localDate(), section, id: q.id, answer: choice.trim()});
   setResult(r); onAnswered?.(r);
   cache.delete(localDate());
  } catch (e) {setError((e as Error).message);} finally {setBusy(false);}
 }

 if (error && !q) return <div className="card q-card"><span className="label">Daily question · {LABEL[section]}</span><p className="muted">Today&apos;s question isn&apos;t available right now.</p></div>;
 if (!q) return <div className="card q-card" aria-busy="true"><span className="label">Daily question · {LABEL[section]}</span><div className="bar"><i style={{width: '35%'}}/></div></div>;

 const isMCQ = q.options.length > 0;
 const state = (letter: string) => {
  if (!result) return choice === letter ? 'sel' : '';
  if (result.key.includes(letter)) return 'right';
  if (result.answer === letter) return 'wrong';
  return '';
 };
 return <div className="card q-card">
  <div className="q-meta">
   <span className="chip chip-green">Daily · {LABEL[section]}</span>
   <span className="chip">{q.domain}</span>
   <span className="chip">{LEVEL[q.difficulty]}</span>
  </div>
  {q.passage && <div className="q-passage" style={compact ? {maxHeight: 200, overflow: 'auto'} : undefined}><MathText text={q.passage}/></div>}
  <div className="q-prompt"><MathText text={q.prompt}/></div>
  {isMCQ ? <div className="opts">
   {q.options.map(o => <button key={o.letter} className={'opt ' + state(o.letter)} disabled={!!result} onClick={() => setChoice(o.letter)}>
    <span className="l">{result && result.key.includes(o.letter) ? <Check size={15}/> : result && result.answer === o.letter ? <X size={15}/> : o.letter}</span>
    <span><MathText text={o.text}/></span>
   </button>)}
  </div> : <div className="spr">
   <input className="input" inputMode="decimal" aria-label="Your answer" value={choice} disabled={!!result} maxLength={8} onChange={e => setChoice(e.target.value)} onKeyDown={e => e.key === 'Enter' && check()} placeholder="Answer"/>
   {result && <span className={'chip ' + (result.correct ? 'chip-green' : 'chip-bad')}>{result.correct ? 'Correct' : 'Answer: ' + result.key[0]}</span>}
  </div>}
  {!result && <button className="btn btn-primary" disabled={!choice.trim() || busy} onClick={check}>{busy ? 'Checking…' : 'Check'}</button>}
  {result && <div className={'feedback ' + (result.correct ? 'good' : 'bad')}>
   <strong>{result.correct ? 'Correct.' : 'Not this time.'}</strong>
   {open ? <MathText text={result.explanation}/> : <button className="link" onClick={() => setOpen(true)}>See why <ArrowRight size={15}/></button>}
  </div>}
  {error && <p className="muted" role="alert">{error}</p>}
 </div>;
}
