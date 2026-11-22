/** One 3D study charm (goat, pencil, calculator, timer). Decorative. */
export type CharmKind = 'goat' | 'pencil' | 'calculator' | 'timer';
const SIZE: Record<CharmKind, number> = {goat: 70, pencil: 14, calculator: 48, timer: 56};
export default function Charm({kind, className = '', style}: {kind: CharmKind; className?: string; style?: React.CSSProperties}) {
 // eslint-disable-next-line @next/next/no-img-element
 return <img className={'charm charm-' + kind + ' ' + className} src={`/pendants/${kind}.png`} alt="" aria-hidden width={SIZE[kind]} style={style} loading="lazy"/>;
}

/** Charms parked in the empty side gutters on wide screens, on every page. */
export function SideCharms() {
 return <div className="side-charms" aria-hidden>
  <Charm kind="pencil" style={{left: 'calc(50% - 760px)', top: '32vh'}}/>
  <Charm kind="timer" style={{right: 'calc(50% - 770px)', top: '58vh'}}/>
  <Charm kind="goat" style={{left: 'calc(50% - 790px)', top: '78vh'}}/>
  <Charm kind="calculator" style={{right: 'calc(50% - 755px)', top: '22vh'}}/>
 </div>;
}
