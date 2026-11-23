import {createClient} from '@supabase/supabase-js';
import {neonSQL} from './neon-database.mjs';

type Row = Record<string, unknown>;
export type AdminUser = {
 id: string; display_name: string | null; email: string | null; created_at: string; last_active: string | null; onboarded_at: string | null;
 grade: string | null; focus: string | null; target_score: number | null; start_score: number | null; test_date: string | null;
 attempts: number; tests_done: number; best_score: number | null; lessons: number; daily_answered: number; daily_correct: number;
 jerry_calls: number; review_rating: number | null;
};
export type AdminStats = {
 generatedAt: string;
 warnings: string[];
 emailsAvailable: boolean;
 users: {total: number; d1: number; d7: number; d30: number; onboarded: number};
 active: {d1: number; d7: number; d30: number};
 funnel: {registered: number; onboarded: number; started_test: number; completed_test: number; did_lesson: number; did_daily: number; used_jerry: number; reviewed: number};
 signups: {day: string; n: number}[];
 visits: {views: number; visitors: number; views_today: number; visitors_today: number; views_7d: number; visitors_7d: number; signed_in_views: number};
 visitSeries: {day: string; views: number; visitors: number}[];
 topPages: {path: string; n: number}[];
 tests: {started: number; completed: number; avg_total: number | null; in_progress: number};
 testSeries: {day: string; n: number}[];
 perTest: {number: number; title: string; published: boolean; started: number; completed: number; avg_score: number | null}[];
 scoreBuckets: {bucket: number; n: number}[];
 learning: {lessons: number; lesson_users: number; daily_answered: number; daily_correct: number; daily_users: number; daily_today: number; jerry_total: number; jerry_today: number; jerry_users: number};
 dailyBySection: {section: string; n: number; ok: number}[];
 topLessons: {lesson_id: string; n: number}[];
 reviews: {n: number; avg: number; featured: number};
 ratingDist: {rating: number; n: number}[];
 latestReviews: {display_name: string; body: string; rating: number; featured: boolean; created_at: string}[];
 userList: AdminUser[];
};

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

