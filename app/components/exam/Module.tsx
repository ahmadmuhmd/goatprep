"use client";
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Bookmark, Calculator, ChevronDown, ChevronUp, CircleHelp, EllipsisVertical, Keyboard, LogOut, Rows3, X} from 'lucide-react';
import type {Question, ResponseValue} from '@/types/sat';
import MathText from '../MathText';
import Passage, {NotesPanel, type HL} from './Passage';
import {CalculatorPanel, ReferencePanel} from './Tools';
import {Legend, QuestionGrid} from './Screens';

const EMPTY: ResponseValue = {answer: '', flagged: false, eliminated: [], note: ''};
const RW_DIRECTIONS = 'The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).\n\nAll questions in this section are multiple-choice with four answer choices. Each question has a single best answer.';
const MATH_DIRECTIONS = 'The questions in this section address a number of important math skills.\n\nUse of a calculator is permitted for all questions. A reference sheet, calculator, and these directions can be accessed throughout the test.\n\nUnless otherwise indicated: All variables and expressions represent real numbers. Figures provided are drawn to scale. All figures lie in a plane. The domain of a given function f is the set of all real numbers x for which f(x) is a real number.\n\nFor multiple-choice questions, solve each problem and choose the correct answer from the choices provided. Each multiple-choice question has a single correct answer.\n\nFor student-produced response questions, solve each problem and enter your answer as described in the directions shown with the question.';

