export const GAME='sunbreak-skydive';
export const routes=[
 {name:'First flight',color:0x08bbef,count:7,radius:2.2},
 {name:'Coastal cruise',color:0x0bb6ef,count:8,radius:2.0},
 {name:'City slalom',color:0x20a7ee,count:9,radius:1.9},
 {name:'Golden runway',color:0x16b7ea,count:10,radius:1.8},
 {name:'Cloud ribbons',color:0x139ee5,count:11,radius:1.7},
 {name:'Sunbreak final',color:0x16baf2,count:12,radius:1.65}
];
export function profile(value){
 return {game:GAME,v:1,best:routes.map((r,i)=>Math.max(0,Math.min(3,Number.isSafeInteger(value?.best?.[i])?value.best[i]:0))),gold:value?.gold===true,confetti:value?.confetti===true,sound:value?.sound!==false};
}
export function gates(level){
 const route=routes[level];
 return Array.from({length:route.count},(_,i)=>({
  x:Math.sin(i*1.15+level*.7)*(level===0?1.45:2.8),
  z:Math.cos(i*.92+level)* (level===0?1.0:2.0),
  y:112-i*(77/(route.count-1)),radius:route.radius,hit:false,passed:false
 }));
}
export function grade(hits,total,landing){
 const ratio=hits/total;
 return ratio>=.85&&landing<1.6?3:ratio>=.55&&landing<3?2:ratio>=.4?1:0;
}
export function unlocked(best){return Math.min(routes.length-1,best.findIndex(n=>n===0)<0?routes.length-1:best.findIndex(n=>n===0))}
