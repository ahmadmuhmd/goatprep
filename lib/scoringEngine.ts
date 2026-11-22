import type {Question, ResponseValue} from '@/types/sat';

/**
 * GOATPrep scoring, modelled on how the Digital SAT is scored:
 *  - Multistage adaptive test: Module 1 decides an easier or harder Module 2.
 *  - Two unscored pretest questions per module are ignored.
 *  - Items are scored with a 3-parameter logistic IRT model (MCQ guessing floor, none for grid-ins),
 *    so harder questions answered correctly move the ability estimate more than easier ones.
 *  - Ability is converted to a "raw-equivalent" on the administered form (IRT true-score equating),
 *    then mapped to 200–800 with route-specific conversion curves. The easier route tops out near 640.
 * Curves are calibrated to official Bluebook practice reports (e.g. 2/98 correct → 200/200;
 * 44/54 R&W → 710 and 38/44 Math → 730 on the harder route) and typical published conversions.
 */
export const SCORING_VERSION = 'goat-mst-irt-3';

export function numericValue(value: string): number | null {
 const v = value.trim().replace(/−/g, '-');
 if (!/^-?(?:\d+(?:\.\d*)?|\.\d+)(?:\/-?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(v)) return null;
 const [a, b] = v.split('/').map(Number);
 const n = b === undefined ? a : b === 0 ? NaN : a / b;
 return Number.isFinite(n) ? n : null;
}

export function isCorrect(q: Pick<Question, 'options' | 'answer'>, response = '') {
 if (!response.trim()) return false;
 return (q.answer ?? []).some(answer => {
  if (q.options.length) return answer === response;
  if (answer.trim() === response.trim()) return true;
  const a = numericValue(answer), b = numericValue(response);
  if (a === null || b === null) return false;
  if (Math.abs(a - b) <= 1e-9) return true;
  // Bluebook: a decimal that doesn't fit may be truncated or rounded, but only if it fills the box
  // (5 characters, or 6 with a negative sign). So 0.666 and .6667 earn credit for 2/3; 0.67 does not.
  const r = response.trim();
  if (!r.includes('.') || r.includes('/') || r.length !== (r.startsWith('-') ? 6 : 5)) return false;
  const f = 10 ** (r.split('.')[1]?.length ?? 0);
  return Math.abs(b - Math.trunc(a * f) / f) < 1e-9 || Math.abs(b - Math.round(a * f) / f) < 1e-9;
 });
}

type Item = {a: number; b: number; c: number; ok: boolean};
const B = {1: -1.1, 2: 0.05, 3: 1.2} as const;

function itemParams(q: Question): Omit<Item, 'ok'> {
 const math = String(q.module ?? '').startsWith('math');
 const shift = String(q.module ?? '').endsWith('hard') ? 0.55 : String(q.module ?? '').endsWith('easy') ? -0.55 : 0;
 const d = (q.difficulty ?? 2) as 1 | 2 | 3;
 return {a: (math ? 1.25 : 1.1) + (d === 3 ? 0.1 : 0), b: B[d] + shift, c: q.options?.length ? 0.2 : 0};
}
const p3 = (t: number, i: Omit<Item, 'ok'>) => i.c + (1 - i.c) / (1 + Math.exp(-1.7 * i.a * (t - i.b)));
const GRID = Array.from({length: 401}, (_, i) => -4 + i * 0.02);

function eap(items: Item[]) {
 const logs = GRID.map(t => {
  let l = -0.5 * t * t;
  for (const i of items) {const p = p3(t, i); l += Math.log(i.ok ? p : 1 - p);}
  return l;
 });
 const max = Math.max(...logs), w = logs.map(l => Math.exp(l - max)), sum = w.reduce((x, y) => x + y, 0);
 return GRID.reduce((n, t, i) => n + t * w[i], 0) / sum;
}
const tcc = (t: number, items: Omit<Item, 'ok'>[]) => items.reduce((n, i) => n + p3(t, i), 0);

/** Fraction of the administered form "earned", weighting harder items more (0..1). */
export function rawEquivalent(questions: Question[], responses: Record<string, Partial<ResponseValue> | undefined>) {
 const scored = questions.filter(q => q.scored);
 if (!scored.length) throw new Error('No scored questions');
 const items: Item[] = scored.map(q => ({...itemParams(q), ok: isCorrect(q, responses[q.id]?.answer ?? '')}));
 const theta = eap(items);
 const lo = tcc(eap(items.map(i => ({...i, ok: false}))), items), hi = tcc(eap(items.map(i => ({...i, ok: true}))), items);
 const f = Math.min(1, Math.max(0, (tcc(theta, items) - lo) / Math.max(1e-9, hi - lo)));
 return {theta, fraction: f, correct: items.filter(i => i.ok).length, total: items.length};
}

type Curve = [number, number][];
// Fitted so the median student with k operational questions right gets the target conversion (all 12 GOATPrep forms).
const CURVES: Record<'rw' | 'math', Record<'easy' | 'hard', Curve>> = {
 rw: {
  hard: [[0, 400], [0.1392, 430], [0.2184, 460], [0.2753, 480], [0.3571, 510], [0.4167, 540], [0.4788, 570], [0.5169, 590], [0.5596, 610], [0.598, 630], [0.6437, 650], [0.6915, 670], [0.7384, 690], [0.7641, 700], [0.793, 710], [0.8189, 720], [0.8469, 730], [0.8741, 740], [0.9004, 750], [0.9278, 760], [0.9534, 770], [0.9781, 790], [1, 800]],
  easy: [[0, 200], [0.0096, 200], [0.0267, 220], [0.0473, 240], [0.0911, 270], [0.1831, 310], [0.2811, 350], [0.364, 390], [0.4564, 420], [0.5392, 450], [0.6275, 480], [0.6969, 510], [0.7716, 540], [0.8192, 560], [0.8676, 580], [0.9102, 600], [0.9555, 620], [0.9782, 630], [1, 640]],
 },
 math: {
  hard: [[0, 400], [0.1561, 460], [0.238, 500], [0.3157, 530], [0.3917, 560], [0.4454, 580], [0.5003, 600], [0.5496, 620], [0.6022, 640], [0.6507, 660], [0.6982, 680], [0.7565, 700], [0.7892, 710], [0.8177, 720], [0.8492, 730], [0.882, 740], [0.9123, 760], [0.9433, 770], [0.9736, 790], [1, 800]],
  easy: [[0, 200], [0.0135, 200], [0.0364, 220], [0.0679, 260], [0.1129, 290], [0.1878, 330], [0.2758, 370], [0.3499, 400], [0.4365, 430], [0.5066, 460], [0.5808, 490], [0.6611, 520], [0.7169, 540], [0.7766, 560], [0.8355, 580], [0.8934, 600], [0.9486, 620], [0.9755, 630], [1, 640]],
 },
};
function convert(curve: Curve, f: number) {
 for (let i = 1; i < curve.length; i++) {
  const [x0, y0] = curve[i - 1], [x1, y1] = curve[i];
  if (f <= x1) return y0 + (y1 - y0) * (f - x0) / (x1 - x0);
 }
 return curve[curve.length - 1][1];
}

/** Section score for the administered modules (Module 1 + the routed Module 2). */
export function estimate(questions: Question[], responses: Record<string, Partial<ResponseValue> | undefined>) {
 const {theta, fraction, correct} = rawEquivalent(questions, responses);
 const section = questions.some(q => String(q.module ?? '').startsWith('math')) ? 'math' : 'rw';
 const route = questions.some(q => String(q.module ?? '').endsWith('hard')) ? 'hard' : 'easy';
 // The 3PL guessing floor makes a handful of right answers look like chance, which would leave them at 200.
 // On the real scale a few correct answers still lift a section off the floor, so every correct answer
 // at the very bottom is worth at least ~8 points (5 right → 240, 10 right → 280).
 const floor = correct > 0 ? Math.min(300, 200 + 10 * Math.ceil(correct * 0.8)) : 200;
 const score = Math.max(200, floor, Math.min(800, Math.round(convert(CURVES[section][route], fraction) / 10) * 10));
 return {theta, fraction, score, route};
}

/** Module 1 → harder Module 2 when the weighted share earned reaches the routing cut. */
export const ROUTING_CUT = 0.53; // ≈ 15/25 R&W or 12/20 Math on Module 1
export function route(moduleOne: Question[], responses: Record<string, Partial<ResponseValue> | undefined>): 'easy' | 'hard' {
 return rawEquivalent(moduleOne, responses).fraction >= ROUTING_CUT ? 'hard' : 'easy';
}

/** 1–7 performance band for a content domain, like the bars on College Board's score report. */
export function domainBand(items: {difficulty: number; correct: boolean}[], routeTaken: 'easy' | 'hard') {
 if (!items.length) return 1;
 const w = (d: number) => (d >= 3 ? 1.7 : d === 2 ? 1.3 : 1);
 const frac = items.reduce((n, i) => n + (i.correct ? w(i.difficulty) : 0), 0) / items.reduce((n, i) => n + w(i.difficulty), 0);
 return Math.max(1, Math.min(7, Math.round(1 + 6 * frac * (routeTaken === 'hard' ? 1 : 0.8))));
}
