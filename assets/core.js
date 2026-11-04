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

// Decides which of the newly chosen files can join the current list.
// Skips unsupported types, oversized files, files already in the list, and anything past the count or total-size limits.
export function acceptFiles(existing, incoming, { valid, maxFiles = 30, maxFileBytes = 30 * 1024 * 1024, maxTotalBytes = 100 * 1024 * 1024 } = {}) {
 const key = f => `${f.name}|${f.size}|${f.lastModified}`;
 const known = new Set(existing.map(key));
 let total = existing.reduce((n, f) => n + f.size, 0);
 const accepted = [];
 const skipped = { type: 0, size: 0, duplicate: 0, count: 0, total: 0 };
 for (const f of incoming) {
  if (valid && !valid.test(f.name)) skipped.type++;
  else if (f.size > maxFileBytes) skipped.size++;
  else if (known.has(key(f))) skipped.duplicate++;
  else if (existing.length + accepted.length >= maxFiles) skipped.count++;
  else if (total + f.size > maxTotalBytes) skipped.total++;
  else {
   accepted.push(f);
   known.add(key(f));
   total += f.size;
  }
 }
 return { accepted, skipped };
}

export const SVG_PRESETS = {
 'original': { mode: 'scale', scale: 1, label: 'Original SVG Size (1×)' },
 'scale-2x': { mode: 'scale', scale: 2, label: 'Retina 2× Scale' },
 'scale-4x': { mode: 'scale', scale: 4, label: 'Ultra HD 4× Scale' },
 'favicon-16': { w: 16, h: 16, label: 'Favicon Mini (16 × 16 px)' },
 'favicon-32': { w: 32, h: 32, label: 'Favicon Standard (32 × 32 px)' },
 'favicon-48': { w: 48, h: 48, label: 'Favicon Desktop (48 × 48 px)' },
 'favicon-64': { w: 64, h: 64, label: 'Favicon HD (64 × 64 px)' },
 'apple-180': { w: 180, h: 180, label: 'Apple Touch Icon (180 × 180 px)' },
 'pwa-192': { w: 192, h: 192, label: 'Web App / Android Icon (192 × 192 px)' },
 'logo-500': { w: 500, h: 500, label: 'Standard Logo (500 × 500 px)' },
 'pwa-512': { w: 512, h: 512, label: 'App Store / PWA Icon (512 × 512 px)' },
 'logo-1000': { w: 1000, h: 1000, label: 'HD Logo (1000 × 1000 px)' },
 'logo-2000': { w: 2000, h: 2000, label: 'Print / 4K Logo (2000 × 2000 px)' },
 'og-1200x630': { w: 1200, h: 630, label: 'Social Share / Open Graph (1200 × 630 px)' },
 'hd-1920x1080': { w: 1920, h: 1080, label: 'Full HD Banner (1920 × 1080 px)' }
};

function parseSvgLength(raw) {
 if (!raw) return 0;
 const m = String(raw).trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+))\s*(px|pt|pc|in|cm|mm|em|rem|%)?$/i);
 if (!m) return 0;
 const val = Number(m[1]);
 const unit = (m[2] || 'px').toLowerCase();
 if (!Number.isFinite(val) || val <= 0 || unit === '%') return 0;
 const factors = { px: 1, pt: 96 / 72, pc: 16, in: 96, cm: 96 / 2.54, mm: 96 / 25.4, em: 16, rem: 16 };
 return val * (factors[unit] || 1);
}

function getAttr(tag, name) {
 const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
 const m = tag.match(re);
 return m ? (m[1] ?? m[2] ?? '').trim() : '';
}

export function parseSvgInfo(svgText) {
 if (typeof svgText !== 'string') throw Error('This file is not a valid SVG document.');
 const cleaned = svgText.replace(/^\uFEFF/, '').trim();
 const tagMatch = cleaned.match(/<svg(?:\s[^>]*)?>/i);
 if (!tagMatch) throw Error('This file is not a valid SVG document.');
 const tag = tagMatch[0];

 const vbRaw = getAttr(tag, 'viewBox');
 let vbW = 0, vbH = 0, viewBox = '';
 if (vbRaw) {
  const parts = vbRaw.split(/[\s,]+/).map(Number);
  if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
   vbW = parts[2];
   vbH = parts[3];
   viewBox = parts.join(' ');
  }
 }

 const attrW = parseSvgLength(getAttr(tag, 'width'));
 const attrH = parseSvgLength(getAttr(tag, 'height'));

 let width = 0, height = 0;
 if (attrW > 0 && attrH > 0) {
  width = attrW;
  height = attrH;
 } else if (vbW > 0 && vbH > 0) {
  if (attrW > 0) {
   width = attrW;
   height = attrW * (vbH / vbW);
  } else if (attrH > 0) {
   height = attrH;
   width = attrH * (vbW / vbH);
  } else {
   width = vbW;
   height = vbH;
  }
 } else if (attrW > 0) {
  width = attrW;
  height = attrW;
 } else if (attrH > 0) {
  width = attrH;
  height = attrH;
 } else {
  width = 512;
  height = 512;
 }

 width = Math.max(1, Math.round(width));
 height = Math.max(1, Math.round(height));
 if (!viewBox) viewBox = `0 0 ${width} ${height}`;

 return { width, height, viewBox };
}

