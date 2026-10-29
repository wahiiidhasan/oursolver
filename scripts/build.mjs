import fs from 'node:fs';
import path from 'node:path';

const config = JSON.parse(fs.readFileSync('site.config.json'));
const origin = (process.env.SITE_URL || config.origin).replace(/\/$/, '');
if (!/^https:\/\/[a-z0-9.-]+$/i.test(origin)) throw Error('SITE_URL must be an HTTPS origin without a path.');

const tools = JSON.parse(fs.readFileSync('src/tools.json'));
const articles = JSON.parse(fs.readFileSync('src/articles.json'));
const dist = 'dist';
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });
fs.cpSync('public', dist, { recursive: true });

const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const json = o => JSON.stringify(o).replaceAll('<', '\\u003c');
let routes = [];

function page(url, title, description, body, { schema = [], noindex = false, pdf = false } = {}) {
  routes.push({ url, noindex });
  const canonical = origin + url;
  const base = [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'OurSolver', url: origin, logo: origin + '/assets/logo.svg' },
    ...schema
  ];
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${noindex ? 'noindex,follow' : 'index,follow'}"><link rel="canonical" href="${canonical}"><meta name="theme-color" content="#183d35"><meta property="og:type" content="${url.startsWith('/blog/') && url !== '/blog/' ? 'article' : 'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin}/assets/social.jpg"><meta property="og:site_name" content="OurSolver"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/assets/logo.svg" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><script type="application/ld+json">${json(base)}</script>${pdf ? '<script defer src="/assets/pdf-lib.min.js"></script>' : ''}<script type="module" src="/assets/app.js"></script></head><body><a class="skip" href="#main">Skip to content</a><header><div class="wrap nav"><a class="brand" href="/" aria-label="OurSolver home"><img src="/assets/logo.svg" width="36" height="36" alt="">OurSolver<span style="color:var(--orange)">.</span></a><nav class="nav-links" aria-label="Main navigation"><a class="nav-cta" href="/tools/">All tools <span>↗</span></a><a href="/blog/">Guides</a><a class="about-link" href="/about/">About</a><span class="pill">Free. Simple. On your device.</span></nav></div></header><main id="main">${body}</main><footer class="site-footer"><div class="wrap"><div class="footer-top"><div><a class="brand" href="/"><img src="/assets/logo.svg" alt="" width="36" height="36">OurSolver.</a><p class="micro">Small file problems. Thoughtfully solved.</p><a class="footer-email" href="mailto:support@oursolver.com">support@oursolver.com <span aria-hidden="true">↗</span></a></div><nav class="footer-links" aria-label="Footer"><a href="/tools/">Tools</a><a href="/blog/">Guides</a><a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="/help/">Help</a></nav></div><p class="footer-note">© ${config.published.slice(0, 4)} OurSolver · Your files are processed in your browser. No file uploads, accounts or subscriptions.</p></div><a class="footer-wordmark" href="/" aria-label="OurSolver home"><svg viewBox="0 0 1000 200" role="presentation" aria-hidden="true" focusable="false"><text x="500" y="164" text-anchor="middle" textLength="980" lengthAdjust="spacingAndGlyphs">oursolver</text></svg></a></footer></body></html>`;
  const target = url === '/404.html' ? '404.html' : url === '/' ? 'index.html' : url.slice(1) + 'index.html';
  fs.mkdirSync(path.dirname(path.join(dist, target)), { recursive: true });
  fs.writeFileSync(path.join(dist, target), html);
}

