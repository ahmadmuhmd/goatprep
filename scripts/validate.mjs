import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {blueprint,sizes,assertBlueprintProportions} from './blueprint.mjs';
export function validate(bank,{complete=true,reviewed=false}={}){
 const issues=[],ids=new Set(),texts=new Set();
 if(!Array.isArray(bank))return ['Expected a JSON array.'];
 for(const q of bank){
  if(!q||typeof q!=='object'){issues.push('Invalid question record');continue;}
  if(ids.has(q.id))issues.push('Duplicate ID: '+q.id);ids.add(q.id);
  const prompt=String(q.passage||'')+String(q.prompt||'');
  const normalized=prompt.toLowerCase().replace(/\W+/g,'');
  if(texts.has(normalized))issues.push('Duplicate passage/question: '+q.id);texts.add(normalized);
  if(typeof q.id!=='string'||!q.id.startsWith(q.test_id+'-'))issues.push('Invalid ID: '+q.id);
  if(!sizes[q.module]||!Number.isInteger(q.position)||q.position<1||q.position>sizes[q.module])issues.push('Invalid module/position: '+q.id);
  if(![1,2,3].includes(q.difficulty)||typeof q.scored!=='boolean')issues.push('Invalid difficulty/scoring flag: '+q.id);
  if(typeof q.prompt!=='string'||q.prompt.length<15||typeof q.explanation!=='string'||q.explanation.length<25||typeof q.passage!=='string')issues.push('Missing question/explanation: '+q.id);
  if(!Array.isArray(q.answer)||!q.answer.length||q.answer.some(a=>typeof a!=='string'||!a.trim()))issues.push('Missing answer: '+q.id);
  if(!Array.isArray(q.options))issues.push('Missing options: '+q.id);
  else if(q.options.length){
   if(q.options.length!==4||q.options.map(o=>o.letter).join('')!=='ABCD'||q.options.some(o=>typeof o.text!=='string'||!o.text.trim())||new Set(q.options.map(o=>o.text?.trim())).size!==4||q.answer?.length!==1||!['A','B','C','D'].includes(q.answer?.[0]))issues.push('Invalid multiple-choice options/key: '+q.id);
  }else{
   if(q.module?.startsWith('rw'))issues.push('Reading questions must be multiple choice: '+q.id);
   if(q.answer?.some(a=>! /^-?(?:\d+(?:\.\d*)?|\.\d+)(?:\/-?(?:\d+(?:\.\d*)?|\.\d+))?$/.test(a)))issues.push('Invalid numeric answer: '+q.id);
  }
  if(reviewed&&(!q.reviewed||!q.audit_passed))issues.push('Editorial review/audit missing: '+q.id);
 }
 if(complete){
  const testIds=[...new Set(bank.map(q=>q.test_id))];
  if(testIds.length!==1)issues.push('One test per file is required.');
  const number=Number(testIds[0]?.replace('test-',''));
  if(!Number.isInteger(number)||number<1||number>18)issues.push('Test number must be 1–18.');
  else{
   const expected=blueprint(number);
   for(const slot of expected){
    const q=bank.find(q=>q.id===slot.id);
    if(!q){issues.push('Missing slot: '+slot.id);continue;}
    for(const field of ['module','position','domain','skill','difficulty','scored'])if(q[field]!==slot[field])issues.push('Blueprint mismatch '+field+': '+q.id);
    if((q.options?.length?'mcq':'spr')!==slot.format)issues.push('Format mismatch: '+q.id);
   }
   try{assertBlueprintProportions(bank.map(q=>({...q,format:q.options?.length?'mcq':'spr'})));}
   catch(error){issues.push(error.message);}
  }
  if(bank.length!==147)issues.push('Expected exactly 147 questions; found '+bank.length);
 }
 return issues;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const file=process.argv[2];if(!file)throw new Error('Usage: npm run content:validate -- content/test-1.json');
 const issues=validate(JSON.parse(fs.readFileSync(file,'utf8')),{reviewed:process.argv.includes('--reviewed')});
 if(issues.length){console.error(issues.join('\n'));process.exitCode=1;}else console.log('PASS: 147 complete, unique, blueprint-matched questions.');
}
