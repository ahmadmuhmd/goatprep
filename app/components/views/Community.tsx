"use client";
import {useEffect, useState} from 'react';
import {BadgeCheck, Star} from 'lucide-react';
import {api} from '@/lib/client';
import type {Review} from '@/types/sat';
import type {AppCtx} from '../site/context';

export function WriteReview({ctx}: {ctx: AppCtx}) {
 const [text, setText] = useState(''), [rating, setRating] = useState(5), [name, setName] = useState(ctx.profile?.display_name || ''), [busy, setBusy] = useState(false), [sent, setSent] = useState(false);
 async function submit() {
  if (!ctx.user) {ctx.login(); return;}
  setBusy(true);
  try {await api('community', {body: text, rating, display_name: name}); setSent(true); setText('');} catch (e) {ctx.notify((e as Error).message);} finally {setBusy(false);}
 }
 return <div style={{maxWidth: 560, margin: '0 auto'}}>
  <div className="page-head"><h1>Write a review</h1></div>
  {sent ? <div className="card card-pad"><h2 style={{fontSize: 24}}>Thank you.</h2><p className="muted" style={{marginTop: 6}}>Selected reviews appear on the home page.</p></div> :
  <form className="card card-pad" style={{display: 'grid', gap: 14}} onSubmit={e => {e.preventDefault(); void submit();}}>
   <label className="label">Name shown<input className="input" style={{marginTop: 6}} required maxLength={40} value={name} onChange={e => setName(e.target.value)}/></label>
   <div className="stars" role="group" aria-label="Rating">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} aria-label={n + ' stars'} aria-pressed={rating === n} onClick={() => setRating(n)}><Star size={30} fill={rating >= n ? 'currentColor' : 'none'}/></button>)}</div>
   <label className="label">Your review<textarea className="input" style={{marginTop: 6}} required minLength={15} maxLength={800} rows={5} value={text} onChange={e => setText(e.target.value)}/></label>
   <button className="btn btn-primary" disabled={busy}>{ctx.user ? 'Submit' : 'Sign in to submit'}</button>
  </form>}
 </div>;
}

export function ManageReviews({ctx}: {ctx: AppCtx}) {
 const [reviews, setReviews] = useState<Review[]>([]);
 const load = () => api<{reviews: Review[]}>('community?admin=1').then(x => setReviews(x.reviews)).catch(e => ctx.notify(e.message));
 useEffect(() => {if (ctx.admin) void load();}, [ctx.admin]); // eslint-disable-line react-hooks/exhaustive-deps
 async function act(r: Review, del = false) {
  try {await api('community', {action: del ? 'delete' : 'feature', id: r.id, featured: !r.featured}); await load();} catch (e) {ctx.notify((e as Error).message);}
 }
 if (!ctx.admin) return <p className="empty">Owner access only.</p>;
 return <>
  <div className="page-head"><h1>Reviews</h1></div>
  <div className="review-grid">{reviews.map(r => <article className="card card-pad" key={r.id} style={{display: 'grid', gap: 10}}>
   <span className="stars">{Array.from({length: r.rating}, (_, i) => <Star key={i} size={16} fill="currentColor"/>)}</span>
   <p>{r.body}</p><b>{r.display_name}</b>
   <div className="facts"><button className="btn btn-soft btn-sm" onClick={() => void act(r)}>{r.featured ? 'Unfeature' : 'Feature'}</button><button className="btn btn-ghost btn-sm" onClick={() => {if (confirm('Delete this review?')) void act(r, true);}}>Delete</button></div>
  </article>)}</div>
 </>;
}

export function FeaturedReviews({reviews, compact = false}: {reviews: Review[]; compact?: boolean}) {
 const [i, setI] = useState(0), [paused, setPaused] = useState(false);
 useEffect(() => {
  if (reviews.length < 2 || paused) return;
  const t = setInterval(() => setI(n => (n + 1) % reviews.length), 5500);
  return () => clearInterval(t);
 }, [reviews.length, paused]);
 if (!reviews.length) return null;
 const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
 const r = reviews[i % reviews.length];
 return <section className={'carousel rise ' + (compact ? 'compact' : '')} aria-roledescription="carousel" aria-label="Student reviews" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
  <div className="carousel-side">
   <span className="label" style={{color: 'inherit', opacity: .7}}>Student reviews</span>
   <div className="carousel-score"><span className="big-num">{avg.toFixed(1)}</span><span className="stars">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={18} fill={avg >= n - .25 ? 'currentColor' : 'none'}/>)}</span></div>
   <span style={{opacity: .75, fontSize: 14}}>{reviews.length} verified review{reviews.length > 1 ? 's' : ''}</span>
  </div>
  <figure className="carousel-slide" key={r.id} aria-live="polite">
   <span className="stars" aria-label={r.rating + ' out of 5 stars'}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={18} fill={r.rating >= n ? 'currentColor' : 'none'}/>)}</span>
   <blockquote>“{r.body}”</blockquote>
   <figcaption>
    <span className="review-avatar" aria-hidden>{r.display_name.trim()[0]?.toUpperCase() || 'S'}</span>
    <span><b>{r.display_name}</b><span className="verified"><BadgeCheck size={14}/> Verified Google account</span></span>
   </figcaption>
  </figure>
  {reviews.length > 1 && <div className="carousel-dots">{reviews.map((x, n) => <button key={x.id} aria-label={'Review ' + (n + 1)} aria-current={n === i % reviews.length} onClick={() => setI(n)}><i style={n === i % reviews.length && !paused ? {animationDuration: '5.5s'} : undefined}/></button>)}</div>}
 </section>;
}
