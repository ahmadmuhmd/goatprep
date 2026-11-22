"use client";
import {useEffect, useState} from 'react';

const SLIDES = ['Answer eliminator', 'Built-in Desmos', 'Highlights & notes', 'Instant score report'];

/** Floating preview of the test app that cycles through its features. */
export default function ProductShot() {
 const [i, setI] = useState(0);
 useEffect(() => {const t = setInterval(() => setI(n => (n + 1) % SLIDES.length), 4200); return () => clearInterval(t);}, []);
 const math = i === 1;
 return <div className="shot" aria-hidden>
  <div className="shot-float">
   <div className="shot-win">
    <div className="shot-head"><span>{i === 3 ? 'Practice Test 1 · Score Details' : math ? 'Section 2, Module 1: Math' : 'Section 1, Module 1: Reading and Writing'}</span><b>{i === 3 ? '' : math ? '34:12' : '31:39'}</b><span/></div>
    <div className="shot-dash"/>
    <div className="shot-stage" key={i}>
     {i === 0 && <RW/>}{i === 1 && <MathSlide/>}{i === 2 && <Notes/>}{i === 3 && <Score/>}
    </div>
    <div className="shot-foot">{i === 3 ? <span>98 questions reviewed</span> : <span>Question {math ? 7 : 4} of {math ? 22 : 27}</span>}<em>{i === 3 ? 'Review' : 'Next'}</em></div>
   </div>
  </div>
  <div className="shot-caption">
   <b key={i}>{SLIDES[i]}</b>
   <span className="shot-dots">{SLIDES.map((s, n) => <i key={s} className={n === i ? 'on' : ''}/>)}</span>
  </div>
 </div>;
}

function Opts({sel, out, list}: {sel: number; out?: number; list: string[]}) {
 return <>{list.map((o, n) => <div key={o} className={'shot-opt' + (n === sel ? ' sel' : '') + (n === out ? ' out' : '')}><span>{'ABCD'[n]}</span>{o}</div>)}</>;
}
function RW() {
 return <div className="shot-body">
  <p className="shot-pass">Although critics believed that customers would never agree to pay to pick their own produce on farms, such concerns didn&rsquo;t ______ Booker T. Whatley&rsquo;s efforts to promote the practice.</p>
  <div className="shot-q"><div className="shot-qh"><i>4</i> Mark for Review<em className="abc">ABC</em></div>
   <p>Which choice completes the text with the most logical and precise word or phrase?</p>
   <Opts sel={1} out={2} list={['enhance', 'hinder', 'misrepresent', 'aggravate']}/></div>
 </div>;
}
function MathSlide() {
 return <div className="shot-body shot-math">
  <div className="shot-calc">
   <div className="sc-head"><b>Graphing</b><span>Scientific</span></div>
   <div className="sc-expr"><div><i style={{background: '#c74440'}}/>y = 2x + 3</div><div><i style={{background: '#2d70b3'}}/>y = −x + 9</div></div>
   <svg viewBox="0 0 200 120" className="sc-graph"><path d="M0 60H200M100 0V120" stroke="#bbb"/><path d="M40 120 140 0" stroke="#c74440" strokeWidth="2.5"/><path d="M30 10 170 110" stroke="#2d70b3" strokeWidth="2.5"/><circle cx="104" cy="44" r="4.5" fill="#555"/><text x="110" y="40" fontSize="11" fill="#333">(2, 7)</text></svg>
  </div>
  <div className="shot-q"><div className="shot-qh"><i>7</i> Mark for Review</div>
   <p>What is the solution (x, y) to the system y = 2x + 3 and y = −x + 9?</p>
   <Opts sel={2} list={['(1, 5)', '(3, 6)', '(2, 7)', '(7, 2)']}/></div>
 </div>;
}
function Notes() {
 return <div className="shot-body">
  <p className="shot-pass">The octopus can change both the color and the <mark>texture of its skin in under a second</mark>, a feat researchers attribute to specialized cells called chromatophores.</p>
  <div className="shot-q">
   <div className="shot-note"><b>Note</b><span>Main claim: speed of change. Look for &ldquo;evidence&rdquo; answer.</span></div>
   <p>Which choice best states the main idea of the text?</p>
   <Opts sel={0} list={['Octopuses rapidly alter their skin.', 'Chromatophores are rare.', 'Researchers disagree.', 'Color matters most.']}/></div>
 </div>;
}
function Score() {
 return <div className="shot-score-slide">
  <div className="ss-card"><small>TOTAL SCORE</small><b>1440</b><div><span>R&amp;W <strong>710</strong></span><span>Math <strong>730</strong></span></div></div>
  <div className="ss-ks">{['Information and Ideas', 'Craft and Structure', 'Algebra', 'Advanced Math'].map((d, n) => <div key={d}><span>{d}</span><div className="ss-seg">{Array.from({length: 7}, (_, k) => <i key={k} className={k < [6, 5, 7, 5][n] ? 'on' : ''}/>)}</div></div>)}</div>
 </div>;
}
