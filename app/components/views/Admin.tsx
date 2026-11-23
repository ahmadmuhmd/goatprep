"use client";
import {useCallback, useEffect, useMemo, useState} from 'react';
import {BookOpen, CalendarCheck, ClipboardCheck, Download, Eye, MessageCircle, RefreshCw, Search, ShieldCheck, Star, Trophy, UserCheck, Users} from 'lucide-react';
import {api} from '@/lib/client';
import type {AdminStats, AdminUser} from '@/lib/admin-stats';
import type {AppCtx} from '../site/context';
import {ManageReviews} from './Community';

const nf = (n: number) => n.toLocaleString();
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) + '%' : '0%');
const shortDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString(undefined, {month: 'short', day: 'numeric'});
function ago(iso: string | null) {
 if (!iso) return 'never';
 const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
 if (s < 90) return 'just now';
 if (s < 3600) return Math.round(s / 60) + ' min ago';
 if (s < 86400) return Math.round(s / 3600) + ' h ago';
 if (s < 86400 * 30) return Math.round(s / 86400) + ' d ago';
 return new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
}
const PAGE_NAMES: Record<string, string> = {home: 'Home', study: 'Study', words: 'Words', practice: 'Tests', daily: 'Daily', jerry: 'Jerry', me: 'Me', reviews: 'Reviews', admin: 'Admin', test: 'Inside a test'};

type Sub = 'overview' | 'users' | 'reviews';
export default function AdminCenter({ctx}: {ctx: AppCtx}) {
 const [data, setData] = useState<AdminStats | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [sub, setSub] = useState<Sub>('overview');
 const load = useCallback(async () => {
  setBusy(true);
  try {setData(await api<AdminStats>('admin')); setError('');} catch (e) {setError((e as Error).message);}
  setBusy(false);
 }, []);
 useEffect(() => {
  if (!ctx.admin) return;
  void load();
  const t = setInterval(() => {if (document.visibilityState === 'visible') void load();}, 60000);
  return () => clearInterval(t);
 }, [ctx.admin, load]);
 if (!ctx.admin) return <p className="empty">Owner access only. Sign in with your admin email.</p>;
 return <div className="adm">
  <div className="page-head adm-hero">
   <div><span className="eyebrow-i">Owner only</span><h1><ShieldCheck size={30} style={{verticalAlign: '-4px', marginRight: 8}}/>Admin center</h1></div>
   <div className="adm-tools">
    {data && <span className="muted adm-stamp">Updated {ago(data.generatedAt)}</span>}
    <button className="btn btn-soft btn-sm" onClick={() => void load()} disabled={busy}><RefreshCw size={16} className={busy ? 'adm-spin' : ''}/> Refresh</button>
   </div>
  </div>
  <div className="adm-subs" role="tablist">
   {([['overview', 'Overview'], ['users', 'Users'], ['reviews', 'Reviews']] as [Sub, string][]).map(([k, l]) => <button key={k} role="tab" aria-selected={sub === k} onClick={() => setSub(k)}>{l}{k === 'users' && data ? <em>{nf(data.users.total)}</em> : null}{k === 'reviews' && data ? <em>{nf(data.reviews.n)}</em> : null}</button>)}
  </div>
  {error && <div className="notice" style={{margin: '0 0 16px', width: '100%'}} role="alert"><span>{error}</span></div>}
  {!data && !error && <p className="muted">Loading the numbers…</p>}
  {data && sub === 'overview' && <Overview d={data} go={setSub}/>}
  {data && sub === 'users' && <UsersTab d={data}/>}
  {sub === 'reviews' && <ManageReviews ctx={ctx}/>}
 </div>;
}

function Warnings({d}: {d: AdminStats}) {
 const w = d.warnings, items: string[] = [];
 if (w.includes('visits')) items.push('Visit tracking isn’t set up yet. Run neon/upgrade-2026-11-admin.sql once in the Neon SQL editor, then visits start counting.');
 if (w.includes('auth-emails')) items.push('Couldn’t load emails from Google sign-in. Check SUPABASE_SERVICE_ROLE_KEY in your Vercel settings.');
 else if (!d.emailsAvailable) items.push('To see each student’s email and last sign-in, add SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables (Supabase → Project Settings → API → service_role). Keep it secret.');
 const other = w.filter(x => !['visits', 'auth-emails'].includes(x));
 if (other.length) items.push('Some sections couldn’t load: ' + other.join(', ') + '. The rest of the page is still correct.');
 if (!items.length) return null;
 return <div className="adm-warn">{items.map(x => <p key={x}>{x}</p>)}</div>;
}

