import Image from 'next/image';
export default function JerryHead({thinking=false,large=false}:{thinking?:boolean;large?:boolean}){
 return <span className={'jerry-pet '+(thinking?'thinking ':'')+(large?'large':'')} aria-label={thinking?'Jerry is thinking':'Jerry, your study companion'}>
  <span className="pet-halo"/><Image src="/jerry-emoji.png" alt="" width={large?112:60} height={large?112:60} unoptimized/>
  <span className="pet-spark spark-one">✦</span><span className="pet-spark spark-two">✧</span><span className="pet-status"/>
 </span>;
}

