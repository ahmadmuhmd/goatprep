"use client";
import {useEffect, useRef, useState} from 'react';
import {ArrowRight, BadgeCheck, BarChart3, Calculator, CalendarCheck, ClipboardCheck, Highlighter, MessageCircle, Minus, Play, Plus, Star} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {WORDS, wordOfTheDay} from '@/lib/vocab';
import ProductShot, {MathSlide, Notes, RW, Score} from './ProductShot';
import Pendants from '../brand/Pendants';
import Charm from '../brand/Charm';
import JerryHead from '../JerryHead';

function useInView<T extends HTMLElement>() {
 const ref = useRef<T>(null), [seen, setSeen] = useState(false);
 useEffect(() => {
  const el = ref.current; if (!el) return;
  const io = new IntersectionObserver(([e]) => {if (e.isIntersecting) {setSeen(true); io.disconnect();}}, {threshold: .3});
  io.observe(el); return () => io.disconnect();
 }, []);
 return [ref, seen] as const;
}
function CountUp({to, run}: {to: number; run: boolean}) {
 const [n, setN] = useState(0);
 useEffect(() => {
  if (!run) return;
  let raf = 0; const t0 = performance.now(), dur = 1800;
  const step = (t: number) => {const p = Math.min(1, (t - t0) / dur); setN(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step);};
  raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
 }, [to, run]);
 return <>{n.toLocaleString()}</>;
}

export default function Landing({ctx}: {ctx: AppCtx}) {
 return <>
  <section className="hero hero-full">
   <Pendants/>
   <div className="rise hero-copy">
    <h1>The Digital SAT, <em>practiced for real.</em></h1>
    <p className="m-sub">Free adaptive practice tests, a built-in Desmos calculator and Jerry, your SAT tutor.</p>
    <div className="hero-cta">
     <button className="btn btn-primary btn-lg" onClick={() => ctx.navigate('practice')}><Play size={18}/> Take a free test</button>
     <button className="btn btn-ghost btn-lg" onClick={ctx.login}>Sign in with Google</button>
    </div>
   </div>
   <div className="hero-art rise" style={{'--i': 2} as React.CSSProperties}><ProductShot/></div>
   <MobileHeroArt/>
  </section>
  <Stats ctx={ctx}/>
  <FeatureTabs ctx={ctx}/>
  <MobileBento ctx={ctx}/>
  <Reviews ctx={ctx}/>
  <Faq/>
  <section className="cta-dark">
   <Charm kind="goat" className="cta-goat"/>
   <h2>Ready to take the SAT <em>on your terms?</em></h2>
   <div className="hero-cta" style={{justifyContent: 'center'}}>
    <button className="btn btn-lg cta-btn" onClick={() => ctx.navigate('practice')}><Play size={18}/> Start Test 1</button>
    <button className="btn btn-lg cta-ghost" onClick={ctx.login}>Sign in with Google</button>
   </div>
  </section>
 </>;
}

/** Phone-only hero art: a cluster of floating cards in place of the simulator screenshot. */
function MobileHeroArt() {
 return <div className="m-art" aria-hidden>
  <div className="m-card m-score">
   <span className="m-k">Sample score report</span>
   <b className="m-big">1480</b>
   <div className="m-bars"><span style={{'--w': '88%'} as React.CSSProperties}><i/>Math</span><span style={{'--w': '74%'} as React.CSSProperties}><i/>Reading &amp; Writing</span></div>
  </div>
  <div className="m-card m-q">
   <span className="chip chip-green">Daily · Math</span>
   <p>If 3x + 7 = 22, what is 6x?</p>
   <div className="m-opts"><span>A · 5</span><span className="sel">B · 30</span><span>C · 15</span></div>
  </div>
  <div className="m-card m-chat"><JerryHead size={28}/><span>Want a quick quiz on semicolons?</span></div>
  <Charm kind="calculator" className="m-calc"/>
  <Charm kind="goat" className="m-goat"/>
 </div>;
}

