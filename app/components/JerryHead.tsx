/** Jerry's icon: the GOATPrep goat inside a chat bubble. The eye blinks; dots pulse while thinking. */
export default function JerryHead({size = 40, thinking = false, tone = 'ink'}: {size?: number; thinking?: boolean; tone?: 'ink' | 'green' | 'paper'}) {
 const bg = tone === 'green' ? '#127A4E' : tone === 'paper' ? '#FAF7F0' : '#141414';
 const fg = tone === 'paper' ? '#141414' : '#FAF7F0';
 return <svg className={'jerry-icon' + (thinking ? ' thinking' : '')} width={size} height={size} viewBox="0 0 64 64" aria-hidden>
  <path fill={bg} d="M18 4h28c8 0 14 6 14 14v18c0 8-6 14-14 14H24l-11 9c-1.3 1-3 .1-3-1.5V49C6 47 4 43 4 37V18C4 10 10 4 18 4Z"/>
  <svg x="13" y="8" width="38" height="40" viewBox="140 80 250 360">
   <path fill={fg} d="M290 176C326 184 352 220 368 260C376 278 384 294 378 306C372 318 356 322 342 318C334 328 322 334 308 334C294 334 282 328 274 322C272 360 276 400 282 440L188 440C196 380 200 300 226 238C242 208 262 182 290 176Z"/>
   <path fill={fg} d="M340 314C336 362 320 398 298 426C284 398 268 362 260 318Z"/>
   <path fill={fg} stroke={bg} strokeWidth="12" strokeLinejoin="round" d="M252 222C222 210 186 216 160 242C190 254 226 250 256 238Z"/>
   <path fill={fg} stroke={bg} strokeWidth="12" strokeLinejoin="round" d="M304 190C304 132 266 84 210 86C178 88 154 108 142 138C164 120 188 112 212 116C248 122 270 150 272 196Z"/>
   <ellipse className="jerry-eye" cx="319" cy="235" rx="12" ry="9" fill={bg}/>
  </svg>
  {thinking && <g fill="#127A4E"><circle className="jd jd1" cx="48" cy="56" r="3"/><circle className="jd jd2" cx="55" cy="56" r="3"/><circle className="jd jd3" cx="62" cy="56" r="3"/></g>}
  {!thinking && <circle cx="55" cy="9" r="5.5" fill="#2FBF7A" stroke={tone === 'paper' ? '#141414' : '#FAF7F0'} strokeWidth="2"/>}
 </svg>;
}
