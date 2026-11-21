"use client";
import {useEffect, useRef, useState} from 'react';
import {Calculator as CalcIcon, GripHorizontal, Maximize2, Minimize2, X} from 'lucide-react';
import MathText from '../MathText';

type DesmosInstance = {destroy: () => void; resize: () => void};
type DesmosAPI = {GraphingCalculator: (el: HTMLElement, o: Record<string, unknown>) => DesmosInstance; ScientificCalculator: (el: HTMLElement, o: Record<string, unknown>) => DesmosInstance};
declare global {interface Window {Desmos?: DesmosAPI}}

let loader: Promise<DesmosAPI> | null = null;
function loadDesmos(): Promise<DesmosAPI> {
 const key = process.env.NEXT_PUBLIC_DESMOS_API_KEY;
 if (!key) return Promise.reject(new Error('missing key'));
 if (window.Desmos) return Promise.resolve(window.Desmos);
 loader ??= new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = 'https://www.desmos.com/api/v1.12/calculator.js?apiKey=' + encodeURIComponent(key);
  s.async = true; s.onload = () => window.Desmos ? resolve(window.Desmos) : reject(new Error('load')); s.onerror = () => {loader = null; reject(new Error('load'));};
  document.head.appendChild(s);
 });
 return loader;
}

// Close to the configuration used on the Digital SAT: no images, folders, notes or links.
const GRAPHING = {keypad: true, expressions: true, settingsMenu: true, zoomButtons: true, expressionsTopbar: true, pointsOfInterest: true, trace: true, border: false, images: false, folders: false, notes: false, links: false, qwertyKeyboard: true, sliders: true, decimalToFraction: true, autosize: true, fontSize: 14, language: 'en'};
const SCIENTIFIC = {keypad: true, settingsMenu: true, qwertyKeyboard: true, decimalToFraction: true, degreeMode: false};

