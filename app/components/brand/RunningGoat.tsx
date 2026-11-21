/** The GOATPrep goat galloping on its own little planet. Pure SVG + SMIL, no images. */
const G = '#127A4E', GD = '#0B4D31', P = '#FAF7F0', INK = '#141414';

function Leg({x, y, phase, far, back}: {x: number; y: number; phase: number; far?: boolean; back?: boolean}) {
 const hip = back ? '38;-34;38' : '-36;40;-36';
 const knee = back ? '-10;-55;-10' : '10;60;10';
 const fill = far ? '#D9D3C4' : P;
 const begin = (-phase).toFixed(2) + 's';
 const spline = '.45 0 .55 1;.45 0 .55 1';
 return <g transform={`translate(${x} ${y})`}>
  <g>
   <animateTransform attributeName="transform" type="rotate" values={hip} keyTimes="0;.5;1" dur=".56s" begin={begin} repeatCount="indefinite" calcMode="spline" keySplines={spline}/>
   <rect x="-7" y="-4" width="14" height="34" rx="7" fill={fill} stroke={INK} strokeWidth="3"/>
   <g transform="translate(0 28)">
    <g>
     <animateTransform attributeName="transform" type="rotate" values={knee} keyTimes="0;.5;1" dur=".56s" begin={begin} repeatCount="indefinite" calcMode="spline" keySplines={spline}/>
     <rect x="-4.5" y="-2" width="9" height="30" rx="4.5" fill={fill} stroke={INK} strokeWidth="3"/>
     <rect x="-6" y="25" width="12" height="7" rx="2.5" fill={INK}/>
    </g>
   </g>
  </g>
 </g>;
}

function GoatFigure() {
 return <>
  {/* the goat */}
  <g>
   <g>
    <animateTransform attributeName="transform" type="translate" values="0 0;0 -9;0 0" dur=".28s" repeatCount="indefinite" calcMode="spline" keyTimes="0;.5;1" keySplines=".3 0 .7 1;.3 0 .7 1"/>
    <Leg x={44} y={-60} phase={.1} far/><Leg x={-52} y={-60} phase={.38} far back/>
    <g>
     <animateTransform attributeName="transform" type="rotate" values="-3 0 -70;3 0 -70;-3 0 -70" dur=".56s" repeatCount="indefinite"/>
     <path fill={P} stroke={INK} strokeWidth="3" d="M-84 -86C-80 -112-48-118 0-116 42-114 70-106 78-90 86-74 74-55 52-50 20-44-40-44-62-50-80-56-88-68-84-86Z"/>
     <path fill="#E9E3D4" d="M-60 -52C-30 -47 20 -47 50 -52 40 -60 -40 -60 -60 -52Z"/>
     <g><animateTransform attributeName="transform" type="rotate" values="-14 -80 -92;20 -80 -92;-14 -80 -92" dur=".28s" repeatCount="indefinite"/>
      <path fill={P} d="M-82 -94C-96 -102-102-112-98-120-90-112-84-106-74-100Z"/></g>
     <g>
      <animateTransform attributeName="transform" type="rotate" values="4 58 -98;-5 58 -98;4 58 -98" dur=".56s" repeatCount="indefinite"/>
      <path fill={P} stroke={INK} strokeWidth="3" d="M46 -100C54 -118 66 -136 84 -148 94 -155 110 -154 118 -146 126 -138 131-129 127-122 123-116 114-116 106-118 99-112 90-103 80-90Z"/>
      <path fill={P} stroke={INK} strokeWidth="5" strokeLinejoin="round" d="M86 -148C80 -170 62 -184 38 -182 54 -174 66 -162 72 -144Z"/>
      <path fill={P} stroke={INK} strokeWidth="4" strokeLinejoin="round" d="M82 -134C70 -136 58 -131 50 -122 62 -120 74 -123 84 -128Z"/>
      <path fill={P} d="M112 -119C113 -107 108 -97 101 -91 99 -101 99 -110 103 -119Z"/>
      <circle cx="104" cy="-136" r="3.6" fill={INK}/>
      <path d="M124 -126 l-5 2" stroke={INK} strokeWidth="2.5" strokeLinecap="round"/>
      {/* scarf */}
      <path fill={G} d="M58 -104C70 -96 84 -96 92 -104L96 -94C84 -86 66 -86 54 -94Z"/>
      <path fill={G} d="M60 -98 C40 -104 22 -96 6 -104 L10 -92 C26 -86 44 -92 58 -90Z"><animate attributeName="d" values="M60 -98 C40 -104 22 -96 6 -104 L10 -92 C26 -86 44 -92 58 -90Z;M60 -98 C40 -92 22 -108 4 -98 L10 -88 C28 -96 44 -84 58 -90Z;M60 -98 C40 -104 22 -96 6 -104 L10 -92 C26 -86 44 -92 58 -90Z" dur=".42s" repeatCount="indefinite"/></path>
     </g>
    </g>
    <Leg x={50} y={-58} phase={0}/><Leg x={-58} y={-58} phase={.28} back/>
   </g>
  </g>
 </>;
}

