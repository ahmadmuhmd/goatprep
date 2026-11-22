import {Mark} from './Logo';

const S = {fill: 'none', stroke: 'var(--ink)', strokeWidth: 2.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

/** A few small, slow-floating study charms scattered behind the hero. Decorative only. */
export default function Pendants() {
 return <div className="pendants" aria-hidden>
  <span className="pd pd-goat"><Mark size={46}/></span>
  <span className="pd pd-calc"><svg width="44" height="52" viewBox="0 0 44 52"><rect x="4" y="3" width="36" height="46" rx="8" {...S} fill="var(--card)"/><rect x="10" y="9" width="24" height="10" rx="3" fill="#127A4E"/>{[0, 1, 2].map(r => [0, 1, 2].map(c => <circle key={r + '' + c} cx={13 + c * 9} cy={27 + r * 8} r="2.6" fill="var(--ink)"/>))}</svg></span>
  <span className="pd pd-timer"><svg width="46" height="50" viewBox="0 0 46 50"><circle cx="23" cy="28" r="17" {...S} fill="var(--card)"/><path d="M18 5h10M23 5v6M36 15l3-3" {...S}/><path d="M23 28V18" {...S} stroke="#127A4E"/><path d="M23 28l6 4" {...S}/></svg></span>
  <span className="pd pd-prot"><svg width="58" height="34" viewBox="0 0 58 34"><path d="M4 30a25 25 0 0 1 50 0Z" {...S} fill="var(--card)"/><path d="M16 30a13 13 0 0 1 26 0" {...S}/>{[30, 60, 90, 120, 150].map(a => {const r = a * Math.PI / 180; return <path key={a} d={`M${29 - Math.cos(r) * 25} ${30 - Math.sin(r) * 25}L${29 - Math.cos(r) * 20} ${30 - Math.sin(r) * 20}`} {...S} strokeWidth={2}/>;})}<circle cx="29" cy="30" r="2.5" fill="#127A4E"/></svg></span>
  <span className="pd pd-pencil"><svg width="60" height="22" viewBox="0 0 60 22"><path d="M8 4h38l10 7-10 7H8Z" {...S} fill="#FFD25A"/><path d="M46 4v14M8 4v14" {...S}/><path d="M53 9l3 2-3 2Z" fill="var(--ink)"/><rect x="2" y="4" width="6" height="14" rx="2.5" {...S} fill="#F28C9A"/></svg></span>
 </div>;
}
