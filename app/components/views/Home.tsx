"use client";
import {ArrowRight, BookOpen, CalendarCheck, Flame, Languages, Play, Target, Timer} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {daysUntil, firstName, totalScore} from '../site/context';
import {WORDS, wordOfTheDay} from '@/lib/vocab';
import {FeaturedReviews} from './Community';
import Landing from './Landing';

export default function Home({ctx}: {ctx: AppCtx}) {
 return ctx.user ? <Dashboard ctx={ctx}/> : <Landing ctx={ctx}/>;
}

function Dashboard({ctx}: {ctx: AppCtx}) {
 const name = firstName(ctx);
 const finished = ctx.attempts.filter(a => a.completed_at);
 const latest = finished[0], active = ctx.attempts.find(a => !a.completed_at);
 const days = daysUntil(ctx.profile?.test_date);
 const target = ctx.profile?.target_score ?? null;
 const score = latest ? totalScore(latest) : null;
 const doneIds = new Set(finished.map(a => a.test_id));
 const nextTest = ctx.tests.find(t => !doneIds.has(t.id)) ?? ctx.tests[0];
 const nextLesson = ctx.lessons.find(l => !ctx.completed.includes(l.id) && (ctx.profile?.focus === 'math' ? l.section === 'math' : ctx.profile?.focus === 'rw' ? l.section === 'rw' : true));
 const word = wordOfTheDay();
 const answeredToday = !!ctx.daily?.days.includes(new Date().toISOString().slice(0, 10));
 const hour = new Date().getHours();
 const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
 return <>
  <section className="banner rise">
   <div className="banner-copy">
    <span className="label" style={{color: 'rgba(250,247,240,.7)'}}>{hello}</span>
    <h1>{name || 'Welcome back'}.</h1>
    <div className="banner-stats">
     <div><span className="big-num">{score ?? '—'}</span><small>Latest score</small></div>
     <div><span className="big-num">{target ?? '—'}</span><small>Goal</small></div>
     <div><span className="big-num">{days !== null && days >= 0 ? days : '—'}</span><small>Days to test</small></div>
     <div><span className="big-num">{ctx.daily?.streak ?? 0}</span><small>Day streak</small></div>
    </div>
    {target && <div className="banner-track"><i style={{width: ((Math.max(400, score ?? 400) - 400) / 1200 * 100) + '%'}}/><b style={{left: `calc(${(target - 400) / 1200 * 100}% - 2px)`}}/></div>}
   </div>
  </section>

  <div className="dash">
   {active ? <button className="action a-dark rise" onClick={() => ctx.openAttempt(active.id)}>
    <span className="ico"><Play size={22}/></span>
    <span className="label">Test in progress</span>
    <h3>{ctx.tests.find(t => t.id === active.test_id)?.title || 'Your test'}</h3>
    <span className="sub">{['Reading and Writing · Module 1', 'Reading and Writing · Module 2', 'Break', 'Math · Module 1', 'Math · Module 2'][active.stage]}</span>
    <span className="go">Resume where you left off <ArrowRight size={17}/></span>
   </button> : <button className="action a-dark rise" onClick={() => nextTest ? ctx.beginTest(nextTest) : ctx.navigate('practice')}>
    <span className="ico"><Timer size={22}/></span>
    <span className="label">Next practice test</span>
    <h3>{nextTest?.title || 'Practice Test 1'}</h3>
    <span className="sub">2h 14m · adaptive · scored like test day</span>
    <span className="go">Start <ArrowRight size={17}/></span>
   </button>}
   <button className="action a-green rise" style={{'--i': 1} as React.CSSProperties} onClick={() => ctx.navigate('daily')}>
    <span className="ico"><Flame size={22}/></span>
    <span className="label">Daily questions</span>
    <h3>{answeredToday ? 'Done for today' : '2 waiting for you'}</h3>
    <span className="sub">{ctx.daily ? `${ctx.daily.correct}/${ctx.daily.answered} correct so far` : 'One Reading & Writing, one Math'}</span>
    <span className="go">{answeredToday ? 'Review' : 'Answer now'} <ArrowRight size={17}/></span>
   </button>
   {nextLesson && <button className="action rise" style={{'--i': 2} as React.CSSProperties} onClick={() => ctx.navigate('study', nextLesson.id)}>
    <span className="ico"><BookOpen size={22}/></span>
    <span className="label">Up next in Study</span>
    <h3>{nextLesson.title}</h3>
    <span className="sub">{nextLesson.domain}</span>
    <span className="go">Open lesson <ArrowRight size={17}/></span>
   </button>}
   <button className="action rise" style={{'--i': 3} as React.CSSProperties} onClick={() => ctx.navigate('words', word.word)}>
    <span className="ico"><Languages size={22}/></span>
    <span className="label">Word of the day</span>
    <h3 className="serif-word">{word.word}</h3>
    <span className="sub">{word.def}</span>
    <span className="go">Flashcards <ArrowRight size={17}/></span>
   </button>
  </div>

  <div className="section"><FeaturedReviews reviews={ctx.reviews} compact/></div>
 </>;
}
