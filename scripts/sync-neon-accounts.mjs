import {createClient} from '@supabase/supabase-js';
import {createDatabase} from '../lib/neon-database.mjs';
const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key)throw new Error('Set Supabase URL and local service role key to synchronize account counts.');
const auth=createClient(url,key,{auth:{persistSession:false}}),db=createDatabase();
let count=0;
for(let page=1;;page++){
 const {data,error}=await auth.auth.admin.listUsers({page,perPage:1000});if(error)throw new Error('Could not list authentication accounts.');
 for(const user of data.users){const {error}=await db.from('profiles').upsert({id:user.id,created_at:user.created_at});if(error)throw error;count++;}
 if(data.users.length<1000)break;
}
console.log(`${count} authentication accounts synchronized. Existing student records were not deleted.`);
