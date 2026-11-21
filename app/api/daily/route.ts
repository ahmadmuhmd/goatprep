import {authenticated,database,failure} from '@/lib/server';
import {isCorrect} from '@/lib/scoringEngine';
import {dailyStats,dayIndex,validDate} from '@/lib/daily';
import type {Question} from '@/types/sat';
export const dynamic='force-dynamic';

type DB=ReturnType<typeof database>;
async function todays(db:DB,date:string){
 const idx=dayIndex(date);
 const {data:picks}=await db.from('daily_questions').select('section,question_id').eq('day_index',idx);
 let ids=(picks??[]) as {section:'rw'|'math';question_id:string}[];
 if(ids.length<2){
  // Fallback before the daily table is seeded: deterministic pick from all published questions.
  const {data:all}=await db.from('goat_questions').select('id,module').limit(10000);
  const pool=(all??[]) as {id:string;module:string}[];
  const hash=(s:string)=>{let h=2166136261;for(const c of s)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
  ids=(['rw','math'] as const).map(section=>{const list=pool.filter(q=>q.module.startsWith(section)).sort((a,b)=>hash(a.id)-hash(b.id));return list.length?{section,question_id:list[idx%list.length].id}:null;}).filter(Boolean) as typeof ids;
 }
 const out:{section:'rw'|'math';q:Question}[]=[];
 for(const p of ids){const {data}=await db.from('goat_questions').select('*').eq('id',p.question_id).maybeSingle();if(data)out.push({section:p.section,q:data as Question});}
 return out;
}
async function optionalUser(request:Request){try{return await authenticated(request);}catch{return null;}}

export async function GET(request:Request){
 try{
  const date=validDate(new URL(request.url).searchParams.get('date'));
  const auth=request.headers.get('authorization')?await optionalUser(request):null;
  const db=auth?.db??database();
  const items=await todays(db,date);
  const answers:Record<string,unknown>={};let stats=null;
  if(auth){
   const {data}=await db.from('daily_answers').select('day,section,answer,correct').eq('user_id',auth.user.id).order('day',{ascending:false}).limit(800);
   const rows=(data??[]) as {day:string;section:string;answer:string;correct:boolean}[];
   stats=dailyStats(rows);
   for(const r of rows.filter(r=>String(r.day).slice(0,10)===date)){
    const it=items.find(i=>i.section===r.section);
    if(it)answers[r.section]={answer:r.answer,correct:r.correct,key:it.q.answer??[],explanation:it.q.explanation??''};
   }
  }
  return Response.json({date,items:items.map(({section,q})=>({section,id:q.id,domain:q.domain,skill:q.skill,difficulty:q.difficulty,passage:q.passage,prompt:q.prompt,options:q.options})),answers,stats},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}
}

export async function POST(request:Request){
 try{
  const body=await request.json(), date=validDate(body.date);
  if(!['rw','math'].includes(body.section)||typeof body.answer!=='string'||!body.answer.trim()||body.answer.length>12)throw new Error('Choose an answer first.');
  const auth=request.headers.get('authorization')?await optionalUser(request):null;
  const db=auth?.db??database();
  const it=(await todays(db,date)).find(i=>i.section===body.section);
  if(!it||it.q.id!==body.id)throw new Error('Today’s question changed. Refresh the page.');
  const correct=isCorrect(it.q,body.answer);
  if(auth){
   const {data:prev}=await db.from('daily_answers').select('answer,correct').eq('user_id',auth.user.id).eq('day',date).eq('section',body.section).maybeSingle();
   if(prev){const p=prev as {answer:string;correct:boolean};return Response.json({answer:p.answer,correct:p.correct,key:it.q.answer??[],explanation:it.q.explanation??''});}
   await db.from('daily_answers').upsert({user_id:auth.user.id,day:date,section:body.section,question_id:it.q.id,answer:body.answer.trim(),correct});
  }
  return Response.json({answer:body.answer.trim(),correct,key:it.q.answer??[],explanation:it.q.explanation??''});
 }catch(e){return failure(e);}
}