function Overview({d, go}: {d: AdminStats; go: (s: Sub) => void}) {
 const accuracy = d.learning.daily_answered ? Math.round((d.learning.daily_correct / d.learning.daily_answered) * 100) : null;
 const completion = d.tests.started ? Math.round((d.tests.completed / d.tests.started) * 100) : 0;
 const kpis: {icon: React.ReactNode; label: string; value: string; note: string; tone: string}[] = [
  {icon: <Users size={18}/>, label: 'Registered accounts', value: nf(d.users.total), note: `+${nf(d.users.d7)} this week · +${nf(d.users.d1)} today`, tone: 'green'},
  {icon: <UserCheck size={18}/>, label: 'Active students (7 days)', value: nf(d.active.d7), note: `${nf(d.active.d1)} in 24 h · ${nf(d.active.d30)} in 30 days`, tone: 'green'},
  {icon: <Eye size={18}/>, label: 'Page views (7 days)', value: nf(d.visits.views_7d), note: `${nf(d.visits.views_today)} today · ${nf(d.visits.views)} all time`, tone: 'blue'},
  {icon: <Users size={18}/>, label: 'Unique visitors (7 days)', value: nf(d.visits.visitors_7d), note: `${nf(d.visits.visitors_today)} today · ${nf(d.visits.visitors)} all time`, tone: 'blue'},
  {icon: <ClipboardCheck size={18}/>, label: 'Tests completed', value: nf(d.tests.completed), note: `${nf(d.tests.started)} started · ${completion}% finish · ${nf(d.tests.in_progress)} in progress`, tone: 'violet'},
  {icon: <Trophy size={18}/>, label: 'Average total score', value: d.tests.avg_total ? String(Math.round(d.tests.avg_total)) : '—', note: 'across completed tests', tone: 'violet'},
  {icon: <Star size={18}/>, label: 'Reviews', value: nf(d.reviews.n), note: d.reviews.n ? `${d.reviews.avg.toFixed(1)} average · ${nf(d.reviews.featured)} featured` : 'none yet', tone: 'amber'},
  {icon: <CalendarCheck size={18}/>, label: 'Daily questions answered', value: nf(d.learning.daily_answered), note: `${accuracy === null ? 'no answers yet' : accuracy + '% correct'} · ${nf(d.learning.daily_users)} students`, tone: 'teal'},
  {icon: <BookOpen size={18}/>, label: 'Lessons completed', value: nf(d.learning.lessons), note: `by ${nf(d.learning.lesson_users)} students`, tone: 'teal'},
  {icon: <MessageCircle size={18}/>, label: 'Jerry messages', value: nf(d.learning.jerry_total), note: `${nf(d.learning.jerry_today)} today · ${nf(d.learning.jerry_users)} students`, tone: 'coral'},
 ];
 const f = d.funnel;
 const steps: [string, number][] = [['Registered', f.registered], ['Finished setup', f.onboarded], ['Started a test', f.started_test], ['Completed a test', f.completed_test], ['Did a lesson', f.did_lesson], ['Answered a daily question', f.did_daily], ['Asked Jerry', f.used_jerry], ['Wrote a review', f.reviewed]];
 const maxScore = Math.max(1, ...d.scoreBuckets.map(b => b.n)), maxRating = Math.max(1, ...d.ratingDist.map(b => b.n));
 const maxPage = Math.max(1, ...d.topPages.map(p => p.n)), maxLesson = Math.max(1, ...d.topLessons.map(p => p.n));
 const ratings = [5, 4, 3, 2, 1].map(r => ({rating: r, n: d.ratingDist.find(x => x.rating === r)?.n ?? 0}));
 return <>
  <Warnings d={d}/>
  <div className="adm-kpis">{kpis.map(k => <div className={'adm-kpi t-' + k.tone} key={k.label}><span className="adm-kpi-ico">{k.icon}</span><span className="adm-kpi-label">{k.label}</span><b>{k.value}</b><small>{k.note}</small></div>)}</div>

  <div className="adm-grid">
   <Panel title="New accounts" tone="green" sub="last 30 days"><Bars data={d.signups.map(s => ({label: shortDay(s.day), value: s.n}))} unit="sign-ups"/></Panel>
   <Panel title="Page views" tone="blue" sub="last 30 days"><Bars data={d.visitSeries.map(s => ({label: shortDay(s.day), value: s.views}))} unit="views"/></Panel>
   <Panel title="Unique visitors" tone="blue" sub="last 30 days"><Bars data={d.visitSeries.map(s => ({label: shortDay(s.day), value: s.visitors}))} unit="visitors"/></Panel>
   <Panel title="Tests started" tone="violet" sub="last 30 days"><Bars data={d.testSeries.map(s => ({label: shortDay(s.day), value: s.n}))} unit="tests"/></Panel>
  </div>

  <div className="adm-grid adm-grid-3">
   <Panel title="Student journey" tone="green" sub="how far students get">
    <div className="adm-rows">{steps.map(([label, n]) => <div className="adm-row" key={label}><span>{label}</span><div className="adm-track"><i style={{width: pct(n, f.registered)}}/></div><b>{nf(n)}<em>{pct(n, f.registered)}</em></b></div>)}</div>
   </Panel>
   <Panel title="Score spread" tone="violet" sub="completed tests, total score">
    {d.scoreBuckets.length ? <div className="adm-rows">{d.scoreBuckets.map(b => <div className="adm-row" key={b.bucket}><span>{b.bucket}–{b.bucket + 99}</span><div className="adm-track"><i style={{width: (b.n / maxScore) * 100 + '%'}}/></div><b>{nf(b.n)}</b></div>)}</div> : <Empty text="No completed tests yet."/>}
   </Panel>
   <Panel title="Where visitors go" tone="blue" sub="top pages, 30 days">
    {d.topPages.length ? <div className="adm-rows">{d.topPages.map(p => <div className="adm-row" key={p.path}><span>{PAGE_NAMES[p.path] ?? p.path}</span><div className="adm-track"><i style={{width: (p.n / maxPage) * 100 + '%'}}/></div><b>{nf(p.n)}</b></div>)}</div> : <Empty text="No visits recorded yet."/>}
    {d.visits.views > 0 && <p className="adm-foot">{pct(d.visits.signed_in_views, d.visits.views)} of views came from signed-in students.</p>}
   </Panel>
  </div>

  <div className="adm-grid">
   <Panel title="Practice tests" tone="violet" sub="per test">
    <div className="adm-table-wrap"><table className="adm-table"><thead><tr><th>Test</th><th>Started</th><th>Completed</th><th>Avg score</th></tr></thead>
     <tbody>{d.perTest.map(t => <tr key={t.number}><td>{t.title}{!t.published && <span className="adm-tag">draft</span>}</td><td>{nf(t.started)}</td><td>{nf(t.completed)}</td><td>{t.avg_score ?? '—'}</td></tr>)}</tbody></table></div>
   </Panel>
   <Panel title="Learning" tone="teal" sub="lessons and daily questions">
    <div className="adm-rows">
     {d.dailyBySection.map(s => <div className="adm-row" key={s.section}><span>Daily {s.section === 'rw' ? 'Reading & Writing' : 'Math'}</span><div className="adm-track"><i style={{width: pct(s.ok, s.n)}}/></div><b>{pct(s.ok, s.n)}<em>{nf(s.n)} answers</em></b></div>)}
     {d.topLessons.map(l => <div className="adm-row" key={l.lesson_id}><span className="adm-clip" title={l.lesson_id}>{l.lesson_id.replace(/^resource-/, '').replace(/-/g, ' ')}</span><div className="adm-track"><i style={{width: (l.n / maxLesson) * 100 + '%'}}/></div><b>{nf(l.n)}</b></div>)}
     {!d.dailyBySection.length && !d.topLessons.length && <Empty text="No lesson or daily activity yet."/>}
    </div>
   </Panel>
  </div>

  <div className="adm-grid">
   <Panel title="Reviews" tone="amber" sub={d.reviews.n ? `${d.reviews.avg.toFixed(1)} average from ${nf(d.reviews.n)}` : 'no reviews yet'} action={<button className="btn btn-ghost btn-sm" onClick={() => go('reviews')}>Manage</button>}>
    <div className="adm-rows">{ratings.map(r => <div className="adm-row" key={r.rating}><span>{r.rating} ★</span><div className="adm-track"><i style={{width: (r.n / maxRating) * 100 + '%'}}/></div><b>{nf(r.n)}</b></div>)}</div>
    {d.latestReviews.slice(0, 3).map(r => <blockquote className="adm-quote" key={r.created_at + r.display_name}>“{r.body.length > 140 ? r.body.slice(0, 140) + '…' : r.body}”<cite>{r.display_name} · {r.rating} ★ · {ago(r.created_at)}</cite></blockquote>)}
   </Panel>
   <Panel title="Newest students" tone="green" sub="most recent sign-ups" action={<button className="btn btn-ghost btn-sm" onClick={() => go('users')}>See all</button>}>
    {d.userList.length ? <div className="adm-people">{d.userList.slice(0, 8).map(u => <Person key={u.id} u={u}/>)}</div> : <Empty text="No accounts yet."/>}
   </Panel>
  </div>
  <p className="adm-foot">Days are counted in UTC. Visits count each browser once per page every 30 seconds; no IP addresses are stored and your own visits as admin are skipped.</p>
 </>;
}

