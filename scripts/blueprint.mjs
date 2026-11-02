export const skills={
 'Craft and Structure':['Words in context','Text structure and purpose','Cross-text connections'],
 'Information and Ideas':['Central ideas and details','Inferences','Command of textual evidence','Quantitative evidence in text tables'],
 'Standard English Conventions':['Sentence boundaries','Subject-verb agreement','Verb tense','Modifiers','Pronouns and possessives'],
 'Expression of Ideas':['Transitions','Rhetorical synthesis'],
 'Algebra':['Linear equations in one variable','Linear functions','Systems of linear equations','Linear inequalities','Linear equations in two variables'],
 'Advanced Math':['Equivalent expressions','Quadratic equations','Exponential functions','Nonlinear equations','Polynomial and rational expressions'],
 'Problem-Solving and Data Analysis':['Ratios and units','Percentages','One-variable statistics','Probability','Sampling and margin of error','Observational studies and experiments','Two-variable data and models'],
 'Geometry and Trigonometry':['Area and volume','Lines and angles','Right triangles and trigonometry','Circles']
};
export const sizes={rw1:27,rw2easy:27,rw2hard:27,math1:22,math2easy:22,math2hard:22};
export const domainTargets={
 rw:{'Craft and Structure':14,'Information and Ideas':13,'Standard English Conventions':13,'Expression of Ideas':10},
 math:{Algebra:14,'Advanced Math':14,'Problem-Solving and Data Analysis':6,'Geometry and Trigonometry':6}
};
export function routeSummary(slots,branch){
 const rwSlots=slots.filter(q=>q.module==='rw1'||q.module==='rw2'+branch);
 const mathSlots=slots.filter(q=>q.module==='math1'||q.module==='math2'+branch);
 const rwScored=rwSlots.filter(q=>q.scored),mathScored=mathSlots.filter(q=>q.scored);
 const count=(rows,domains)=>Object.fromEntries(Object.keys(domains).map(d=>[d,rows.filter(q=>q.domain===d).length]));
 return {
  reading_writing:{questions:rwSlots.length,scored:rwScored.length,unscored:rwSlots.length-rwScored.length,scored_by_domain:count(rwScored,domainTargets.rw)},
  math:{questions:mathSlots.length,scored:mathScored.length,unscored:mathSlots.length-mathScored.length,scored_by_domain:count(mathScored,domainTargets.math),all_by_format:{mcq:mathSlots.filter(q=>q.format==='mcq').length,spr:mathSlots.filter(q=>q.format==='spr').length}}
 };
}
export function assertBlueprintProportions(slots){
 if(slots.length!==147)throw new Error('Blueprint must contain 147 stored questions; found '+slots.length);
 for(const branch of ['easy','hard']){
  const {reading_writing:rw,math}=routeSummary(slots,branch);
  if(rw.questions!==54||rw.scored!==50||rw.unscored!==4)throw new Error('R&W '+branch+' route must contain 50 scored and 4 unscored questions');
  if(JSON.stringify(rw.scored_by_domain)!==JSON.stringify(domainTargets.rw))throw new Error('R&W '+branch+' domain targets mismatch');
  if(math.questions!==44||math.scored!==40||math.unscored!==4)throw new Error('Math '+branch+' route must contain 40 scored and 4 unscored questions');
  if(JSON.stringify(math.scored_by_domain)!==JSON.stringify(domainTargets.math))throw new Error('Math '+branch+' domain targets mismatch');
  if(math.all_by_format.mcq!==33||math.all_by_format.spr!==11)throw new Error('Math '+branch+' route must contain 33 MCQ and 11 SPR questions');
 }
}
// Version 2. Keep parity with the standalone Python generator (covered by tests).
export function blueprint(testNumber){
 const result=[];
 for(const [module,size] of Object.entries(sizes)){
  const rw=module.startsWith('rw'),second=!module.endsWith('1');
  const domains=Object.keys(skills).slice(rw?0:4,rw?4:8);
  const counts=rw?(second?[7,7,6,5]:[7,6,7,5]):[7,7,3,3];
  const rows=[];
  for(let d=0;d<4;d++)for(let i=0;i<counts[d];i++){
   const difficulty=module.endsWith('easy')?(i%4===0?2:1):module.endsWith('hard')?(i%4===0?2:3):([1,2,2,3][i%4]);
   const ordinal=rows.length+1;
   rows.push({domain:domains[d],skill:skills[domains[d]][(testNumber+i-1)%skills[domains[d]].length],difficulty,scored:true,format:rw||ordinal%4!==0?'mcq':'spr',ordinal});
  }
  for(let n=0;n<2;n++){
   const domain=domains[(testNumber+n)%4];
   rows.push({domain,skill:skills[domain][(testNumber+n)%skills[domain].length],difficulty:2,scored:false,format:!rw&&second&&n===0?'spr':'mcq',ordinal:rows.length+1});
  }
  const group=q=>rw?domains.indexOf(q.domain)*100+(q.domain==='Standard English Conventions'?0:skills[q.domain].indexOf(q.skill)):0;
  rows.sort((a,b)=>group(a)-group(b)||a.difficulty-b.difficulty||((a.ordinal*7+testNumber*3)%31)-((b.ordinal*7+testNumber*3)%31));
  rows.forEach(({ordinal,...q},index)=>{
   void ordinal;
   const position=index+1;
   result.push({id:'test-'+testNumber+'-'+module+'-'+position,test_id:'test-'+testNumber,module,position,...q});
  });
  if(rows.length!==size)throw new Error('Invalid blueprint module size');
 }
 assertBlueprintProportions(result);
 return result;
}
