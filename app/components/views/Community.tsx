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

export function FeaturedReviews({reviews}: {reviews: Review[]}) {
 if (!reviews.length) return null;
 const avg = reviews.reduce((n, r) => n + r.rating, 0) / reviews.length;
 return <section className="reviews rise" aria-labelledby="reviews-title">
  <div className="reviews-head">
   <h2 id="reviews-title">What students say</h2>
   <span className="reviews-score"><span className="stars">{[1, 2, 3, 4, 5].map(n => <Star key={n} size={16} fill={avg >= n - .25 ? 'currentColor' : 'none'}/>)}</span><b>{avg.toFixed(1)}</b><span className="muted">· {reviews.length} review{reviews.length > 1 ? 's' : ''}</span></span>
  </div>
  <div className="review-row">{reviews.map((r, i) => <figure className="review-card rise" key={r.id} style={{'--i': i} as React.CSSProperties}>
   <span className="stars" aria-label={r.rating + ' out of 5 stars'}>{[1, 2, 3, 4, 5].map(n => <Star key={n} size={16} fill={r.rating >= n ? 'currentColor' : 'none'}/>)}</span>
   <blockquote>{r.body}</blockquote>
   <figcaption>
    <span className="review-avatar" aria-hidden>{r.display_name.trim()[0]?.toUpperCase() || 'S'}</span>
    <span><b>{r.display_name}</b><span className="verified"><BadgeCheck size={14}/> Verified Google account</span></span>
    <time className="muted" dateTime={r.created_at}>{new Date(r.created_at).toLocaleDateString(undefined, {month: 'short', year: 'numeric'})}</time>
   </figcaption>
  </figure>)}</div>
 </section>;
}