export function resolveSvgDimensions(origW, origH, { preset = 'custom', width = 500, height = 500, fitMode = 'contain-canvas', padPct = 0 } = {}) {
 if (![origW, origH].every(x => Number.isFinite(x) && x > 0)) {
  throw Error('SVG intrinsic dimensions must be positive numbers.');
 }
 let targetW = Number(width);
 let targetH = Number(height);
 const presetDef = SVG_PRESETS[preset];
 if (presetDef) {
  if (presetDef.mode === 'scale') {
   targetW = Math.max(1, Math.round(origW * presetDef.scale));
   targetH = Math.max(1, Math.round(origH * presetDef.scale));
  } else {
   targetW = presetDef.w;
   targetH = presetDef.h;
  }
 } else {
  targetW = Math.round(targetW);
  targetH = Math.round(targetH);
 }

 if (![targetW, targetH].every(x => Number.isFinite(x) && x > 0)) {
  throw Error('Width and height must be positive numbers.');
 }

 const safePad = Math.max(0, Math.min(0.4, Number(padPct) || 0));

 if (fitMode === 'fit-bounds') {
  const [fitW, fitH] = fitSize(origW, origH, targetW, targetH, true);
  const canvasW = fitW;
  const canvasH = fitH;
  const usableW = Math.max(1, canvasW * (1 - safePad * 2));
  const usableH = Math.max(1, canvasH * (1 - safePad * 2));
  const scale = Math.min(usableW / origW, usableH / origH);
  const drawW = Math.max(1, Math.round(origW * scale));
  const drawH = Math.max(1, Math.round(origH * scale));
  const x = Math.round((canvasW - drawW) / 2);
  const y = Math.round((canvasH - drawH) / 2);
  return { canvasW, canvasH, drawW, drawH, x, y };
 }

 if (fitMode === 'stretch') {
  const canvasW = targetW;
  const canvasH = targetH;
  const drawW = Math.max(1, Math.round(canvasW * (1 - safePad * 2)));
  const drawH = Math.max(1, Math.round(canvasH * (1 - safePad * 2)));
  const x = Math.round((canvasW - drawW) / 2);
  const y = Math.round((canvasH - drawH) / 2);
  return { canvasW, canvasH, drawW, drawH, x, y };
 }

 // Default: 'contain-canvas' — fits proportionally and centers on exact targetW x targetH canvas
 const canvasW = targetW;
 const canvasH = targetH;
 const usableW = Math.max(1, canvasW * (1 - safePad * 2));
 const usableH = Math.max(1, canvasH * (1 - safePad * 2));
 const scale = Math.min(usableW / origW, usableH / origH);
 const drawW = Math.max(1, Math.round(origW * scale));
 const drawH = Math.max(1, Math.round(origH * scale));
 const x = Math.round((canvasW - drawW) / 2);
 const y = Math.round((canvasH - drawH) / 2);
 return { canvasW, canvasH, drawW, drawH, x, y };
}

function setSvgAttr(tag, name, value) {
 const re = new RegExp(`(\\b${name}\\s*=\\s*)(?:"[^"]*"|'[^']*')`, 'i');
 if (re.test(tag)) return tag.replace(re, `$1"${value}"`);
 return tag.replace(/(\/?>)$/, ` ${name}="${value}"$1`);
}

export function prepareSvgForRender(svgText, drawW, drawH, preserveAspectRatio = 'xMidYMid meet') {
 const info = parseSvgInfo(svgText);
 const w = Math.max(1, Math.round(Number(drawW) || info.width));
 const h = Math.max(1, Math.round(Number(drawH) || info.height));
 let cleaned = svgText.replace(/^\uFEFF/, '').trim();
 cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

 return cleaned.replace(/<svg(?:\s[^>]*)?>/i, match => {
  let tag = match;
  if (!/\bxmlns\s*=/i.test(tag)) tag = setSvgAttr(tag, 'xmlns', 'http://www.w3.org/2000/svg');
  if (!/\bviewBox\s*=/i.test(tag)) tag = setSvgAttr(tag, 'viewBox', info.viewBox);
  tag = setSvgAttr(tag, 'width', String(w));
  tag = setSvgAttr(tag, 'height', String(h));
  tag = setSvgAttr(tag, 'preserveAspectRatio', preserveAspectRatio);
  return tag;
 });
}

