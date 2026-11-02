import {authenticated,failure,moduleKey,selectedModules} from '@/lib/server';
import {estimate,isCorrect,route,SCORING_VERSION} from '@/lib/scoringEngine';
import type {Attempt,Question,ResponseValue} from '@/types/sat';
export async function POST(request: Request) {
 try {
  const {db,user}=await authenticated(request), body=await request.json();
  if(body.action==='start'){
   const {data:test}=await db.from('tests').select('id').eq('id',body.testId).eq('published',true).single();
   if(!test) throw new Error('This test is not available yet.');
   const {data:active}=await db.from('attempts').select('*').eq('test_id',test.id).eq('user_id',user.id).is('completed_at',null).maybeSingle();
   if(active) return Response.json({attempt:active});
   const {data,error}=await db.from('attempts').insert({user_id:user.id,test_id:test.id,deadline:new Date(Date.now()+32*60000).toISOString()}).select().single();
   if(error) throw error; return Response.json({attempt:data});
  }
  const {data,error}=await db.from('attempts').select('*').eq('id',body.id).eq('user_id',user.id).single();
  if(error||!data) return failure(new Error('Attempt not found.'),404);
  const a=data as Attempt;
  const {data:bank,error:bankError}=await db.from('goat_questions').select('*').eq('test_id',a.test_id);
  if(bankError||!bank) throw new Error('Unable to load this test.');
  const all=bank as Question[], questions=all.filter(q=>q.module===moduleKey(a)).sort((x,y)=>x.position-y.position);
  if(body.action==='load'){
   const review=a.completed_at ? all.filter(q=>selectedModules(a).includes(q.module)).map(q=>({...q,correct:isCorrect(q,a.responses[q.id]?.answer)})) : undefined;
   return Response.json({attempt:a,questions:questions.map(q=>({...q,answer:undefined,explanation:undefined,scored:undefined})),review});
  }
  if(a.completed_at) return Response.json({attempt:a});
  if(body.version!==a.version) return failure(new Error('This attempt changed in another tab. Reload to continue.'),409);
  const expired=Date.now()>=new Date(a.deadline).getTime(), responses={...a.responses};
  if(!expired&&a.stage!==2&&body.responses&&typeof body.responses==='object'){
   for(const q of questions){
    const v=body.responses[q.id] as ResponseValue|undefined; if(!v) continue;
    if(typeof v.answer!=='string'||v.answer.length>32||typeof v.note!=='string'||v.note.length>2000||!Array.isArray(v.eliminated)) throw new Error('Invalid response.');
    if(q.options.length&&v.answer&&!q.options.some(o=>o.letter===v.answer)) throw new Error('Invalid option.');
    responses[q.id]={answer:v.answer,note:v.note,flagged:v.flagged===true,eliminated:v.eliminated.filter(l=>['A','B','C','D'].includes(l))};
   }
  }
  const patch: Partial<Attempt>&{scoring_version?:string}={responses,version:a.version+1};
  if(body.action==='advance'||expired){
   if(a.stage===0) patch.route_rw=route(questions,responses);
   if(a.stage===3) patch.route_math=route(questions,responses);
   patch.stage=a.stage+1;
   patch.deadline=new Date(Date.now()+[32,32,10,35,35,0][patch.stage]*60000).toISOString();
   if(a.stage===4){
    const selected=all.filter(q=>selectedModules(a).includes(q.module));
    patch.rw_score=estimate(selected.filter(q=>q.module.startsWith('rw')),responses).score;
    patch.math_score=estimate(selected.filter(q=>q.module.startsWith('math')),responses).score;
    patch.completed_at=new Date().toISOString(); patch.scoring_version=SCORING_VERSION;
   }
  }else if(body.action!=='save') throw new Error('Unknown action.');
  const result=await db.from('attempts').update(patch).eq('id',a.id).eq('version',a.version).select().maybeSingle();
  if(result.error) throw result.error;
  if(!result.data) return failure(new Error('Another save completed first. Reload to continue.'),409);
  return Response.json({attempt:result.data,expired});
 }catch(e){return failure(e);}
}


