"use client";
import {Fragment, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Trash2} from 'lucide-react';
import MathText from '../MathText';

export type HL = {id: string; start: number; end: number; color: 'yellow' | 'blue' | 'pink'; underline: 'none' | 'solid' | 'dashed' | 'dotted'; note: string | null};
type Atom = {start: number; end: number; math: boolean; text: string};

function atoms(text: string): Atom[] {
 const out: Atom[] = []; const re = /(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g; let last = 0, m: RegExpExecArray | null;
 while ((m = re.exec(text))) {
  if (m.index > last) out.push({start: last, end: m.index, math: false, text: text.slice(last, m.index)});
  out.push({start: m.index, end: m.index + m[0].length, math: true, text: m[0]}); last = m.index + m[0].length;
 }
 if (last < text.length) out.push({start: last, end: text.length, math: false, text: text.slice(last)});
 return out;
}

/** Text that can be highlighted like Bluebook. Offsets refer to the source string, so highlights survive re-renders. */
export default function Passage({text, highlights, onChange, autoMode, enabled, className, onNote}: {
 text: string; highlights: HL[]; onChange: (h: HL[]) => void; autoMode: boolean; enabled: boolean; className?: string; onNote?: (id: string) => void;
}) {
 const host = useRef<HTMLDivElement>(null);
 const [bar, setBar] = useState<{x: number; y: number; range?: [number, number]; id?: string} | null>(null);
 const pieces = useMemo(() => {
  const cuts = new Set<number>([0, text.length]);
  for (const h of highlights) {cuts.add(h.start); cuts.add(h.end);}
  const list: {start: number; end: number; math: boolean; text: string; hl?: HL}[] = [];
  for (const a of atoms(text)) {
   if (a.math) {list.push({...a}); continue;}
   const inner = [...cuts].filter(c => c > a.start && c < a.end).sort((x, y) => x - y);
   let s = a.start;
   for (const c of [...inner, a.end]) {list.push({start: s, end: c, math: false, text: text.slice(s, c)}); s = c;}
  }
  for (const p of list) for (const h of highlights) if (h.start < p.end && h.end > p.start) p.hl = h; // last wins
  return list;
 }, [text, highlights]);

 const offset = useCallback((node: Node, off: number, isEnd: boolean): number | null => {
  const el = (node.nodeType === 3 ? node.parentElement : node as Element)?.closest?.('[data-o]') as HTMLElement | null;
  if (!el || !host.current?.contains(el)) return null;
  const base = Number(el.dataset.o), len = Number(el.dataset.l);
  if (el.dataset.m) return isEnd ? base + len : base;
  if (node.nodeType === 3) return base + Math.min(off, len);
  return off === 0 ? base : base + len;
 }, []);

 const onUp = useCallback(() => {
  if (!enabled) return;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (!host.current?.contains(r.commonAncestorContainer)) return;
  let a = offset(r.startContainer, r.startOffset, false), b = offset(r.endContainer, r.endOffset, true);
  if (a === null || b === null) return;
  if (a > b) [a, b] = [b, a];
  while (a < b && /\s/.test(text[a])) a++;
  while (b > a && /\s/.test(text[b - 1])) b--;
  if (b - a < 1) return;
  if (autoMode) {onChange([...highlights, {id: crypto.randomUUID(), start: a, end: b, color: 'yellow', underline: 'none', note: null}]); sel.removeAllRanges(); return;}
  const rect = r.getBoundingClientRect();
  setBar({x: rect.left + rect.width / 2, y: rect.top - 10, range: [a, b]});
 }, [enabled, offset, autoMode, highlights, onChange, text]);

 useEffect(() => {
  const close = (e: MouseEvent) => {if (!(e.target as HTMLElement).closest?.('.bb-hlbar')) setBar(b => (b && window.getSelection()?.isCollapsed !== false ? null : b));};
  document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close);
 }, []);

 function apply(patch: Partial<HL>, withNote = false) {
  if (!bar) return;
  if (bar.id) onChange(highlights.map(h => h.id === bar.id ? {...h, ...patch, ...(withNote && h.note === null ? {note: ''} : {})} : h));
  else if (bar.range) {
   const id = crypto.randomUUID();
   onChange([...highlights, {id, start: bar.range[0], end: bar.range[1], color: 'yellow', underline: 'none', note: withNote ? '' : null, ...patch}]);
   if (withNote) onNote?.(id);
  }
  window.getSelection()?.removeAllRanges();
  if (withNote || !bar.id) setBar(null);
 }
 const current = bar?.id ? highlights.find(h => h.id === bar.id) : undefined;
 return <div ref={host} className={className} onMouseUp={onUp} onTouchEnd={() => setTimeout(onUp, 30)}>
  {pieces.map(p => {
   const inner = p.math ? <span data-o={p.start} data-l={p.end - p.start} data-m="1"><MathText text={p.text}/></span> : <span data-o={p.start} data-l={p.end - p.start}>{p.text}</span>;
   if (!p.hl) return <Fragment key={p.start}>{inner}</Fragment>;
   const h = p.hl;
   return <mark key={p.start} data-hl={h.id} className={'hl-' + h.color + ' u-' + h.underline + (h.note !== null ? ' has-note' : '') + (bar?.id === h.id ? ' active' : '')}
    onClick={e => {if (!enabled || !window.getSelection()?.isCollapsed) return; const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); setBar({x: r.left + r.width / 2, y: r.top - 10, id: h.id});}}>{inner}</mark>;
  })}
  {bar && <div className="bb-hlbar" style={{left: bar.x, top: bar.y}} onMouseDown={e => e.preventDefault()}>
   {(['yellow', 'blue', 'pink'] as const).map(c => <button key={c} className={'sw ' + (current?.color === c ? 'on' : '')} aria-label={'Highlight ' + c} onClick={() => apply({color: c})}
    style={{background: c === 'yellow' ? '#FFE14D' : c === 'blue' ? '#D7EEFF' : '#FFD6EE'}}>{current?.color === c && <svg width="12" height="14" viewBox="0 0 12 14"><path d="M6 1C6 1 1 7 1 9.5A5 5 0 0 0 11 9.5C11 7 6 1 6 1Z" fill="none" stroke="#1e1e1e" strokeWidth="1.6"/></svg>}</button>)}
   <select aria-label="Underline style" value={current?.underline ?? 'none'} onChange={e => apply({underline: e.target.value as HL['underline']})}>
    <option value="none">U̲  none</option><option value="solid">U̲  solid</option><option value="dashed">U̲  dashed</option><option value="dotted">U̲  dotted</option>
   </select>
   <span className="sep"/>
   {bar.id && <button className="ic" aria-label="Delete highlight" onClick={() => {onChange(highlights.filter(h => h.id !== bar.id)); setBar(null);}}><Trash2 size={16}/></button>}
   <button className="ic" aria-label="Add note" onClick={() => {apply({}, true); if (bar.id) onNote?.(bar.id);}}>
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8M8 12h8"/></svg>
   </button>
  </div>}
 </div>;
}

export function NotesPanel({items, onChange, onDelete, focusId}: {items: {hl: HL; excerpt: string}[]; onChange: (id: string, note: string) => void; onDelete: (id: string) => void; focusId: string | null}) {
 return <aside className="bb-notes" aria-label="Notes">
  {items.map(({hl, excerpt}) => <div className="bb-note" key={hl.id}>
   <header><span>{excerpt}</span><button aria-label="Delete note" onClick={() => onDelete(hl.id)}><Trash2 size={14}/></button></header>
   <textarea autoFocus={focusId === hl.id} value={hl.note ?? ''} maxLength={2000} placeholder="Type your note" onChange={e => onChange(hl.id, e.target.value)}/>
  </div>)}
 </aside>;
}
