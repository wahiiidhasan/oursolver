# OurSolver — Image and PDF Tools

A complete static website with 10 browser-local file tools, 10 guides, original logo and artwork, and 28 generated HTML pages. No API keys, database, subscription or processing server is needed. Images are processed using browser HTML5 canvas; PDFs use the bundled MIT-licensed pdf-lib 1.17.1.

## Start here

1. Read `DEPLOYMENT.md` for private GitHub → Cloudflare Pages setup.
2. Upload the **contents of this folder**, with `package.json` at your repository root. Do not upload the ZIP itself.
3. Use build command `npm run build` and output directory `dist`.
4. The canonical site address is `https://oursolver.com` in `site.config.json` (or set `SITE_URL` during build).

## Local commands

Use Node.js 18 or later (Node 20+ recommended):

```sh
npm test
npm run build
npm run check
```

Serve the generated folder with a local HTTP server, for example `python3 -m http.server 8080 --directory dist`. Open `http://localhost:8080`. Do not double-click `index.html`: absolute links and JavaScript modules expect HTTP hosting.

## Included tools (10 Tools)

### Image Tools (7 Tools)
- **Resize Image:** Change image dimensions with side-by-side inputs, proportional fit or exact dimensions.
- **Compress Image:** Reduce JPG/WebP file size with quality slider up, dimension scale down, and target KB optimizer.
- **Crop & Rotate:** Trim to standard ratios (1:1, 4:3, 16:9), rotate in 90° steps, flip horizontally, and straighten tilted horizons.
- **Combine Images:** Join screenshots or photos vertically (great for long threads/receipts) or horizontally with custom gap and background color.
- **Make Square (No Crop):** Fit any landscape or portrait photo inside a 1:1 square canvas using soft blurred background or solid color.
- **Photo Size for Forms:** Crop and compress portrait photos to exact passport, visa (US Visa 600×600 px, max 240 KB), and ID portal specifications with a live checklist.
- **Convert Image:** Convert among JPG, PNG, and WebP with instant live previews.

### PDF Tools (3 Tools)
- **Merge PDF:** Combine multiple PDF documents with intuitive file ordering.
- **Organize PDF:** Extract, reorder, reverse, and duplicate PDF pages with ranges such as `3,1-2,5`.
- **Images to PDF:** Convert multiple images into a PDF with A4, US Letter, or original image-sized pages.

## Workflow & UX Enhancements

- **Global Clipboard Paste (Ctrl+V):** Paste an image or screenshot anywhere on the page to immediately load it into the workbench.
- **Inter-Tool Transfer ("Send to..."):** Pipe processed images directly to another tool (e.g. Crop → Resize → Compress) in one click via browser memory without downloading and re-selecting.
- **Before / After Stats Card:** Compare original dimensions and byte size with the processed result, including exact reduction percentages.
- **Intuitive Field Hierarchy:** Quality sliders are placed prominently at the top, dimension scale below, target KB before output, and output format at the very end.
- **Clean Responsive Form Grid:** Width and height are positioned side-by-side in their own row, eliminating any zigzag alignment.
- **High-Focus Navbar CTA:** The "All tools" button in the header features a primary button style that draws visitor focus.

## Edit the site

- `scripts/build.mjs`: HTML layouts, metadata, supporting pages, sitemap, and headers.
- `src/tools.json`: tool descriptions, labels, icons, steps, and FAQs.
- `src/articles.json`: blog posts and practical guides.
- `public/assets/app.js`: user interface, drag-and-drop, clipboard paste, inter-tool handoff, and file-processing workflows.
- `public/assets/core.js`: reusable sizing, bounding box calculations, change formatting, and page-selection logic.
- `public/assets/style.css`: responsive stylesheet and UI components.
- `site.config.json`: production origin, brand, and publication date.
- `dist/`: production-ready pre-built static files; rebuild after source edits.

## Ownership and third-party notices

You may edit and host the delivered OurSolver project. Preserve `public/assets/THIRD-PARTY-NOTICES.txt` with the bundled pdf-lib library. The package is marked private and UNLICENSED.
