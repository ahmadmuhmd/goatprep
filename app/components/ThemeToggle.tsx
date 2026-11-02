'use client';
import {useEffect,useSyncExternalStore} from 'react';
import {Moon,Sun} from 'lucide-react';
function snapshot(){try{const saved=localStorage.getItem('goatprep-theme');if(saved==='light'||saved==='dark')return saved;}catch{}return matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}
function subscribe(callback:()=>void){const media=matchMedia('(prefers-color-scheme: dark)');window.addEventListener('storage',callback);window.addEventListener('goatprep-theme',callback);media.addEventListener('change',callback);return()=>{window.removeEventListener('storage',callback);window.removeEventListener('goatprep-theme',callback);media.removeEventListener('change',callback);};}
export default function ThemeToggle(){
 const theme=useSyncExternalStore(subscribe,snapshot,()=> 'light');
 useEffect(()=>{document.documentElement.dataset.theme=theme;},[theme]);
 return <button className="theme-toggle" aria-label={'Switch to '+(theme==='light'?'dark':'light')+' theme'} title={'Switch to '+(theme==='light'?'dark':'light')+' theme'} onClick={()=>{const next=theme==='light'?'dark':'light';try{localStorage.setItem('goatprep-theme',next);}catch{}document.documentElement.dataset.theme=next;window.dispatchEvent(new Event('goatprep-theme'));}}>{theme==='light'?<Moon size={21}/>:<Sun size={21}/>}</button>;
}
