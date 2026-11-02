import fs from 'node:fs';
import {blueprint} from './blueprint.mjs';
import {validate} from './validate.mjs';
const args=process.argv.slice(2),arg=(name,fallback)=>{const i=args.indexOf('--'+name);return i<0?fallback:args[i+1];};
const number=Number(arg('test','1')),budget=Number(arg('budget','0')),key=process.env.OPENROUTER_API_KEY,model=arg('model',process.env.OPENROUTER_MODEL),auditor=process.env.OPENROUTER_AUDIT_MODEL||model;
if(!Number.isInteger(number)||number<1||number>18||!Number.isFinite(budget)||budget<=0||!key||!model)throw new Error('Set OPENROUTER_API_KEY and OPENROUTER_MODEL. Supply --test 1 --budget 5. Budget is a conservative reservation ceiling in USD.');
fs.mkdirSync('content',{recursive:true});
const file='content/test-'+number+'.json',ledgerFile='content/test-'+number+'.budget.json';
let bank=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):[],ledger=fs.existsSync(ledgerFile)?JSON.parse(fs.readFileSync(ledgerFile,'utf8')):{reserved:0,calls:0};
const modelsResponse=await fetch('https://openrouter.ai/api/v1/models',{signal:AbortSignal.timeout(30000)});
if(!modelsResponse.ok)throw new Error('Could not check current model pricing.');
const catalog=(await modelsResponse.json()).data;
function price(id){const m=catalog.find(m=>m.id===id);if(!m)throw new Error('Model unavailable: '+id);const input=Number(m.pricing.prompt),output=Number(m.pricing.completion);if(!Number.isFinite(input)||!Number.isFinite(output)||input<0||output<0)throw new Error('Unrecognized model pricing');if(Number(m.pricing.request||0)>0)throw new Error('Per-request-priced models are not supported');return {input,output};}
const prices={[model]:price(model),[auditor]:price(auditor)};
const save=()=>fs.writeFileSync(file,JSON.stringify(bank,null,2));
async function call(id,system,prompt){
 const max=2400,estimate=(system.length+prompt.length+1000)*prices[id].input+max*prices[id].output;
 if(ledger.reserved+estimate>budget)throw new Error('Budget ceiling reached. Progress saved. Increase --budget to resume; the ceiling includes prior calls for this test.');
 ledger.reserved+=estimate;ledger.calls++;fs.writeFileSync(ledgerFile,JSON.stringify(ledger,null,2));
 const response=await fetch('https://openrouter.ai/api/v1/chat/completions',{method:'POST',signal:AbortSignal.timeout(120000),headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:id,max_tokens:max,temperature:.3,messages:[{role:'system',content:system},{role:'user',content:prompt}],response_format:{type:'json_object'}})});
 if(!response.ok)throw new Error('OpenRouter request failed ('+response.status+'); reservation retained to avoid overspending.');
 const data=await response.json(),text=data.choices?.[0]?.message?.content;
 if(!text)throw new Error('Empty model response');
 return JSON.parse(text.replace(/^\s*```(?:json)?/,'').replace(/```\s*$/,''));
}
const system='Create one ORIGINAL text-only digital SAT-style item. Do not copy or closely paraphrase a published question. Use a short self-contained passage for Reading & Writing, and no diagrams or external facts needed to solve. Plain text tables are allowed. MCQ: exactly four distinct options A-D, exactly one unambiguous correct answer. Math SPR: options=[], answer is an array of acceptable numeric strings; list rounded variants explicitly when required. Use $...$ for inline math, not currency. Return JSON with passage, prompt, options [{letter,text}], answer [string], explanation (teach the solution and why alternatives fail). No other fields. Respect the requested skill and difficulty.';
for(const slot of blueprint(number)){
 if(bank.some(q=>q.id===slot.id&&q.audit_passed))continue;
 let accepted=false;
 for(let retry=0;retry<2&&!accepted;retry++){
  try{
   const draft=await call(model,system,JSON.stringify(slot));
   const q={...draft,...slot};delete q.format;
   const errors=validate([q],{complete:false});if(errors.length)throw new Error(errors.join('; '));
   const blind={passage:q.passage,prompt:q.prompt,options:q.options,domain:q.domain,skill:q.skill};
   const audit=await call(auditor,'Independently solve this SAT-style question. You are not given the proposed key. Check ambiguity, missing information, and whether a diagram is required. Return JSON: {answer: string, valid: boolean, reason: string}. Be strict; do not approve ambiguous items.',JSON.stringify(blind));
   if(!audit.valid||!q.answer.includes(String(audit.answer).trim()))throw new Error('Independent solver disagreed or rejected item.');
   q.audit_passed=true;q.audit_reason=audit.reason;q.reviewed=false;
   bank=bank.filter(x=>x.id!==q.id);bank.push(q);save();accepted=true;
   console.log(q.id+' accepted for HUMAN REVIEW; reserved budget $'+ledger.reserved.toFixed(4));
  }catch(e){save();if(/Budget|OpenRouter request|pricing|Empty model/.test(e.message))throw e;console.error(slot.id+': '+e.message);}
 }
 if(!accepted)throw new Error('Slot failed twice. Fix the prompt or model and resume. No incomplete test will be published.');
}
const problems=validate(bank);if(problems.length)throw new Error(problems.join('\n'));
console.log('Draft complete. Run content:review, inspect every item, then import the reviewed file.');
