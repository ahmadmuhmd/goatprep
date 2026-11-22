import {estimate,SCORING_VERSION} from '@/lib/scoringEngine';
import {selectedModules} from '@/lib/server';
import type {Attempt,Question} from '@/types/sat';

type Db = Awaited<ReturnType<typeof import('@/lib/server').authenticated>>['db'];

/** Re-scores finished attempts that were scored by an older version of the scoring engine. */
export async function rescoreOutdated(db: Db, attempts: Attempt[], banks: Record<string, Question[]> = {}) {
 const out: Attempt[] = [];
 for (const a of attempts) {
  if (!a.completed_at || a.scoring_version === SCORING_VERSION) {out.push(a); continue;}
  try {
   if (!banks[a.test_id]) {
    const {data} = await db.from('goat_questions').select('*').eq('test_id', a.test_id);
    banks[a.test_id] = (data ?? []) as Question[];
   }
   const selected = banks[a.test_id].filter(q => selectedModules(a).includes(q.module));
   if (!selected.length) {out.push(a); continue;}
   const rw_score = estimate(selected.filter(q => q.module.startsWith('rw')), a.responses).score;
   const math_score = estimate(selected.filter(q => q.module.startsWith('math')), a.responses).score;
   const {data} = await db.from('attempts').update({rw_score, math_score, scoring_version: SCORING_VERSION}).eq('id', a.id).select().maybeSingle();
   out.push((data as Attempt | null) ?? {...a, rw_score, math_score, scoring_version: SCORING_VERSION});
  } catch {out.push(a);}
 }
 return out;
}
