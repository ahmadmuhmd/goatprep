"use client";
import {ArrowRight, BookOpen, CalendarCheck, Flame, Languages, Play, Target} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {daysUntil, firstName, totalScore} from '../site/context';
import DailyCard from './DailyCard';
import {WORDS, wordOfTheDay} from '@/lib/vocab';
import {FeaturedReviews} from './Community';

export default function Home({ctx}: {ctx: AppCtx}) {
 return ctx.user ? <Dashboard ctx={ctx}/> : <Landing ctx={ctx}/>;
}

function Landing({ctx}: {ctx: AppCtx}) {
 const ready = ctx.tests.length || 12;
 return <>
  <section className="hero">
   <div className="rise">
    <h1>The Digital SAT, <em>practiced for real.</em></h1>
    <p>{ready} adaptive tests in a Bluebook-style app, plus lessons, daily questions and words. Free.</p>
    <div className="hero-cta">
     <button className="btn btn-primary btn-lg" onClick={() => ctx.navigate('practice')}><Play size={18}/> Take a practice test</button>
     <button className="btn btn-ghost btn-lg" onClick={() => ctx.navigate('study')}>Study lessons</button>
    </div>
   </div>
   <div className="hero-demo rise" style={{'--i': 2} as React.CSSProperties}><DailyCard section="rw" compact/></div>
  </section>
  <FeaturedReviews reviews={ctx.reviews}/>
  <section className="bento section">
   <Tile i={1} dark icon={<Target size={22}/>} title="Practice tests" value={String(ready)} onClick={() => ctx.navigate('practice')}/>
   <Tile i={2} icon={<BookOpen size={22}/>} title="Lessons" value={String(ctx.lessons.length)} onClick={() => ctx.navigate('study')}/>
   <Tile i={3} green icon={<CalendarCheck size={22}/>} title="Daily questions" value="2/day" onClick={() => ctx.navigate('daily')}/>
   <Tile i={4} icon={<Languages size={22}/>} title="SAT words" value={String(WORDS.length)} onClick={() => ctx.navigate('words')}/>
  </section>
 </>;
}

function Tile({icon, title, value, onClick, dark, green, i}: {icon: React.ReactNode; title: string; value: string; onClick: () => void; dark?: boolean; green?: boolean; i: number}) {
 return <button className={'tile rise ' + (dark ? 'tile-dark' : green ? 'tile-green' : '')} style={{'--i': i} as React.CSSProperties} onClick={onClick}>
  <span className="ico">{icon}</span>
  <span><span className="big-num">{value}</span><h3>{title}</h3></span>
 </button>;
}

function Dashboard({ctx}: {ctx: AppCtx}) {
 const name = firstName(ctx);
 const finished = ctx.attempts.filter(a => a.completed_at);
 const latest = finished[0], active = ctx.attempts.find(a => !a.completed_at);
 const days = daysUntil(ctx.profile?.test_date);
 const target = ctx.profile?.target_score ?? null;
 const score = latest ? totalScore(latest) : null;
 const nextLesson = ctx.lessons.find(l => !ctx.completed.includes(l.id) && (ctx.profile?.focus === 'math' ? l.section === 'math' : ctx.profile?.focus === 'rw' ? l.section === 'rw' : true));
 const word = wordOfTheDay();
 const hour = new Date().getHours();
 const hello = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
 return <>
  <div className="greet rise">
   <h1>{hello}{name ? ', ' + name : ''}.</h1>
   <div className="facts">
    {days !== null && days >= 0 && <span className="chip chip-green">{days === 0 ? 'Test day' : days + ' days to test day'}</span>}
    {ctx.daily && ctx.daily.streak > 0 && <span className="chip"><Flame size={14}/> {ctx.daily.streak}-day streak</span>}
   </div>
  </div>

  {active && <button className="resume rise" style={{width: '100%', textAlign: 'left', marginBottom: 14}} onClick={() => ctx.openAttempt(active.id)}>
   <Play size={22}/>
   <span style={{flex: 1}}><b>Resume {ctx.tests.find(t => t.id === active.test_id)?.title || 'your test'}</b><br/><span className="muted">{['Reading and Writing · Module 1', 'Reading and Writing · Module 2', 'Break', 'Math · Module 1', 'Math · Module 2'][active.stage] || ''}</span></span>
   <ArrowRight size={20}/>
  </button>}

  <div className="dash">
   <div className="card score-card rise" style={{'--i': 1} as React.CSSProperties}>
    <span className="label">Latest score</span>
    <div className="score-row">
     <span className="big-num">{score ?? '—'}</span>
     {latest && <span className="muted" style={{paddingBottom: 8}}>R&W {latest.rw_score} · Math {latest.math_score}</span>}
    </div>
    {target ? <>
     <div className="goal-track" aria-label={'Target ' + target}>
      <i style={{width: ((Math.max(400, score ?? 400) - 400) / 1200 * 100) + '%'}}/>
      <b style={{left: `calc(${(target - 400) / 1200 * 100}% - 2px)`}}/>
     </div>
     <div className="goal-scale"><span>400</span><span>Goal {target}</span><span>1600</span></div>
    </> : <button className="link" onClick={() => ctx.navigate('me')}>Set a target score <ArrowRight size={16}/></button>}
    {!latest && <button className="btn btn-primary" onClick={() => ctx.navigate('practice')}><Play size={17}/> Take your first test</button>}
   </div>
   <div className="rise" style={{'--i': 2} as React.CSSProperties}><DailyCard section={new Date().getDate() % 2 ? 'math' : 'rw'} compact/></div>
   <div style={{display: 'grid', gap: 14}}>
    {nextLesson && <button className="card card-pad rise" style={{'--i': 3, textAlign: 'left'} as React.CSSProperties} onClick={() => ctx.navigate('study', nextLesson.id)}>
     <span className="label">Up next</span>
     <h3 style={{fontSize: 22, margin: '8px 0 4px'}}>{nextLesson.title}</h3>
     <span className="muted" style={{fontSize: 14}}>{nextLesson.domain}</span>
    </button>}
    <button className="card word-card rise" style={{'--i': 4, textAlign: 'left'} as React.CSSProperties} onClick={() => ctx.navigate('words', word.word)}>
     <span className="label">Word of the day</span>
     <span className="w">{word.word}</span>
     <span className="muted">{word.def}</span>
    </button>
   </div>
  </div>
  <div className="section"><FeaturedReviews reviews={ctx.reviews}/></div>
 </>;
}
