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

export function combineDimensions(sizes,direction='vertical',gap=0,matchSize=true){
 if(!Array.isArray(sizes)||!sizes.length)throw Error('At least one image size is required.');
 for(const s of sizes){
  if(!Number.isFinite(s.w)||!Number.isFinite(s.h)||s.w<=0||s.h<=0)throw Error('All image dimensions must be positive numbers.');
 }
 if(direction==='vertical'){
  const targetW=Math.max(...sizes.map(s=>s.w));
  if(matchSize){
   const items=sizes.map(s=>{
    const scale=targetW/s.w;
    return {w:targetW,h:Math.round(s.h*scale)};
   });
   const height=items.reduce((sum,s)=>sum+s.h,0)+Math.max(0,sizes.length-1)*gap;
   return [targetW,height,items];
  }else{
   const height=sizes.reduce((sum,s)=>sum+s.h,0)+Math.max(0,sizes.length-1)*gap;
   return [targetW,height,sizes.map(s=>({w:s.w,h:s.h}))];
  }
 }else{
  const targetH=Math.max(...sizes.map(s=>s.h));
  if(matchSize){
   const items=sizes.map(s=>{
    const scale=targetH/s.h;
    return {w:Math.round(s.w*scale),h:targetH};
   });
   const width=items.reduce((sum,s)=>sum+s.w,0)+Math.max(0,sizes.length-1)*gap;
   return [width,targetH,items];
  }else{
   const width=sizes.reduce((sum,s)=>sum+s.w,0)+Math.max(0,sizes.length-1)*gap;
   return [width,targetH,sizes.map(s=>({w:s.w,h:s.h}))];
  }
 }
}

export function calculateSquareBounds(w,h,paddingPct=0){
 if(![w,h].every(x=>Number.isFinite(x)&&x>0))throw Error('Dimensions must be positive numbers.');
 const size=Math.max(w,h);
 const usable=size*(1-paddingPct*2);
 const scale=usable/Math.max(w,h);
 const drawW=Math.round(w*scale);
 const drawH=Math.round(h*scale);
 const x=Math.round((size-drawW)/2);
 const y=Math.round((size-drawH)/2);
 return {size,drawW,drawH,x,y};
}

export function formatChange(origBytes,newBytes){
 if(!origBytes||!newBytes)return '';
 const diff=newBytes-origBytes;
 const pct=Math.round((Math.abs(diff)/origBytes)*100);
 if(diff<0)return `(-${pct}% smaller)`;
 if(diff>0)return `(+${pct}% larger)`;
 return '(no change)';
}

export function bytes(n){
 return n<1024?`${n} B`:n<1048576?`${(n/1024).toFixed(1)} KB`:`${(n/1048576).toFixed(2)} MB`;
}