/** Everything the Admin Center shows, computed in the database. Each block fails on its own so one missing table never blanks the page. */
export async function adminStats(): Promise<AdminStats> {
 const sql = neonSQL(), warnings: string[] = [];
 const q = async (name: string, text: string): Promise<Row[]> => {
  try {return (await sql.query(text)) as Row[];} catch {warnings.push(name); return [];}
 };
 const series = (table: string, dateExpr: string, extra = '') => `
  SELECT to_char(g::date,'YYYY-MM-DD') AS day, COALESCE(c.n,0)::int AS n FROM generate_series(current_date-29,current_date,'1 day') g
  LEFT JOIN (SELECT ${dateExpr}::date AS d, count(*) AS n FROM public.${table} WHERE ${dateExpr} >= current_date-29 ${extra} GROUP BY 1) c ON c.d = g::date ORDER BY g`;

 const [users, active, funnel, signups, visits, visitSeries, topPages, tests, testSeries, perTest, buckets, lessons, topLessons, daily, dailyBySection, jerry, reviews, ratingDist, latest, list] = await Promise.all([
  q('profiles', `SELECT count(*)::int total, count(*) FILTER (WHERE created_at >= now()-interval '1 day')::int d1, count(*) FILTER (WHERE created_at >= now()-interval '7 days')::int d7, count(*) FILTER (WHERE created_at >= now()-interval '30 days')::int d30, count(onboarded_at)::int onboarded FROM public.profiles`),
  q('activity', `SELECT count(DISTINCT u) FILTER (WHERE t >= now()-interval '1 day')::int d1, count(DISTINCT u) FILTER (WHERE t >= now()-interval '7 days')::int d7, count(DISTINCT u) FILTER (WHERE t >= now()-interval '30 days')::int d30 FROM (
    SELECT user_id u, created_at t FROM public.attempts UNION ALL SELECT user_id, answered_at FROM public.daily_answers
    UNION ALL SELECT user_id, completed_at FROM public.lesson_progress UNION ALL SELECT user_id, day::timestamptz FROM public.jerry_usage) x`),
  q('funnel', `SELECT (SELECT count(*) FROM public.profiles)::int registered, (SELECT count(*) FROM public.profiles WHERE onboarded_at IS NOT NULL)::int onboarded,
    (SELECT count(DISTINCT user_id) FROM public.attempts)::int started_test, (SELECT count(DISTINCT user_id) FROM public.attempts WHERE completed_at IS NOT NULL)::int completed_test,
    (SELECT count(DISTINCT user_id) FROM public.lesson_progress)::int did_lesson, (SELECT count(DISTINCT user_id) FROM public.daily_answers)::int did_daily,
    (SELECT count(DISTINCT user_id) FROM public.jerry_usage)::int used_jerry, (SELECT count(*) FROM public.reviews)::int reviewed`),
  q('signups', series('profiles', 'created_at')),
  q('visits', `SELECT count(*)::int views, count(DISTINCT visitor)::int visitors, count(*) FILTER (WHERE day = current_date)::int views_today, count(DISTINCT visitor) FILTER (WHERE day = current_date)::int visitors_today,
    count(*) FILTER (WHERE day >= current_date-6)::int views_7d, count(DISTINCT visitor) FILTER (WHERE day >= current_date-6)::int visitors_7d, count(*) FILTER (WHERE signed_in)::int signed_in_views FROM public.site_visits`),
  q('visits', `SELECT to_char(g::date,'YYYY-MM-DD') AS day, COALESCE(c.views,0)::int views, COALESCE(c.visitors,0)::int visitors FROM generate_series(current_date-29,current_date,'1 day') g
    LEFT JOIN (SELECT day d, count(*) views, count(DISTINCT visitor) visitors FROM public.site_visits WHERE day >= current_date-29 GROUP BY 1) c ON c.d = g::date ORDER BY g`),
  q('visits', `SELECT path, count(*)::int n FROM public.site_visits WHERE day >= current_date-29 GROUP BY 1 ORDER BY n DESC LIMIT 10`),
  q('attempts', `SELECT count(*)::int started, count(completed_at)::int completed, count(*) FILTER (WHERE completed_at IS NULL)::int in_progress,
    avg(rw_score+math_score) FILTER (WHERE completed_at IS NOT NULL AND rw_score IS NOT NULL AND math_score IS NOT NULL)::float avg_total FROM public.attempts`),
  q('attempts', series('attempts', 'created_at')),
  q('tests', `SELECT t.number, t.title, t.published, count(a.id)::int started, count(a.completed_at)::int completed,
    round(avg(a.rw_score+a.math_score) FILTER (WHERE a.completed_at IS NOT NULL))::int avg_score FROM public.tests t LEFT JOIN public.attempts a ON a.test_id = t.id GROUP BY t.id ORDER BY t.number`),
  q('scores', `SELECT least(floor((rw_score+math_score)/100.0)*100,1500)::int bucket, count(*)::int n FROM public.attempts WHERE completed_at IS NOT NULL AND rw_score IS NOT NULL AND math_score IS NOT NULL GROUP BY 1 ORDER BY 1`),
  q('lessons', `SELECT count(*)::int n, count(DISTINCT user_id)::int users FROM public.lesson_progress`),
  q('lessons', `SELECT lesson_id, count(*)::int n FROM public.lesson_progress GROUP BY 1 ORDER BY n DESC LIMIT 8`),
  q('daily', `SELECT count(*)::int answered, count(*) FILTER (WHERE correct)::int correct, count(DISTINCT user_id)::int users, count(*) FILTER (WHERE day = current_date)::int today FROM public.daily_answers`),
  q('daily', `SELECT section, count(*)::int n, count(*) FILTER (WHERE correct)::int ok FROM public.daily_answers GROUP BY 1 ORDER BY 1`),
  q('jerry', `SELECT COALESCE(sum(calls),0)::int total, COALESCE(sum(calls) FILTER (WHERE day = current_date),0)::int today, count(DISTINCT user_id)::int users FROM public.jerry_usage`),
  q('reviews', `SELECT count(*)::int n, COALESCE(avg(rating),0)::float avg, count(*) FILTER (WHERE featured)::int featured FROM public.reviews`),
  q('reviews', `SELECT rating, count(*)::int n FROM public.reviews GROUP BY 1 ORDER BY 1`),
  q('reviews', `SELECT display_name, body, rating, featured, created_at FROM public.reviews ORDER BY created_at DESC LIMIT 6`),
  q('users', `SELECT p.id, p.display_name, p.created_at, p.onboarded_at, p.grade, p.focus, p.target_score, p.start_score, p.test_date,
    COALESCE(a.started,0)::int attempts, COALESCE(a.done,0)::int tests_done, a.best, a.last_attempt,
    COALESCE(l.n,0)::int lessons, l.last_lesson, COALESCE(d.n,0)::int daily_answered, COALESCE(d.ok,0)::int daily_correct, d.last_daily,
    COALESCE(j.calls,0)::int jerry_calls, j.last_jerry, r.rating review_rating
    FROM public.profiles p
    LEFT JOIN (SELECT user_id, count(*) started, count(completed_at) done, max(CASE WHEN rw_score IS NOT NULL AND math_score IS NOT NULL THEN rw_score+math_score END) best, max(created_at) last_attempt FROM public.attempts GROUP BY 1) a ON a.user_id = p.id
    LEFT JOIN (SELECT user_id, count(*) n, max(completed_at) last_lesson FROM public.lesson_progress GROUP BY 1) l ON l.user_id = p.id
    LEFT JOIN (SELECT user_id, count(*) n, count(*) FILTER (WHERE correct) ok, max(answered_at) last_daily FROM public.daily_answers GROUP BY 1) d ON d.user_id = p.id
    LEFT JOIN (SELECT user_id, sum(calls) calls, max(day) last_jerry FROM public.jerry_usage GROUP BY 1) j ON j.user_id = p.id
    LEFT JOIN public.reviews r ON r.user_id = p.id ORDER BY p.created_at DESC LIMIT 1000`),
 ]);

 // Emails and last sign-in live in Supabase Auth, which needs the service key (optional, server-only).
 const emails = new Map<string, {email: string | null; signedIn: string | null}>();
 let emailsAvailable = false;
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (url && key) {
  try {
   const auth = createClient(url, key, {auth: {persistSession: false, autoRefreshToken: false}});
   for (let page = 1; page <= 10; page++) {
    const {data, error} = await auth.auth.admin.listUsers({page, perPage: 1000});
    if (error) throw error;
    data.users.forEach(u => emails.set(u.id, {email: u.email ?? null, signedIn: u.last_sign_in_at ?? null}));
    if (data.users.length < 1000) break;
   }
   emailsAvailable = true;
  } catch {warnings.push('auth-emails');}
 }

 const userList: AdminUser[] = list.map(r => {
  const e = emails.get(String(r.id));
  const stamps = [r.last_attempt, r.last_lesson, r.last_daily, r.last_jerry, e?.signedIn].filter(Boolean).map(x => new Date(x as string).getTime());
  return {
   id: String(r.id), display_name: (r.display_name as string) ?? null, email: e?.email ?? null, created_at: iso(r.created_at)!, onboarded_at: iso(r.onboarded_at),
   last_active: stamps.length ? new Date(Math.max(...stamps)).toISOString() : null,
   grade: (r.grade as string) ?? null, focus: (r.focus as string) ?? null, target_score: numOrNull(r.target_score), start_score: numOrNull(r.start_score),
   test_date: r.test_date ? new Date(r.test_date as string).toISOString().slice(0, 10) : null,
   attempts: num(r.attempts), tests_done: num(r.tests_done), best_score: numOrNull(r.best), lessons: num(r.lessons),
   daily_answered: num(r.daily_answered), daily_correct: num(r.daily_correct), jerry_calls: num(r.jerry_calls), review_rating: numOrNull(r.review_rating),
  };
 });

 const one = (rows: Row[]) => rows[0] ?? {};
 const u = one(users), a = one(active), f = one(funnel), v = one(visits), t = one(tests), l = one(lessons), d = one(daily), j = one(jerry), rv = one(reviews);
 return {
  generatedAt: new Date().toISOString(),
  warnings: [...new Set(warnings)],
  emailsAvailable,
  users: {total: num(u.total), d1: num(u.d1), d7: num(u.d7), d30: num(u.d30), onboarded: num(u.onboarded)},
  active: {d1: num(a.d1), d7: num(a.d7), d30: num(a.d30)},
  funnel: {registered: num(f.registered), onboarded: num(f.onboarded), started_test: num(f.started_test), completed_test: num(f.completed_test), did_lesson: num(f.did_lesson), did_daily: num(f.did_daily), used_jerry: num(f.used_jerry), reviewed: num(f.reviewed)},
  signups: signups.map(r => ({day: String(r.day), n: num(r.n)})),
  visits: {views: num(v.views), visitors: num(v.visitors), views_today: num(v.views_today), visitors_today: num(v.visitors_today), views_7d: num(v.views_7d), visitors_7d: num(v.visitors_7d), signed_in_views: num(v.signed_in_views)},
  visitSeries: visitSeries.map(r => ({day: String(r.day), views: num(r.views), visitors: num(r.visitors)})),
  topPages: topPages.map(r => ({path: String(r.path), n: num(r.n)})),
  tests: {started: num(t.started), completed: num(t.completed), in_progress: num(t.in_progress), avg_total: numOrNull(t.avg_total)},
  testSeries: testSeries.map(r => ({day: String(r.day), n: num(r.n)})),
  perTest: perTest.map(r => ({number: num(r.number), title: String(r.title), published: r.published === true, started: num(r.started), completed: num(r.completed), avg_score: numOrNull(r.avg_score)})),
  scoreBuckets: buckets.map(r => ({bucket: num(r.bucket), n: num(r.n)})),
  learning: {lessons: num(l.n), lesson_users: num(l.users), daily_answered: num(d.answered), daily_correct: num(d.correct), daily_users: num(d.users), daily_today: num(d.today), jerry_total: num(j.total), jerry_today: num(j.today), jerry_users: num(j.users)},
  dailyBySection: dailyBySection.map(r => ({section: String(r.section), n: num(r.n), ok: num(r.ok)})),
  topLessons: topLessons.map(r => ({lesson_id: String(r.lesson_id), n: num(r.n)})),
  reviews: {n: num(rv.n), avg: num(rv.avg), featured: num(rv.featured)},
  ratingDist: ratingDist.map(r => ({rating: num(r.rating), n: num(r.n)})),
  latestReviews: latest.map(r => ({display_name: String(r.display_name), body: String(r.body), rating: num(r.rating), featured: r.featured === true, created_at: iso(r.created_at)!})),
  userList,
 };
}
