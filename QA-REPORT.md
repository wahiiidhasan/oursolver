# Verification report — 29 October 2026

## Passed

- Production build: 20 static HTML pages.
- Site audit: 392 internal links/asset references resolve; unique titles and descriptions; one H1 per page; canonical links present; JSON-LD parses; sitemap, robots file and third-party notices exist.
- Five automated tests: page selection order/reversal/duplicates, invalid selections and output limits, proportional/exact resizing, PDF page copy order/dimensions, image embedding in a readable PDF.
- Browser search: entering “merge” leaves the merge tool visible and hides unrelated tools.
- Browser merge: two test PDFs produced a three-page PDF result.
- Browser resize: a 1600 × 900 image produced a 1200 × 675 proportional result.
- Browser compression: an impossible 1 KB JPEG target produced an explicit target-not-reached message; the saved JPEG was decoded and confirmed as 1600 × 900.
- Browser conversion: PNG to WebP produced a preview and a downloadable result.
- Browser PDF organizer: selecting `2,1,2` from a two-page PDF produced a three-page result.
- Visual review: desktop homepage and narrow iframe layouts at 390px (homepage) and 360px (resize tool). Responsive layouts showed no obvious clipping in the inspected views. This is not physical-device testing.

- Browser images-to-PDF: a PNG produced a one-page A4 PDF result. PDF download capture timed out, so its downloaded bytes were not independently inspected.

## Scope and limits

The browser's click/download event capture timed out on the merged PDF. Saving an image through its generated download link succeeded. This does not establish every browser's native download behavior. Complete the launch checklist on your desktop and phone.

No live domain was deployed or checked. DNS, TLS, root redirect, Cloudflare response headers, true HTTP 404 responses, Search Console, search indexing and field performance remain launch checks. No Lighthouse score or exhaustive accessibility certification is claimed. Actual file memory limits depend on the visitor's device.

The supplied `_headers` policy is intended for Cloudflare Pages; the internal preview is not proof that the production host applies it. No real user files were used in testing.