const cards = () => tools.map(t => `<a class="tool-card" data-category="${t.category}" href="/tools/${t.slug}/"><span class="icon" aria-hidden="true">${t.icon}</span><h3>${t.name}</h3><p>${t.description}</p><div class="card-foot"><span>${t.label}</span><span aria-hidden="true">↗</span></div></a>`).join('');
const guideCards = (n = articles.length) => articles.slice(0, n).map(a => `<a class="guide-card" href="/blog/${a.slug}/"><span class="eyebrow">${a.category} guide</span><h3>${a.title}</h3><p>${a.description}</p><span class="micro">Read guide ↗</span></a>`).join('');
const directory = (standalone = false) => `<section id="tools" class="wrap"><div class="section-head"><div><span class="eyebrow">THE EVERYDAY TOOLKIT</span>${standalone ? '<h1 style="font-size:40px;letter-spacing:-1px">Image & PDF tools</h1>' : '<h2>What would you like to solve?</h2>'}<p>Pick a tool. Get it done. Get on with your day.</p></div><label class="search-label"><span>Find a tool</span><input class="search" id="tool-search" type="search" placeholder="Search image or PDF tools…"></label></div><div class="filters" role="group" aria-label="Filter tools">${['All', 'Image', 'PDF'].map((c, i) => `<button class="chip ${i ? '' : 'active'}" data-filter="${c}" aria-pressed="${!i}">${c === 'All' ? 'All tools' : c + ' tools'}</button>`).join('')}</div><div class="grid">${cards()}</div><p id="empty" hidden>No tools match. Try “image” or “PDF”.</p></section>`;

page('/', 'OurSolver — Free Image & PDF Tools, on Your Device', 'Resize, compress and convert images. Merge, organize and create PDFs. Free browser tools that keep your files on your device.', `
<div class="wrap hero">
  <div>
    <span class="eyebrow">A LITTLE LESS FILE FRUSTRATION</span>
    <h1>Make your files<br><em>fit your life.</em></h1>
    <p class="lead">Lightning-fast, completely private, and processed right inside your browser.<br>No server uploads, no waiting in queues, and zero account sign-ups—just instant, high-quality results on your device.</p>
    <a class="button" href="#tools">Find your tool <span>↗</span></a>
    <p class="micro">No sign-up. No file uploads. Just the result you need.</p>
  </div>
  <img class="hero-art" src="/assets/hero.webp" width="900" height="600" alt="Paper documents and a landscape image brought together with a check mark" fetchpriority="high">
</div>
<div class="wrap trust">
  <span>Processed on your device</span>
  <span>Free to use</span>
  <span>No account needed</span>
  <span>Built for everyday tasks</span>
</div>
${directory()}
<section class="wrap">
  <div class="dark">
    <div>
      <span class="eyebrow" style="color:#c6d2c8">YOUR FILES. YOUR DEVICE.</span>
      <h2>A smaller task list.<br>Not another upload.</h2>
      <p>Your browser does the work. Images and documents aren't sent to our servers for processing.</p>
      <a href="/privacy/">How your privacy works ↗</a>
    </div>
    <div class="steps">
      <div>Choose a file from your device.</div>
      <div>Make the changes you need.</div>
      <div>Download. And get back to your day.</div>
    </div>
  </div>
</section>
<section class="wrap">
  <div class="section-head">
    <div><span class="eyebrow">A LITTLE KNOW-HOW</span><h2>Good answers. Less guesswork.</h2></div>
    <a href="/blog/">Explore all guides ↗</a>
  </div>
  <div class="grid">${guideCards(3)}</div>
</section>
`, { schema: [{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'OurSolver', url: origin }] });

page('/tools/', 'Free Image & PDF Tools | OurSolver', 'Choose a free image or PDF tool: resize, compress, convert, merge, organize pages or turn images into a PDF.', directory(true));

