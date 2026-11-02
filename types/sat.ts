export type ModuleKey = 'rw1' | 'rw2easy' | 'rw2hard' | 'math1' | 'math2easy' | 'math2hard';
export type Question = {
 id: string; test_id: string; module: ModuleKey; position: number; domain: string; skill: string;
 difficulty: 1 | 2 | 3; passage: string; prompt: string; options: {letter: string; text: string}[];
 answer?: string[]; explanation?: string; scored: boolean;
};
export type ResponseValue = {answer: string; flagged: boolean; eliminated: string[]; note: string};
export type TestInfo = {id: string; title: string; number: number; published: boolean};
export type Attempt = {
 id: string; test_id: string; user_id: string; stage: number; route_rw: 'easy' | 'hard'; route_math: 'easy' | 'hard';
 deadline: string; responses: Record<string, ResponseValue>; completed_at: string | null;
 rw_score: number | null; math_score: number | null; created_at: string; version: number;
};
export type Review = {id: string; display_name: string; body: string; rating: number; featured: boolean; created_at: string};

