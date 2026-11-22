/** Four small 3D study charms placed in the empty corners of the hero. Decorative only. */
export default function Pendants() {
 return <div className="pendants" aria-hidden>
  {/* eslint-disable @next/next/no-img-element */}
  <img className="pd pd-goat" src="/pendants/goat.png" alt="" width={74} height={90}/>
  <img className="pd pd-pencil" src="/pendants/pencil.png" alt="" width={14} height={100}/>
  <img className="pd pd-calc" src="/pendants/calculator.png" alt="" width={50} height={73}/>
  <img className="pd pd-timer" src="/pendants/timer.png" alt="" width={60} height={59}/>
 </div>;
}
