"use client";
import {useCallback, useEffect, useRef, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {api} from '@/lib/client';
import {supabase} from '@/lib/supabase';
import type {Attempt, Question, ResponseValue, TestInfo} from '@/types/sat';
import Module, {ExamHeader} from './Module';
import {BreakScreen, IntroScreen, ModuleOverScreen, PausedScreen, PreparingScreen} from './Screens';
import Report, {type ReviewItem} from './Report';

type Loaded = {attempt: Attempt; questions: Question[]; review?: ReviewItem[]};
const EMPTY: ResponseValue = {answer: '', flagged: false, eliminated: [], note: ''};

function enterFullscreen() {
 const el = document.documentElement as HTMLElement & {webkitRequestFullscreen?: () => void};
 try {if (!document.fullscreenElement) (el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())?.catch?.(() => {});} catch {}
}
function leaveFullscreen() {try {if (document.fullscreenElement) void document.exitFullscreen();} catch {}}

export default function Exam({attemptId, test, user, onStarted, onExit, onStudy}: {
 attemptId: string | null; test: TestInfo | null; user: User | null;
 onStarted: (id: string) => void; onExit: () => void; onStudy: (lessonId: string) => void;
}) {
 const [phase, setPhase] = useState<'intro' | 'preparing' | 'loading' | 'ready' | 'over'>(attemptId ? 'loading' : 'intro');
 const [data, setData] = useState<Loaded | null>(null);
 const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
 const [index, setIndexState] = useState(0);
 const [now, setNow] = useState(() => Date.now());
 const [busy, setBusy] = useState(false), [error, setError] = useState('');
 const attempt = useRef<Attempt | null>(null), resp = useRef<Record<string, ResponseValue>>({}), pos = useRef(0);
 const chain = useRef<Promise<unknown>>(Promise.resolve()), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
 const token = useRef<string | null>(null), dirty = useRef(false), expiring = useRef(false), live = useRef(true);
 const name = (user?.user_metadata?.full_name as string) || user?.email?.split('@')[0] || 'Student';

 useEffect(() => {
  live.current = true;
  if (!supabase) return;
  void supabase.auth.getSession().then(({data}) => {token.current = data.session?.access_token ?? null;});
  const {data: sub} = supabase.auth.onAuthStateChange((_e, s) => {token.current = s?.access_token ?? null;});
  const tick = setInterval(() => setNow(Date.now()), 500);
  return () => {live.current = false; sub.subscription.unsubscribe(); clearInterval(tick);};
 }, []);

 const load = useCallback(async () => {
  if (!attemptId) return;
  const x = await api<Loaded>('attempt', {action: 'load', id: attemptId});
  if (!live.current) return;
  attempt.current = x.attempt; resp.current = x.attempt.responses ?? {};
  setData(x); setResponses(resp.current); expiring.current = false;
  const p = Math.max(0, Math.min(x.attempt.position ?? 0, Math.max(0, x.questions.length)));
  pos.current = p; setIndexState(p);
  setPhase('ready');
 }, [attemptId]);
 useEffect(() => {if (attemptId) {setPhase('loading'); void load().catch(e => setError((e as Error).message));}}, [attemptId, load]);

 /** Serialised writes: answers, position, and stage changes never race each other. */
 const send = useCallback((action: 'save' | 'advance' | 'pause' | 'resume') => {
  const run = async () => {
   const a = attempt.current; if (!a || a.completed_at) return null;
   dirty.current = false;
   const x = await api<{attempt: Attempt}>('attempt', {action, id: a.id, version: a.version, responses: resp.current, position: pos.current});
   attempt.current = x.attempt;
   if (live.current) setData(d => d ? {...d, attempt: x.attempt} : d);
   return x.attempt;
  };
  const p = chain.current.catch(() => {}).then(run);
  chain.current = p;
  return p;
 }, []);
 const queueSave = useCallback(() => {
  dirty.current = true;
  if (timer.current) clearTimeout(timer.current);
  timer.current = setTimeout(() => {send('save').then(() => setError('')).catch(e => live.current && setError((e as Error).message + ' Your latest answers will retry.'));}, 700);
 }, [send]);

 // Pause automatically if the tab is closed mid-module, so the clock stops like "Save and Exit".
 useEffect(() => {
  const away = () => {
   const a = attempt.current;
   if (!a || a.completed_at || a.paused_remaining != null || !token.current) return;
   try {
    void fetch('/api/attempt', {method: 'POST', keepalive: true, headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token.current},
     body: JSON.stringify({action: 'pause', id: a.id, version: a.version, responses: resp.current, position: pos.current})});
   } catch {}
  };
  window.addEventListener('pagehide', away);
  return () => window.removeEventListener('pagehide', away);
 }, []);

 const change = useCallback((qid: string, patch: Partial<ResponseValue>) => {
  const next = {...resp.current, [qid]: {...(resp.current[qid] ?? EMPTY), ...patch}};
  resp.current = next; setResponses(next); queueSave();
 }, [queueSave]);
 const setIndex = useCallback((i: number) => {pos.current = i; setIndexState(i); queueSave();}, [queueSave]);

 const advance = useCallback(async () => {
  if (busy) return;
  setBusy(true); setError('');
  if (timer.current) clearTimeout(timer.current);
  const fromStage = attempt.current?.stage ?? 0;
  if (fromStage !== 2) setPhase('over');
  const started = Date.now();
  try {
   pos.current = 0;
   const a = await send('advance');
   if (fromStage !== 2) await new Promise(r => setTimeout(r, Math.max(0, 1800 - (Date.now() - started))));
   if (a) await load();
  } catch (e) {setError((e as Error).message); setPhase('ready');}
  finally {if (live.current) setBusy(false);}
 }, [busy, send, load]);

 const saveExit = useCallback(async () => {
  setBusy(true);
  try {if (timer.current) clearTimeout(timer.current); await send('pause'); leaveFullscreen(); onExit();}
  catch (e) {setError((e as Error).message);} finally {setBusy(false);}
 }, [send, onExit]);

 const a = data?.attempt;
 const paused = a?.paused_remaining != null;
 const remaining = a ? (paused ? a.paused_remaining! : Math.max(0, Math.ceil((new Date(a.deadline).getTime() - now) / 1000))) : 0;
 useEffect(() => {
  if (phase !== 'ready' || !a || a.completed_at || paused || remaining > 0 || expiring.current) return;
  expiring.current = true; void advance();
 }, [phase, a, paused, remaining, advance]);

 // ---------- start flow ----------
 if (!attemptId && test) {
  if (phase === 'preparing') return <PreparingScreen/>;
  return <IntroScreen busy={busy} onBack={onExit} onNext={async () => {
   enterFullscreen(); setPhase('preparing'); setBusy(true);
   const t0 = Date.now();
   try {
    const x = await api<{attempt: Attempt}>('attempt', {action: 'start', testId: test.id});
    await new Promise(r => setTimeout(r, Math.max(0, 1500 - (Date.now() - t0))));
    onStarted(x.attempt.id);
   } catch (e) {setError((e as Error).message); setPhase('intro'); alert((e as Error).message);}
   finally {setBusy(false);}
  }}/>;
 }

 if (!a || phase === 'loading') return <div className="bb"><div className="bb-over"><div>
  {error ? <><h2>We couldn&apos;t open this test</h2><p>{error}</p><div style={{display: 'flex', gap: 10, justifyContent: 'center', marginTop: 16}}><button className="bb-btn ghost" onClick={onExit}>Back</button><button className="bb-btn" onClick={() => {setError(''); void load().catch(e => setError((e as Error).message));}}>Retry</button></div></>
   : <><h2>Loading your practice test</h2><span className="bb-dots"/></>}
 </div></div></div>;

 if (a.completed_at) return <Report attempt={a} review={data!.review ?? []} name={name} onExit={() => {leaveFullscreen(); onExit();}} onStudy={onStudy}/>;
 if (phase === 'over') return <ModuleOverScreen header={<ExamHeader stage={Math.min(a.stage, 4)} remaining={null}/>}/>;
 if (paused) return <PausedScreen title={['Reading and Writing · Module 1', 'Reading and Writing · Module 2', 'Break', 'Math · Module 1', 'Math · Module 2'][a.stage] ?? 'Practice test'} remaining={remaining} busy={busy}
  onExit={() => {leaveFullscreen(); onExit();}}
  onResume={async () => {enterFullscreen(); setBusy(true); try {await send('resume');} catch (e) {setError((e as Error).message);} finally {setBusy(false);}}}/>;
 if (a.stage === 2) return <BreakScreen remaining={remaining} name={name} busy={busy} onResume={() => {enterFullscreen(); void advance();}}/>;
 return <Module attemptId={a.id} stage={a.stage} questions={data!.questions} responses={responses} onChange={change}
  index={index} setIndex={setIndex} remaining={remaining} name={name} busy={busy} error={error}
  onSubmit={() => void advance()} onSaveExit={() => void saveExit()}/>;
}
