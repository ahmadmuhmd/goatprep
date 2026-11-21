"use client";
import {useEffect, useState} from 'react';
import {Flame} from 'lucide-react';
import type {AppCtx} from '../site/context';
import {localDate} from '../site/context';
import DailyCard, {loadDaily} from './DailyCard';
import type {DailyStats} from '@/types/sat';

export default function Daily({ctx}: {ctx: AppCtx}) {
 const [stats, setStats] = useState<DailyStats | null>(ctx.daily);
 useEffect(() => {loadDaily().then(d => d.stats && setStats(d.stats)).catch(() => {});}, []);
 const refresh = () => {loadDaily(localDate(), true).then(d => d.stats && setStats(d.stats)).catch(() => {}); void ctx.refreshUser();};
 const week = Array.from({length: 7}, (_, i) => {const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d;});
 const today = new Date();
 return <>
  <div className="page-head">
   <div>
    <span className="label">{today.toLocaleDateString(undefined, {weekday: 'long', month: 'long', day: 'numeric'})}</span>
    <h1>Daily questions</h1>
   </div>
   <div className="daily-head">
    <div className="cal" aria-label="Last 7 days">
     {week.map(d => <span key={d.toISOString()} className={(stats?.days.includes(localDate(d)) ? 'on ' : '') + (localDate(d) === localDate() ? 'today' : '')}>{d.toLocaleDateString(undefined, {weekday: 'narrow'})}</span>)}
    </div>
    {ctx.user && <span className="streak"><Flame size={18}/> {stats?.streak ?? 0}</span>}
   </div>
  </div>
  {!ctx.user && <p className="muted" style={{marginBottom: 16}}><button className="link" onClick={ctx.login}>Sign in</button> to keep your streak.</p>}
  <div className="daily-grid">
   <div className="rise"><DailyCard section="rw" onAnswered={refresh}/></div>
   <div className="rise" style={{'--i': 1} as React.CSSProperties}><DailyCard section="math" onAnswered={refresh}/></div>
  </div>
  <p className="muted" style={{marginTop: 18, fontSize: 14}}>New questions every day, taken from the 12 practice tests.</p>
 </>;
}