for (const t of tools) {
  const isImage = t.category === 'Image';
  let fields = '';
  const format = `<label class="field wide">Output format<select id="format"><option value="image/jpeg">JPG (white background)</option>${t.slug !== 'compress-image' ? '<option value="image/png">PNG (supports transparency)</option>' : ''}<option value="image/webp">WebP (supports transparency)</option></select></label>`;

  if (t.slug === 'resize-image') {
    fields = `
      <div class="field-row">
        <label class="field">Width (px)<input id="width" type="number" min="1" max="12000" value="1200" required></label>
        <label class="field">Height (px)<input id="height" type="number" min="1" max="12000" value="1200" required></label>
      </div>
      <label class="checkbox-field"><input id="proportions" type="checkbox" checked> <span>Fit inside dimensions (keep proportions without distortion)</span></label>
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"><span class="micro">For JPG and WebP. PNG ignores this setting.</span></label>
      ${format}
    `;
  } else if (t.slug === 'compress-image') {
    fields = `
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"><span class="micro">Controls compression level for JPG and WebP.</span></label>
      <label class="field wide"><div class="field-header"><span>Dimension Scale</span><span id="scale-value" class="field-val">100%</span></div><input id="scale" type="range" min="10" max="100" step="5" value="100"><span class="micro">Proportionally scales dimensions down to help reach tight targets.</span></label>
      <label class="field wide">Target file size (KB, optional)<input id="target" type="number" min="1" max="30000" placeholder="For example, 200"><span class="micro">Optional: OurSolver searches the best quality to reach this size.</span></label>
      ${format}
    `;
  } else if (t.slug === 'crop-rotate-image') {
    fields = `
      <div class="field wide">
        <div class="field-header"><span>Rotation & Flip</span></div>
        <div class="btn-group">
          <button type="button" id="btn-rot-left">↺ Rotate Left 90°</button>
          <button type="button" id="btn-rot-right">↻ Rotate Right 90°</button>
          <button type="button" id="btn-flip">⇄ Flip Horizontal</button>
        </div>
      </div>
      <label class="field wide">Aspect Ratio Crop<select id="aspect"><option value="original">Original Ratio (No Crop)</option><option value="1:1">1:1 Square (Social / Avatar)</option><option value="4:3">4:3 Standard</option><option value="16:9">16:9 Widescreen</option><option value="3:2">3:2 Classic Photo</option></select></label>
      <label class="field wide"><div class="field-header"><span>Straighten Horizon</span><span id="angle-value" class="field-val">0°</span></div><input id="angle" type="range" min="-45" max="45" value="0"><span class="micro">Adjust tilt from -45° to +45°.</span></label>
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"></label>
      ${format}
    `;
  } else if (t.slug === 'combine-images') {
    fields = `
      <div class="field-row">
        <label class="field">Arrangement Direction<select id="direction"><option value="vertical">Vertical (Stack Top to Bottom)</option><option value="horizontal">Horizontal (Side-by-Side)</option></select></label>
        <label class="field">Spacing Gap (px)<input id="gap" type="number" min="0" max="200" value="0"></label>
      </div>
      <label class="field wide">Background Color<select id="bg-color"><option value="transparent">Transparent (PNG / WebP)</option><option value="#ffffff">Clean White</option><option value="#000000">Solid Black</option><option value="#f5f7f1">Soft Cream</option></select></label>
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">90%</span></div><input id="quality" type="range" min="5" max="100" value="90"></label>
      ${format}
    `;
  } else if (t.slug === 'square-image') {
    fields = `
      <label class="field wide">Background Style<select id="square-bg"><option value="blur">Soft Blurred Image (Recommended)</option><option value="white">Clean White</option><option value="black">Solid Black</option><option value="transparent">Transparent (PNG / WebP)</option></select></label>
      <label class="field wide"><div class="field-header"><span>Inner Padding</span><span id="pad-value" class="field-val">0%</span></div><input id="pad" type="range" min="0" max="25" step="5" value="0"><span class="micro">Adds margins around the photo inside the square.</span></label>
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"></label>
      ${format}
    `;
  } else if (t.slug === 'photo-for-forms') {
    fields = `
      <label class="field wide">Application Preset<select id="preset"><option value="us-visa">US Visa / Passport (600 × 600 px · Max 240 KB · JPG)</option><option value="passport-2x2">Standard 2×2 Inch Photo (600 × 600 px · Max 200 KB · JPG)</option><option value="id-card">Online ID / Job Application (400 × 514 px · Max 100 KB · JPG)</option><option value="avatar">Profile Avatar (400 × 400 px · Max 50 KB · JPG)</option><option value="custom">Custom Requirements</option></select></label>
      <div class="field-row">
        <label class="field">Required Width (px)<input id="form-w" type="number" min="50" max="6000" value="600" required></label>
        <label class="field">Required Height (px)<input id="form-h" type="number" min="50" max="6000" value="600" required></label>
      </div>
      <label class="field wide">Maximum File Size (KB)<input id="form-kb" type="number" min="10" max="10000" value="240" required><span class="micro">Target upload ceiling.</span></label>
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"></label>
      ${format}
    `;
  } else if (t.slug === 'convert-image') {
    fields = `
      <label class="field wide"><div class="field-header"><span>Quality</span><span id="quality-value" class="field-val">85%</span></div><input id="quality" type="range" min="5" max="100" value="85"><span class="micro">For JPG and WebP outputs.</span></label>
      ${format}
    `;
  } else if (t.slug === 'organize-pdf') {
    fields = `
      <label class="field wide">Page selection and order<input id="pages" type="text" placeholder="For example, 3,1-2" required><span class="micro">Use commas and ranges. Example: 3,1-2 produces pages 3, 1, 2.</span></label>
    `;
  } else if (t.slug === 'images-to-pdf') {
    fields = `
      <label class="field wide">Page size<select id="paper"><option value="a4">A4 portrait</option><option value="letter">US Letter portrait</option><option value="original">Fit page to each image</option></select></label>
    `;
  }

  const imageInput = isImage || t.slug === 'images-to-pdf';
  const multi = ['merge-pdf', 'images-to-pdf', 'combine-images'].includes(t.slug);

  page(`/tools/${t.slug}/`, `${t.name} Online — Free & Private | OurSolver`, t.description, `
<div class="wrap">
  <div class="breadcrumb"><a href="/">Home</a> / <a href="/tools/">Tools</a> / ${t.name}</div>
  <div class="page-intro">
    <span class="eyebrow">${t.category} TOOL · FREE TO USE</span>
    <h1>${t.name}</h1>
    <p class="lead">${t.description}</p>
  </div>
  <div class="tool-layout">
    <form class="workbench" data-tool="${t.slug}">
      <noscript><p class="notice">Enable JavaScript to process files. No files are uploaded.</p></noscript>
      <div class="drop" id="drop">
        <span class="icon" style="margin:auto" aria-hidden="true">${t.icon}</span>
        <strong>Drop your ${imageInput ? 'images' : 'PDFs'} here</strong>
        <p class="micro">or choose from your device (or paste with Ctrl+V)</p>
        <label class="button file-button">Choose ${imageInput ? 'images' : 'PDFs'}
          <input id="files" aria-label="Choose ${imageInput ? 'images' : 'PDFs'}" type="file" accept="${imageInput ? '.jpg,.jpeg,.png,.webp' : '.pdf'}" ${multi ? 'multiple' : ''}>
        </label>
        <p class="micro">${imageInput ? 'JPG, PNG, WebP' : 'PDF'} · Up to 30 MB per file</p>
      </div>
      <ul class="file-list" id="file-list" aria-label="Selected files"></ul>
      ${isImage && t.slug !== 'images-to-pdf' ? `
      <div class="live-preview-stage" id="live-stage" hidden>
        <div class="live-stage-header">
          <div class="live-badge"><span class="live-dot"></span> Interactive Live Preview</div>
          <span class="live-dims" id="live-dims">—</span>
        </div>
        <div class="live-canvas-wrap" id="live-canvas-wrap">
          <canvas id="live-canvas"></canvas>
        </div>
        <div class="live-hint" id="live-hint">Live preview updates instantly as you adjust settings</div>
      </div>` : ''}
      <div class="fields">${fields}</div>
      <div class="actions">
        <button class="button" id="run" type="submit" disabled>Create ${isImage ? 'image' : 'PDF'} ↗</button>
        <button class="button secondary" id="clear" type="button">Clear files</button>
      </div>
      <p id="status" class="status" role="status" aria-live="polite">Choose a file to get started.</p>
      <div id="results"></div>
    </form>
    <aside class="aside">
      <h2>Three simple steps</h2>
      <ol>${t.how.map(s => `<li>${s}</li>`).join('')}</ol>
      <div class="note"><strong>Stays on your device</strong><br>File processing happens in this browser. No account or upload required.</div>
      <p class="micro">30 files maximum for multi-file tools, 100 MB combined. Image limit: 40 megapixels. PDF output: 2,000 pages.</p>
    </aside>
  </div>
  <section class="prose">
    <h2>Good to know</h2>
    <p>${t.faq}</p>
    <p>Keep your original files. Check the downloaded result before submitting or sharing it. Modern desktop browsers work best for larger documents.</p>
    <details>
      <summary>Does OurSolver store my files?</summary>
      <p>No. Files are held in browser memory during processing. Clear the files or close the page when you finish. Downloaded files remain on your device.</p>
    </details>
    <details>
      <summary>Why did processing fail?</summary>
      <p>A file may be damaged, encrypted, unsupported or too large for your device's available memory. Try a smaller file and an updated browser. <a href="/help/">Read troubleshooting tips.</a></p>
    </details>
    <h2>Related guides</h2>
    <ul>${articles.filter(a => a.tool === t.slug).map(a => `<li><a href="/blog/${a.slug}/">${a.title}</a></li>`).join('')}</ul>
  </section>
</div>
`, {
    pdf: !isImage,
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: t.name,
        description: t.description,
        url: origin + `/tools/${t.slug}/`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any modern browser',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: origin + '/' },
          { '@type': 'ListItem', position: 2, name: 'Tools', item: origin + '/tools/' },
          { '@type': 'ListItem', position: 3, name: t.name, item: origin + `/tools/${t.slug}/` }
        ]
      }
    ]
  });
}

