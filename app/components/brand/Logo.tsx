const HEAD = 'M290 176C326 184 352 220 368 260C376 278 384 294 378 306C372 318 356 322 342 318C334 328 322 334 308 334C294 334 282 328 274 322C270 352 274 420 296 540L140 540C150 420 186 300 226 238C242 208 262 182 290 176Z';
const BEARD = 'M340 314C336 362 320 398 298 426C284 398 268 362 260 318Z';
const EAR = 'M252 222C222 210 186 216 160 242C190 254 226 250 256 238Z';
const HORN = 'M304 190C304 132 266 84 210 86C178 88 154 108 142 138C164 120 188 112 212 116C248 122 270 150 272 196Z';
const EYE = 'M306 236C314 228 326 228 333 235C325 242 314 243 306 236Z';

/** The GOATPrep signature mark: side-profile goat on a green coin. */
export function Mark({size = 36, bg = '#127A4E', fg = '#FAF7F0', title}: {size?: number; bg?: string; fg?: string; title?: string}) {
 return <svg width={size} height={size} viewBox="0 0 512 512" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
  <defs><clipPath id="goat-coin"><circle cx="256" cy="256" r="256"/></clipPath></defs>
  <circle cx="256" cy="256" r="256" fill={bg}/>
  <g clipPath="url(#goat-coin)"><g transform="translate(10 20)">
   <path fill={fg} d={HEAD}/><path fill={fg} d={BEARD}/>
   <path fill={fg} stroke={bg} strokeWidth="10" strokeLinejoin="round" d={EAR}/>
   <path fill={fg} stroke={bg} strokeWidth="10" strokeLinejoin="round" d={HORN}/>
   <path fill={bg} d={EYE}/>
  </g></g>
 </svg>;
}

/** Goat silhouette only (no coin), used for small inline accents. */
export function GoatGlyph({size = 20, color = 'currentColor'}: {size?: number; color?: string}) {
 return <svg width={size} height={size} viewBox="130 70 270 400" aria-hidden>
  <path fill={color} d={HEAD.replace('L140 540', 'L150 470').replace('296 540', '292 470')}/><path fill={color} d={BEARD}/><path fill={color} d={EAR}/><path fill={color} d={HORN}/>
 </svg>;
}

export function Wordmark() {
 return <span className="wm">GOAT<em>Prep</em></span>;
}

export function Brand({href = '#home'}: {href?: string}) {
 return <a className="brand" href={href} aria-label="GOATPrep home"><Mark size={34}/><Wordmark/></a>;
}
