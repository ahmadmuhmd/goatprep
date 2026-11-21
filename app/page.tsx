"use client";
import {useCallback, useEffect, useMemo, useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {BookOpen, CalendarCheck, Home as HomeIcon, Target, UserRound, X} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {api} from '@/lib/client';
import {lessons as foundationLessons} from '@/lib/lessons';
import type {StudyLesson} from '@/lib/study-schema';
import type {Attempt, DailyStats, Profile, Review, TestInfo} from '@/types/sat';
import {Brand} from './components/brand/Logo';
import JerryHead from './components/JerryHead';
import type {AppCtx, Tab} from './components/site/context';
import {firstName} from './components/site/context';
import Home from './components/views/Home';
import Study from './components/views/Study';
import Words from './components/views/Words';
import Practice from './components/views/Practice';
import Daily from './components/views/Daily';
import Me from './components/views/Me';
import Onboarding from './components/views/Onboarding';
import JerryChat, {JerryPage, useJerryChat} from './components/views/Jerry';
import {ManageReviews, WriteReview} from './components/views/Community';
import {forgetDaily} from './components/views/DailyCard';
import Exam from './components/exam/Exam';

const NAV: {id: Tab; label: string}[] = [
 {id: 'home', label: 'Home'}, {id: 'study', label: 'Study'}, {id: 'words', label: 'Words'},
 {id: 'practice', label: 'Practice'}, {id: 'daily', label: 'Daily'}, {id: 'jerry', label: 'Jerry'},
];
const TABS: {id: Tab; label: string; icon: typeof HomeIcon}[] = [
 {id: 'home', label: 'Home', icon: HomeIcon}, {id: 'study', label: 'Study', icon: BookOpen},
 {id: 'practice', label: 'Tests', icon: Target}, {id: 'daily', label: 'Daily', icon: CalendarCheck}, {id: 'me', label: 'Me', icon: UserRound},
];
const ROUTES: Tab[] = ['home', 'study', 'words', 'practice', 'daily', 'jerry', 'me', 'reviews', 'admin'];

export default function Page() {
 const [tab, setTab] = useState<Tab>('home'), [routeId, setRouteId] = useState<string | null>(null);
 const [examId, setExamId] = useState<string | null>(null), [startTest, setStartTest] = useState<TestInfo | null>(null);
 const [user, setUser] = useState<User | null>(null), [profile, setProfile] = useState<Profile | null>(null), [profileLoaded, setProfileLoaded] = useState(false);
 const [lessons, setLessons] = useState<StudyLesson[]>([...foundationLessons]);
 const [tests, setTests] = useState<TestInfo[]>([]), [attempts, setAttempts] = useState<Attempt[]>([]), [reviews, setReviews] = useState<Review[]>([]);
 const [completed, setCompletedState] = useState<string[]>([]), [daily, setDaily] = useState<DailyStats | null>(null), [admin, setAdmin] = useState(false);
 const [notice, setNotice] = useState(''), [scrolled, setScrolled] = useState(false);
 const [chats, setChats] = useJerryChat(), [jerryOpen, setJerryOpen] = useState(false), [pending, setPending] = useState<string | undefined>();

 const navigate = useCallback((next: Tab, id?: string) => {window.location.hash = next + (id ? '/' + encodeURIComponent(id) : '');}, []);
 const refresh = useCallback(async () => {
  const [community, library] = await Promise.all([
   api<{reviews: Review[]}>('community').catch(() => ({reviews: []})),
   api<{tests: TestInfo[]}>('tests').catch(() => ({tests: []})),
  ]);
  setReviews(community.reviews); setTests(library.tests);
 }, []);
 const refreshUser = useCallback(async () => {
  try {
   const me = await api<{attempts: Attempt[]; admin: boolean; profile: Profile | null; completed: string[]; daily: DailyStats | null}>('me');
   setAttempts(me.attempts); setAdmin(me.admin); setProfile(me.profile); setCompletedState(me.completed ?? []); setDaily(me.daily ?? null);
  } catch (e) {setNotice((e as Error).message);} finally {setProfileLoaded(true);}
 }, []);

 useEffect(() => {
  const route = () => {
   const [t, id] = location.hash.slice(1).split('/');
   if (t === 'test' && id) {setExamId(decodeURIComponent(id)); return;}
   setExamId(null);
   const mapped = (t === 'tests' ? 'practice' : t) as Tab;
   setTab(ROUTES.includes(mapped) ? mapped : 'home');
   setRouteId(id ? decodeURIComponent(id) : null);
   window.scrollTo({top: 0, behavior: 'instant' as ScrollBehavior});
  };
  route(); window.addEventListener('hashchange', route);
  const onScroll = () => setScrolled(window.scrollY > 8); window.addEventListener('scroll', onScroll, {passive: true});
  void refresh();
  void api<{lessons: StudyLesson[]}>('lessons').then(x => x.lessons?.length && setLessons(x.lessons)).catch(() => {});
  let unsub = () => {};
  if (supabase) {
   void supabase.auth.getSession().then(({data}) => {setUser(data.session?.user ?? null); if (!data.session) setProfileLoaded(true);});
   const {data} = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
   unsub = () => data.subscription.unsubscribe();
  } else setProfileLoaded(true);
  return () => {window.removeEventListener('hashchange', route); window.removeEventListener('scroll', onScroll); unsub();};
 }, [refresh]);
 useEffect(() => {
  if (user) {setProfileLoaded(false); void refreshUser(); forgetDaily();}
  else {setAttempts([]); setAdmin(false); setCompletedState([]); setProfile(null); setDaily(null);}
 }, [user, refreshUser]);

 const login = useCallback(async () => {
  if (!supabase) {setNotice('Sign-in is not configured yet.'); return;}
  const {error} = await supabase.auth.signInWithOAuth({provider: 'google', options: {redirectTo: location.origin + '/' + location.hash}});
  if (error) setNotice(error.message);
 }, []);

 const ctx: AppCtx = useMemo(() => ({
  user, profile, attempts, tests, reviews, lessons, completed, daily, admin, navigate,
  login: () => void login(), logout: () => {void supabase?.auth.signOut(); navigate('home');},
  notify: setNotice, refreshUser,
  setCompleted: u => setCompletedState(u), setProfile: p => setProfile(p),
  beginTest: t => {if (!user) {void login(); return;} setStartTest(t);},
  openAttempt: id => navigate('test' as Tab, id),
  askJerry: m => {setPending(m); setJerryOpen(true);},
 }), [user, profile, attempts, tests, reviews, lessons, completed, daily, admin, navigate, login, refreshUser]);

 if (examId || startTest) return <Exam
  attemptId={examId} test={startTest} user={user}
  onStarted={id => {setStartTest(null); navigate('test' as Tab, id);}}
  onExit={() => {setStartTest(null); void refreshUser(); navigate('practice');}}
  onStudy={id => {void refreshUser(); navigate('study', id);}}
 />;

 const showOnboarding = !!user && profileLoaded && !profile?.onboarded_at;
 const current = tab === 'study' && routeId ? {page: 'lesson', lessonId: routeId} : {page: tab};
 return <div className="shell">
  <header className={'topbar ' + (scrolled ? 'scrolled' : '')}>
   <div className="topbar-in">
    <Brand/>
    <nav className="nav" aria-label="Main">{NAV.map(n => <a key={n.id} href={'#' + n.id} aria-current={tab === n.id ? 'page' : undefined}>{n.label}</a>)}</nav>
    <div className="top-right">
     {user ? <a href="#me" className="avatar" aria-label="Your profile">{user.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} alt="" referrerPolicy="no-referrer"/> : (firstName({user, profile})[0] || 'G').toUpperCase()}</a>
      : <button className="btn btn-ink btn-sm" onClick={() => void login()}>Sign in</button>}
    </div>
   </div>
  </header>
  {notice && <div className="notice" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={17}/></button></div>}
  <main className="page" key={tab + (routeId || '')}>
   {tab === 'home' && <Home ctx={ctx}/>}
   {tab === 'study' && <Study ctx={ctx} lessonId={routeId}/>}
   {tab === 'words' && <Words ctx={ctx} focus={routeId}/>}
   {tab === 'practice' && <Practice ctx={ctx}/>}
   {tab === 'daily' && <Daily ctx={ctx}/>}
   {tab === 'jerry' && <JerryPage ctx={ctx} chats={chats} setChats={setChats} pending={pending} clearPending={() => setPending(undefined)}/>}
   {tab === 'me' && <Me ctx={ctx}/>}
   {tab === 'reviews' && <WriteReview ctx={ctx}/>}
   {tab === 'admin' && <ManageReviews ctx={ctx}/>}
  </main>
  <footer className="footer"><div className="footer-in"><span>© GOATPrep · Free Digital SAT practice</span><span>Not affiliated with College Board. SAT® is a trademark of College Board.</span></div></footer>

  {tab !== 'jerry' && <button className="jerry-fab hide-m" onClick={() => setJerryOpen(true)} aria-label="Ask Jerry"><JerryHead size={34} tone="green"/></button>}
  <nav className="tabbar" aria-label="Tabs">
   <div className="glass-pill">
    <span className="glass-thumb" style={{transform: `translateX(${Math.max(0, TABS.findIndex(t => t.id === tab)) * 100}%)`, opacity: TABS.some(t => t.id === tab) ? 1 : 0}}/>
    {TABS.map(t => <a key={t.id} href={'#' + t.id} aria-current={tab === t.id ? 'page' : undefined}><t.icon size={21} strokeWidth={tab === t.id ? 2.4 : 2}/><span>{t.label}</span></a>)}
   </div>
   <button className="glass-orb" onClick={() => setJerryOpen(true)} aria-label="Ask Jerry"><JerryHead size={30} tone="green"/></button>
  </nav>

  {jerryOpen && <div className="scrim jerry-scrim" onClick={e => e.target === e.currentTarget && setJerryOpen(false)}>
   <div className="sheet jerry-sheet" role="dialog" aria-label="Jerry">
    <div className="jerry-sheet-head"><JerryHead size={34}/><b style={{fontSize: 18}}>Jerry</b><button className="sheet-close" style={{position: 'static', marginLeft: 'auto'}} onClick={() => setJerryOpen(false)} aria-label="Close"><X size={18}/></button></div>
    <JerryChat ctx={ctx} chats={chats} setChats={setChats} pending={pending} clearPending={() => setPending(undefined)} context={current as Record<string, string>} embedded/>
   </div>
  </div>}
  {startTest === null && showOnboarding && <Onboarding ctx={ctx} onClose={() => void refreshUser()}/>}
 </div>;
}