page('/blog/', 'Image & PDF Guides — Practical File Fixes | OurSolver', 'Clear guides to image compression, resizing, file formats, PDF merging and organizing document pages.', `
<section class="wrap">
  <div class="page-intro">
    <span class="eyebrow">THE OURSOLVER BLOG</span>
    <h1>Less file frustration.<br>More know-how.</h1>
    <p class="lead">Practical explanations, useful examples, and the right tool for the job.</p>
  </div>
  <div class="grid">${guideCards()}</div>
</section>
`);

for (const a of articles) {
  const matchedTool = tools.find(t => t.slug === a.tool);
  const toolName = matchedTool ? matchedTool.name.toLowerCase() : 'image or pdf';
  page(`/blog/${a.slug}/`, `${a.title} | OurSolver`, a.description, `
<section class="wrap">
  <article class="prose">
    <div class="breadcrumb"><a href="/blog/">Guides</a> / ${a.category}</div>
    <h1>${a.title}</h1>
    <p class="article-meta">OurSolver editorial · ${esc(a.published || config.published)} · ${Math.max(2, Math.ceil(a.body.split(/\s+/).length / 200))} min read</p>
    <p class="lead">${a.description}</p>
    ${a.body}
    <div class="callout">
      <strong>Ready to try it?</strong>
      <p>Use the free ${toolName} tool. Your files stay in your browser.</p>
      <a class="button" href="/tools/${a.tool}/">Open the tool ↗</a>
    </div>
    <p class="micro">Editorial note: This guide was prepared with AI assistance and checked against the tool's implemented behavior. It does not claim independent expert review.</p>
  </article>
</section>
`, {
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: a.title,
        description: a.description,
        datePublished: a.published || config.published,
        dateModified: a.modified || a.published || config.published,
        author: { '@type': 'Organization', name: 'OurSolver' },
        publisher: { '@type': 'Organization', name: 'OurSolver', logo: { '@type': 'ImageObject', url: origin + '/assets/logo.svg' } },
        mainEntityOfPage: origin + `/blog/${a.slug}/`,
        image: origin + '/assets/social.jpg'
      }
    ]
  });
}

