import {neon} from '@neondatabase/serverless';

const schema={
 profiles:'id created_at',tests:'id number title published',
 goat_questions:'id test_id module position domain skill difficulty passage prompt options answer explanation scored',
 attempts:'id user_id test_id stage route_rw route_math deadline responses version rw_score math_score scoring_version completed_at created_at',
 reviews:'id user_id display_name body rating featured created_at',
 lesson_progress:'user_id lesson_id completed_at',jerry_usage:'user_id day calls',
 study_lessons:'id payload provenance published sort_order updated_at'
};
const keys={lesson_progress:'user_id,lesson_id',jerry_usage:'user_id,day'};
const value=v=>v!==null&&typeof v==='object'?JSON.stringify(v):v;
export function neonSQL(){
 const url=process.env.DATABASE_URL;
 if(!url)throw new Error('Set DATABASE_URL for Neon. See GOATPrep-START-TO-PUBLISH.md.');
 const parsed=new URL(url);
 if(!['postgres:','postgresql:'].includes(parsed.protocol)||!parsed.hostname.endsWith('.neon.tech'))throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string.');
 return neon(url);
}
export function createDatabase(sql=neonSQL()){
 return {from(table){if(!schema[table])throw new Error('Unknown table');return new Query(sql,table);},async rpc(name,args){
  const signatures={consume_jerry_quota:['uid','daily_limit'],publish_goat_test:['test_id_value','test_number','question_bank','make_public']};
  if(!signatures[name])throw new Error('Unknown database function');
  try{const rows=await sql.query(`SELECT public.${name}(${signatures[name].map((_,i)=>'$'+(i+1)).join(',')}) AS result`,signatures[name].map(k=>value(args[k])));return {data:rows[0]?.result,error:null};}
  catch{return {data:null,error:new Error('Database operation failed. Check the schema and server configuration.')};}
 }};
}
class Query{
 constructor(sql,table){this.sql=sql;this.table=table;this.filters=[];this.orders=[];this.columns='*';this.mode='select';}
 column(c){if(!schema[this.table].split(' ').includes(c))throw new Error('Unknown column');return '"'+c+'"';}
 select(columns='*',options={}){this.columns=columns;this.countOnly=options.head&&options.count==='exact';return this;}
 eq(c,v){this.filters.push([this.column(c),'=',v]);return this;}
 is(c,v){if(v!==null)throw new Error('Only null filters supported');this.filters.push([this.column(c),'IS NULL']);return this;}
 order(c,options={}){this.orders.push(this.column(c)+(options.ascending===false?' DESC':' ASC'));return this;}
 limit(n){if(!Number.isInteger(n)||n<1||n>10000)throw new Error('Invalid limit');this.max=n;return this;}
 insert(row){this.mode='insert';this.row=row;return this;}
 upsert(row,options={}){this.insert(row);this.conflict=options.onConflict||keys[this.table]||'id';return this;}
 update(row){this.mode='update';this.row=row;return this;}
 delete(){this.mode='delete';return this;}
 single(){this.one='required';return this;}
 maybeSingle(){this.one='optional';return this;}
 then(resolve,reject){return this.execute().then(resolve,reject);}
 async execute(){
  try{
   const params=[],bind=v=>{params.push(value(v));return '$'+params.length;};
   const selection=this.columns==='*'?'*':this.columns.split(',').map(c=>this.column(c.trim())).join(',');
   let query,entries;
   if(this.mode==='select')query=`SELECT ${this.countOnly?'count(*)::integer AS total':selection} FROM public.${this.table}`;
   else if(this.mode==='insert'){
    entries=Object.entries(this.row);if(!entries.length)throw new Error('Empty insert');
    query=`INSERT INTO public.${this.table} (${entries.map(([k])=>this.column(k)).join(',')}) VALUES (${entries.map(([,v])=>bind(v)).join(',')})`;
    if(this.conflict){const conflict=this.conflict.split(',');const updates=entries.filter(([k])=>!conflict.includes(k));query+=` ON CONFLICT (${conflict.map(k=>this.column(k)).join(',')}) DO `+(updates.length?'UPDATE SET '+updates.map(([k])=>`${this.column(k)}=EXCLUDED.${this.column(k)}`).join(','):'NOTHING');}
   }else{
    if(!this.filters.length)throw new Error('Unfiltered write refused');
    query=this.mode==='delete'?`DELETE FROM public.${this.table}`:`UPDATE public.${this.table} SET ${Object.entries(this.row).map(([k,v])=>this.column(k)+'='+bind(v)).join(',')}`;
   }
   if(this.filters.length)query+=' WHERE '+this.filters.map(([c,op,v])=>c+' '+op+(op==='='?' '+bind(v):'')).join(' AND ');
   if(this.mode==='select'){if(this.orders.length)query+=' ORDER BY '+this.orders.join(',');if(this.max)query+=' LIMIT '+this.max;}
   else query+=' RETURNING '+selection;
   const rows=await this.sql.query(query,params);
   if(this.one&&(rows.length>1||(this.one==='required'&&!rows.length)))throw new Error('Unexpected row count');
   return {data:this.countOnly?null:this.one?rows[0]??null:rows,count:this.countOnly?rows[0].total:null,error:null};
  }catch{return {data:null,count:null,error:new Error('Database operation failed. Check the schema and server configuration.')};}
 }
}
