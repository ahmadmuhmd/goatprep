import type {User} from '@supabase/supabase-js';
import type {StudyLesson} from '@/lib/study-schema';
import type {Attempt, DailyStats, Profile, Review, TestInfo} from '@/types/sat';

export type Tab = 'home' | 'study' | 'words' | 'practice' | 'daily' | 'jerry' | 'me' | 'reviews' | 'admin';

export type AppCtx = {
 user: User | null;
 profile: Profile | null;
 attempts: Attempt[];
 tests: TestInfo[];
 reviews: Review[];
 userCount: number | null;
 lessons: StudyLesson[];
 completed: string[];
 daily: DailyStats | null;
 admin: boolean;
 navigate: (tab: Tab, id?: string) => void;
 login: () => void;
 logout: () => void;
 notify: (message: string) => void;
 refreshUser: () => Promise<void>;
 setCompleted: (update: (ids: string[]) => string[]) => void;
 setProfile: (profile: Profile) => void;
 beginTest: (test: TestInfo) => void;
 openAttempt: (id: string) => void;
 askJerry: (message: string) => void;
};

export function firstName(ctx: Pick<AppCtx, 'user' | 'profile'>) {
 return (ctx.profile?.display_name || ctx.user?.user_metadata?.full_name || '').trim().split(/\s+/)[0] || '';
}

export function totalScore(a: Attempt) {
 return a.rw_score !== null && a.math_score !== null ? a.rw_score + a.math_score : null;
}

export function daysUntil(date: string | null | undefined) {
 if (!date) return null;
 const target = new Date(date + 'T00:00:00');
 const today = new Date(); today.setHours(0, 0, 0, 0);
 return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export function localDate(d = new Date()) {
 const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
 return `${y}-${m}-${day}`;
}
