import {authenticated,failure} from '@/lib/server';
import {loadStudyLessons} from '@/lib/study';
export async function GET(request: Request) {
 try {const {db,user}=await authenticated(request); const {data,error}=await db.from('lesson_progress').select('lesson_id').eq('user_id',user.id); if(error) throw error; return Response.json({completed:data.map(x=>x.lesson_id)});}catch(e){return failure(e);}
}
export async function POST(request: Request){
 try {const {db,user}=await authenticated(request),b=await request.json(); const {lessons}=await loadStudyLessons(db); if(!lessons.some(l=>l.id===b.id)) throw new Error('Unknown lesson.');
 const result=b.completed ? await db.from('lesson_progress').upsert({user_id:user.id,lesson_id:b.id}) : await db.from('lesson_progress').delete().eq('user_id',user.id).eq('lesson_id',b.id);
 if(result.error)throw result.error;return Response.json({ok:true});}catch(e){return failure(e);}
}
