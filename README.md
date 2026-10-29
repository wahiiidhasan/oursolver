# OurSolver — image and PDF tools

A complete static website with six browser-local file tools, six guides, original logo and artwork, and 20 generated HTML pages. No API keys, database, subscription or processing server is needed. Images are processed using browser canvas; PDFs use the bundled MIT-licensed pdf-lib 1.17.1.

## Start here

1. Read `DEPLOYMENT.md` for private GitHub → Cloudflare Pages setup.
2. Upload the **contents of this folder**, with `package.json` at your repository root. Do not upload the ZIP itself.
3. Use build command `npm run build` and output directory `dist`.
4. The canonical site address is `https://www.oursolver.com` in `site.config.json`.

## Local commands

Use Node.js 22 or later:

```sh
npm ci
npm test
npm run build
npm run check
```

Serve the generated folder with a local HTTP server, for example `python -m http.server 8080 --directory dist`. Open `http://localhost:8080`. Do not double-click index.html: absolute links and JavaScript modules expect HTTP hosting.

## Included tools

- Resize JPG, PNG and WebP, with proportional fit or exact dimensions.
- Compress JPG/WebP with a quality control and optional target size.
- Convert among JPG, PNG and WebP, with result previews.
- Merge PDFs, with file ordering.
- Extract, reorder and duplicate PDF pages with ranges such as `3,1-2`.
- Convert images to a PDF with A4, Letter or image-sized pages.

Image editing takes one file at a time. Merge PDF and images-to-PDF accept multiple files. Compression reports unmet targets rather than guaranteeing a particular size. See the site Help page for memory and format limits. This release does not offer OCR, PDF-to-Word, PDF compression, HEIC or animated-image processing. PDF forms, signatures, bookmarks and attachments are not guaranteed to survive page copying.

## Edit the site

- `scripts/build.mjs`: HTML layouts, metadata, supporting pages, sitemap and headers.
- `src/tools.json`: tool descriptions and help content.
- `src/articles.json`: blog posts; `body` is trusted editorial HTML, never visitor input.
- `public/assets/app.js`: user interface and file-processing workflows.
- `public/assets/core.js`: reusable sizing/page-selection logic.
- `public/assets/style.css`: responsive design.
- `public/assets/logo.svg`, `hero.webp`, `social.jpg`: brand assets.
- `site.config.json`: production origin, brand and initial publication date.
- `dist/`: ready-to-host generated production files; rebuild after source edits.

## Blog

Add an article object to `src/articles.json` with a unique lowercase hyphenated `slug`, `title`, `description`, `category`, `tool` (an existing tool slug), `published` and `modified` dates (YYYY-MM-DD), and complete HTML `body`. Run the build and audit. The blog directory, related guides, metadata and sitemap update automatically. There is no online admin dashboard or CMS in this release. See `CONTENT-PLAN.md` for prompts and publishing checks.

## Ownership and third-party notices

You may edit and host the delivered OurSolver project. Preserve `public/assets/THIRD-PARTY-NOTICES.txt` with the bundled library. The package is marked private and UNLICENSED to avoid accidentally publishing the whole project as an open-source npm package. The illustration was generated for this project; the logo is editable SVG. No fabricated staff profiles are included.

See `QA-REPORT.md` for what was actually tested and remaining launch checks.
