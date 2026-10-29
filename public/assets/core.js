export function parsePages(value,count){
 if(!value.trim())throw Error('Enter at least one page number.');
 const out=[];
 for(const token of value.split(',')){
  const m=token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if(!m)throw Error('Use page numbers and ranges, for example 1,3-5.');
  const a=Number(m[1]),b=Number(m[2]||m[1]);
  if(a<1||b<1||a>count||b>count)throw Error(`Choose pages between 1 and ${count}.`);
  if(out.length+Math.abs(b-a)+1>2000)throw Error('Choose at most 2,000 output pages.');
  for(let i=a;;i+=a<=b?1:-1){out.push(i-1);if(i===b)break;}
 }
 return out;
}
export function fitSize(w,h,maxW,maxH,keep=true){
 if(![w,h,maxW,maxH].every(x=>Number.isFinite(x)&&x>0))throw Error('Dimensions must be positive numbers.');
 const r=Math.min(maxW/w,maxH/h);
 return keep?[Math.max(1,Math.round(w*r)),Math.max(1,Math.round(h*r))]:[Math.round(maxW),Math.round(maxH)];
}
export function bytes(n){return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;}
