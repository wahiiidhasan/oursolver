import { parsePages, fitSize, combineDimensions, calculateSquareBounds, formatChange, bytes } from './core.js';

const $ = s => document.querySelector(s);
const search = $('#tool-search');

function filter() {
  const q = search?.value.toLowerCase().trim() || '';
  const cat = $('.chip.active')?.dataset.filter || 'All';
  let count = 0;
  document.querySelectorAll('.tool-card').forEach(c => {
    c.hidden = !(c.textContent.toLowerCase().includes(q) && (cat === 'All' || c.dataset.category === cat));
    if (!c.hidden) count++;
  });
  if ($('#empty')) $('#empty').hidden = !!count;
}

search?.addEventListener('input', filter);

document.querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(x => {
    x.classList.remove('active');
    x.setAttribute('aria-pressed', 'false');
  });
  b.classList.add('active');
  b.setAttribute('aria-pressed', 'true');
  filter();
}));

const root = $('[data-tool]');
if (root) {
  const tool = root.dataset.tool;
  const input = $('#files');
  const list = $('#file-list');
  const status = $('#status');
  const results = $('#results');
  const run = $('#run');

  const liveStage = $('#live-stage');
  const liveCanvas = $('#live-canvas');
  const liveDims = $('#live-dims');
  const liveHint = $('#live-hint');

  let files = [];
  let urls = [];
  let busy = false;
  let generation = 0;

  // Track orientation/crop state for crop-rotate-image
  let rotateDegrees = 0;
  let flipHorizontal = false;

  const imageMode = [
    'resize-image',
    'compress-image',
    'convert-image',
    'crop-rotate-image',
    'combine-images',
    'square-image',
    'photo-for-forms',
    'images-to-pdf'
  ].includes(tool);

  const multi = ['merge-pdf', 'images-to-pdf', 'combine-images'].includes(tool);

  function clearResults() {
    urls.forEach(URL.revokeObjectURL);
    urls = [];
    results.replaceChildren();
  }

  function message(t, error = false) {
    status.textContent = t;
    status.classList.toggle('error', error);
  }

  const previewUrls = new Map();
  const bitmapCache = new Map();

  async function getBitmap(file) {
    if (bitmapCache.has(file)) return bitmapCache.get(file);
    const bmp = await decode(file);
    bitmapCache.set(file, bmp);
    return bmp;
  }

  function clearBitmapCache() {
    for (const [file, bmp] of bitmapCache) {
      if (!files.includes(file)) {
        try { bmp.close(); } catch (e) {}
        bitmapCache.delete(file);
      }
    }
  }

  const selection = document.createElement('div');
  selection.className = 'selection-summary';
  selection.hidden = true;
  selection.setAttribute('role', 'status');
  selection.setAttribute('aria-live', 'polite');
  list.before(selection);

  const dropTitle = $('#drop strong');
  const originalDropTitle = dropTitle.textContent;

  // Live interactive preview engine
  let previewTicket = 0;
  function scheduleLivePreview() {
    if (!imageMode || tool === 'images-to-pdf' || !files.length || !liveCanvas) {
      if (liveStage) liveStage.hidden = true;
      return;
    }
    if (liveStage) liveStage.hidden = false;
    previewTicket++;
    const currentTicket = previewTicket;
    requestAnimationFrame(() => renderLivePreview(currentTicket));
  }

  async function renderLivePreview(ticket) {
    if (ticket !== previewTicket || !files.length || !liveCanvas) return;
    try {
      if (tool === 'crop-rotate-image') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        const aspect = $('#aspect')?.value || 'original';
        const straightenDeg = Number($('#angle')?.value || 0);

        let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
        if (aspect === '1:1') {
          const side = Math.min(sw, sh);
          sx = Math.round((sw - side) / 2);
          sy = Math.round((sh - side) / 2);
          sw = side;
          sh = side;
        } else if (aspect === '4:3' || aspect === '16:9' || aspect === '3:2') {
          const ratio = aspect === '4:3' ? 4 / 3 : aspect === '16:9' ? 16 / 9 : 3 / 2;
          if (sw / sh > ratio) {
            const targetW = Math.round(sh * ratio);
            sx = Math.round((sw - targetW) / 2);
            sw = targetW;
          } else {
            const targetH = Math.round(sw / ratio);
            sy = Math.round((sh - targetH) / 2);
            sh = targetH;
          }
        }

        const rad = ((rotateDegrees + straightenDeg) * Math.PI) / 180;
        const sin = Math.abs(Math.sin(rad));
        const cos = Math.abs(Math.cos(rad));
        const outW = Math.round(sw * cos + sh * sin);
        const outH = Math.round(sw * sin + sh * cos);

        liveCanvas.width = outW;
        liveCanvas.height = outH;
        const ctx = liveCanvas.getContext('2d');
        ctx.clearRect(0, 0, outW, outH);
        ctx.save();
        ctx.translate(outW / 2, outH / 2);
        ctx.rotate(rad);
        if (flipHorizontal) ctx.scale(-1, 1);
        ctx.drawImage(bmp, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
        ctx.restore();

        if (liveDims) liveDims.textContent = `${outW} × ${outH} px · ${aspect === 'original' ? 'Original Ratio' : aspect}`;
        if (liveHint) liveHint.textContent = `Rotation: ${rotateDegrees}° · Tilt: ${straightenDeg}° · Flip: ${flipHorizontal ? 'Horizontal' : 'None'}`;
      } else if (tool === 'square-image') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        const bgStyle = $('#square-bg')?.value || 'blur';
        const padPct = Number($('#pad')?.value || 0) / 100;
        const bounds = calculateSquareBounds(bmp.width, bmp.height, padPct);

        liveCanvas.width = bounds.size;
        liveCanvas.height = bounds.size;
        const ctx = liveCanvas.getContext('2d');
        ctx.clearRect(0, 0, bounds.size, bounds.size);

        if (bgStyle === 'blur') {
          ctx.save();
          ctx.filter = 'blur(24px) brightness(0.85)';
          ctx.drawImage(bmp, 0, 0, bounds.size, bounds.size);
          ctx.restore();
        } else if (bgStyle === 'white') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, bounds.size, bounds.size);
        } else if (bgStyle === 'black') {
          ctx.fillStyle = '#000000';
          ctx.fillRect(0, 0, bounds.size, bounds.size);
        }

        ctx.drawImage(bmp, bounds.x, bounds.y, bounds.drawW, bounds.drawH);
        if (liveDims) liveDims.textContent = `${bounds.size} × ${bounds.size} px (1:1 Square Canvas)`;
        if (liveHint) liveHint.textContent = `Background: ${bgStyle} · Inner Padding: ${Math.round(padPct * 100)}%`;
      } else if (tool === 'combine-images') {
        const bitmaps = await Promise.all(files.map(f => getBitmap(f)));
        if (ticket !== previewTicket) return;
        const dir = $('#direction')?.value || 'vertical';
        const gap = Number($('#gap')?.value || 0);
        const bg = $('#bg-color')?.value || 'transparent';
        const match = $('#match-size') ? $('#match-size').value !== 'original' : true;

        const sizes = bitmaps.map(b => ({ w: b.width, h: b.height }));
        const [totW, totH, items] = combineDimensions(sizes, dir, gap, match);

        liveCanvas.width = totW;
        liveCanvas.height = totH;
        const ctx = liveCanvas.getContext('2d');
        ctx.clearRect(0, 0, totW, totH);

        if (bg !== 'transparent') {
          ctx.fillStyle = bg;
          ctx.fillRect(0, 0, totW, totH);
        }

        let curOffset = 0;
        bitmaps.forEach((b, idx) => {
          const item = items[idx];
          if (dir === 'vertical') {
            const x = Math.round((totW - item.w) / 2);
            ctx.drawImage(b, 0, 0, b.width, b.height, x, curOffset, item.w, item.h);
            curOffset += item.h + gap;
          } else {
            const y = Math.round((totH - item.h) / 2);
            ctx.drawImage(b, 0, 0, b.width, b.height, curOffset, y, item.w, item.h);
            curOffset += item.w + gap;
          }
        });

        if (liveDims) liveDims.textContent = `${totW} × ${totH} px · ${files.length} images (${match ? (dir === 'vertical' ? 'Uniform Width' : 'Uniform Height') : 'Original Sizes'})`;
        if (liveHint) liveHint.textContent = `Direction: ${dir} · ${match ? 'Images scaled to match width' : 'Original dimensions'} · Gap: ${gap}px`;
      } else if (tool === 'photo-for-forms') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        const reqW = Number($('#form-w')?.value || 600);
        const reqH = Number($('#form-h')?.value || 600);
        const targetRatio = reqW / reqH;
        const curRatio = bmp.width / bmp.height;

        let sw = bmp.width, sh = bmp.height, sx = 0, sy = 0;
        if (curRatio > targetRatio) {
          sw = Math.round(bmp.height * targetRatio);
          sx = Math.round((bmp.width - sw) / 2);
        } else {
          sh = Math.round(bmp.width / targetRatio);
          sy = Math.round((bmp.height - sh) / 2);
        }

        liveCanvas.width = reqW;
        liveCanvas.height = reqH;
        const ctx = liveCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, reqW, reqH);
        ctx.drawImage(bmp, sx, sy, sw, sh, 0, 0, reqW, reqH);

        if (liveDims) liveDims.textContent = `${reqW} × ${reqH} px · Form Passport/ID Frame`;
        if (liveHint) liveHint.textContent = `Max limit: ≤ ${$('#form-kb')?.value || 240} KB`;
      } else if (tool === 'resize-image') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        const [w, h] = fitSize(bmp.width, bmp.height, Number($('#width')?.value || 1200), Number($('#height')?.value || 1200), $('#proportions')?.checked);
        liveCanvas.width = w;
        liveCanvas.height = h;
        const ctx = liveCanvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0, w, h);
        if (liveDims) liveDims.textContent = `${w} × ${h} px (${$('#proportions')?.checked ? 'Proportional Fit' : 'Exact'})`;
        if (liveHint) liveHint.textContent = `Original: ${bmp.width} × ${bmp.height} px`;
      } else if (tool === 'compress-image') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        const s = Number($('#scale')?.value || 100) / 100;
        const w = Math.round(bmp.width * s);
        const h = Math.round(bmp.height * s);
        liveCanvas.width = w;
        liveCanvas.height = h;
        const ctx = liveCanvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0, w, h);
        if (liveDims) liveDims.textContent = `${w} × ${h} px · Scale: ${Math.round(s * 100)}%`;
        if (liveHint) liveHint.textContent = `Quality: ${$('#quality')?.value || 85}% · Source: ${bmp.width} × ${bmp.height} px`;
      } else if (tool === 'convert-image') {
        const bmp = await getBitmap(files[0]);
        if (ticket !== previewTicket) return;
        liveCanvas.width = bmp.width;
        liveCanvas.height = bmp.height;
        const ctx = liveCanvas.getContext('2d');
        ctx.drawImage(bmp, 0, 0);
        if (liveDims) liveDims.textContent = `${bmp.width} × ${bmp.height} px`;
        if (liveHint) liveHint.textContent = `Target Format: ${$('#format')?.value?.split('/')[1]?.toUpperCase()}`;
      }
    } catch (e) {
      console.warn('Live preview render error:', e);
    }
  }

  function render() {
    clearBitmapCache();
    for (const [file, url] of previewUrls) {
      if (!files.includes(file)) {
        URL.revokeObjectURL(url);
        previewUrls.delete(file);
      }
    }
    const count = files.length;
    root.classList.toggle('has-files', count > 0);
    selection.hidden = !count;
    selection.replaceChildren();

    if (count) {
      const check = document.createElement('span');
      check.className = 'selection-check';
      check.textContent = '✓';
      check.setAttribute('aria-hidden', 'true');
      const copy = document.createElement('div');
      const heading = document.createElement('strong');
      const detail = document.createElement('p');
      heading.textContent = `${count} file${count === 1 ? '' : 's'} selected`;
      detail.textContent = `${bytes(files.reduce((n, f) => n + f.size, 0))} total · Files stay on your device. ${multi ? 'Arrange sequence below, then inspect live preview.' : 'Adjust settings below and inspect live preview.'}`;
      copy.append(heading, detail);
      selection.append(check, copy);
    }

    dropTitle.textContent = count ? (multi ? 'Add more files if you need them' : 'Choose another file to replace this one') : originalDropTitle;
    list.replaceChildren();

    files.forEach((f, i) => {
      const row = document.createElement('li');
      row.className = 'selected-file';
      const visual = document.createElement('div');
      visual.className = 'file-preview';
      const badge = document.createElement('span');
      badge.className = 'file-type';
      badge.textContent = imageMode ? 'IMG' : 'PDF';
      visual.append(badge);

      if (imageMode) {
        if (!previewUrls.has(f)) previewUrls.set(f, URL.createObjectURL(f));
        const img = document.createElement('img');
        img.src = previewUrls.get(f);
        img.alt = '';
        img.loading = 'lazy';
        img.onerror = () => img.remove();
        visual.append(img);
      }

      const info = document.createElement('div');
      info.className = 'file-info';
      const name = document.createElement('strong');
      name.textContent = f.name;
      const detail = document.createElement('p');
      detail.textContent = `${bytes(f.size)} · ${f.name.split('.').pop().toUpperCase()}`;
      const order = document.createElement('span');
      order.className = 'file-order';
      order.textContent = multi ? `File ${i + 1} of ${count}` : 'Selected file';
      info.append(order, name, detail);

      const actions = document.createElement('div');
      actions.className = 'file-actions';
      for (const [label, delta] of [...(multi ? [['↑', -1], ['↓', 1]] : []), ['Remove', 0]]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = delta < 0 ? 'Move up' : delta > 0 ? 'Move down' : 'Remove file';
        b.setAttribute('aria-label', `${delta < 0 ? 'Move up' : delta > 0 ? 'Move down' : 'Remove'} ${f.name}`);
        b.disabled = busy || (delta < 0 && i === 0) || (delta > 0 && i === count - 1);
        b.onclick = () => {
          if (busy) return;
          if (delta) [files[i], files[i + delta]] = [files[i + delta], files[i]];
          else files.splice(i, 1);
          generation++;
          clearResults();
          render();
          message(files.length ? `${files.length} file${files.length === 1 ? '' : 's'} ready. Adjust settings and run.` : 'No files selected. Choose a file to start.');
          scheduleLivePreview();
        };
        actions.append(b);
      }
      row.append(visual, info, actions);
      list.append(row);
    });

    run.disabled = busy || !count;
    scheduleLivePreview();
  }

  async function select(incoming) {
    if (busy) return;
    generation++;
    const ticket = generation;
    clearResults();
    const a = Array.from(incoming);
    if (!a.length) return;

    const valid = imageMode ? /\.(jpe?g|png|webp)$/i : /\.pdf$/i;
    if (a.some(f => !valid.test(f.name))) {
      message(imageMode ? 'Choose JPG, PNG, or WebP files.' : 'Choose PDF files.', true);
      return;
    }

    const next = multi ? [...files, ...a] : a.slice(0, 1);
    if (next.length > 30 || next.some(f => f.size > 30 * 1024 * 1024) || next.reduce((n, f) => n + f.size, 0) > 100 * 1024 * 1024) {
      message('Use up to 30 files, 30 MB per file, and 100 MB total.', true);
      return;
    }

    files = next;
    render();
    message(`${files.length} file${files.length === 1 ? '' : 's'} ready. Live preview updated.`);

    // Auto-fill original dimensions if resizer
    if (tool === 'resize-image' && files[0]) {
      try {
        const bmp = await getBitmap(files[0]);
        if (ticket === generation) {
          $('#width').value = bmp.width;
          $('#height').value = bmp.height;
          message(`Loaded: ${bmp.width} × ${bmp.height} px. Live preview ready.`);
          scheduleLivePreview();
        }
      } catch (e) {}
    }

    if (tool === 'organize-pdf' && files[0]) {
      try {
        const doc = await PDFLib.PDFDocument.load(await files[0].arrayBuffer());
        if (ticket !== generation) return;
        $('#pages').value = `1-${doc.getPageCount()}`;
        message(`${doc.getPageCount()} pages detected. Enter the page order you want.`);
      } catch (e) {
        if (ticket === generation) message('This PDF cannot be opened. It may be encrypted or damaged.', true);
      }
    }
  }

  input.addEventListener('change', () => {
    select(input.files);
    input.value = '';
  });

  // Global Ctrl+V clipboard paste support
  window.addEventListener('paste', e => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pasted = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) {
          const ext = f.type.split('/')[1] || 'png';
          const named = new File([f], `pasted-${Date.now()}.${ext}`, { type: f.type });
          pasted.push(named);
        }
      }
    }
    if (pasted.length && imageMode) {
      e.preventDefault();
      select(pasted);
      message(`${pasted.length} image pasted from clipboard! Live preview ready.`);
    }
  });

  const drop = $('#drop');
  for (const event of ['dragenter', 'dragover']) drop.addEventListener(event, e => {
    e.preventDefault();
    drop.classList.add('drag');
  });
  for (const event of ['dragleave', 'drop']) drop.addEventListener(event, e => {
    e.preventDefault();
    drop.classList.remove('drag');
  });
  drop.addEventListener('drop', e => select(e.dataTransfer.files));

  $('#clear').onclick = () => {
    if (busy) return;
    generation++;
    files = [];
    rotateDegrees = 0;
    flipHorizontal = false;
    clearResults();
    render();
    if (liveStage) liveStage.hidden = true;
    message('Files cleared. Choose a file or paste from clipboard (Ctrl+V) to start.');
  };

  // Slider and input feedback listeners that trigger live preview updates
  const quality = $('#quality');
  quality?.addEventListener('input', () => {
    $('#quality-value').textContent = `${quality.value}%`;
    scheduleLivePreview();
  });

  const scale = $('#scale');
  scale?.addEventListener('input', () => {
    $('#scale-value').textContent = `${scale.value}%`;
    scheduleLivePreview();
  });

  const pad = $('#pad');
  pad?.addEventListener('input', () => {
    $('#pad-value').textContent = `${pad.value}%`;
    scheduleLivePreview();
  });

  const angle = $('#angle');
  angle?.addEventListener('input', () => {
    $('#angle-value').textContent = `${angle.value}°`;
    scheduleLivePreview();
  });

  // Watch all field changes for instant real-time live preview updates
  const fieldsContainer = $('.fields');
  fieldsContainer?.addEventListener('input', scheduleLivePreview);
  fieldsContainer?.addEventListener('change', scheduleLivePreview);

  // Crop & rotate live interaction buttons
  $('#btn-rot-left')?.addEventListener('click', () => {
    rotateDegrees = (rotateDegrees - 90 + 360) % 360;
    scheduleLivePreview();
    message(`Rotated left 90° (Total: ${rotateDegrees}°).`);
  });

  $('#btn-rot-right')?.addEventListener('click', () => {
    rotateDegrees = (rotateDegrees + 90) % 360;
    scheduleLivePreview();
    message(`Rotated right 90° (Total: ${rotateDegrees}°).`);
  });

  $('#btn-flip')?.addEventListener('click', () => {
    flipHorizontal = !flipHorizontal;
    scheduleLivePreview();
    message(`Horizontal flip: ${flipHorizontal ? 'ON' : 'OFF'}.`);
  });

  // Preset selector for photo-for-forms
  const preset = $('#preset');
  preset?.addEventListener('change', () => {
    const val = preset.value;
    if (val === 'us-visa') {
      $('#form-w').value = 600;
      $('#form-h').value = 600;
      $('#form-kb').value = 240;
    } else if (val === 'passport-2x2') {
      $('#form-w').value = 600;
      $('#form-h').value = 600;
      $('#form-kb').value = 200;
    } else if (val === 'id-card') {
      $('#form-w').value = 400;
      $('#form-h').value = 514;
      $('#form-kb').value = 100;
    } else if (val === 'avatar') {
      $('#form-w').value = 400;
      $('#form-h').value = 400;
      $('#form-kb').value = 50;
    }
    scheduleLivePreview();
  });

  async function decode(file) {
    const bitmap = await createImageBitmap(file);
    if (bitmap.width * bitmap.height > 40000000) {
      bitmap.close();
      throw Error('This image exceeds 40 megapixels. Choose a smaller image.');
    }
    return bitmap;
  }

  function canvasBlob(c, type, q) {
    return new Promise((resolve, reject) => c.toBlob(b => b && b.type === type ? resolve(b) : reject(Error('Your browser cannot export this format. Try PNG or JPG.')), type, q));
  }

  function download(blob, name, detail, { preview = false, origW = 0, origH = 0, origSize = 0, outW = 0, outH = 0, checklist = [] } = {}) {
    const url = URL.createObjectURL(blob);
    urls.push(url);
    const box = document.createElement('div');
    box.className = 'result';

    if (preview) {
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Processed image preview';
      box.append(img);
    }

    if (origW && origH && origSize && outW && outH) {
      const comp = document.createElement('div');
      comp.className = 'comp-box';
      const changeText = formatChange(origSize, blob.size);
      comp.innerHTML = `
        <div class="comp-col">
          <span class="micro">ORIGINAL</span>
          <strong>${origW} × ${origH} px</strong>
          <p>${bytes(origSize)}</p>
        </div>
        <div class="comp-arrow" aria-hidden="true">→</div>
        <div class="comp-col">
          <span class="micro">RESULT</span>
          <strong>${outW} × ${outH} px</strong>
          <p>${bytes(blob.size)} <span class="comp-badge">${changeText}</span></p>
        </div>
      `;
      box.append(comp);
    } else {
      const p = document.createElement('p');
      p.textContent = detail;
      box.append(p);
    }

    if (checklist && checklist.length) {
      const ul = document.createElement('ul');
      ul.className = 'checklist';
      checklist.forEach(item => {
        const li = document.createElement('li');
        li.className = `check-item ${item.pass ? 'check-pass' : 'check-fail'}`;
        li.innerHTML = `<span>${item.pass ? '✓' : '✗'}</span> <span>${item.label}</span>`;
        ul.append(li);
      });
      box.append(ul);
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.className = 'button';
    a.textContent = `Download ${name}`;
    box.append(a);

    // Inter-tool handoff: "Send to another tool"
    if (imageMode && tool !== 'images-to-pdf') {
      const transfer = document.createElement('div');
      transfer.className = 'transfer-card';
      const tTitle = document.createElement('span');
      tTitle.className = 'transfer-title';
      tTitle.textContent = 'Next step with this file:';
      transfer.append(tTitle);

      const btns = document.createElement('div');
      btns.className = 'transfer-btns';
      const targets = [
        { slug: 'compress-image', name: 'Send to Compress ↗' },
        { slug: 'resize-image', name: 'Send to Resize ↗' },
        { slug: 'crop-rotate-image', name: 'Send to Crop & Rotate ↗' },
        { slug: 'square-image', name: 'Make Square ↗' },
        { slug: 'convert-image', name: 'Convert Format ↗' }
      ].filter(t => t.slug !== tool);

      targets.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'transfer-btn';
        btn.textContent = t.name;
        btn.onclick = () => {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              sessionStorage.setItem('oursolver_transfer', JSON.stringify({
                data: reader.result,
                name: name,
                type: blob.type
              }));
              window.location.href = `/tools/${t.slug}/`;
            } catch (err) {
              window.location.href = `/tools/${t.slug}/`;
            }
          };
          reader.readAsDataURL(blob);
        };
        btns.append(btn);
      });
      transfer.append(btns);
      box.append(transfer);
    }

    results.append(box);
  }

  // Check for incoming transferred file from previous tool
  try {
    const pending = sessionStorage.getItem('oursolver_transfer');
    if (pending && imageMode && tool !== 'images-to-pdf') {
      const { data, name, type } = JSON.parse(pending);
      sessionStorage.removeItem('oursolver_transfer');
      fetch(data).then(res => res.blob()).then(b => {
        const transferredFile = new File([b], name, { type });
        select([transferredFile]);
        message('Image loaded from previous tool. Adjust settings and run!');
      });
    }
  } catch (e) {
    sessionStorage.removeItem('oursolver_transfer');
  }

  root.addEventListener('submit', async e => {
    e.preventDefault();
    if (busy || !files.length) return;
    busy = true;
    clearResults();
    render();
    root.querySelectorAll('input,select,#clear,button[type=button]').forEach(el => el.disabled = true);
    message('Processing high-resolution output…');

    try {
      if (['resize-image', 'compress-image', 'convert-image', 'crop-rotate-image', 'square-image', 'photo-for-forms'].includes(tool)) {
        const file = files[0];
        const img = await decode(file);
        const origW = img.width;
        const origH = img.height;
        const origSize = file.size;
        let c = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        const type = $('#format')?.value || 'image/jpeg';
        const qVal = Number(quality?.value || 85) / 100;
        let note = '';
        let checklist = [];

        if (tool === 'resize-image') {
          [w, h] = fitSize(img.width, img.height, Number($('#width').value), Number($('#height').value), $('#proportions').checked);
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          img.close();
        } else if (tool === 'compress-image') {
          if ($('#scale')) {
            const s = Number($('#scale').value) / 100;
            w = Math.max(1, Math.round(w * s));
            h = Math.max(1, Math.round(h * s));
          }
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          img.close();
        } else if (tool === 'crop-rotate-image') {
          const aspect = $('#aspect')?.value || 'original';
          const straightenDeg = Number($('#angle')?.value || 0);

          let sx = 0, sy = 0, sw = img.width, sh = img.height;
          if (aspect === '1:1') {
            const side = Math.min(sw, sh);
            sx = Math.round((sw - side) / 2);
            sy = Math.round((sh - side) / 2);
            sw = side;
            sh = side;
          } else if (aspect === '4:3' || aspect === '16:9' || aspect === '3:2') {
            const ratio = aspect === '4:3' ? 4 / 3 : aspect === '16:9' ? 16 / 9 : 3 / 2;
            if (sw / sh > ratio) {
              const targetW = Math.round(sh * ratio);
              sx = Math.round((sw - targetW) / 2);
              sw = targetW;
            } else {
              const targetH = Math.round(sw / ratio);
              sy = Math.round((sh - targetH) / 2);
              sh = targetH;
            }
          }

          const rad = ((rotateDegrees + straightenDeg) * Math.PI) / 180;
          const sin = Math.abs(Math.sin(rad));
          const cos = Math.abs(Math.cos(rad));
          w = Math.round(sw * cos + sh * sin);
          h = Math.round(sw * sin + sh * cos);

          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.translate(w / 2, h / 2);
          ctx.rotate(rad);
          if (flipHorizontal) ctx.scale(-1, 1);
          ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
          img.close();
        } else if (tool === 'square-image') {
          const bgStyle = $('#square-bg')?.value || 'blur';
          const padPct = Number($('#pad')?.value || 0) / 100;
          const bounds = calculateSquareBounds(img.width, img.height, padPct);
          w = bounds.size;
          h = bounds.size;
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');

          if (bgStyle === 'blur') {
            ctx.save();
            ctx.filter = 'blur(28px) brightness(0.85)';
            ctx.drawImage(img, 0, 0, w, h);
            ctx.restore();
          } else if (bgStyle === 'white' || type === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          } else if (bgStyle === 'black') {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, w, h);
          }

          ctx.drawImage(img, bounds.x, bounds.y, bounds.drawW, bounds.drawH);
          img.close();
        } else if (tool === 'photo-for-forms') {
          const reqW = Number($('#form-w').value);
          const reqH = Number($('#form-h').value);
          const maxKB = Number($('#form-kb').value);

          const targetRatio = reqW / reqH;
          const curRatio = img.width / img.height;
          let sx = 0, sy = 0, sw = img.width, sh = img.height;

          if (curRatio > targetRatio) {
            sw = Math.round(img.height * targetRatio);
            sx = Math.round((img.width - sw) / 2);
          } else {
            sh = Math.round(img.width / targetRatio);
            sy = Math.round((img.height - sh) / 2);
          }

          w = reqW;
          h = reqH;
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
          img.close();
        } else if (tool === 'convert-image') {
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          if (type === 'image/jpeg') {
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
          }
          ctx.drawImage(img, 0, 0, w, h);
          img.close();
        }

        if (w * h > 40000000 || w > 12000 || h > 12000) {
          throw Error('Output dimensions must be at most 40 megapixels and 12,000 pixels per side.');
        }

        let blob = await canvasBlob(c, type, qVal);
        let targetBytes = 0;
        if (tool === 'compress-image') {
          targetBytes = Number($('#target')?.value || 0) * 1024;
        } else if (tool === 'photo-for-forms') {
          targetBytes = Number($('#form-kb')?.value || 0) * 1024;
        }

        if (targetBytes && blob.size > targetBytes) {
          let low = 0.05, high = qVal;
          let best = await canvasBlob(c, type, low);
          for (let i = 0; i < 9; i++) {
            const mid = (low + high) / 2;
            const b = await canvasBlob(c, type, mid);
            if (b.size <= targetBytes) {
              best = b;
              low = mid;
            } else {
              high = mid;
            }
          }
          blob = best;
        }

        if (tool === 'photo-for-forms') {
          const reqW = Number($('#form-w').value);
          const reqH = Number($('#form-h').value);
          const maxKB = Number($('#form-kb').value);
          checklist = [
            { label: `Required Dimensions: ${reqW} × ${reqH} px`, pass: w === reqW && h === reqH },
            { label: `File Size: ${bytes(blob.size)} (Target: ≤ ${maxKB} KB)`, pass: blob.size <= maxKB * 1024 },
            { label: `Output Format: ${type.split('/')[1].replace('jpeg', 'jpg').toUpperCase()}`, pass: true }
          ];
        }

        if (targetBytes) {
          note = blob.size <= targetBytes ? ' Target reached.' : ' Target not reached; scale down dimensions and try again.';
        }

        const ext = type.split('/')[1].replace('jpeg', 'jpg');
        download(blob, `${file.name.replace(/\.[^.]+$/, '')}-oursolver.${ext}`, `${w} × ${h} px · ${bytes(origSize)} → ${bytes(blob.size)}.${note}`, {
          preview: true,
          origW,
          origH,
          origSize,
          outW: w,
          outH: h,
          checklist
        });
      } else if (tool === 'combine-images') {
        const bitmaps = await Promise.all(files.map(f => decode(f)));
        const dir = $('#direction')?.value || 'vertical';
        const gap = Number($('#gap')?.value || 0);
        const bg = $('#bg-color')?.value || 'transparent';
        const match = $('#match-size') ? $('#match-size').value !== 'original' : true;
        const type = $('#format')?.value || 'image/png';
        const qVal = Number(quality?.value || 90) / 100;

        const sizes = bitmaps.map(b => ({ w: b.width, h: b.height }));
        const [totW, totH, items] = combineDimensions(sizes, dir, gap, match);

        if (totW * totH > 40000000 || totW > 16000 || totH > 16000) {
          bitmaps.forEach(b => b.close());
          throw Error('Combined image exceeds 40 megapixels or 16,000 pixels. Use fewer or smaller images.');
        }

        const c = document.createElement('canvas');
        c.width = totW;
        c.height = totH;
        const ctx = c.getContext('2d');

        if (bg !== 'transparent' || type === 'image/jpeg') {
          ctx.fillStyle = bg === 'transparent' ? '#ffffff' : bg;
          ctx.fillRect(0, 0, totW, totH);
        }

        let curOffset = 0;
        bitmaps.forEach((b, idx) => {
          const item = items[idx];
          if (dir === 'vertical') {
            const x = Math.round((totW - item.w) / 2);
            ctx.drawImage(b, 0, 0, b.width, b.height, x, curOffset, item.w, item.h);
            curOffset += item.h + gap;
          } else {
            const y = Math.round((totH - item.h) / 2);
            ctx.drawImage(b, 0, 0, b.width, b.height, curOffset, y, item.w, item.h);
            curOffset += item.w + gap;
          }
          b.close();
        });

        const blob = await canvasBlob(c, type, qVal);
        const ext = type.split('/')[1].replace('jpeg', 'jpg');
        const totOrigSize = files.reduce((sum, f) => sum + f.size, 0);

        download(blob, `combined-oursolver.${ext}`, `${totW} × ${totH} px · ${files.length} images joined · ${bytes(blob.size)}`, {
          preview: true,
          origW: 0,
          origH: 0,
          origSize: totOrigSize,
          outW: totW,
          outH: totH
        });
      } else {
        const out = await PDFLib.PDFDocument.create();

        if (tool === 'images-to-pdf') {
          for (const file of files) {
            const image = await decode(file);
            const c = document.createElement('canvas');
            c.width = image.width;
            c.height = image.height;
            const ctx = c.getContext('2d');
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, c.width, c.height);
            ctx.drawImage(image, 0, 0);
            image.close();
            const b = await canvasBlob(c, 'image/jpeg', 0.92);
            const embedded = await out.embedJpg(await b.arrayBuffer());
            const size = $('#paper').value;
            const dims = size === 'a4' ? [595.28, 841.89] : size === 'letter' ? [612, 792] : [c.width * 0.75, c.height * 0.75];
            const margin = size === 'original' ? 0 : 24;
            const scale = Math.min((dims[0] - margin * 2) / embedded.width, (dims[1] - margin * 2) / embedded.height);
            const page = out.addPage(dims);
            page.drawImage(embedded, {
              x: (dims[0] - embedded.width * scale) / 2,
              y: (dims[1] - embedded.height * scale) / 2,
              width: embedded.width * scale,
              height: embedded.height * scale
            });
          }
        } else {
          if (tool === 'merge-pdf' && files.length < 2) throw Error('Choose at least two PDFs to merge.');
          for (const f of files) {
            let source;
            try {
              source = await PDFLib.PDFDocument.load(await f.arrayBuffer());
            } catch {
              throw Error(`Cannot open ${f.name}. Encrypted or damaged PDFs are not supported.`);
            }
            const indices = tool === 'organize-pdf' ? parsePages($('#pages').value, source.getPageCount()) : source.getPageIndices();
            if (out.getPageCount() + indices.length > 2000) throw Error('The output is limited to 2,000 pages.');
            const pages = await out.copyPages(source, indices);
            pages.forEach(p => out.addPage(p));
          }
        }

        if (!out.getPageCount()) throw Error('The output needs at least one page.');
        out.setProducer('OurSolver / pdf-lib');
        const blob = new Blob([await out.save()], { type: 'application/pdf' });
        download(blob, `oursolver-${tool}.pdf`, `${out.getPageCount()} pages · ${bytes(blob.size)}. Open the downloaded PDF to check it before sharing.`);
      }

      message('Done. Your download is ready.');
    } catch (error) {
      message(error.message || 'Processing failed. Try a smaller file or a different browser.', true);
    } finally {
      busy = false;
      root.querySelectorAll('input,select,#clear,button[type=button]').forEach(el => el.disabled = false);
      render();
    }
  });

  window.addEventListener('pagehide', () => {
    urls.forEach(URL.revokeObjectURL);
    previewUrls.forEach(URL.revokeObjectURL);
    previewUrls.clear();
    for (const bmp of bitmapCache.values()) {
      try { bmp.close(); } catch (e) {}
    }
    bitmapCache.clear();
  });

  window.addEventListener('pageshow', e => {
    if (e.persisted) {
      clearResults();
      render();
    }
  });
}
