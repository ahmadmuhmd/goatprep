"use client";
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Check, RotateCcw, Shuffle, Undo2, X} from 'lucide-react';
import {THEMES, WORDS, type Theme, type Word} from '@/lib/vocab';
import type {AppCtx} from '../site/context';

type Mode = 'cards' | 'quiz' | 'list';
const KEY = 'goatprep-words';
function loadKnown(): string[] {try {return JSON.parse(localStorage.getItem(KEY) || '[]');} catch {return [];}}
function saveKnown(k: string[]) {try {localStorage.setItem(KEY, JSON.stringify(k));} catch {}}

export default function Words({ctx, focus}: {ctx: AppCtx; focus: string | null}) {
 const [mode, setMode] = useState<Mode>('cards');
 const [theme, setTheme] = useState<Theme | 'All'>('All');
 const [known, setKnown] = useState<string[]>([]);
 useEffect(() => {setKnown(loadKnown());}, []);
 const mark = useCallback((w: string, isKnown: boolean) => setKnown(k => {const next = isKnown ? [...new Set([...k, w])] : k.filter(x => x !== w); saveKnown(next); return next;}), []);
 const pool = useMemo(() => WORDS.filter(w => theme === 'All' || w.theme === theme), [theme]);
 return <>
  <div className="page-head">
   <div><span className="label">{known.length} of {WORDS.length} known</span><h1>SAT words</h1></div>
   <div className="seg" role="group" aria-label="Mode">
    <button aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>Cards</button>
    <button aria-pressed={mode === 'quiz'} onClick={() => setMode('quiz')}>Quiz</button>
    <button aria-pressed={mode === 'list'} onClick={() => setMode('list')}>List</button>
   </div>
  </div>
  <div className="words-top">
   <div className="chips" role="group" aria-label="Theme">
    {(['All', ...THEMES] as const).map(t => <button key={t} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t}</button>)}
   </div>
   <div className="bar" style={{width: 180}}><i style={{width: (known.length / WORDS.length * 100) + '%'}}/></div>
  </div>
  {mode === 'cards' && <Cards pool={pool} known={known} mark={mark} focus={focus} key={theme}/>}
  {mode === 'quiz' && <Quiz pool={pool} mark={mark} key={theme + 'q'}/>}
  {mode === 'list' && <List pool={pool} known={known} mark={mark}/>}
  <p className="muted" style={{marginTop: 22, fontSize: 14}}>{ctx.user ? 'Progress saves on this device.' : 'Progress saves on this device.'}</p>
 </>;
}

function shuffle<T>(a: T[]) {const b = [...a]; for (let i = b.length - 1; i > 0; i--) {const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]];} return b;}

function Cards({pool, known, mark, focus}: {pool: Word[]; known: string[]; mark: (w: string, k: boolean) => void; focus: string | null}) {
 const [deck, setDeck] = useState<Word[]>(() => {
  const unknown = pool.filter(w => !known.includes(w.word)), rest = pool.filter(w => known.includes(w.word));
  const d = [...unknown, ...rest];
  const f = focus ? d.findIndex(w => w.word === focus) : -1;
  return f > 0 ? [d[f], ...d.slice(0, f), ...d.slice(f + 1)] : d;
 });
 const [i, setI] = useState(0), [flipped, setFlipped] = useState(false), [dx, setDx] = useState(0);
 const start = useRef<number | null>(null), history = useRef<number[]>([]);
 const w = deck[i];
 const go = useCallback((isKnown: boolean) => {
  if (!w) return;
  mark(w.word, isKnown); history.current.push(i);
  setFlipped(false); setDx(isKnown ? 600 : -600);
  setTimeout(() => {setDx(0); setI(n => n + 1);}, 180);
 }, [w, i, mark]);
 useEffect(() => {
  const key = (e: KeyboardEvent) => {
   if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
   if (e.key === ' ') {e.preventDefault(); setFlipped(f => !f);} else if (e.key === 'ArrowRight') go(true); else if (e.key === 'ArrowLeft') go(false);
  };
  window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
 }, [go]);
 if (!w) return <div className="card card-pad" style={{textAlign: 'center', maxWidth: 560, margin: '0 auto'}}>
  <h2 style={{fontSize: 28}}>Deck done.</h2>
  <p className="muted" style={{margin: '8px 0 18px'}}>{pool.filter(x => known.includes(x.word)).length} of {pool.length} marked known.</p>
  <div className="flash-ctl"><button className="btn btn-primary" onClick={() => {setDeck(shuffle(pool.filter(x => !known.includes(x.word)))); setI(0);}}>Review unknown</button><button className="btn btn-ghost" onClick={() => {setDeck(shuffle(pool)); setI(0);}}><Shuffle size={16}/> All again</button></div>
 </div>;
 return <div className="flash-wrap">
  <div className={'flash ' + (flipped ? 'flipped' : '')}
   style={{transform: `translateX(${dx}px) rotate(${dx / 30}deg) ${flipped ? 'rotateY(180deg)' : ''}`, transition: start.current === null ? undefined : 'none'}}
   onClick={() => Math.abs(dx) < 6 && setFlipped(f => !f)}
   onPointerDown={e => {start.current = e.clientX;}}
   onPointerMove={e => {if (start.current !== null) setDx(e.clientX - start.current);}}
   onPointerUp={() => {const d = dx; start.current = null; if (d > 110) go(true); else if (d < -110) go(false); else setDx(0);}}
   onPointerCancel={() => {start.current = null; setDx(0);}}
   role="button" aria-label={'Flashcard ' + w.word + '. Tap to flip.'}>
   <div className="face">
    <span className="chip" style={{alignSelf: 'center'}}>{w.theme}</span>
    <span className="w">{w.word}</span>
    <span className="pos">{w.pos}</span>
    <span className="hint">Tap to flip · swipe right if you know it</span>
   </div>
   <div className="face back">
    <span className="pos" style={{color: 'inherit', opacity: .7, textAlign: 'left'}}>{w.word} · {w.pos}</span>
    <span className="def">{w.def}</span>
    <span className="ex">“{w.ex}”</span>
    <span className="mnemo"><b>Remember it: </b>{w.trick}</span>
   </div>
  </div>
  <div className="flash-ctl">
   <button className="btn btn-ghost" onClick={() => go(false)}><X size={17}/> Still learning</button>
   <button className="btn btn-primary" onClick={() => go(true)}><Check size={17}/> Know it</button>
  </div>
  <div className="flash-count">{i + 1} / {deck.length}{history.current.length > 0 && <> · <button className="link" onClick={() => {const p = history.current.pop(); if (p !== undefined) {setI(p); setFlipped(false);}}}><Undo2 size={14}/> Undo</button></>}</div>
 </div>;
}