export function moduleTitle(stage: number) {
 return stage < 2 ? `Section 1, Module ${stage + 1}: Reading and Writing` : `Section 2, Module ${stage - 2}: Math`;
}
export function fmt(sec: number) {return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');}

/** Header used by the module and by the "module is over" screen. */
export function ExamHeader({stage, remaining, children, dir, onDir}: {stage: number; remaining: number | null; children?: React.ReactNode; dir?: boolean; onDir?: () => void}) {
 const [hidden, setHidden] = useState(false);
 const warn = remaining !== null && remaining <= 300;
 return <>
  <header className="bb-header">
   <div><div className="bb-title">{moduleTitle(stage)}</div>
    {onDir && <button className="bb-directions" aria-expanded={!!dir} onClick={onDir}>Directions {dir ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button>}</div>
   {remaining !== null ? <div className={'bb-timer ' + (warn ? 'warn' : '')}>
    {hidden && !warn ? <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-label="Timer hidden"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg> : <strong role="timer" aria-live={warn ? 'polite' : 'off'}>{fmt(remaining)}</strong>}
    {!warn && <button className="bb-hide" onClick={() => setHidden(!hidden)}>{hidden ? 'Show' : 'Hide'}</button>}
   </div> : <div/>}
   <div className="bb-tools">{children}</div>
  </header>
  <div className="bb-dash"/>
 </>;
}

export default function Module({attemptId, stage, questions, responses, onChange, index, setIndex, remaining, name, onSubmit, onSaveExit, busy, error}: {
 attemptId: string; stage: number; questions: Question[]; responses: Record<string, ResponseValue>;
 onChange: (qid: string, patch: Partial<ResponseValue>) => void; index: number; setIndex: (i: number) => void;
 remaining: number; name: string; onSubmit: () => void; onSaveExit: () => void; busy: boolean; error: string;
}) {
 const isMath = stage >= 3;
 const [view, setView] = useState<'q' | 'review'>(index >= questions.length ? 'review' : 'q');
 const [nav, setNav] = useState(false), [dir, setDir] = useState(false), [more, setMore] = useState(false);
 const [calc, setCalc] = useState(false), [ref, setRef] = useState(false), [elim, setElim] = useState(false);
 const [hlMode, setHlMode] = useState(false), [tip, setTip] = useState(false), [noteFocus, setNoteFocus] = useState<string | null>(null);
 const [lineReader, setLineReader] = useState(false), [ly, setLy] = useState(160);
 const [split, setSplit] = useState(50);
 const [help, setHelp] = useState<'help' | 'keys' | null>(null);
 const store = 'goatprep-hl-' + attemptId;
 const [hls, setHls] = useState<Record<string, HL[]>>({});
 useEffect(() => {try {setHls(JSON.parse(localStorage.getItem(store) || '{}'));} catch {}}, [store]);
 const saveHls = useCallback((key: string, list: HL[]) => setHls(h => {const next = {...h, [key]: list}; try {localStorage.setItem(store, JSON.stringify(next));} catch {} return next;}), [store]);
 const main = useRef<HTMLDivElement>(null);
 const q = questions[Math.min(index, questions.length - 1)];
 const r = q ? responses[q.id] ?? EMPTY : EMPTY;
 const spr = !!q && q.options.length === 0;
 const twoPane = !!q && (!isMath || !!q.passage.trim() || spr);

 useEffect(() => {setNav(false); setMore(false);}, [index, view]);
 useEffect(() => {if (!tip) return; const t = setTimeout(() => setTip(false), 2600); return () => clearTimeout(t);}, [tip]);

 const notes = useMemo(() => {
  if (!q) return [];
  return (['p', 'q'] as const).flatMap(k => (hls[q.id + ':' + k] ?? []).filter(h => h.note !== null).map(hl => ({hl, key: q.id + ':' + k, excerpt: (k === 'p' ? q.passage : q.prompt).slice(hl.start, hl.end)})));
 }, [hls, q]);

 function pick(letter: string) {
  if (remaining <= 0) return;
  onChange(q.id, {answer: r.answer === letter && !r.eliminated.includes(letter) ? r.answer : letter, eliminated: r.eliminated.filter(l => l !== letter)});
 }
 function strike(letter: string) {
  const on = r.eliminated.includes(letter);
  onChange(q.id, {eliminated: on ? r.eliminated.filter(l => l !== letter) : [...r.eliminated, letter], ...(!on && r.answer === letter ? {answer: ''} : {})});
 }
 function sprInput(v: string) {
  const clean = v.replace(/[^0-9./-]/g, '').replace(/(?!^)-/g, '');
  const max = clean.startsWith('-') ? 6 : 5;
  onChange(q.id, {answer: clean.slice(0, max)});
 }
 function dragSplit(e: React.PointerEvent) {
  const host = main.current; if (!host) return;
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  const rect = host.getBoundingClientRect();
  const moveTo = (x: number) => setSplit(Math.min(75, Math.max(25, (x - rect.left) / rect.width * 100)));
  const mv = (ev: PointerEvent) => moveTo(ev.clientX);
  const up = () => {window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up);};
  window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
 }

 const answered = (i: number) => !!responses[questions[i].id]?.answer;
 const flagged = (i: number) => !!responses[questions[i].id]?.flagged;
 const tools = <>
  {!isMath && <button className="bb-tool" aria-pressed={hlMode} onClick={() => {setHlMode(!hlMode); if (!hlMode) setTip(true);}}>
   <svg width="40" height="22" viewBox="0 0 40 22" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="M4 18l2-6 9-9 4 4-9 9-6 2ZM13 5l4 4M3 20h8"/><rect x="24" y="4" width="13" height="13" rx="2"/><path d="M27 8.5h7M27 12h5"/></svg>
   <span>Highlights &amp; Notes</span></button>}
  {isMath && <button className="bb-tool" aria-pressed={calc} onClick={() => setCalc(!calc)}><Calculator size={21}/><span>Calculator</span></button>}
  {isMath && <button className="bb-tool" aria-pressed={ref} onClick={() => setRef(!ref)}><span style={{fontFamily: 'var(--font-exam-serif),serif', fontStyle: 'italic', fontWeight: 700, fontSize: 18, height: 22, lineHeight: '22px'}}>x²</span><span>Reference</span></button>}
  <button className="bb-tool" aria-pressed={more} onClick={() => setMore(!more)}><EllipsisVertical size={21}/><span>More</span></button>
 </>;

 return <div className="bb">
  <ExamHeader stage={stage} remaining={remaining} dir={dir} onDir={() => setDir(!dir)}>{tools}</ExamHeader>
  {tip && <div className="bb-tip" role="status"><b>Highlight mode on:</b>Select text to create a highlight automatically.</div>}
  {more && <div className="bb-menu" role="menu">
   <button role="menuitem" onClick={() => {setHelp('help'); setMore(false);}}><CircleHelp size={18}/> Help</button>
   <button role="menuitem" onClick={() => {setHelp('keys'); setMore(false);}}><Keyboard size={18}/> Shortcuts</button>
   <button role="menuitem" onClick={() => {setLineReader(!lineReader); setMore(false);}}><Rows3 size={18}/> {lineReader ? 'Turn Off Line Reader' : 'Line Reader'}</button>
   <button role="menuitem" onClick={() => {setMore(false); onSaveExit();}}><LogOut size={18}/> Save and Exit</button>
  </div>}
  <div className="bb-banner">THIS IS A PRACTICE TEST</div>
  {error && <div style={{margin: '8px 50px 0', padding: '8px 14px', background: '#FDECEA', color: '#8C1D18', borderRadius: 8, fontSize: 14}} role="alert">{error}</div>}

  {view === 'review' ? <div className="bb-check">
   <h1>Check Your Work</h1>
   <p>On test day, you won&apos;t be able to move on to the next module until time expires.</p>
   <p>For these practice questions, you can click <b>Next</b> when you&apos;re ready to move on.</p>
   <div className="bb-card">
    <div className="bb-card-top"><b>{moduleTitle(stage)} Questions</b><Legend current={false}/></div>
    <QuestionGrid big count={questions.length} answered={answered} flagged={flagged} onPick={i => {setIndex(i); setView('q');}}/>
   </div>
  </div> : q ? <div ref={main} className={'bb-main' + (lineReader ? ' lr' : '')} style={lineReader ? {overflow: 'hidden'} : undefined}
   onMouseMove={lineReader ? e => {const rc = main.current!.getBoundingClientRect(); setLy(e.clientY - rc.top);} : undefined}>
   <CalculatorPanel open={calc} onClose={() => setCalc(false)}/>
   {dir && <><div className="bb-shade" onClick={() => setDir(false)}/><div className="bb-dirpanel" role="dialog" aria-label="Directions">
    {(isMath ? MATH_DIRECTIONS : RW_DIRECTIONS).split('\n\n').map(p => <p key={p}>{p}</p>)}
    <button className="bb-btn yellow" onClick={() => setDir(false)}>Close</button>
   </div></>}
   {twoPane && <section className="bb-pane left" style={{'--split': split + '%'} as React.CSSProperties}>
    {spr && !q.passage.trim() ? <SprDirections/> : <Passage className="bb-passage bb-serif" text={q.passage} enabled={!isMath} autoMode={hlMode}
     highlights={hls[q.id + ':p'] ?? []} onChange={l => saveHls(q.id + ':p', l)} onNote={setNoteFocus}/>}
   </section>}
   {twoPane && notes.length > 0 && <NotesPanel items={notes} focusId={noteFocus}
    onChange={(id, note) => {const n = notes.find(x => x.hl.id === id)!; saveHls(n.key, (hls[n.key] ?? []).map(h => h.id === id ? {...h, note} : h));}}
    onDelete={id => {const n = notes.find(x => x.hl.id === id)!; saveHls(n.key, (hls[n.key] ?? []).map(h => h.id === id ? {...h, note: null} : h));}}/>}
   {twoPane && <div className="bb-divider" onPointerDown={dragSplit}><button aria-label="Resize panes" tabIndex={-1}>
    <svg width="11" height="12" viewBox="0 0 11 12" fill="#fff"><path d="M0 6l4-4v8zM11 6 7 2v8z"/></svg></button></div>}
   <section className={'bb-pane ' + (twoPane ? 'right' : 'single')} style={calc && !twoPane ? {paddingLeft: 'calc(var(--cw, 380px) + 40px)'} : undefined}>
    <div className="bb-q">
     <div className="bb-qline">
      <div className="bb-qhead">
       <span className="bb-qnum">{index + 1}</span>
       <button className={'bb-mark ' + (r.flagged ? 'on' : '')} onClick={() => onChange(q.id, {flagged: !r.flagged})} aria-pressed={r.flagged}>
        <Bookmark size={18} fill={r.flagged ? '#C8102E' : 'none'}/> Mark for Review</button>
       {!spr && <button className="bb-abc" aria-pressed={elim} aria-label="Cross out answer choices" onClick={() => setElim(!elim)}>
        <svg width="22" height="14" viewBox="0 0 22 14" aria-hidden><text x="1" y="11" fontSize="10" fontWeight="700" fontFamily="Roboto,Arial" fill="currentColor">ABC</text><path d="M1 13 21 1" stroke="currentColor" strokeWidth="1.4"/></svg></button>}
      </div>
      <div className="bb-dash" style={{height: 2}}/>
     </div>
     <Passage className="bb-prompt bb-serif" text={q.prompt} enabled={!isMath} autoMode={hlMode} highlights={hls[q.id + ':q'] ?? []} onChange={l => saveHls(q.id + ':q', l)} onNote={setNoteFocus}/>
     {spr ? <div>
      <input className="bb-spr-input" aria-label="Your answer" inputMode="text" autoComplete="off" value={r.answer} onChange={e => sprInput(e.target.value)}/>
      <div className="bb-preview">Answer Preview: <span className="v">{r.answer ? <MathText text={'$' + previewTex(r.answer) + '$'}/> : null}</span></div>
     </div> : <div className="bb-options">
      {q.options.map(o => {
       const out = r.eliminated.includes(o.letter), sel = r.answer === o.letter;
       return <div className="bb-optrow" key={o.letter}>
        <button className={'bb-opt bb-serif ' + (sel ? 'sel ' : '') + (out ? 'out' : '')} onClick={() => pick(o.letter)} aria-pressed={sel}>
         <span className="bb-letter">{o.letter}</span><span><MathText text={o.text}/></span>
        </button>
        {elim && (out ? <button className="bb-strike undo" onClick={() => strike(o.letter)}>Undo</button>
         : <button className="bb-strike" aria-label={'Cross out ' + o.letter} onClick={() => strike(o.letter)}><span className="circ">{o.letter}</span></button>)}
       </div>;
      })}
     </div>}
    </div>
   </section>
   {ref && <ReferencePanel onClose={() => setRef(false)}/>}
   {lineReader && <div className="bb-linereader" style={{top: Math.max(0, ly - 34)}}/>}
  </div> : null}

  <div className="bb-dash"/>
  <footer className="bb-footer">
   <span className="bb-name">{name}</span>
   {view === 'q' ? <button className="bb-qbtn" onClick={() => setNav(!nav)} aria-expanded={nav}>Question {index + 1} of {questions.length} {nav ? <ChevronDown size={18}/> : <ChevronUp size={18}/>}</button> : <span/>}
   <div className="bb-nav">
    {(view === 'review' || index > 0) && <button className="bb-btn" onClick={() => view === 'review' ? (setView('q'), setIndex(questions.length - 1)) : setIndex(index - 1)}>Back</button>}
    <button className="bb-btn" disabled={busy} onClick={() => view === 'review' ? onSubmit() : index < questions.length - 1 ? setIndex(index + 1) : setView('review')}>Next</button>
   </div>
   {nav && view === 'q' && <div className="bb-pop" role="dialog" aria-label="Questions">
    <button className="x" aria-label="Close" onClick={() => setNav(false)}><X size={20}/></button>
    <h4>{moduleTitle(stage)} Questions</h4>
    <Legend/>
    <QuestionGrid count={questions.length} answered={answered} flagged={flagged} current={index} onPick={i => {setIndex(i); setNav(false);}}/>
    <button className="bb-review-link" onClick={() => {setNav(false); setView('review');}}>Go to Review Page</button>
   </div>}
  </footer>
  {help && <div className="rp-modal" onClick={e => e.target === e.currentTarget && setHelp(null)}><div style={{maxWidth: 560, padding: 26, fontSize: 15, lineHeight: 1.6}}>
   <button className="x" aria-label="Close" onClick={() => setHelp(null)} style={{position: 'absolute', right: 14, top: 12}}><X size={20}/></button>
   {help === 'help' ? <><h3 style={{fontSize: 20, margin: '0 0 10px'}}>Help</h3>
    <p><b>Highlights &amp; Notes:</b> select passage text, then choose a color, an underline, or add a note. Turn on highlight mode to highlight as you select.</p>
    <p><b>Answer eliminator:</b> click ABC to cross out choices you&apos;ve ruled out.</p>
    <p><b>Mark for Review:</b> flags the question in the navigator and on the review page.</p>
    <p><b>Calculator &amp; Reference:</b> available for every Math question. Drag the calculator by its top bar.</p>
    <p><b>Save and Exit:</b> pauses the clock. You&apos;ll come back to the same question.</p></> :
    <><h3 style={{fontSize: 20, margin: '0 0 10px'}}>Shortcuts</h3>
    <p><b>Enter</b> in the answer box: keep your answer. <b>Tab</b> moves between choices. Drag the divider to resize the passage.</p></>}
  </div></div>}
 </div>;
}

function previewTex(v: string) {
 const neg = v.startsWith('-'), body = neg ? v.slice(1) : v;
 const [a, b] = body.split('/');
 return (neg ? '-' : '') + (b !== undefined ? `\\dfrac{${a || '\\square'}}{${b || '\\square'}}` : a);
}

function SprDirections() {
 return <div className="bb-spr-dir">
  <h3>Student-produced response directions</h3>
  <ul>
   <li>If you find <b>more than one correct answer</b>, enter only one answer.</li>
   <li>You can enter up to 5 characters for a <b>positive</b> answer and up to 6 characters (including the negative sign) for a <b>negative</b> answer.</li>
   <li>If your answer is a <b>fraction</b> that doesn&apos;t fit in the provided space, enter the decimal equivalent.</li>
   <li>If your answer is a <b>decimal</b> that doesn&apos;t fit in the provided space, enter it by truncating or rounding at the fourth digit.</li>
   <li>If your answer is a <b>mixed number</b> (such as 3½), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
   <li>Don&apos;t enter <b>symbols</b> such as a percent sign, comma, or dollar sign.</li>
  </ul>
  <table>
   <caption>Examples</caption>
   <thead><tr><th>Answer</th><th>Acceptable ways to enter answer</th><th>Unacceptable: will NOT receive credit</th></tr></thead>
   <tbody>
    <tr><td>3.5</td><td><code>3.5</code><code>3.50</code><code>7/2</code></td><td><code>31/2</code><code>3 1/2</code></td></tr>
    <tr><td><MathText text="$\frac{2}{3}$"/></td><td><code>2/3</code><code>.6666</code><code>.6667</code><code>0.666</code><code>0.667</code></td><td><code>0.66</code><code>.66</code><code>0.67</code><code>.67</code></td></tr>
    <tr><td><MathText text="$-\frac{1}{3}$"/></td><td><code>-1/3</code><code>-.3333</code><code>-0.333</code></td><td><code>-.33</code><code>-0.33</code></td></tr>
   </tbody>
  </table>
 </div>;
}