const BENTO = [
 {key: 'tests', Icon: ClipboardCheck, label: 'Practice tests', title: 'Feels exactly like Bluebook.', text: 'Full adaptive tests with the real layout, timer and tools.', color: '#BFE7D4', go: 'practice'},
 {key: 'desmos', Icon: Calculator, label: 'Calculator', title: 'Desmos, built in.', text: 'Drag, resize, graph.', color: '#CFE3F7', go: 'practice'},
 {key: 'notes', Icon: Highlighter, label: 'Annotate', title: 'Highlight, note, eliminate.', text: '', color: '#F6E2A6', go: 'practice'},
 {key: 'score', Icon: BarChart3, label: 'Scoring', title: 'A real score, instantly.', text: '', color: '#F7C9A7', go: 'practice'},
 {key: 'daily', Icon: CalendarCheck, label: 'Daily', title: 'Two questions a day.', text: 'Keep your streak going.', color: '#DCD0F5', go: 'daily'},
 {key: 'jerry', Icon: MessageCircle, label: 'Your tutor', title: 'Stuck? Ask Jerry.', text: 'Explanations, quizzes and study plans any time.', color: '#C9EDEA', go: 'jerry'},
] as const;

/** Phone-only features grid: mixed tile sizes instead of one tab card. */
function MobileBento({ctx}: {ctx: AppCtx}) {
 return <section className="features-bento">
  <div className="ft-head">
   <span className="eyebrow-i">Features</span>
   <h2>Everything for test day, <em>in one place.</em></h2>
  </div>
  <div className="bento">
   {BENTO.map(({key, Icon, label, title, text, color, go}) => <button key={key} className={'bt bt-' + key} style={{background: color}}
    onClick={() => go === 'jerry' ? ctx.askJerry('Hi Jerry! What can you help me with?') : ctx.navigate(go)}>
    <span className="bt-ico"><Icon size={20}/></span>
    <span className="bt-label">{label}</span>
    <b className="bt-title">{title}</b>
    {text && <span className="bt-text">{text}</span>}
    <ArrowRight size={18} className="bt-go"/>
   </button>)}
  </div>
 </section>;
}

function Stats({ctx}: {ctx: AppCtx}) {
 const [ref, seen] = useInView<HTMLElement>();
 const avg = ctx.reviews.length ? ctx.reviews.reduce((n, r) => n + r.rating, 0) / ctx.reviews.length : null;
 return <section className="stats" ref={ref}>
  <h2 className="stats-title">The free SAT platform <em>students actually finish.</em></h2>
  <div className={'stat-collage ' + (seen ? 'in' : '')}>
   <div className="sc sc-users">
    <span className="sc-num">{ctx.userCount ? <CountUp to={ctx.userCount} run={seen}/> : '—'}</span>
    <span className="sc-label">students registered</span>
   </div>
   <div className="sc sc-tests"><span className="sc-num"><CountUp to={ctx.tests.length || 12} run={seen}/></span><span className="sc-label">full adaptive tests, scored like test day</span></div>
   {avg && <div className="sc sc-rating"><span className="sc-num">{avg.toFixed(1)}<Star size={34} fill="currentColor"/></span><span className="sc-label">average student review</span></div>}
   <div className="sc sc-learn"><span className="sc-num"><CountUp to={ctx.lessons.length + WORDS.length} run={seen}/></span><span className="sc-label">lessons and SAT words to learn</span></div>
   <Charm kind="calculator" className="sc-charm"/>
  </div>
 </section>;
}