/** Bluebook-style calculator panel. Stays mounted (hidden) between questions so expressions persist within a module. */
export function CalculatorPanel({open, onClose}: {open: boolean; onClose: () => void}) {
 const [kind, setKind] = useState<'graphing' | 'scientific'>('graphing');
 const [wide, setWide] = useState(false);
 const [error, setError] = useState('');
 const [pos, setPos] = useState<{x: number; y: number; w: number; h: number} | null>(null);
 const gHost = useRef<HTMLDivElement>(null), sHost = useRef<HTMLDivElement>(null);
 const inst = useRef<{g?: DesmosInstance; s?: DesmosInstance}>({});
 const drag = useRef<{mode: 'move' | 'size'; x: number; y: number; start: {x: number; y: number; w: number; h: number}} | null>(null);
 const panel = useRef<HTMLDivElement>(null);

 useEffect(() => {
  if (!open) return;
  let live = true;
  loadDesmos().then(D => {
   if (!live) return;
   if (kind === 'graphing' && !inst.current.g && gHost.current) inst.current.g = D.GraphingCalculator(gHost.current, GRAPHING);
   if (kind === 'scientific' && !inst.current.s && sHost.current) inst.current.s = D.ScientificCalculator(sHost.current, SCIENTIFIC);
   setTimeout(() => {inst.current.g?.resize(); inst.current.s?.resize();}, 30);
  }).catch(() => live && setError('The calculator could not load.'));
  return () => {live = false;};
 }, [open, kind]);
 useEffect(() => () => {inst.current.g?.destroy(); inst.current.s?.destroy();}, []);
 useEffect(() => {const t = setTimeout(() => {inst.current.g?.resize(); inst.current.s?.resize();}, 50); return () => clearTimeout(t);}, [wide, pos]);

 function begin(mode: 'move' | 'size', e: React.PointerEvent) {
  if ((e.target as HTMLElement).closest('button') && mode === 'move') return;
  const r = panel.current!.getBoundingClientRect(), parent = panel.current!.parentElement!.getBoundingClientRect();
  const start = pos ?? {x: r.left - parent.left, y: r.top - parent.top, w: r.width, h: r.height};
  drag.current = {mode, x: e.clientX, y: e.clientY, start};
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
 }
 function move(e: React.PointerEvent) {
  const d = drag.current; if (!d) return;
  const dx = e.clientX - d.x, dy = e.clientY - d.y;
  setPos(d.mode === 'move' ? {...d.start, x: Math.max(0, d.start.x + dx), y: Math.max(0, d.start.y + dy)} : {...d.start, w: Math.max(300, d.start.w + dx), h: Math.max(320, d.start.h + dy)});
 }
 const style = pos ? {'--cx': pos.x + 'px', '--cy': pos.y + 'px', '--cw': pos.w + 'px', '--ch': pos.h + 'px'} : {'--cw': wide ? 'min(760px, 70vw)' : '380px'};
 return <div ref={panel} className={'bb-calc ' + (pos ? 'floating' : '')} style={{...style, display: open ? 'flex' : 'none'} as React.CSSProperties} aria-label="Calculator">
  <div className="bb-calc-head" onPointerDown={e => begin('move', e)} onPointerMove={move} onPointerUp={() => {drag.current = null;}}>
   <button className="bb-calc-tab" aria-pressed={kind === 'graphing'} onClick={() => setKind('graphing')}>
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 13c3-9 5-9 7-4s4 5 7-4"/></svg>Graphing</button>
   <button className="bb-calc-tab" aria-pressed={kind === 'scientific'} onClick={() => setKind('scientific')}><CalcIcon size={13}/>Scientific</button>
   <GripHorizontal className="grip" size={22}/>
   <button className="hbtn" aria-label={wide ? 'Collapse calculator' : 'Expand calculator'} onClick={() => {setPos(null); setWide(w => !w);}}>{wide ? <Minimize2 size={17}/> : <Maximize2 size={17}/>}</button>
   <button className="hbtn" aria-label="Close calculator" onClick={onClose}><X size={20}/></button>
  </div>
  <div className="bb-calc-host">
   {error ? <p className="bb-calc-msg">{error} <a href="https://www.desmos.com/testing/cb-digital-sat/graphing" target="_blank" rel="noreferrer" style={{textDecoration: 'underline'}}>Open the Desmos SAT calculator</a></p> : null}
   <div ref={gHost} style={{display: kind === 'graphing' ? 'block' : 'none'}}/>
   <div ref={sHost} style={{display: kind === 'scientific' ? 'block' : 'none'}}/>
  </div>
  {pos && <span className="bb-calc-resize" onPointerDown={e => begin('size', e)} onPointerMove={move} onPointerUp={() => {drag.current = null;}} aria-hidden>
   <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 9 9 1M5 9l4-4" stroke="#333" strokeWidth="1.5"/></svg></span>}
 </div>;
}

const FIG: {f: string; svg: React.ReactNode}[] = [
 {f: '$A=\\pi r^2$\n$C=2\\pi r$', svg: <svg viewBox="0 0 96 72"><circle cx="48" cy="36" r="28"/><circle cx="48" cy="36" r="1.8" fill="#1e1e1e"/><path d="M48 36h28"/><text x="58" y="31">r</text></svg>},
 {f: '$A=\\ell w$', svg: <svg viewBox="0 0 96 72"><rect x="18" y="20" width="60" height="34"/><text x="45" y="15">ℓ</text><text x="82" y="40">w</text></svg>},
 {f: '$A=\\tfrac12 bh$', svg: <svg viewBox="0 0 96 72"><path d="M14 58 50 12 84 58Z"/><path d="M50 12v46" strokeDasharray="3 3"/><path d="M50 52h6v6"/><text x="54" y="38">h</text><text x="46" y="70">b</text></svg>},
 {f: '$c^2=a^2+b^2$', svg: <svg viewBox="0 0 96 72"><path d="M18 58h58V14Z"/><path d="M70 58v-6h6"/><text x="44" y="70">a</text><text x="80" y="40">b</text><text x="40" y="32">c</text></svg>},
 {f: 'Special right triangles', svg: <svg viewBox="0 0 96 72"><path d="M4 60h40V22Z"/><text x="18" y="70">x√3</text><text x="46" y="44">x</text><text x="12" y="38">2x</text><path d="M54 60h34V26Z"/><text x="66" y="70">s</text><text x="90" y="46">s</text><text x="58" y="40">s√2</text></svg>},
 {f: '$V=\\ell wh$', svg: <svg viewBox="0 0 96 72"><path d="M16 30h48v30H16Z"/><path d="M16 30l14-14h48L64 30M78 16v30L64 60"/><text x="36" y="70">ℓ</text><text x="72" y="62">w</text><text x="82" y="34">h</text></svg>},
 {f: '$V=\\pi r^2 h$', svg: <svg viewBox="0 0 96 72"><ellipse cx="48" cy="16" rx="26" ry="8"/><path d="M22 16v40M74 16v40"/><path d="M22 56a26 8 0 0 0 52 0"/><path d="M48 16h26"/><text x="56" y="12">r</text><text x="78" y="40">h</text></svg>},
 {f: '$V=\\tfrac43\\pi r^3$', svg: <svg viewBox="0 0 96 72"><circle cx="48" cy="36" r="28"/><ellipse cx="48" cy="36" rx="28" ry="8" strokeDasharray="3 3"/><path d="M48 36h28"/><text x="58" y="31">r</text></svg>},
 {f: '$V=\\tfrac13\\pi r^2 h$', svg: <svg viewBox="0 0 96 72"><path d="M22 56 48 8l26 48"/><ellipse cx="48" cy="56" rx="26" ry="8"/><path d="M48 8v48" strokeDasharray="3 3"/><path d="M48 56h26"/><text x="52" y="36">h</text><text x="58" y="53">r</text></svg>},
 {f: '$V=\\tfrac13 \\ell wh$', svg: <svg viewBox="0 0 96 72"><path d="M14 56h52l16-14H30Z"/><path d="M14 56 48 8l18 48M48 8l34 34M48 8 30 42"/><path d="M48 8v40" strokeDasharray="3 3"/><text x="38" y="68">ℓ</text><text x="76" y="56">w</text><text x="50" y="34">h</text></svg>},
];

export function ReferencePanel({onClose}: {onClose: () => void}) {
 const [wide, setWide] = useState(false);
 return <aside className={'bb-ref ' + (wide ? 'wide' : '')} aria-label="Reference sheet">
  <div className="bb-ref-head">Reference<div>
   <button aria-label={wide ? 'Collapse' : 'Expand'} onClick={() => setWide(!wide)}>{wide ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
   <button aria-label="Close reference" onClick={onClose}><X size={20}/></button>
  </div></div>
  <div className="bb-ref-body">
   <div className="bb-ref-grid">{FIG.map((x, i) => <div className="bb-fig" key={i}>{x.svg}<div>{x.f.split('\n').map(l => <div key={l}><MathText text={l}/></div>)}</div></div>)}</div>
   <div className="bb-ref-facts">
    <p>The number of degrees of arc in a circle is 360.</p>
    <p>The number of radians of arc in a circle is <MathText text="$2\pi$"/>.</p>
    <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
   </div>
  </div>
 </aside>;
}