const info = {
  about: ['About OurSolver', 'Simple tools for the files that get in your way.', `
<p>OurSolver is an independent collection of browser-based image and PDF utilities. Its purpose is simple: help you finish a file task without creating an account or sending your document away for processing.</p>
<h2>Useful by design</h2>
<p>The collection handles everyday jobs: resizing, compressing, converting, cropping, combining, creating PDFs, and formatting photos for visas and portals. Each tool states its limits and gives you a downloadable result.</p>
<h2>A small, honest project</h2>
<p>OurSolver does not present invented employees, customer testimonials or usage statistics. The artwork is an original AI-assisted illustration, not a photograph of a real team. Tools use browser APIs and the open-source pdf-lib library.</p>
<h2>Keep the original</h2>
<p>File conversion can change quality, metadata and document features. Always keep the source and inspect the result. Visit our <a href="/help/">help page</a> for supported formats and troubleshooting.</p>
`],
  privacy: ['Privacy', 'What happens to your files when you use OurSolver.', `
<p>Effective ${config.published}.</p>
<h2>File processing</h2>
<p>The tools process selected files locally in your browser. This version does not upload file contents to a processing server. Files and generated results are held in browser memory while the page is open. Clearing the tool or closing the page releases its references; downloaded copies remain on your device. This is not a guarantee of secure memory erasure.</p>
<h2>Website requests</h2>
<p>Your browser requests site pages, scripts and images from the hosting provider. The provider may process ordinary connection information such as IP address, requested URL and browser information for delivery and security. Local file contents are not included in these requests by the tools.</p>
<h2>Cookies, analytics and accounts</h2>
<p>This release does not add advertising, analytics, accounts or application tracking cookies. It does not save selected files in local storage. Hosting-level security features may operate independently. If analytics or advertising are added later, this notice must be updated before enabling them.</p>
<h2>Your choices</h2>
<p>Use only files you are permitted to process. You can close the page at any time and remove downloaded files using your device's file manager. For tool limitations, see <a href="/help/">Help</a>.</p>
`],
  terms: ['Terms of use', 'Practical conditions for using the free tools.', `
<p>Effective ${config.published}.</p>
<h2>Your files and responsibility</h2>
<p>You retain your rights in the files you select. Use the tools only for content you have permission to process. Check outputs before relying on them, especially for official submissions, contracts or print production.</p>
<h2>Availability and limitations</h2>
<p>The tools are provided as available, without a promise that every file or browser will be supported. Processing may change quality, metadata or PDF features. Keep original copies. Nothing on this site guarantees acceptance by an external organization.</p>
<h2>No professional advice</h2>
<p>Guides explain general file workflows. They are not legal, security or professional printing advice. These terms do not remove rights that applicable law does not allow to be waived.</p>
<h2>Third-party software</h2>
<p>PDF tools use pdf-lib and its bundled dependencies under their included open-source notices. <a href="/assets/THIRD-PARTY-NOTICES.txt">Read the notices</a>.</p>
`],
  help: ['Help & troubleshooting', 'Supported files, common errors and practical fixes.', `
<h2>What can I use?</h2>
<p>Images: JPG, PNG and WebP. PDFs: ordinary, unencrypted PDF documents. Animated images, SVG, HEIC, password-protected PDFs and OCR are outside this release.</p>
<h2>My file will not open</h2>
<p>Check that the file opens in another app. A renamed extension does not convert a file. Try a fresh export from the original application. If a PDF is password-protected, create an unencrypted copy only when you have permission to do so.</p>
<h2>Processing stops or the browser freezes</h2>
<p>Close other tabs, use fewer files, and try a desktop browser. Limits are 30 MB per file, 100 MB total, 30 input files for multi-file tools, 40 megapixels per image, and 2,000 output PDF pages. Devices with less memory may fail below these limits.</p>
<h2>My compressed image misses the target</h2>
<p>Compression keeps dimensions unchanged. If the lowest quality is still too large, use <a href="/tools/resize-image/">Resize image</a> first. Do not assume a target was reached: check the reported size.</p>
<h2>A PDF lost interactive features</h2>
<p>The tools copy page content. Forms, bookmarks, attachments and signatures may not carry across. Use the original authoring software when these features must be retained.</p>
<h2>Can I work offline?</h2>
<p>After a tool and its scripts have fully loaded, file processing itself does not require an upload. Offline navigation and reloading are not guaranteed; this version does not install an offline cache.</p>
`]
};

for (const [slug, [title, description, body]] of Object.entries(info)) {
  page(`/${slug}/`, `${title} | OurSolver`, description, `
<section class="wrap">
  <article class="prose">
    <h1>${title}</h1>
    <p class="lead">${description}</p>
    ${body}
  </article>
</section>
`);
}

page('/404.html', 'Page not found | OurSolver', 'Find a working image or PDF tool on OurSolver.', `
<div class="notfound">
  <span class="eyebrow">404 · WRONG TURN, EASY FIX</span>
  <h1>This page doesn't fit.</h1>
  <p>Let's get you back to a tool that does.</p>
  <a class="button" href="/tools/">Browse all tools ↗</a>
</div>
`, { noindex: true });

fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.filter(r => !r.noindex).map(r => `<url><loc>${origin + r.url}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
fs.writeFileSync('dist/_headers', `/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'none'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'none'\n`);

console.log(`Built ${routes.length} pages for ${origin}`);