function Person({u}: {u: AdminUser}) {
 const name = u.display_name || u.email || 'Student ' + u.id.slice(0, 4);
 return <div className="adm-person"><span className="review-avatar" aria-hidden>{name.trim()[0]?.toUpperCase() || 'S'}</span><span className="adm-person-t"><b>{name}</b><small>{u.email && u.display_name ? u.email + ' · ' : ''}joined {ago(u.created_at)}</small></span><span className="adm-person-n">{u.tests_done} test{u.tests_done === 1 ? '' : 's'}</span></div>;
}

function Panel({title, sub, action, tone, children}: {title: string; sub?: string; action?: React.ReactNode; tone: string; children: React.ReactNode}) {
 return <section className={'card adm-panel t-' + tone}><div className="adm-panel-head"><div><h2>{title}</h2>{sub && <span className="muted">{sub}</span>}</div>{action}</div>{children}</section>;
}
function Empty({text}: {text: string}) {return <p className="muted adm-empty">{text}</p>;}

/** One-series bar chart. Hover or tap a bar to read its value. Single hue, one axis, no legend needed. */
function Bars({data, unit}: {data: {label: string; value: number}[]; unit: string}) {
 const [hi, setHi] = useState<number | null>(null);
 const max = Math.max(1, ...data.map(x => x.value)), total = data.reduce((n, x) => n + x.value, 0);
 const W = 600, H = 150, gap = 4, bw = (W - gap * (data.length - 1)) / Math.max(1, data.length);
 const cur = hi === null ? null : data[hi];
 return <div className="adm-chart">
  <div className="adm-readout">{cur ? <><b>{nf(cur.value)}</b> {unit} · {cur.label}</> : <><b>{nf(total)}</b> {unit} in 30 days</>}</div>
  <svg viewBox={`0 0 ${W} ${H + 18}`} role="img" aria-label={`${unit}, last 30 days: ${total} in total`} onMouseLeave={() => setHi(null)}>
   <line x1="0" x2={W} y1={H} y2={H} className="adm-axis"/>
   {data.map((x, n) => {
    const h = x.value ? Math.max(3, (x.value / max) * (H - 8)) : 0;
    return <g key={n} onMouseEnter={() => setHi(n)} onClick={() => setHi(n)}>
     <rect x={n * (bw + gap)} y="0" width={bw} height={H} fill="transparent"/>
     {x.value > 0 ? <rect x={n * (bw + gap)} y={H - h} width={bw} height={h} rx="2.5" className={'adm-bar' + (hi === n ? ' on' : '')}/> : <rect x={n * (bw + gap)} y={H - 2} width={bw} height="2" rx="1" className="adm-bar-zero"/>}
    </g>;
   })}
   <text x="0" y={H + 14} className="adm-ax">{data[0]?.label}</text>
   <text x={W} y={H + 14} textAnchor="end" className="adm-ax">{data[data.length - 1]?.label}</text>
   <text x={W} y="10" textAnchor="end" className="adm-ax">max {nf(max)}</text>
  </svg>
 </div>;
}

