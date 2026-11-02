"use client";
import Image from 'next/image';
import {useCallback,useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {ArrowUpRight,ArrowRight,BookOpen,Check,ChevronLeft,Clock,GraduationCap,Home,LogOut,MessageCircle,Play,Plus,Send,ShieldCheck,Star,Target,X} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {api} from '@/lib/client';
import {lessons as foundationLessons} from '@/lib/lessons';
import type {StudyLesson} from '@/lib/study-schema';
import type {Attempt,Review,TestInfo} from '@/types/sat';
import TestRunner from './components/TestRunner';
import JerryHead from './components/JerryHead';
import ThemeToggle from './components/ThemeToggle';

type Tab='home'|'study'|'tests'|'jerry'|'reviews'|'admin';
const navigation=[{id:'home',label:'Home',icon:Home},{id:'study',label:'Study',icon:BookOpen},{id:'tests',label:'Practice tests',icon:GraduationCap},{id:'jerry',label:'Jerry',icon:MessageCircle}] as const;
type Chat={role:'user'|'assistant';text:string;sources?:{id:string;title:string}[]};
export default function Page(){
 const [lessons,setLessons]=useState<StudyLesson[]>([...foundationLessons]);
 const [tab,setTab]=useState<Tab>('home'),[user,setUser]=useState<User|null>(null);
 const [count,setCount]=useState<number|null>(null),[reviews,setReviews]=useState<Review[]>([]),[tests,setTests]=useState<TestInfo[]>([]),[attempts,setAttempts]=useState<Attempt[]>([]);
 const [admin,setAdmin]=useState(false),[adminReviews,setAdminReviews]=useState<Review[]>([]);
 const [completed,setCompleted]=useState<string[]>([]),[lessonId,setLessonId]=useState<string|null>(null),[section,setSection]=useState('rw'),[search,setSearch]=useState(''),[choice,setChoice]=useState<number|null>(null);
 const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[profile,setProfile]=useState(false);
 const [reviewText,setReviewText]=useState(''),[rating,setRating]=useState(5),[displayName,setDisplayName]=useState('');
 const [chats,setChats]=useState<Chat[]>([]),[message,setMessage]=useState(''),[chatBusy,setChatBusy]=useState(false);
 const [attemptId,setAttemptId]=useState<string|null>(null),[startTest,setStartTest]=useState<TestInfo|null>(null);
 const [reviewMode,setReviewMode]=useState(false);
 const navigate=useCallback((next:Tab,id?:string)=>{window.location.hash=next+(id?'/'+id:'');setProfile(false);},[]);
 const refresh=useCallback(async()=>{
  const [community,library]=await Promise.all([api<{count:number|null;reviews:Review[]}>('community'),api<{tests:TestInfo[]}>('tests')]);
  setCount(community.count);setReviews(community.reviews);setTests(library.tests);
 },[]);
 const refreshUser=useCallback(async()=>{
  try {const [me,p]=await Promise.all([api<{attempts:Attempt[];admin:boolean}>('me'),api<{completed:string[]}>('progress')]);setAttempts(me.attempts);setAdmin(me.admin);setCompleted(p.completed);}
  catch(e){setNotice((e as Error).message);}
 },[]);
 useEffect(()=>{
  const route=()=>{const [t,id]=location.hash.slice(1).split('/');setTab(['home','study','tests','jerry','reviews','admin'].includes(t)?t as Tab:'home');setLessonId(t==='study'&&id?id:null);setChoice(null);window.scrollTo({top:0,behavior:'instant'});};
  route();window.addEventListener('hashchange',route);
  void refresh().catch(()=>setNotice('Some data could not load. Please refresh.'));
  if(!supabase)return()=>window.removeEventListener('hashchange',route);
  void supabase.auth.getSession().then(({data})=>setUser(data.session?.user??null));
  const {data}=supabase.auth.onAuthStateChange((_event,session)=>setUser(session?.user??null));
  return()=>{window.removeEventListener('hashchange',route);data.subscription.unsubscribe();};
 },[refresh]);
 useEffect(()=>{if(user){void refreshUser().then(refresh);setDisplayName(user.user_metadata.full_name??'');void refresh();}else{setAttempts([]);setAdmin(false);setCompleted([]);}},[user,refreshUser,refresh]);
 useEffect(()=>{if(tab==='admin'&&admin)void api<{reviews:Review[]}>('community?admin=1').then(x=>setAdminReviews(x.reviews)).catch(e=>setNotice(e.message));},[tab,admin]);
 useEffect(()=>{
  let active=true;
  const update=()=>{void api<{lessons:StudyLesson[];unavailable:boolean}>('lessons').then(x=>{if(active)setLessons(x.lessons);}).catch(()=>{});};
  update();window.addEventListener('focus',update);
  return()=>{active=false;window.removeEventListener('focus',update);};
 },[tab]);
 async function login(){
  if(!supabase){setNotice('Google sign-in is being prepared. Please check back soon.');return;}
  const {error}=await supabase.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+'/#home'}});
  if(error)setNotice(error.message);
 }
 async function run(action:()=>Promise<void>){setBusy(true);setNotice('');try{await action();}catch(e){setNotice((e as Error).message);}finally{setBusy(false);}}
 async function begin(test:TestInfo){if(!user){void login();return;}setStartTest(test);}
 async function submitReview(){if(!user){void login();return;}await run(async()=>{await api('community',{body:reviewText,rating,display_name:displayName});setReviewText('');setNotice('Thank you! Your review is submitted for homepage consideration. Editing a review sends it back for selection.');});}
 async function feature(r:Review,remove=false){await run(async()=>{await api('community',{action:remove?'delete':'feature',id:r.id,featured:!r.featured});const x=await api<{reviews:Review[]}>('community?admin=1');setAdminReviews(x.reviews);await refresh();});}
 async function ask(text=message){
  if(!text.trim()||chatBusy)return;if(!user){void login();return;}
  setChats(c=>[...c,{role:'user',text}]);setMessage('');setChatBusy(true);
  try{const x=await api<{reply:string;sources:{id:string;title:string}[];mode:string}>('jerry',{message:text});setChats(c=>[...c,{role:'assistant',text:(x.mode==='library'?'From the study library\n\n':'')+x.reply,sources:x.sources}]);}
  catch(e){setChats(c=>[...c,{role:'assistant',text:(e as Error).message}]);}finally{setChatBusy(false);}
 }
 const finished=attempts.filter(a=>a.completed_at),latest=finished[0],active=attempts.find(a=>!a.completed_at),lesson=lessons.find(l=>l.id===lessonId);
 const firstName=(user?.user_metadata.full_name??'').split(' ')[0];
 if(attemptId)return <TestRunner id={attemptId} reviewMode={reviewMode} onExit={()=>{setAttemptId(null);void refreshUser();navigate('tests');}} onStudy={id=>{setAttemptId(null);navigate('study',id);void refreshUser();}}/>;
 return <div className="site-shell">
  <header className="site-header">
   <a className="brand" href="#home" aria-label="GOATPrep home"><span className="logo-wrap"><Image src="/goat-logo.png" alt="" width="40" height="40" unoptimized/></span><span>GOAT<span className="brand-light">Prep</span></span></a>
   <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(n=><a key={n.id} className={tab===n.id?'active':''} href={'#'+n.id}>{n.label}{n.id==='jerry'&&<span className="tiny-dot"/>}</a>)}</nav>
   <div className="profile-area"><ThemeToggle/><span className="free-tag">Free forever.</span>{user?<button className="avatar" onClick={()=>setProfile(!profile)} aria-label="Open account menu">{firstName?.[0]||'G'}</button>:<button className="button small secondary" onClick={login}>Sign in <ArrowUpRight size={15}/></button>}
    {profile&&user&&<div className="profile-menu glass"><strong>{firstName||'Your account'}</strong><p>{user.email}</p><button onClick={()=>navigate('reviews')}><Star size={16}/> Write a review</button>{admin&&<button onClick={()=>navigate('admin')}><ShieldCheck size={16}/> Manage reviews</button>}<button onClick={()=>{void supabase?.auth.signOut();setProfile(false);}}><LogOut size={16}/> Sign out</button></div>}
   </div>
  </header>
  {notice&&<div className="notice" role="status"><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice('')}><X size={18}/></button></div>}
  <main className="main-content">
   {tab==='home'&&<>
    <section className="editorial-hero">
     <div className="hero-art"><Image src="/goatprep-still-life.png" alt="A little goat, a pencil, a calculator, and a timer on a sunlit white surface" width={1916} height={821} priority unoptimized/></div>
     <div className="editorial-copy">
      <h1>Digital SAT prep. <em>Free forever.</em></h1>
      <p>Study Reading &amp; Writing and Math with worked examples,<br/>adaptive practice tests, and Jerry, your SAT study assistant.</p>
      <div className="button-row"><button className="button primary" onClick={()=>navigate('tests')}>Start practicing <ArrowUpRight size={20}/></button><button className="button secondary" onClick={()=>navigate('study')}>Explore the lessons <ArrowRight size={20}/></button></div>
     </div>
    </section>
    <section className="sat-overview" aria-labelledby="overview-title">
     <div className="overview-heading"><h2 id="overview-title">SAT preparation overview</h2><span>Reading &amp; Writing + Math</span></div>
     <div className="stat-strip">
      <div><strong>{count===null?'Open to all':count.toLocaleString()}</strong><span>{count===null?'Free student accounts':'registered student accounts'}</span><small>Save your lessons and test history</small></div>
      <div><strong>{tests.length || '18'}</strong><span>{tests.length?'full-length tests available':'full-length tests planned'}</span><small>{tests.length?'Timed, adaptive practice':'Currently in preparation'}</small></div>
      <div><strong>8 domains</strong><span>{lessons.length} study lessons</span><small>Worked examples and skill checks</small></div>
      <div><strong>$0</strong><span>Free forever</span><small>No subscription required</small></div>
     </div>
    </section>
    <section className="sat-subjects" aria-label="SAT subject coverage">
     <article><span className="eyebrow">READING &amp; WRITING</span><h2>Reading comprehension and grammar</h2><p>Information and Ideas · Craft and Structure · Expression of Ideas · Standard English Conventions</p><button className="text-button" onClick={()=>{setSection('rw');navigate('study');}}>Study Reading &amp; Writing <ArrowRight size={18}/></button></article>
     <article><span className="eyebrow">MATH</span><h2>Algebra, data analysis and geometry</h2><p>Algebra · Advanced Math · Problem-Solving and Data Analysis · Geometry and Trigonometry</p><button className="text-button" onClick={()=>{setSection('math');navigate('study');}}>Study Math <ArrowRight size={18}/></button></article>
    </section>
    {user&&<section className="section-block"><div className="section-heading"><div><span className="eyebrow">YOUR SPACE</span><h2>Welcome back{firstName?', '+firstName:''}.</h2></div><button className="text-button" onClick={()=>navigate('tests')}>All your practice <ArrowUpRight size={17}/></button></div><div className="dashboard-grid"><div className="glass dashboard-score"><span className="muted">Latest estimated score</span><strong>{latest?(latest.rw_score!+latest.math_score!):'No score yet'}</strong>{latest?<><div className="score-breakdown"><span>R&W <b>{latest.rw_score}</b></span><span>Math <b>{latest.math_score}</b></span></div><button className="text-button" onClick={()=>{setReviewMode(true);setAttemptId(latest.id);}}>View score details <ArrowRight size={16}/></button></>:<p>Complete a practice test to discover your strengths and your next steps.</p>}</div><div className="glass next-step"><span className="eyebrow">YOUR STUDY PROGRESS</span><h3>{active?'Your test is waiting.':'Continue your SAT lessons.'}</h3><p>{active?'Your answers are saved. The module timer continues while you are away.':completed.length+' of '+lessons.length+' study lessons completed. Find one skill to strengthen today.'}</p><button className="button secondary" onClick={()=>active?(setReviewMode(false),setAttemptId(active.id)):navigate('study')}>{active?'Resume practice':'Continue learning'} <ArrowRight size={17}/></button></div></div></section>}
    <section className="section-block"><div className="section-heading"><div><span className="eyebrow">YOUR SAT STUDY TOOLS</span><h2>Prepare for both SAT sections.</h2></div><p>Lessons, practice, and explanations in one place.</p></div><div className="feature-grid">
     {[{icon:BookOpen,n:'01',title:'Study SAT skills',text:'Lessons across all 8 domains, with worked examples, step-by-step methods, and quick checks.',tab:'study'},{icon:Target,n:'02',title:'Practice the full test',text:'98 questions, timed modules, and adaptive second modules. Review your answers and estimated section scores.',tab:'tests'},{icon:MessageCircle,n:'03',title:'Get help from Jerry',text:'Ask about SAT grammar, reading strategies, or math. Get another explanation and links to relevant lessons.',tab:'jerry'}].map(f=><button key={f.n} className="feature-card glass" onClick={()=>navigate(f.tab as Tab)}><div className="feature-top"><f.icon size={25} strokeWidth={1.5}/><span>{f.n}</span></div><h3>{f.title}</h3><p>{f.text}</p><ArrowUpRight className="feature-arrow" size={21}/></button>)}
    </div></section>
    <section className="section-block community"><div className="section-heading"><div><span className="eyebrow">BUILT FOR STUDENTS</span><h2>Student reviews</h2></div><button className="text-button" onClick={()=>navigate('reviews')}>Share your review <ArrowUpRight size={17}/></button></div>
     {reviews.length?<div className="review-grid">{reviews.map(r=><article className="glass review-card" key={r.id}><div className="stars" aria-label={r.rating+' out of 5 stars'}>{'★'.repeat(r.rating)}</div><blockquote>{r.body}</blockquote><span className="review-author">{r.display_name}</span><span className="muted">GOATPrep learner</span></article>)}</div>:<div className="community-empty"><div><h3>Tried a lesson or a practice test?</h3><p>Tell other students what helped you. Selected student reviews appear here.</p></div><button className="button secondary" onClick={()=>navigate('reviews')}>Leave a review <Plus size={17}/></button></div>}
    </section>
   </>}
   {tab==='study'&&<section className="page-section">
    {!lesson?<><div className="page-intro"><span className="eyebrow">THE STUDY LIBRARY</span><h1>SAT study <span>library</span></h1><p>Start with the foundations. A clear concept, a worked example, and a quick check.</p></div>
     <div className="study-toolbar"><div className="segmented"><button className={section==='rw'?'selected':''} onClick={()=>setSection('rw')}>Reading & Writing</button><button className={section==='math'?'selected':''} onClick={()=>setSection('math')}>Math</button></div><input aria-label="Search lessons" className="search-input" placeholder="Find a skill…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
     {[...new Set(lessons.filter(l=>l.section===section).map(l=>l.domain))].map((domain,i)=><div className="domain-group" key={domain}><div className="domain-title"><span>0{i+1}</span><h2>{domain}</h2></div><div className="lesson-grid">{lessons.filter(l=>l.domain===domain&&(l.title+' '+l.concept).toLowerCase().includes(search.toLowerCase())).map(l=><button key={l.id} className="glass lesson-card" onClick={()=>navigate('study',l.id)}><div><span className="lesson-meta">{completed.includes(l.id)?'COMPLETED':'SAT SKILL LESSON'}</span><h3>{l.title}</h3><p>{l.summary}</p></div>{completed.includes(l.id)?<Check size={20}/>:<ArrowUpRight size={20}/>}</button>)}</div></div>)}
     {lessons.filter(l=>l.section===section&&(l.title+' '+l.concept).toLowerCase().includes(search.toLowerCase())).length===0&&<p className="empty-state">No matching lessons. Try a broader topic.</p>}
     <p className="fine-print">Study library · {lessons.length} original lessons, with methods, worked examples, and skill checks.</p>
    </>:<article className="lesson-reader"><button className="text-button" onClick={()=>navigate('study')}><ChevronLeft size={17}/> Back to library</button><span className="eyebrow">{lesson.domain}</span><h1>{lesson.title}</h1><p className="lesson-lead">{lesson.summary}</p><div className="glass lesson-body"><h2>The idea</h2><p>{lesson.concept}</p><h2>A reliable approach</h2><ol>{lesson.steps.map(s=><li key={s}>{s}</li>)}</ol><div className="worked-example"><span className="eyebrow">WORKED EXAMPLE</span><p>{lesson.example}</p><span>{lesson.explanation}</span></div><h2>Check your understanding</h2><p>{lesson.quiz.prompt}</p><div className="quiz-options">{lesson.quiz.options.map((o,i)=><button key={o} className={'quiz-option '+(choice===i?(i===lesson.quiz.answer?'correct':'incorrect'):'')} onClick={()=>setChoice(i)}><span>{String.fromCharCode(65+i)}</span>{o}</button>)}</div>{choice!==null&&<p role="status" className="quiz-feedback"><strong>{choice===lesson.quiz.answer?'Exactly. ':'Not quite. '}</strong>{lesson.quiz.feedback}</p>}<div className="button-row"><button className="button primary" disabled={busy} onClick={()=>{if(!user){void login();return;}void run(async()=>{const done=!completed.includes(lesson.id);await api('progress',{id:lesson.id,completed:done});setCompleted(c=>done?[...c,lesson.id]:c.filter(id=>id!==lesson.id));});}}>{completed.includes(lesson.id)?'Mark as incomplete':'Mark lesson complete'} <Check size={17}/></button><button className="text-button" onClick={()=>{setMessage('Explain '+lesson.title.toLowerCase()+' with another example.');navigate('jerry');}}>Ask Jerry <MessageCircle size={17}/></button></div></div></article>}
   </section>}
   {tab==='tests'&&<section className="page-section"><div className="page-intro"><span className="eyebrow">YOUR PRACTICE SPACE</span><h1>Full-length<br/><span>SAT practice tests.</span></h1><p>Practice Reading & Writing and Math in timed, adaptive modules. Each test uses text-based questions.</p></div><div className="test-meta"><span><Clock size={17}/> 2 hr 14 min + 10 min break</span><span><Target size={17}/> 98 questions per sitting</span><span><ShieldCheck size={17}/> Estimated scores</span></div>
    <div className="test-grid">{Array.from({length:18},(_,i)=>{const t=tests.find(t=>t.number===i+1),a=t?attempts.find(a=>a.test_id===t.id):null;return <article className={'glass test-card '+(!t?'unavailable':'')} key={i}><div className="test-card-top"><span className="test-number">{String(i+1).padStart(2,'0')}</span><span className="pill">{t?(a?.completed_at?'Completed':a?'In progress':'Ready when you are'):'In preparation'}</span></div><h3>{t?.title||'Practice Test '+(i+1)}</h3><p>Reading & Writing · Math<br/>Two-stage adaptive practice</p>{a?.completed_at&&<div className="test-score">{a.rw_score!+a.math_score!}<span>estimated score</span></div>}<button className={'button '+(t?'secondary':'quiet')} disabled={!t||busy} onClick={()=>{if(t)void begin(t);}}>{t?(a&&!a.completed_at?'Resume test':'Start practice'):'Coming soon'}{t&&<ArrowUpRight size={17}/>}</button>{a?.completed_at&&<button className="text-button" onClick={()=>{setReviewMode(true);setAttemptId(a.id);}}>Review your answers <ArrowRight size={15}/></button>}</article>;})}</div>
    <div className="section-block"><h2>Your practice history</h2>{attempts.length?<div className="history-list">{attempts.map(a=><button key={a.id} className="history-row" onClick={()=>{setReviewMode(!!a.completed_at);setAttemptId(a.id);}}><span><strong>{tests.find(t=>t.id===a.test_id)?.title||a.test_id}</strong><small>{new Date(a.created_at).toLocaleDateString()}</small></span><span>{a.completed_at?(a.rw_score!+a.math_score!)+' estimated':'Resume'} <ArrowUpRight size={17}/></span></button>)}</div>:<p className="empty-state">{user?'Your first attempt will appear here.':'Sign in with Google to save your practice history.'}</p>}</div>
   </section>}
   {tab==='jerry'&&<section className="page-section jerry-page"><div className="page-intro"><span className="eyebrow">YOUR SAT STUDY ASSISTANT</span><h1>Jerry: <span>SAT assistant</span></h1><p>Ask for a worked example, a grammar rule, or a reading strategy.</p></div><div className="glass chat-panel"><div className="chat-heading"><JerryHead thinking={chatBusy}/><div><strong>Jerry</strong><span>Your SAT study companion</span></div><button className="text-button" onClick={()=>setChats([])}>Clear chat</button></div><div className="chat-messages" aria-live="polite">{!chats.length?<div className="chat-welcome"><JerryHead large/><h3>Ask an SAT question</h3><p>Ask about a concept, a strategy, or where to start.</p><div className="suggestions">{['Explain sentence boundaries','Help me with quadratic equations','How do I approach inferences?'].map(s=><button key={s} onClick={()=>void ask(s)}>{s}<ArrowUpRight size={15}/></button>)}</div></div>:chats.map((c,i)=><div className={'chat-message '+c.role} key={i}><span>{c.role==='user'?'YOU':'JERRY'}</span><p>{c.text}</p>{c.sources?.map(s=><button className="source-link" key={s.id} onClick={()=>navigate('study',s.id)}><BookOpen size={14}/>{s.title}<ArrowUpRight size={13}/></button>)}</div>)}{chatBusy&&<p className="muted">Jerry is thinking…</p>}</div><form className="chat-composer" onSubmit={e=>{e.preventDefault();void ask();}}><input aria-label="Message Jerry" placeholder={user?'Ask an SAT question…':'Sign in to talk with Jerry…'} value={message} maxLength={1500} onChange={e=>setMessage(e.target.value)}/><button className="send-button" disabled={chatBusy||!message.trim()} aria-label="Send message"><Send size={18}/></button></form><p className="fine-print">Library guidance is available now. Live AI, when enabled, can make mistakes—check important steps.</p></div></section>}
   {tab==='reviews'&&<section className="page-section narrow"><div className="page-intro"><span className="eyebrow">YOUR VOICE</span><h1>Review <span>GOATPrep</span></h1><p>Tell us what helped, and what could be better. Selected reviews appear on our homepage.</p></div><form className="glass review-form" onSubmit={e=>{e.preventDefault();void submitReview();}}><label>Public display name<input required maxLength={40} value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Your first name"/></label><label>Your rating</label><div className="rating-buttons">{[1,2,3,4,5].map(n=><button type="button" key={n} aria-label={n+' stars'} aria-pressed={rating===n} onClick={()=>setRating(n)}><Star fill={rating>=n?'currentColor':'none'} size={28}/></button>)}</div><label>Your experience<textarea required minLength={15} maxLength={800} rows={6} value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="What has your experience with GOATPrep been like?"/></label><small>{reviewText.length}/800 · One review per account. Submitting again updates it.</small><button className="button primary" disabled={busy}>{user?'Submit review':'Sign in to submit'}<ArrowRight size={17}/></button></form></section>}
   {tab==='admin'&&<section className="page-section"><div className="page-intro"><span className="eyebrow">OWNER SPACE</span><h1>Community <span>voices.</span></h1><p>Choose the reviews displayed on the homepage. Public display is limited to six featured reviews.</p></div>{!admin?<p className="empty-state">Sign in with your configured owner account to manage reviews.</p>:<div className="review-grid">{adminReviews.map(r=><article className="glass review-card" key={r.id}><span className="stars">{'★'.repeat(r.rating)}</span><blockquote>{r.body}</blockquote><strong>{r.display_name}</strong><div className="button-row"><button className="button secondary small" disabled={busy} onClick={()=>void feature(r)}>{r.featured?'Remove from homepage':'Feature on homepage'}</button><button className="text-button" disabled={busy} onClick={()=>{if(confirm('Delete this review permanently?'))void feature(r,true);}}>Delete</button></div></article>)}</div>}</section>}
  </main>
  <footer className="site-footer"><a className="brand" href="#home">GOAT<span className="brand-light">Prep</span></a><p>Digital SAT preparation. Free forever.</p><span>Independent SAT preparation. Not affiliated with College Board.<br/>Text-based practice. Scores are estimates.</span></footer>
  <nav className="mobile-nav glass" aria-label="Mobile navigation">{navigation.map(n=><a key={n.id} href={'#'+n.id} className={tab===n.id?'active':''}><n.icon size={20}/><span>{n.label}</span></a>)}</nav>
  {startTest&&<div className="modal-backdrop"><div className="glass modal" role="dialog" aria-modal="true" aria-labelledby="start-title"><button className="modal-close" aria-label="Close" onClick={()=>setStartTest(null)}><X/></button><span className="eyebrow">BEFORE YOU START</span><h2 id="start-title">{startTest.title}</h2><p>Allow 2 hours 24 minutes, including the scheduled break. Your answers save automatically. Timers keep running if you leave or refresh.</p><p>You cannot return to a completed module. Jerry is unavailable during the test.</p><button className="button primary" disabled={busy} onClick={()=>void run(async()=>{const x=await api<{attempt:Attempt}>('attempt',{action:'start',testId:startTest.id});setStartTest(null);setReviewMode(false);setAttemptId(x.attempt.id);})}>I’m ready <Play size={17}/></button></div></div>}
 </div>;
}