function Quiz({pool, mark}: {pool: Word[]; mark: (w: string, k: boolean) => void}) {
 const make = useCallback(() => shuffle(pool).slice(0, 10).map(w => ({w, options: shuffle([w, ...shuffle(WORDS.filter(x => x.word !== w.word)).slice(0, 3)])})), [pool]);
 const [qs, setQs] = useState(make), [n, setN] = useState(0), [pick, setPick] = useState<string | null>(null), [score, setScore] = useState(0);
 const q = qs[n];
 if (!q) return <div className="card card-pad" style={{textAlign: 'center', maxWidth: 560, margin: '0 auto'}}>
  <div className="big-num" style={{fontSize: 72}}>{score}/10</div>
  <p className="muted" style={{margin: '8px 0 18px'}}>{score >= 9 ? 'Excellent.' : score >= 6 ? 'Solid. Review the misses.' : 'Keep going with the cards.'}</p>
  <button className="btn btn-primary" onClick={() => {setQs(make()); setN(0); setScore(0); setPick(null);}}><RotateCcw size={16}/> New quiz</button>
 </div>;
 return <div className="card q-card" style={{maxWidth: 620, margin: '0 auto'}}>
  <div className="q-meta"><span className="chip">{n + 1} / 10</span><span className="chip chip-green">Score {score}</span></div>
  <h2 style={{fontSize: 40}}>{q.w.word}</h2>
  <div className="opts">{q.options.map((o, i) => {
   const cls = pick === null ? '' : o.word === q.w.word ? 'right' : pick === o.word ? 'wrong' : '';
   return <button key={o.word} className={'opt ' + cls} disabled={pick !== null} style={{fontFamily: 'var(--font-ui)'}} onClick={() => {setPick(o.word); const ok = o.word === q.w.word; if (ok) setScore(s => s + 1); mark(q.w.word, ok);}}>
    <span className="l">{String.fromCharCode(65 + i)}</span><span>{o.def}</span>
   </button>;
  })}</div>
  {pick !== null && <div className={'feedback ' + (pick === q.w.word ? 'good' : 'bad')}><strong>{q.w.word}: {q.w.def}</strong>{q.w.trick}</div>}
  {pick !== null && <button className="btn btn-primary" onClick={() => {setN(x => x + 1); setPick(null);}}>Next</button>}
 </div>;
}

function List({pool, known, mark}: {pool: Word[]; known: string[]; mark: (w: string, k: boolean) => void}) {
 const [q, setQ] = useState(''), [open, setOpen] = useState<string | null>(null);
 const items = pool.filter(w => (w.word + ' ' + w.def).toLowerCase().includes(q.toLowerCase()));
 return <>
  <input className="input" style={{maxWidth: 320, borderRadius: 999, marginBottom: 14}} placeholder="Search words" value={q} onChange={e => setQ(e.target.value)} aria-label="Search words"/>
  <div className="word-list">{items.map(w => <button key={w.word} className={'word-item ' + (known.includes(w.word) ? 'known' : '')} onClick={() => setOpen(open === w.word ? null : w.word)}>
   <b>{w.word}</b><span className="muted" style={{fontSize: 14}}>{w.def}</span>
   {open === w.word && <span style={{fontSize: 14, marginTop: 6}}><i>“{w.ex}”</i><br/><span style={{display: 'block', marginTop: 6}}><b style={{font: 'inherit', fontWeight: 800}}>Trick: </b>{w.trick}</span>
    <span className="link" style={{marginTop: 8}} onClick={e => {e.stopPropagation(); mark(w.word, !known.includes(w.word));}}>{known.includes(w.word) ? 'Mark as learning' : 'Mark as known'}</span></span>}
  </button>)}</div>
 </>;
}