const TABS = [
 {key: 'tests', label: 'Tests', tag: 'Practice tests', title: 'Feels exactly like Bluebook.', text: 'Full adaptive tests with the real layout, timer, tools and module routing. Pause any time and come back to the same question.', color: '#BFE7D4', go: 'practice'},
 {key: 'desmos', label: 'Desmos', tag: 'Calculator', title: 'Desmos, built right in.', text: 'Graphing and scientific calculators you can drag and resize, plus the reference sheet, on every Math question.', color: '#CFE3F7', go: 'practice'},
 {key: 'notes', label: 'Highlights', tag: 'Annotate', title: 'Highlight, note, eliminate.', text: 'Three highlight colors, underlines, notes and the answer eliminator work just like test day.', color: '#F6E2A6', go: 'practice'},
 {key: 'score', label: 'Score report', tag: 'Scoring', title: 'A real score, instantly.', text: 'Section scores from 200 to 800, skill bars for all 8 domains, and every question with its explanation.', color: '#F7C9A7', go: 'practice'},
 {key: 'daily', label: 'Daily', tag: 'Daily questions', title: 'Two questions a day.', text: 'One Reading & Writing and one Math question every day, with a streak to keep you going.', color: '#DCD0F5', go: 'daily'},
 {key: 'jerry', label: 'Jerry', tag: 'Your tutor', title: 'Stuck? Ask Jerry.', text: 'Explanations, quick quizzes and study plans from your own SAT tutor, any time.', color: '#C9EDEA', go: 'jerry'},
] as const;

function FeatureTabs({ctx}: {ctx: AppCtx}) {
 const [i, setI] = useState(0), [paused, setPaused] = useState(false);
 const bar = useRef<HTMLDivElement>(null), [pill, setPill] = useState<React.CSSProperties>({});
 useEffect(() => {if (paused) return; const t = setInterval(() => setI(n => (n + 1) % TABS.length), 6500); return () => clearInterval(t);}, [paused]);
 useEffect(() => {
  const place = () => {const b = bar.current?.querySelectorAll('button')[i] as HTMLElement | undefined; if (b) setPill({width: b.offsetWidth, transform: `translateX(${b.offsetLeft}px)`});};
  place(); window.addEventListener('resize', place); return () => window.removeEventListener('resize', place);
 }, [i]);
 const t = TABS[i], word = wordOfTheDay();
 return <section className="features-tabs" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
  <div className="ft-head">
   <span className="eyebrow-i">Features</span>
   <h2>Everything for test day, <em>in one place.</em></h2>
  </div>
  <div className="ft-bar" ref={bar} role="tablist">
   <span className="ft-pill" style={pill}/>
   {TABS.map((x, n) => <button key={x.key} role="tab" aria-selected={n === i} onClick={() => setI(n)}>{x.label}</button>)}
  </div>
  <div className="ft-stage">
   {[1, 2].map(k => <div key={k} className={'ft-ghost g' + k} style={{background: TABS[(i + k) % TABS.length].color}}/>)}
   <div className="ft-card" key={t.key} style={{background: t.color}}>
    <div className="ft-copy">
     <span className="eyebrow-i">{t.tag}</span>
     <h3>{t.title}</h3>
     <p>{t.text}</p>
     <div className="ft-btns"><button className="btn btn-ink" onClick={() => t.go === 'jerry' ? ctx.askJerry('Hi Jerry! What can you help me with?') : ctx.navigate(t.go)}>Get started</button></div>
    </div>
    <div className="ft-visual">
     <div className="ft-window">
      {t.key === 'tests' && <RW/>}{t.key === 'desmos' && <MathSlide/>}{t.key === 'notes' && <Notes/>}{t.key === 'score' && <Score/>}
      {t.key === 'daily' && <div className="ft-daily"><span className="chip chip-green">Daily · Math</span><p>If 3x + 7 = 22, what is the value of 6x?</p><div className="shot-opt"><span>A</span>5</div><div className="shot-opt sel"><span>B</span>30</div><div className="shot-opt"><span>C</span>15</div></div>}
      {t.key === 'jerry' && <div className="ft-chat"><div className="m u">When do I use a semicolon?</div><div className="m a"><JerryHead size={26}/><span>Between two complete sentences, with no conjunction. Want a quick quiz?</span></div><div className="m u">Yes, quiz me!</div></div>}
     </div>
    </div>
    {t.key === 'daily' && <span className="ft-word">Today&apos;s word: <b>{word.word}</b></span>}
   </div>
  </div>
 </section>;
}