type SortKey = 'new' | 'active' | 'score' | 'tests';
function UsersTab({d}: {d: AdminStats}) {
 const [q, setQ] = useState(''), [sort, setSort] = useState<SortKey>('new'), [open, setOpen] = useState<string | null>(null);
 const rows = useMemo(() => {
  const s = q.trim().toLowerCase();
  const list = d.userList.filter(u => !s || [u.display_name, u.email, u.id, u.grade].some(x => x?.toLowerCase().includes(s)));
  const by: Record<SortKey, (a: AdminUser, b: AdminUser) => number> = {
   new: (a, b) => b.created_at.localeCompare(a.created_at),
   active: (a, b) => (b.last_active ?? '').localeCompare(a.last_active ?? ''),
   score: (a, b) => (b.best_score ?? 0) - (a.best_score ?? 0),
   tests: (a, b) => b.tests_done - a.tests_done,
  };
  return [...list].sort(by[sort]);
 }, [d.userList, q, sort]);
 function csv() {
  const head = ['id', 'name', 'email', 'joined', 'last_active', 'grade', 'focus', 'target_score', 'start_score', 'test_date', 'tests_started', 'tests_done', 'best_score', 'lessons', 'daily_answered', 'daily_correct', 'jerry_messages', 'review_rating'];
  const esc = (v: unknown) => {const t = v === null || v === undefined ? '' : String(v); return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;};
  const lines = rows.map(u => [u.id, u.display_name, u.email, u.created_at, u.last_active, u.grade, u.focus, u.target_score, u.start_score, u.test_date, u.attempts, u.tests_done, u.best_score, u.lessons, u.daily_answered, u.daily_correct, u.jerry_calls, u.review_rating].map(esc).join(','));
  const url = URL.createObjectURL(new Blob([[head.join(','), ...lines].join('\n')], {type: 'text/csv'}));
  const a = document.createElement('a'); a.href = url; a.download = 'goatprep-students.csv'; a.click(); URL.revokeObjectURL(url);
 }
 return <>
  <Warnings d={d}/>
  <div className="adm-filter">
   <label className="adm-search"><Search size={16}/><input className="input" placeholder={d.emailsAvailable ? 'Search name, email or ID' : 'Search name or ID'} value={q} onChange={e => setQ(e.target.value)}/></label>
   <select className="input adm-select" value={sort} onChange={e => setSort(e.target.value as SortKey)} aria-label="Sort by">
    <option value="new">Newest first</option><option value="active">Recently active</option><option value="score">Highest score</option><option value="tests">Most tests done</option>
   </select>
   <button className="btn btn-soft btn-sm" onClick={csv}><Download size={16}/> CSV</button>
  </div>
  <p className="muted adm-count">{nf(rows.length)} of {nf(d.users.total)} accounts{d.users.total > d.userList.length ? ` (showing the newest ${nf(d.userList.length)})` : ''}</p>
  <div className="card adm-table-wrap"><table className="adm-table adm-users"><thead><tr><th>Student</th><th>Joined</th><th>Last active</th><th>Tests</th><th>Best</th><th>Lessons</th><th>Daily</th><th>Jerry</th><th>Review</th></tr></thead>
   <tbody>{rows.map(u => {
    const name = u.display_name || u.email || 'Student ' + u.id.slice(0, 4), isOpen = open === u.id;
    return [<tr key={u.id} className={isOpen ? 'open' : ''} onClick={() => setOpen(isOpen ? null : u.id)}>
     <td><span className="adm-person"><span className="review-avatar" aria-hidden>{name.trim()[0]?.toUpperCase() || 'S'}</span><span className="adm-person-t"><b>{name}</b>{u.email && u.display_name && <small>{u.email}</small>}</span></span></td>
     <td>{ago(u.created_at)}</td><td>{ago(u.last_active)}</td><td>{u.tests_done}<small>/{u.attempts}</small></td><td>{u.best_score ?? '—'}</td><td>{u.lessons}</td>
     <td>{u.daily_answered ? <>{pct(u.daily_correct, u.daily_answered)}<small> of {u.daily_answered}</small></> : '—'}</td><td>{u.jerry_calls || '—'}</td><td>{u.review_rating ? u.review_rating + ' ★' : '—'}</td></tr>,
     isOpen && <tr key={u.id + 'd'} className="adm-detail"><td colSpan={9}><div className="adm-facts">
      <span><small>Account ID</small>{u.id}</span><span><small>Grade</small>{u.grade || '—'}</span><span><small>Focus</small>{u.focus === 'rw' ? 'Reading & Writing' : u.focus === 'math' ? 'Math' : u.focus === 'both' ? 'Both' : '—'}</span>
      <span><small>Starting score</small>{u.start_score ?? '—'}</span><span><small>Target score</small>{u.target_score ?? '—'}</span><span><small>Test date</small>{u.test_date ?? '—'}</span>
      <span><small>Finished setup</small>{u.onboarded_at ? ago(u.onboarded_at) : 'not yet'}</span><span><small>Daily correct</small>{u.daily_correct} / {u.daily_answered}</span>
     </div></td></tr>];
   })}
   {!rows.length && <tr><td colSpan={9} className="muted" style={{textAlign: 'center', padding: 28}}>No accounts match.</td></tr>}</tbody></table></div>
 </>;
}
