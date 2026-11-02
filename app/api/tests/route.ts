import {database} from '@/lib/server';
export async function GET(){
 try {
  const {data,error}=await database().from('tests').select('id,title,number,published').eq('published',true).order('number');
  if(error) throw error;
  return Response.json({tests:data});
 }catch{return Response.json({tests:[],unavailable:true});}
}