function Reviews({ctx}: {ctx: AppCtx}) {
 const list = ctx.reviews, per = 3;
 const [page, setPage] = useState(0);
 const pages = Math.max(1, Math.ceil(list.length / per));
 useEffect(() => {if (pages < 2) return; const t = setInterval(() => setPage(p => (p + 1) % pages), 7000); return () => clearInterval(t);}, [pages]);
 if (!list.length) return null;
 const shown = list.slice(page * per, page * per + per);
 return <section className="reviews-dark">
  <Charm kind="pencil" className="rv-charm"/>
  <h2>Helping students <em>score higher.</em></h2>
  <div className="rv-list" key={page}>
   {shown.map((r, n) => <figure key={r.id} className="rv" style={{'--i': n} as React.CSSProperties}>
    <span className="review-avatar" aria-hidden>{r.display_name.trim()[0]?.toUpperCase() || 'S'}</span>
    <div>
     <span className="stars">{[1, 2, 3, 4, 5].map(k => <Star key={k} size={15} fill={r.rating >= k ? 'currentColor' : 'none'}/>)}</span>
     <blockquote>“{r.body}”</blockquote>
     <figcaption>{r.display_name} · <span className="verified-l"><BadgeCheck size={13}/> Verified Google account</span></figcaption>
    </div>
   </figure>)}
  </div>
  <div className="rv-swipe">
   {list.slice(0, 12).map(r => <figure key={r.id} className="rv-card">
    <span className="stars">{[1, 2, 3, 4, 5].map(k => <Star key={k} size={15} fill={r.rating >= k ? 'currentColor' : 'none'}/>)}</span>
    <blockquote>“{r.body}”</blockquote>
    <figcaption><span className="review-avatar" aria-hidden>{r.display_name.trim()[0]?.toUpperCase() || 'S'}</span><span>{r.display_name}<span className="verified-l"><BadgeCheck size={13}/> Verified Google account</span></span></figcaption>
   </figure>)}
  </div>
  {pages > 1 && <div className="rv-dots">{Array.from({length: pages}, (_, n) => <button key={n} aria-label={'Reviews page ' + (n + 1)} aria-current={n === page} onClick={() => setPage(n)}/>)}</div>}
 </section>;
}

const FAQ = [
 ['Is GOATPrep really free?', 'Yes. All 12 practice tests, lessons, daily questions, words and Jerry are free. Sign in with Google to save your progress.'],
 ['How close is it to the real Bluebook app?', 'The test screen copies Bluebook: the same layout, timer, Desmos calculator, reference sheet, highlights, notes, answer eliminator, mark for review and adaptive second modules.'],
 ['How is my score calculated?', 'Like the Digital SAT: Module 1 decides an easier or harder Module 2, two unscored questions per module are ignored, and harder questions count for more. Each section is scored 200–800.'],
 ['Can I pause a test?', 'Yes. Use Save and Exit in the More menu, or just close the tab. You come back to the same question with the same time left.'],
 ['What is a GOATTrick?', 'A shortcut added to every lesson: Desmos tricks, plugging in answers, or quick elimination tests that save time on real questions.'],
];
function Faq() {
 const [open, setOpen] = useState<number | null>(0);
 return <section className="faq">
  <div className="faq-left">
   <h2>Frequently asked <em>questions</em></h2>
   <p className="muted">Every question has a good answer.</p>
   <Charm kind="timer" className="faq-charm"/>
  </div>
  <div className="faq-list">{FAQ.map(([q, a], n) => <div key={q} className={'faq-item ' + (open === n ? 'open' : '')}>
   <button onClick={() => setOpen(open === n ? null : n)} aria-expanded={open === n}><span>{q}</span>{open === n ? <Minus size={18}/> : <Plus size={18}/>}</button>
   <div className="faq-a"><p>{a}</p></div>
  </div>)}</div>
 </section>;
}
