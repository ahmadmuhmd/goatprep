import type {Question, ResponseValue} from '@/types/sat';
export const SCORING_VERSION = 'provisional-irt-1';
export function numericValue(value: string): number | null {
 const v = value.trim().replace(/\u2212/g, '-');
 if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:\/-?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(v)) return null;
 const [a,b] = v.split('/').map(Number);
 const n = b === undefined ? a : b === 0 ? NaN : a/b;
 return Number.isFinite(n) ? n : null;
}
export function isCorrect(q: Question, response = '') {
 if (!response.trim()) return false;
 return (q.answer ?? []).some(answer => {
  if (q.options.length) return answer === response;
  if (answer.trim() === response.trim()) return true;
  const a = numericValue(answer), b = numericValue(response);
  return a !== null && b !== null && Math.abs(a-b) <= 1e-9;
 });
}
// Assumed parameters, NOT College Board calibration. Numeric entries have no guessing floor.
// All administered scored items are included; unanswered items count as incorrect.
export function estimate(questions: Question[], responses: Record<string, ResponseValue>) {
 const scored = questions.filter(q => q.scored);
 if (!scored.length) throw new Error('No scored questions');
 const grid = Array.from({length:161}, (_,i) => -4+i*.05);
 const logs = grid.map(theta => {
  let log = -.5*theta*theta;
  for (const q of scored) {
   const b = [-1.2,0,1.2][q.difficulty-1], c = q.options.length ? .2 : 0;
   const p = c+(1-c)/(1+Math.exp(-1.2*(theta-b)));
   log += Math.log(isCorrect(q,responses[q.id]?.answer) ? p : 1-p);
  }
  return log;
 });
 const max = Math.max(...logs), weights = logs.map(l=>Math.exp(l-max));
 const sum = weights.reduce((a,b)=>a+b,0);
 const theta = grid.reduce((n,t,i)=>n+t*weights[i],0)/sum;
 return {theta, score: Math.max(200,Math.min(800,Math.round((500+theta*120)/10)*10))};
}
export function route(q: Question[], r: Record<string,ResponseValue>): 'easy'|'hard' {
 return estimate(q,r).theta >= 0 ? 'hard' : 'easy';
}

