"use client";
import {useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
type CalculatorInstance={destroy:()=>void;resize:()=>void};
declare global {interface Window {Desmos?:{GraphingCalculator:(el:HTMLElement,options:Record<string,unknown>)=>CalculatorInstance}}}
export default function DesmosCalculator({onClose}:{onClose:()=>void}){
 const host=useRef<HTMLDivElement>(null),[error,setError]=useState(process.env.NEXT_PUBLIC_DESMOS_API_KEY ? '' : 'The embedded calculator is being configured. Open the public SAT calculator below.');
 useEffect(()=>{
  let instance:CalculatorInstance|undefined,disposed=false;
  const key=process.env.NEXT_PUBLIC_DESMOS_API_KEY;
  if(!key)return;
  function init(){if(!disposed&&window.Desmos&&host.current){instance=window.Desmos.GraphingCalculator(host.current,{keypad:true,expressions:true,settingsMenu:false,restrictedFunctions:true});}}
  let script=document.getElementById('goat-desmos') as HTMLScriptElement|null;
  const fail=()=>setError('Calculator could not load. Please use the public calculator link.');
  if(window.Desmos)init();
  else{
   if(!script){script=document.createElement('script');script.id='goat-desmos';script.src='https://www.desmos.com/api/v1.12/calculator.js?apiKey='+encodeURIComponent(key);script.async=true;document.body.appendChild(script);}
   script.addEventListener('load',init);script.addEventListener('error',fail);
  }
  const resize=new ResizeObserver(()=>instance?.resize());if(host.current)resize.observe(host.current);
  return()=>{disposed=true;instance?.destroy();resize.disconnect();script?.removeEventListener('load',init);script?.removeEventListener('error',fail);};
 },[]);
 return <aside className="calculator-panel" aria-label="Graphing calculator"><div className="tool-title"><strong>Desmos calculator</strong><button aria-label="Close calculator" onClick={onClose}><X size={20}/></button></div>{error&&<p className="calculator-error">{error} <a href="https://www.desmos.com/testing/cb-digital-sat/graphing" target="_blank" rel="noreferrer">Open calculator ↗</a></p>}<div ref={host} className="calculator-host"/></aside>;
}
