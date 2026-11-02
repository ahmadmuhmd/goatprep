"use client";
import {Fragment} from 'react';
import {BlockMath,InlineMath} from 'react-katex';
export default function MathText({text}:{text:string}){
 const parts=text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g);
 return <>{parts.map((p,i)=>p.startsWith('$$')?<BlockMath key={i} math={p.slice(2,-2)} renderError={()=> <span>{p}</span>}/>:p.startsWith('$')&&p.endsWith('$')?<InlineMath key={i} math={p.slice(1,-1)} renderError={()=> <span>{p}</span>}/>:<Fragment key={i}>{p}</Fragment>)}</>;
}
