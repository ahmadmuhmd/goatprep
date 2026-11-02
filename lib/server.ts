import {createDatabase} from './neon-database.mjs';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import type {Attempt, ModuleKey} from '@/types/sat';
export function database() {
 return createDatabase() as unknown as Pick<SupabaseClient,'from'|'rpc'>;
}
export async function authenticated(request: Request) {
 const token=request.headers.get('authorization')?.replace(/^Bearer /,'');
 if (!token) throw new Error('Please sign in with Google.');
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('Google sign-in configuration is missing.');
 const auth=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await auth.auth.getUser(token);
 if(error||!data.user)throw new Error('Your session has expired. Please sign in again.');
 const db=database();
 const result=await db.from('profiles').upsert({id:data.user.id,created_at:data.user.created_at});
 if(result.error)throw result.error;
 return {db,user:data.user};
}
export function isAdmin(email?: string) {
 return !!email && (process.env.ADMIN_EMAILS??'').split(',').map(e=>e.trim().toLowerCase()).includes(email.toLowerCase());
}
export function moduleKey(a: Attempt): ModuleKey|null {
 return (['rw1','rw2'+a.route_rw,null,'math1','math2'+a.route_math] as (ModuleKey|null)[])[a.stage]??null;
}
export function selectedModules(a: Attempt): ModuleKey[] {
 return ['rw1',('rw2'+a.route_rw) as ModuleKey,'math1',('math2'+a.route_math) as ModuleKey];
}
export function failure(e: unknown,status=400) {
 return Response.json({error:e instanceof Error ? e.message : 'Something went wrong. Please retry.'},{status});
}