/** Hero scene: the goat sprinting through a stream of SAT answer bubbles and scores. */
export default function RunningGoat({className}: {className?: string}) {
 const bubbles: [string, number, number, number, number][] = [['A', 120, 3.2, 0, 26], ['B', 300, 2.6, .9, 20], ['C', 200, 3.6, 1.7, 30], ['D', 80, 2.9, 2.4, 22], ['B', 360, 3.4, .4, 18], ['A', 250, 2.4, 1.3, 16]];
 const scores: [string, number, number, number][] = [['+10', 150, 3, .6], ['1600', 60, 4.2, 2], ['+20', 330, 3.3, 1.5], ['✓', 280, 2.7, .2], ['800', 100, 3.8, 2.9]];
 return <svg className={className} viewBox="0 0 600 460" role="img" aria-label="The GOATPrep goat sprinting through flying SAT answer bubbles">
  <defs>
   <radialGradient id="rg-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#2FBF7A" stopOpacity=".95"/><stop offset=".7" stopColor={G}/><stop offset="1" stopColor={GD}/></radialGradient>
   <linearGradient id="rg-trail" x1="0" x2="1"><stop offset="0" stopColor={G} stopOpacity="0"/><stop offset="1" stopColor={G} stopOpacity=".55"/></linearGradient>
  </defs>
  <circle cx="330" cy="215" r="170" fill="url(#rg-sun)"><animate attributeName="r" values="166;174;166" dur="3s" repeatCount="indefinite"/></circle>
  <circle cx="330" cy="215" r="205" fill="none" stroke={G} strokeOpacity=".25" strokeWidth="2" strokeDasharray="2 12"><animateTransform attributeName="transform" type="rotate" from="0 330 215" to="360 330 215" dur="40s" repeatCount="indefinite"/></circle>
  {/* flying answer bubbles and scores, right to left */}
  {bubbles.map(([l, y, d, b, r], i) => <g key={'b' + i} opacity="0">
   <animateTransform attributeName="transform" type="translate" values={`660 ${y};-60 ${y + 10}`} dur={d + 's'} begin={-b + 's'} repeatCount="indefinite"/>
   <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur={d + 's'} begin={-b + 's'} repeatCount="indefinite"/>
   <circle r={r} fill="#fff" stroke={INK} strokeWidth="2.5"/>
   <text textAnchor="middle" dy=".35em" fontSize={r * .9} fontWeight="800" fontFamily="var(--font-exam-sans), Arial" fill={INK}>{l}</text>
  </g>)}
  {scores.map(([t, y, d, b], i) => <g key={'s' + i} opacity="0">
   <animateTransform attributeName="transform" type="translate" values={`660 ${y};-80 ${y - 12}`} dur={d + 's'} begin={-b + 's'} repeatCount="indefinite"/>
   <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.8;1" dur={d + 's'} begin={-b + 's'} repeatCount="indefinite"/>
   <text fontSize="22" fontWeight="800" fontFamily="var(--font-display), Georgia" fill={i % 2 ? INK : '#0B4D31'}>{t}</text>
  </g>)}
  {/* track */}
  <line x1="0" y1="392" x2="600" y2="392" stroke={INK} strokeWidth="3" strokeLinecap="round"/>
  <line x1="-40" y1="414" x2="640" y2="414" stroke={INK} strokeWidth="3" strokeDasharray="28 22" strokeLinecap="round" opacity=".35"><animate attributeName="stroke-dashoffset" from="0" to="50" dur=".35s" repeatCount="indefinite"/></line>
  {/* speed trails */}
  {[318, 300, 282].map((y, i) => <rect key={i} x="40" y={y} width="190" height={8 - i * 2} rx="4" fill="url(#rg-trail)"><animate attributeName="width" values="150;210;150" dur={(.5 + i * .12) + 's'} repeatCount="indefinite"/></rect>)}
  {/* dust */}
  {[0, .28].map((d, i) => <circle key={i} cx="250" cy="388" r="4" fill={INK} opacity=".25"><animate attributeName="r" values="3;14" dur=".56s" begin={d + 's'} repeatCount="indefinite"/><animate attributeName="opacity" values=".3;0" dur=".56s" begin={d + 's'} repeatCount="indefinite"/><animate attributeName="cx" values="250;190" dur=".56s" begin={d + 's'} repeatCount="indefinite"/></circle>)}
  <ellipse cx="330" cy="394" rx="78" ry="7" fill={INK} opacity=".18"><animate attributeName="rx" values="78;62;78" dur=".28s" repeatCount="indefinite"/></ellipse>
  <g transform="translate(330 392) scale(1.32)"><GoatFigure/></g>
 </svg>;
}
