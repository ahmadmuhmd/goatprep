import {authenticated,failure,isAdmin} from '@/lib/server';
import {dailyStats} from '@/lib/daily';
import {rescoreOutdated} from '@/lib/rescore';
import type {Attempt} from '@/types/sat';

const PROFILE='display_name,grade,test_date,target_score,start_score,focus,onboarded_at';
export async function GET(request: Request) {
 try {
  const {db,user}=await authenticated(request);
  const [attempts,profile,progress,answers]=await Promise.all([
   db.from('attempts').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100),
   db.from('profiles').select(PROFILE).eq('id',user.id).maybeSingle(),
   db.from('lesson_progress').select('lesson_id').eq('user_id',user.id),
   db.from('daily_answers').select('day,section,correct').eq('user_id',user.id).order('day',{ascending:false}).limit(800),
  ]);
  if(attempts.error) throw attempts.error;
  const list=await rescoreOutdated(db,attempts.data as Attempt[]);
  return Response.json({
   attempts:list,admin:isAdmin(user.email),
   profile:profile.error?null:profile.data,
   completed:progress.error?[]:(progress.data as {lesson_id:string}[]).map(x=>x.lesson_id),
   daily:answers.error?null:dailyStats(answers.data as {day:string;correct:boolean}[]),
  });
 }catch(e){return failure(e,401);}
}

export async function POST(request: Request) {
 try {
  const {db,user}=await authenticated(request), body=await request.json(), p=body.profile??{};
  const int=(v:unknown,lo:number,hi:number)=>Number.isInteger(v)&&(v as number)>=lo&&(v as number)<=hi?v as number:null;
  const date=typeof p.test_date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(p.test_date)?p.test_date:null;
  const row={
   id:user.id,
   display_name:typeof p.display_name==='string'?p.display_name.trim().slice(0,40)||null:null,
   grade:typeof p.grade==='string'?p.grade.slice(0,30):null,
   test_date:date,target_score:int(p.target_score,400,1600),start_score:int(p.start_score,400,1600),
   focus:['rw','math','both'].includes(p.focus)?p.focus:null,
   onboarded_at:new Date(typeof p.onboarded_at==='string'&&!Number.isNaN(Date.parse(p.onboarded_at))?p.onboarded_at:Date.now()).toISOString(),
  };
  const {error}=await db.from('profiles').upsert(row);
  if(error) throw new Error('Could not save your profile. Ask the site owner to run neon/upgrade-2026-11.sql.');
  const {id:_,...profile}=row; void _;
  return Response.json({profile});
 }catch(e){return failure(e);}
}
