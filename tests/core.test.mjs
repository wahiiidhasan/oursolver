import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePages,fitSize,combineDimensions,calculateSquareBounds,formatChange,bytes} from '../public/assets/core.js';
import {PDFDocument} from 'pdf-lib';

test('page selection preserves requested order, reversal and duplicates',()=>{
  assert.deepEqual(parsePages('3,1-2,4-2,1',4),[2,0,1,3,2,1,0]);
});

test('invalid page selections are rejected',()=>{
  for(const s of ['','0','5','1,,2','-1','1.5','1-a'])assert.throws(()=>parsePages(s,4));
  assert.throws(()=>parsePages('1-2001',2001));
});

test('fit preserves ratio, exact mode allows stretch',()=>{
  assert.deepEqual(fitSize(1600,900,1200,1200),[1200,675]);
  assert.deepEqual(fitSize(1600,900,1200,1200,false),[1200,1200]);
  assert.throws(()=>fitSize(0,3,4,5));
});

test('combineDimensions calculates vertical and horizontal bounding boxes with gaps',()=>{
  const sizes=[{w:800,h:600},{w:1200,h:400},{w:1000,h:500}];
  assert.deepEqual(combineDimensions(sizes,'vertical',10),[1200,600+400+500+20]);
  assert.deepEqual(combineDimensions(sizes,'horizontal',15),[800+1200+1000+30,600]);
  assert.throws(()=>combineDimensions([]));
  assert.throws(()=>combineDimensions([{w:0,h:100}]));
});

test('calculateSquareBounds correctly centers and scales',()=>{
  const bounds=calculateSquareBounds(1600,900,0);
  assert.equal(bounds.size,1600);
  assert.equal(bounds.drawW,1600);
  assert.equal(bounds.drawH,900);
  assert.equal(bounds.x,0);
  assert.equal(bounds.y,350);
  
  const padded=calculateSquareBounds(1000,1000,0.1);
  assert.equal(padded.size,1000);
  assert.equal(padded.drawW,800);
  assert.equal(padded.drawH,800);
  assert.equal(padded.x,100);
  assert.equal(padded.y,100);
});

test('formatChange and bytes formatting',()=>{
  assert.equal(formatChange(1000,500),'(-50% smaller)');
  assert.equal(formatChange(500,600),'(+20% larger)');
  assert.equal(formatChange(500,500),'(no change)');
  assert.equal(bytes(500),'500 B');
  assert.equal(bytes(2048),'2.0 KB');
});

test('PDF copy workflow preserves page order and sizes',async()=>{
  const a=await PDFDocument.create();
  a.addPage([200,300]);
  a.addPage([400,500]);
  const source=await PDFDocument.load(await a.save());
  const out=await PDFDocument.create();
  for(const p of await out.copyPages(source,parsePages('2,1,2',2)))out.addPage(p);
  const saved=await PDFDocument.load(await out.save());
  assert.equal(saved.getPageCount(),3);
  assert.deepEqual([...saved.getPages().map(p=>p.getWidth())],[400,200,400]);
});

test('PDF image embedding creates readable output',async()=>{
  const doc=await PDFDocument.create();
  const img=await doc.embedPng(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=','base64'));
  doc.addPage([595.28,841.89]).drawImage(img,{x:24,y:24,width:100,height:100});
  assert.equal((await PDFDocument.load(await doc.save())).getPageCount(),1);
});
