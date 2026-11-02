import {authenticated,failure,isAdmin} from '@/lib/server';
export async function GET(request: Request) {
 try {
  const {db,user}=await authenticated(request);
  const {data,error}=await db.from('attempts').select('*').eq('user_id',user.id).order('created_at',{ascending:false}).limit(100);
  if(error) throw error;
  return Response.json({attempts:data,admin:isAdmin(user.email)});
 }catch(e){return failure(e,401);}
}

