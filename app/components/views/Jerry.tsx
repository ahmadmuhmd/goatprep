"use client";
import {useEffect, useRef, useState} from 'react';
import {ArrowUp, BookOpen, Check, RotateCcw, X} from 'lucide-react';
import {api} from '@/lib/client';
import type {AppCtx} from '../site/context';
import MathText from '../MathText';
import JerryHead from '../JerryHead';

export type Chat = {role: 'user' | 'assistant'; text: string; sources?: {id: string; title: string}[]};
type QuizBlock = {question: string; options: string[]; answer: number; explanation?: string};

const STARTERS = ['Quiz me on my weakest skill', 'Teach me a Desmos trick', 'Comma vs semicolon?', 'Plan my week until test day'];
const STORE = 'goatprep-jerry';

export function useJerryChat() {
 const [chats, setChats] = useState<Chat[]>([]);
 useEffect(() => {try {const s = sessionStorage.getItem(STORE); if (s) setChats(JSON.parse(s));} catch {}}, []);
 useEffect(() => {try {sessionStorage.setItem(STORE, JSON.stringify(chats.slice(-30)));} catch {}}, [chats]);
 return [chats, setChats] as const;
}

export default function JerryChat({ctx, chats, setChats, pending, clearPending, context, embedded = false}: {
 ctx: AppCtx; chats: Chat[]; setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
 pending?: string; clearPending?: () => void; context?: Record<string, string>; embedded?: boolean;
}) {
 const [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
 const log = useRef<HTMLDivElement>(null);
 useEffect(() => {log.current?.scrollTo({top: log.current.scrollHeight, behavior: 'smooth'});}, [chats, busy]);
 async function ask(text = message) {
  const t = text.trim();
  if (!t || busy) return;
  if (!ctx.user) {ctx.login(); return;}
  const history = chats.slice(-10).map(c => ({role: c.role, text: c.text.slice(0, 1500)}));
  setChats(c => [...c, {role: 'user', text: t}]); setMessage(''); setBusy(true);
  try {
   const x = await api<{reply: string; sources: {id: string; title: string}[]}>('jerry', {message: t, history, context});
   setChats(c => [...c, {role: 'assistant', text: x.reply, sources: x.sources}]);
  } catch (e) {setChats(c => [...c, {role: 'assistant', text: (e as Error).message}]);}
  finally {setBusy(false);}
 }
 useEffect(() => {if (pending) {clearPending?.(); void ask(pending);}}, [pending]); // eslint-disable-line react-hooks/exhaustive-deps
 return <div className={embedded ? 'chat chat-embedded' : 'card chat'}>
  <div className="chat-log" ref={log} aria-live="polite">
   {!chats.length && <div style={{margin: 'auto', textAlign: 'center', padding: '10px 0'}}>
    <div style={{display: 'grid', placeItems: 'center'}}><JerryHead size={76}/></div>
    <h2 style={{fontSize: 28, marginTop: 14}}>Ask Jerry</h2>
    <p className="muted" style={{marginTop: 6}}>Explanations, quick quizzes, study plans.</p>
    <div className="suggest">{STARTERS.map(s => <button key={s} onClick={() => void ask(s)}>{s}</button>)}</div>
   </div>}
   {chats.map((c, i) => <div key={i} className={'msg ' + c.role}>
    {c.role === 'assistant' ? <Rich text={c.text}/> : c.text}
    {c.sources && c.sources.length > 0 && <div className="src">{c.sources.map(s => <button key={s.id} className="chip chip-green" onClick={() => ctx.navigate('study', s.id)}><BookOpen size={13}/> {s.title}</button>)}</div>}
   </div>)}
   {busy && <div className="msg assistant" style={{padding: 0}}><span className="typing"><i/><i/><i/></span></div>}
  </div>
  <form className="composer" onSubmit={e => {e.preventDefault(); void ask();}}>
   {chats.length > 0 && <button type="button" className="btn btn-ghost btn-sm" style={{width: 44, padding: 0}} aria-label="New chat" onClick={() => setChats([])}><RotateCcw size={16}/></button>}
   <input className="input" placeholder={ctx.user ? 'Ask anything about the SAT' : 'Sign in to chat with Jerry'} value={message} maxLength={1500} onChange={e => setMessage(e.target.value)} aria-label="Message Jerry"/>
   <button className="btn btn-primary" style={{width: 48, padding: 0}} disabled={busy || !message.trim()} aria-label="Send"><ArrowUp size={19}/></button>
  </form>
 </div>;
}

/** Light markdown: paragraphs, **bold**, bullet and numbered lists, $math$, and ```quiz blocks. */
function Rich({text}: {text: string}) {
 const parts = text.split(/```quiz\s*([\s\S]*?)```/g);
 return <>{parts.map((p, i) => {
  if (i % 2 === 1) {
   try {const q = JSON.parse(p) as QuizBlock; if (q.question && Array.isArray(q.options) && q.options.length >= 2) return <MiniQuiz key={i} q={q}/>;} catch {}
   return null;
  }
  return <Blocks key={i} text={p}/>;
 })}</>;
}
function Inline({text}: {text: string}) {
 const bits = text.split(/(\*\*[^*]+\*\*)/g);
 return <>{bits.map((b, i) => b.startsWith('**') && b.endsWith('**') ? <b key={i}><MathText text={b.slice(2, -2)}/></b> : <MathText key={i} text={b}/>)}</>;
}
function Blocks({text}: {text: string}) {
 const lines = text.trim().split('\n');
 const out: React.ReactNode[] = []; let list: {ordered: boolean; items: string[]} | null = null;
 const flush = () => {if (list) {const L = list.ordered ? 'ol' : 'ul'; out.push(<L key={out.length} style={{margin: '6px 0', paddingLeft: 20}}>{list.items.map((t, i) => <li key={i}><Inline text={t}/></li>)}</L>); list = null;}};
 for (const raw of lines) {
  const line = raw.trimEnd();
  const b = line.match(/^\s*[-*•]\s+(.*)/), n = line.match(/^\s*\d+[.)]\s+(.*)/);
  if (b || n) {const ordered = !!n; if (!list || list.ordered !== ordered) {flush(); list = {ordered, items: []};} list.items.push((b || n)![1]); continue;}
  flush();
  if (!line.trim()) continue;
  const h = line.match(/^#{1,4}\s+(.*)/);
  out.push(h ? <p key={out.length} style={{fontWeight: 800, marginTop: 6}}><Inline text={h[1]}/></p> : <p key={out.length} style={{margin: '4px 0'}}><Inline text={line}/></p>);
 }
 flush();
 return <>{out}</>;
}
function MiniQuiz({q}: {q: QuizBlock}) {
 const [pick, setPick] = useState<number | null>(null);
 return <div className="card" style={{padding: 14, margin: '8px 0', display: 'grid', gap: 8, background: 'var(--card)', color: 'var(--ink)'}}>
  <div className="q-prompt" style={{fontSize: 15.5}}><MathText text={q.question}/></div>
  <div className="opts">{q.options.map((o, i) => {
   const cls = pick === null ? '' : i === q.answer ? 'right' : pick === i ? 'wrong' : '';
   return <button key={i} className={'opt ' + cls} style={{padding: '9px 12px', fontSize: 15}} disabled={pick !== null} onClick={() => setPick(i)}>
    <span className="l" style={{width: 26, height: 26}}>{cls === 'right' ? <Check size={14}/> : cls === 'wrong' ? <X size={14}/> : String.fromCharCode(65 + i)}</span><span><MathText text={o}/></span>
   </button>;
  })}</div>
  {pick !== null && q.explanation && <div className={'feedback ' + (pick === q.answer ? 'good' : 'bad')} style={{fontSize: 14}}><strong>{pick === q.answer ? 'Correct.' : 'Not quite.'}</strong><MathText text={q.explanation}/></div>}
 </div>;
}

export function JerryPage({ctx, chats, setChats, pending, clearPending}: {ctx: AppCtx; chats: Chat[]; setChats: React.Dispatch<React.SetStateAction<Chat[]>>; pending?: string; clearPending?: () => void}) {
 return <>
  <div className="page-head"><div><span className="label">Your SAT tutor</span><h1>Jerry</h1></div></div>
  <JerryChat ctx={ctx} chats={chats} setChats={setChats} pending={pending} clearPending={clearPending}/>
 </>;
}
