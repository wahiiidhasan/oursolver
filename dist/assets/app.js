import {parsePages,fitSize,bytes} from './core.js';
const $=s=>document.querySelector(s);
const search=$('#tool-search');
function filter(){const q=search?.value.toLowerCase().trim()||'';const cat=$('.chip.active')?.dataset.filter||'All';let count=0;document.querySelectorAll('.tool-card').forEach(c=>{c.hidden=!(c.textContent.toLowerCase().includes(q)&&(cat==='All'||c.dataset.category===cat));if(!c.hidden)count++;});if($('#empty'))$('#empty').hidden=!!count;}
search?.addEventListener('input',filter);
document.querySelectorAll('.chip').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.chip').forEach(x=>{x.classList.remove('active');x.setAttribute('aria-pressed','false');});b.classList.add('active');b.setAttribute('aria-pressed','true');filter();}));
const root=$('[data-tool]');
if(root){
 const tool=root.dataset.tool, input=$('#files'), list=$('#file-list'), status=$('#status'), results=$('#results'), run=$('#run');
 let files=[],urls=[],busy=false,generation=0;
 const imageMode=['resize-image','compress-image','convert-image','images-to-pdf'].includes(tool);
 function clearResults(){urls.forEach(URL.revokeObjectURL);urls=[];results.replaceChildren();}
 function message(t,error=false){status.textContent=t;status.classList.toggle('error',error);}
 const previewUrls=new Map();
 const selection=document.createElement('div');selection.className='selection-summary';selection.hidden=true;selection.setAttribute('role','status');selection.setAttribute('aria-live','polite');list.before(selection);
 const dropTitle=$('#drop strong'),originalDropTitle=dropTitle.textContent;
 function render(){
  for(const [file,url] of previewUrls){if(!files.includes(file)){URL.revokeObjectURL(url);previewUrls.delete(file);}}
  const count=files.length,multi=['merge-pdf','images-to-pdf'].includes(tool);
  root.classList.toggle('has-files',count>0);selection.hidden=!count;
  selection.replaceChildren();
  if(count){const check=document.createElement('span');check.className='selection-check';check.textContent='✓';check.setAttribute('aria-hidden','true');
   const copy=document.createElement('div'),heading=document.createElement('strong'),detail=document.createElement('p');
   heading.textContent=`${count} file${count===1?'':'s'} selected`;
   detail.textContent=`${bytes(files.reduce((n,f)=>n+f.size,0))} total · Files stay on your device. ${multi?'Arrange them below, then choose your settings.':'Choose your settings below to continue.'}`;
   copy.append(heading,detail);selection.append(check,copy);
  }
  dropTitle.textContent=count?(multi?'Add more files if you need them':'Choose another file to replace this one'):originalDropTitle;
  list.replaceChildren();files.forEach((f,i)=>{
   const row=document.createElement('li');row.className='selected-file';
   const visual=document.createElement('div');visual.className='file-preview';
   const badge=document.createElement('span');badge.className='file-type';badge.textContent=imageMode?'IMG':'PDF';visual.append(badge);
   if(imageMode){if(!previewUrls.has(f))previewUrls.set(f,URL.createObjectURL(f));const img=document.createElement('img');img.src=previewUrls.get(f);img.alt='';img.loading='lazy';img.onerror=()=>img.remove();visual.append(img);}
   const info=document.createElement('div');info.className='file-info';const name=document.createElement('strong');name.textContent=f.name;
   const detail=document.createElement('p');detail.textContent=`${bytes(f.size)} · ${f.name.split('.').pop().toUpperCase()}`;
   const order=document.createElement('span');order.className='file-order';order.textContent=multi?`File ${i+1} of ${count}`:'Selected file';info.append(order,name,detail);
   const actions=document.createElement('div');actions.className='file-actions';
   for(const [label,delta]of [...(multi?[['↑',-1],['↓',1]]:[]),['Remove',0]]){
    const b=document.createElement('button');b.type='button';b.textContent=label;b.title=delta<0?'Move up':delta>0?'Move down':'Remove file';b.setAttribute('aria-label',`${delta<0?'Move up':delta>0?'Move down':'Remove'} ${f.name}`);
    b.disabled=busy||(delta<0&&i===0)||(delta>0&&i===count-1);
    b.onclick=()=>{if(busy)return;if(delta)[files[i],files[i+delta]]=[files[i+delta],files[i]];else files.splice(i,1);generation++;clearResults();render();message(files.length?`${files.length} file${files.length===1?'':'s'} selected. Choose your settings and create the result.`:'No files selected. Choose a file to start.');};actions.append(b);
   }
   row.append(visual,info,actions);list.append(row);
  });run.disabled=busy||!count;
 }

 async function select(incoming){if(busy)return;generation++;const ticket=generation;clearResults();const a=Array.from(incoming);if(!a.length)return;const valid=imageMode?/\.(jpe?g|png|webp)$/i:/\.pdf$/i;
 if(a.some(f=>!valid.test(f.name))){message(imageMode?'Choose JPG, PNG or WebP files.':'Choose PDF files.',true);return;}
 const multi=['merge-pdf','images-to-pdf'].includes(tool);const next=multi?[...files,...a]:a.slice(0,1);
 if(next.length>30||next.some(f=>f.size>30*1024*1024)||next.reduce((n,f)=>n+f.size,0)>100*1024*1024){message('Use up to 30 files, 30 MB per file, and 100 MB total.',true);return;}
 files=next;render();message(`${files.length} file${files.length===1?'':'s'} ready. Files stay on this device.`);
 if(tool==='organize-pdf'&&files[0]){try{const doc=await PDFLib.PDFDocument.load(await files[0].arrayBuffer());if(ticket!==generation)return;$('#pages').value=`1-${doc.getPageCount()}`;message(`${doc.getPageCount()} pages. Enter the page order you want.`);}catch(e){if(ticket===generation)message('This PDF cannot be opened. It may be encrypted or damaged.',true);}}
 }
 input.addEventListener('change',()=>{select(input.files);input.value='';});
 const drop=$('#drop');for(const event of ['dragenter','dragover'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.add('drag');});for(const event of ['dragleave','drop'])drop.addEventListener(event,e=>{e.preventDefault();drop.classList.remove('drag');});drop.addEventListener('drop',e=>select(e.dataTransfer.files));
 $('#clear').onclick=()=>{if(busy)return;generation++;files=[];clearResults();render();message('Files cleared. Choose a file to start again.');};
 const quality=$('#quality');quality?.addEventListener('input',()=>$('#quality-value').textContent=`${quality.value}%`);
 async function decode(file){const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>40000000){bitmap.close();throw Error('This image exceeds 40 megapixels. Choose a smaller image.');}return bitmap;}
 function canvasBlob(c,type,q){return new Promise((resolve,reject)=>c.toBlob(b=>b&&b.type===type?resolve(b):reject(Error('Your browser cannot export this format. Try PNG or JPG.')),type,q));}
 function download(blob,name,detail,preview=false){const url=URL.createObjectURL(blob);urls.push(url);const box=document.createElement('div');box.className='result';if(preview){const img=document.createElement('img');img.src=url;img.alt='Processed image preview';box.append(img);}const p=document.createElement('p');p.textContent=detail;box.append(p);const a=document.createElement('a');a.href=url;a.download=name;a.className='button';a.textContent=`Download ${name}`;box.append(a);results.append(box);}
 root.addEventListener('submit',async e=>{e.preventDefault();if(busy||!files.length)return;busy=true;clearResults();render();root.querySelectorAll('input,select,#clear').forEach(el=>el.disabled=true);message('Processing on your device…');
 try{
 if(['resize-image','compress-image','convert-image'].includes(tool)){
 const file=files[0],img=await decode(file),c=document.createElement('canvas');let w=img.width,h=img.height;
 if(tool==='resize-image')[w,h]=fitSize(w,h,Number($('#width').value),Number($('#height').value),$('#proportions').checked);
 if(w*h>40000000||w>12000||h>12000){img.close();throw Error('Output must be at most 40 megapixels and 12,000 pixels per side.');}
 c.width=w;c.height=h;const ctx=c.getContext('2d');const type=$('#format').value;if(type==='image/jpeg'){ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);}ctx.drawImage(img,0,0,w,h);img.close();
 let blob=await canvasBlob(c,type,Number(quality?.value||85)/100);let note='';const target=Number($('#target')?.value||0)*1024;
 if(target&&blob.size>target){let low=.05,high=Number(quality?.value||85)/100;let best=await canvasBlob(c,type,low);for(let i=0;i<9;i++){const mid=(low+high)/2,b=await canvasBlob(c,type,mid);if(b.size<=target){best=b;low=mid;}else high=mid;}blob=best;}
 if(target)note=blob.size<=target?' Target reached.':' Target not reached; resize the image smaller and try again.';
 const ext=type.split('/')[1].replace('jpeg','jpg');download(blob,`${file.name.replace(/\.[^.]+$/,'')}-oursolver.${ext}`,`${w} × ${h} px · ${bytes(file.size)} → ${bytes(blob.size)}.${note}`,true);
 }else{
 const out=await PDFLib.PDFDocument.create();
 if(tool==='images-to-pdf'){
 for(const file of files){const image=await decode(file),c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(image,0,0);image.close();const b=await canvasBlob(c,'image/jpeg',.92);const embedded=await out.embedJpg(await b.arrayBuffer());const size=$('#paper').value;const dims=size==='a4'?[595.28,841.89]:size==='letter'?[612,792]:[c.width*.75,c.height*.75];const margin=size==='original'?0:24;const scale=Math.min((dims[0]-margin*2)/embedded.width,(dims[1]-margin*2)/embedded.height);const page=out.addPage(dims);page.drawImage(embedded,{x:(dims[0]-embedded.width*scale)/2,y:(dims[1]-embedded.height*scale)/2,width:embedded.width*scale,height:embedded.height*scale});}
 }else{
 if(tool==='merge-pdf'&&files.length<2)throw Error('Choose at least two PDFs to merge.');
 for(const f of files){let source;try{source=await PDFLib.PDFDocument.load(await f.arrayBuffer());}catch{throw Error(`Cannot open ${f.name}. Encrypted or damaged PDFs are not supported.`);}const indices=tool==='organize-pdf'?parsePages($('#pages').value,source.getPageCount()):source.getPageIndices();if(out.getPageCount()+indices.length>2000)throw Error('The output is limited to 2,000 pages.');const pages=await out.copyPages(source,indices);pages.forEach(p=>out.addPage(p));}
 }
 if(!out.getPageCount())throw Error('The output needs at least one page.');
 out.setProducer('OurSolver / pdf-lib');const blob=new Blob([await out.save()],{type:'application/pdf'});download(blob,`oursolver-${tool}.pdf`,`${out.getPageCount()} pages · ${bytes(blob.size)}. Open the downloaded PDF to check it before sharing.`);
 }
 message('Done. Your download is ready.');
 }catch(error){message(error.message||'Processing failed. Try a smaller file or a different browser.',true);}finally{busy=false;root.querySelectorAll('input,select,#clear').forEach(el=>el.disabled=false);render();}
 });
 window.addEventListener('pagehide',()=>{urls.forEach(URL.revokeObjectURL);previewUrls.forEach(URL.revokeObjectURL);previewUrls.clear();});
 window.addEventListener('pageshow',e=>{if(e.persisted){clearResults();render();}});
}
