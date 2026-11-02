import {supabase} from './supabase';
export async function api<T>(path:string,body?:unknown):Promise<T>{
 const {data}=supabase ? await supabase.auth.getSession() : {data:{session:null}};
 const response=await fetch('/api/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(data.session?{Authorization:'Bearer '+data.session.access_token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const result=await response.json(); if(!response.ok)throw new Error(result.error||'Request failed.');return result;
}
