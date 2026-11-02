import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const moduleURL=js=>'data:text/javascript;base64,'+Buffer.from(js).toString('base64');
const transpile=p=>ts.transpileModule(fs.readFileSync(new URL(p,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const scoring=moduleURL(transpile('../lib/scoringEngine.ts'));
const server=moduleURL(`export async function authenticated(){return globalThis.goatTestContext;}
export function moduleKey(a){return ['rw1','rw2'+a.route_rw,null,'math1','math2'+a.route_math][a.stage]??null;}
export function selectedModules(a){return ['rw1','rw2'+a.route_rw,'math1','math2'+a.route_math];}
export function failure(e,status=400){return Response.json({error:e.message},{status});}`);
let source=transpile('../app/api/attempt/route.ts').replace(/['"]@\/lib\/server['"]/g,JSON.stringify(server)).replace(/['"]@\/lib\/scoringEngine['"]/g,JSON.stringify(scoring));
const {POST}=await import(moduleURL(source));
function context({stage=0,expired=false,owner='u',complete=false}={}){
 const attempt={id:'a',test_id:'test-1',user_id:owner,stage,route_rw:'easy',route_math:'easy',deadline:new Date(Date.now()+(expired?-60000:60000)).toISOString(),responses:{},version:0,completed_at:complete?new Date().toISOString():null};
 const bank=['rw1','rw2easy','rw2hard','math1','math2easy','math2hard'].flatMap(module=>Array.from({length:module.startsWith('rw')?27:22},(_,i)=>({id:module+'-'+i,test_id:'test-1',module,position:i+1,domain:module.startsWith('rw')?'Information and Ideas':'Algebra',skill:'skill',difficulty:2,passage:'Passage',prompt:'Question',options:[{letter:'A',text:'a'},{letter:'B',text:'b'},{letter:'C',text:'c'},{letter:'D',text:'d'}],answer:['A'],explanation:'Explanation',scored:i<(module.startsWith('rw')?25:20)})));
 const tables={attempts:[attempt],goat_questions:bank,tests:[{id:'test-1',published:true}]};
 const db={from(table){let filters=[],patch=null;const query={
  select(){return query;},eq(k,v){filters.push(r=>r[k]===v);return query;},is(k,v){filters.push(r=>r[k]===v);return query;},
  update(p){patch=p;return query;},
  async single(){const x=await query;return {data:x.data[0]??null,error:null};},
  async maybeSingle(){return query.single();},
  then(resolve,reject){try{let rows=tables[table].filter(r=>filters.every(f=>f(r)));if(patch)rows.forEach(r=>Object.assign(r,patch));return Promise.resolve({data:structuredClone(rows),error:null}).then(resolve,reject);}catch(e){return Promise.reject(e).then(resolve,reject);}}
 };return query;}};
 globalThis.goatTestContext={db,user:{id:'u'}};
 return {attempt,bank};
}
const request=b=>new Request('http://localhost/api/attempt',{method:'POST',body:JSON.stringify(b),headers:{'Content-Type':'application/json'}});
test('Active module load never reveals answer keys, explanations or trial flags',async()=>{context();const response=await POST(request({action:'load',id:'a'}));assert.equal(response.status,200);const x=await response.json();assert.equal(x.questions.length,27);assert(!('answer'in x.questions[0]));assert(!('explanation'in x.questions[0]));assert(!('scored'in x.questions[0]));assert(!x.review);});
test('A different student cannot load the attempt',async()=>{context({owner:'someone-else'});assert.equal((await POST(request({action:'load',id:'a'}))).status,404);});
test('Stale versions cannot overwrite newer answers',async()=>{const {attempt}=context();attempt.version=2;assert.equal((await POST(request({action:'save',id:'a',version:1,responses:{}}))).status,409);});
test('An expired module rejects late answer changes and advances',async()=>{const {attempt}=context({expired:true});const response=await POST(request({action:'save',id:'a',version:0,responses:{'rw1-0':{answer:'A',flagged:false,eliminated:[],note:''}}}));assert.equal(response.status,200);assert.equal(attempt.stage,1);assert.equal(attempt.responses['rw1-0'],undefined);});
test('Math route ignores correct Reading & Writing responses',async()=>{const {attempt,bank}=context({stage:3});for(const q of bank.filter(q=>q.module.startsWith('rw')))attempt.responses[q.id]={answer:'A',flagged:false,eliminated:[],note:''};const response=await POST(request({action:'advance',id:'a',version:0}));assert.equal(response.status,200);assert.equal(attempt.route_math,'easy');});
test('Completion saves estimated scores and only then exposes selected-path review',async()=>{const {attempt}=context({stage:4});const response=await POST(request({action:'advance',id:'a',version:0}));assert.equal(response.status,200);assert.equal(attempt.stage,5);assert(attempt.completed_at);assert(attempt.rw_score>=200&&attempt.math_score>=200);const x=await(await POST(request({action:'load',id:'a'}))).json();assert.equal(x.review.length,98);assert(x.review.every(q=>q.answer[0]==='A'));assert(x.review.every(q=>!q.correct));});
