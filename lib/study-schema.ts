export type StudyLesson = {
 id:string;section:string;domain:string;title:string;summary:string;concept:string;
 steps:readonly string[];example:string;explanation:string;
 quiz:{prompt:string;options:readonly string[];answer:number;feedback:string};
};
export const studyDomains:Record<string,readonly string[]>={
 rw:['Craft and Structure','Information and Ideas','Standard English Conventions','Expression of Ideas'],
 math:['Algebra','Advanced Math','Problem-Solving and Data Analysis','Geometry and Trigonometry']
};
export function parseStudyLesson(value:unknown):StudyLesson|null {
 if(!value||typeof value!=='object')return null;
 const v=value as Record<string,unknown>;
 const limits:Record<string,number>={id:100,section:4,domain:80,title:100,summary:240,concept:6000,example:3000,explanation:4000};
 for(const [k,max] of Object.entries(limits))if(typeof v[k]!=='string'||!(v[k] as string).trim()||(v[k] as string).length>max)return null;
 if(!/^[a-z0-9-]+$/.test(v.id as string)||!studyDomains[v.section as string]?.includes(v.domain as string))return null;
 if(!Array.isArray(v.steps)||v.steps.length<2||v.steps.length>8||v.steps.some(s=>typeof s!=='string'||!s.trim()||s.length>700))return null;
 if(!v.quiz||typeof v.quiz!=='object')return null;
 const q=v.quiz as Record<string,unknown>;
 if(typeof q.prompt!=='string'||!q.prompt.trim()||q.prompt.length>2000||typeof q.feedback!=='string'||!q.feedback.trim()||q.feedback.length>3000)return null;
 if(!Array.isArray(q.options)||q.options.length!==4||q.options.some(s=>typeof s!=='string'||!s.trim()||s.length>800)||new Set(q.options).size!==4)return null;
 if(!Number.isInteger(q.answer)||(q.answer as number)<0||(q.answer as number)>3)return null;
 return {id:v.id as string,section:v.section as string,domain:v.domain as string,title:v.title as string,
 summary:v.summary as string,concept:v.concept as string,steps:v.steps as string[],
 example:v.example as string,explanation:v.explanation as string,
 quiz:{prompt:q.prompt,options:q.options as string[],answer:q.answer as number,feedback:q.feedback}};
}
