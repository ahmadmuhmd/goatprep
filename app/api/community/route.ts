import {authenticated,database,failure,isAdmin} from '@/lib/server';
export async function GET(request: Request) {
 try {
  const db=database(), admin=new URL(request.url).searchParams.has('admin');
  if(admin) {const {user}=await authenticated(request); if(!isAdmin(user.email)) return failure(new Error('Admin access required.'),403);}
  let query=db.from('reviews').select('id,display_name,body,rating,featured,created_at').order('created_at',{ascending:false}).limit(100);
  if(!admin) query=query.eq('featured',true).limit(6);
  const [count,reviews]=await Promise.all([db.from('profiles').select('id',{count:'exact',head:true}),query]);
  if(count.error||reviews.error) throw new Error('Community data is temporarily unavailable.');
  return Response.json({count:count.count,reviews:reviews.data});
 } catch {return Response.json({count:null,reviews:[],unavailable:true});}
}
export async function POST(request: Request) {
 try {
  const {db,user}=await authenticated(request), body=await request.json();
  if(body.action==='feature'||body.action==='delete') {
   if(!isAdmin(user.email)) return failure(new Error('Admin access required.'),403);
   const result=body.action==='delete' ? await db.from('reviews').delete().eq('id',body.id) : await db.from('reviews').update({featured:body.featured===true}).eq('id',body.id);
   if(result.error) throw result.error;
  } else {
   if(typeof body.body!=='string'||body.body.trim().length<15||body.body.length>800||!Number.isInteger(body.rating)||body.rating<1||body.rating>5) throw new Error('Write 15–800 characters and select a rating from 1 to 5.');
   const name=String(body.display_name||user.user_metadata.full_name||'Student').trim().slice(0,40);
   const {error}=await db.from('reviews').upsert({user_id:user.id,display_name:name,body:body.body.trim(),rating:body.rating,featured:false},{onConflict:'user_id'});
   if(error) throw error;
  }
  return Response.json({ok:true});
 }catch(e){return failure(e);}
}

