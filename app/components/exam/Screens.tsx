"use client";
import {Bookmark, Clock, FileText, Lock, PersonStanding} from 'lucide-react';

export function IntroScreen({onBack, onNext, busy}: {onBack: () => void; onNext: () => void; busy: boolean}) {
 return <div className="bb">
  <div className="bb-screen">
   <h1>Practice Test</h1>
   <div className="bb-card bb-info">
    <div><Clock size={20}/><b>Timing</b><p>Practice tests are timed, but you can pause them. Use <b>Save and Exit</b> in the <b>More</b> menu and you&apos;ll come back to the same question with the same time left.</p></div>
    <div><FileText size={20}/><b>Scores</b><p>When you finish, your score report opens right away and stays in <b>Practice</b> and <b>Me</b>.</p></div>
    <div><PersonStanding size={20}/><b>Tools</b><p>Highlights &amp; notes, answer eliminator, mark for review, line reader, the Desmos calculator and the reference sheet all work like test day.</p></div>
    <div><Lock size={20}/><b>Full screen</b><p>The test opens in full screen. On test day your device is locked; here you can still leave.</p></div>
   </div>
  </div>
  <div className="bb-bottom"><button className="bb-btn" onClick={onBack}>Back</button><button className="bb-btn" disabled={busy} onClick={onNext}>Next</button></div>
 </div>;
}

export function PreparingScreen() {
 return <div className="bb"><div className="bb-screen">
  <h1>We&apos;re Preparing Your Practice Test</h1>
  <div className="bb-card" style={{width: 300, textAlign: 'center'}}>
   <div className="bb-hour"><svg width="120" height="110" viewBox="0 0 120 110" aria-hidden>
    <ellipse cx="30" cy="40" rx="26" ry="16" fill="#CFE7F7"/><ellipse cx="52" cy="34" rx="20" ry="14" fill="#CFE7F7"/><ellipse cx="88" cy="70" rx="24" ry="14" fill="#CFE7F7"/>
    <rect x="44" y="6" width="34" height="6" rx="2" fill="#555"/><rect x="44" y="96" width="34" height="6" rx="2" fill="#555"/>
    <path d="M48 12h26c0 22-10 26-10 42 0 16 10 20 10 42H48c0-22 10-26 10-42 0-16-10-20-10-42Z" fill="#fff" stroke="#555" strokeWidth="2"/>
    <path className="sand" d="M52 18h18c-2 12-7 18-9 28-2-10-7-16-9-28Z" fill="#127A4E"/>
    <path className="sand" d="M52 92c2-10 6-16 9-20 3 4 7 10 9 20Z" fill="#127A4E"/>
   </svg></div>
   <p style={{margin: '8px 0 0', fontSize: 15}}>This may take up to a minute. Please don&apos;t refresh this page or quit the app.</p>
  </div>
 </div></div>;
}

export function ModuleOverScreen({header}: {header: React.ReactNode}) {
 return <div className="bb">{header}
  <div className="bb-over"><div>
   <h2>This Module Is Over</h2>
   <p>All your work has been saved.</p>
   <p>You&apos;ll move on automatically in just a moment.</p>
   <p>Do not refresh this page or quit the app.</p>
   <span className="bb-dots" aria-label="Loading"/>
  </div></div>
 </div>;
}

export function PausedScreen({title, remaining, onResume, onExit, busy}: {title: string; remaining: number; onResume: () => void; onExit: () => void; busy: boolean}) {
 return <div className="bb"><div className="bb-screen">
  <h1>Welcome Back</h1>
  <div className="bb-card bb-info">
   <div><Clock size={20}/><b>{title}</b><p>Your test is paused with <b>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</b> left in this module. You&apos;ll return to the question you were on.</p></div>
  </div>
 </div>
 <div className="bb-bottom"><button className="bb-btn ghost" onClick={onExit}>Back to Practice</button><button className="bb-btn" disabled={busy} onClick={onResume}>Resume Testing</button></div>
 </div>;
}

export function BreakScreen({remaining, name, onResume, busy}: {remaining: number; name: string; onResume: () => void; busy: boolean}) {
 const t = Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2, '0');
 return <div className="bb-break">
  <div className="l">
   <div className="clock"><span>Remaining Break Time:</span><strong>{t}</strong></div>
   <button className="bb-btn yellow" disabled={busy} onClick={onResume}>Resume Testing</button>
  </div>
  <div className="r">
   <h2>Practice Test Break</h2>
   <p>You can resume this practice test as soon as you&apos;re ready to move on. On test day, you&apos;ll wait until the clock counts down. Read below to see how breaks work on test day.</p>
   <hr/>
   <h2>Take a Break: Do Not Close Your Device</h2>
   <p>After the break, a <b>Resume Testing Now</b> button will appear and you&apos;ll start the next section.</p>
   <p style={{marginTop: 14}}><b>Follow these rules during the break:</b></p>
   <ol>
    <li>Do not disturb students who are still testing.</li>
    <li>Do not exit the app or close your laptop.</li>
    <li>Do not access phones, smartwatches, textbooks, notes, or the internet.</li>
    <li>Do not eat or drink near any testing device.</li>
    <li>Do not speak in the testing room; outside the room, do not discuss the exam with anyone.</li>
   </ol>
   <div className="name">{name}</div>
  </div>
 </div>;
}

export function QuestionGrid({count, answered, flagged, current, onPick, big}: {count: number; answered: (i: number) => boolean; flagged: (i: number) => boolean; current?: number; onPick: (i: number) => void; big?: boolean}) {
 return <div className="bb-grid">{Array.from({length: count}, (_, i) => <button key={i} className={'bb-sq ' + (answered(i) ? 'done ' : '') + (current === i ? 'cur' : '')} onClick={() => onPick(i)} aria-label={'Question ' + (i + 1) + (answered(i) ? ', answered' : ', unanswered') + (flagged(i) ? ', marked for review' : '')}>
  {i + 1}{flagged(i) && <Bookmark className="flag" size={big ? 13 : 11} fill="currentColor" strokeWidth={0}/>}
 </button>)}</div>;
}

export function Legend({current = true}: {current?: boolean}) {
 return <div className="bb-legend">
  {current && <span><svg width="12" height="14" viewBox="0 0 24 28"><path d="M12 2a8 8 0 0 0-8 8c0 6 8 15 8 15s8-9 8-15a8 8 0 0 0-8-8Z" fill="none" stroke="#1e1e1e" strokeWidth="2.6"/><circle cx="12" cy="10" r="3" fill="#1e1e1e"/></svg> Current</span>}
  <span><i className="dashsq"/> Unanswered</span>
  <span><Bookmark size={14} fill="#C8102E" color="#C8102E"/> For Review</span>
 </div>;
}
