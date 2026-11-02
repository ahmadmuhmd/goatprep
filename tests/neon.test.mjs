import test from 'node:test';
import assert from 'node:assert/strict';
import {createDatabase} from '../lib/neon-database.mjs';
function fixture(rows=[]){const calls=[];return {calls,db:createDatabase({query:async(...args)=>{calls.push(args);return rows;}})};}
test('Neon parameterizes values and preserves attempt owner/version guards',async()=>{
 const {calls,db}=fixture([{id:'a'}]);
 const r=await db.from('attempts').update({responses:{q:"';DROP TABLE tests;--"},version:2}).eq('id','a').eq('user_id','u').eq('version',1).select().maybeSingle();
 assert.equal(r.data.id,'a');assert.match(calls[0][0],/WHERE "id" = \$3 AND "user_id" = \$4 AND "version" = \$5/);assert.ok(!calls[0][0].includes('DROP'));assert.equal(calls[0][1][0],JSON.stringify({q:"';DROP TABLE tests;--"}));
});
test('Neon rejects identifiers and unfiltered writes',async()=>{const {db,calls}=fixture();assert.throws(()=>db.from('tests;DROP'));assert.throws(()=>db.from('tests').eq('nope',1));assert.ok((await db.from('reviews').delete()).error);assert.equal(calls.length,0);});
test('Neon count, empty CAS, conflict and null filters',async()=>{
 const f=fixture([{total:8}]);assert.equal((await f.db.from('profiles').select('id',{head:true,count:'exact'})).count,8);
 const {db,calls}=fixture();assert.equal((await db.from('attempts').update({version:3}).eq('version',2).maybeSingle()).data,null);
 await db.from('lesson_progress').upsert({user_id:'u',lesson_id:'l'});assert.match(calls[1][0],/ON CONFLICT \("user_id","lesson_id"\) DO NOTHING/);
 await db.from('attempts').select('*').is('completed_at',null);assert.match(calls[2][0],/IS NULL/);
});
test('Neon publication and quota functions are allowlisted',async()=>{const {db,calls}=fixture([{result:true}]);assert.equal((await db.rpc('consume_jerry_quota',{uid:'u',daily_limit:10})).data,true);assert.deepEqual(calls[0][1],['u',10]);await assert.rejects(()=>db.rpc('arbitrary',{}));});