const CRC_TABLE = (() => {
 const table = new Uint32Array(256);
 for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  table[n] = c >>> 0;
 }
 return table;
})();

function crc32(bytesArr) {
 let c = 0xFFFFFFFF;
 for (let i = 0; i < bytesArr.length; i++) {
  c = CRC_TABLE[(c ^ bytesArr[i]) & 0xFF] ^ (c >>> 8);
 }
 return (c ^ 0xFFFFFFFF) >>> 0;
}

// Packs an array of { name, data: Uint8Array } into a standard PKZIP Uint8Array archive.
export function createZip(entries) {
 if (!Array.isArray(entries) || !entries.length) throw Error('At least one file is required to create a ZIP archive.');
 const encoder = new TextEncoder();
 const usedNames = new Set();
 const prepared = entries.map(entry => {
  const rawName = String(entry.name || 'image.png').replace(/[\\/]+/g, '-');
  let uniqueName = rawName;
  let counter = 2;
  while (usedNames.has(uniqueName.toLowerCase())) {
   const dot = rawName.lastIndexOf('.');
   uniqueName = dot > 0 ? `${rawName.slice(0, dot)}-${counter}${rawName.slice(dot)}` : `${rawName}-${counter}`;
   counter++;
  }
  usedNames.add(uniqueName.toLowerCase());
  const nameBytes = encoder.encode(uniqueName);
  const data = entry.data instanceof Uint8Array ? entry.data : new Uint8Array(entry.data);
  const crc = crc32(data);
  return { nameBytes, data, crc };
 });

 let localSize = 0;
 let centralSize = 0;
 for (const p of prepared) {
  localSize += 30 + p.nameBytes.length + p.data.length;
  centralSize += 46 + p.nameBytes.length;
 }

 const totalSize = localSize + centralSize + 22;
 const out = new Uint8Array(totalSize);
 const view = new DataView(out.buffer);

 // Fixed valid DOS timestamp (2026-11-04 12:00:00)
 const dosTime = (12 << 11) | (0 << 5) | 0;
 const dosDate = ((2026 - 1980) << 9) | (11 << 5) | 4;

 let localOffset = 0;
 let centralOffset = localSize;

 for (const p of prepared) {
  const nLen = p.nameBytes.length;
  const dLen = p.data.length;

  // Local file header (30 bytes)
  view.setUint32(localOffset, 0x04034b50, true);
  view.setUint16(localOffset + 4, 20, true);
  view.setUint16(localOffset + 6, 0x0800, true); // UTF-8 flag
  view.setUint16(localOffset + 8, 0, true); // Store method
  view.setUint16(localOffset + 10, dosTime, true);
  view.setUint16(localOffset + 12, dosDate, true);
  view.setUint32(localOffset + 14, p.crc, true);
  view.setUint32(localOffset + 18, dLen, true);
  view.setUint32(localOffset + 22, dLen, true);
  view.setUint16(localOffset + 26, nLen, true);
  view.setUint16(localOffset + 28, 0, true);
  out.set(p.nameBytes, localOffset + 30);
  out.set(p.data, localOffset + 30 + nLen);

  // Central directory file header (46 bytes)
  view.setUint32(centralOffset, 0x02014b50, true);
  view.setUint16(centralOffset + 4, 20, true);
  view.setUint16(centralOffset + 6, 20, true);
  view.setUint16(centralOffset + 8, 0x0800, true);
  view.setUint16(centralOffset + 10, 0, true);
  view.setUint16(centralOffset + 12, dosTime, true);
  view.setUint16(centralOffset + 14, dosDate, true);
  view.setUint32(centralOffset + 16, p.crc, true);
  view.setUint32(centralOffset + 20, dLen, true);
  view.setUint32(centralOffset + 24, dLen, true);
  view.setUint16(centralOffset + 28, nLen, true);
  view.setUint16(centralOffset + 30, 0, true);
  view.setUint16(centralOffset + 32, 0, true);
  view.setUint16(centralOffset + 34, 0, true);
  view.setUint16(centralOffset + 36, 0, true);
  view.setUint32(centralOffset + 38, 0, true);
  view.setUint32(centralOffset + 42, localOffset, true);
  out.set(p.nameBytes, centralOffset + 46);

  localOffset += 30 + nLen + dLen;
  centralOffset += 46 + nLen;
 }

 // End of central directory record (22 bytes)
 view.setUint32(centralOffset, 0x06054b50, true);
 view.setUint16(centralOffset + 4, 0, true);
 view.setUint16(centralOffset + 6, 0, true);
 view.setUint16(centralOffset + 8, prepared.length, true);
 view.setUint16(centralOffset + 10, prepared.length, true);
 view.setUint32(centralOffset + 12, centralSize, true);
 view.setUint32(centralOffset + 16, localSize, true);
 view.setUint16(centralOffset + 20, 0, true);

 return out;
}
