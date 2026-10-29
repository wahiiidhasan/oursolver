# Deploy OurSolver

Prepared 29 October 2026. This ZIP does not create accounts, publish a domain or alter your NameSilo resale listing.

## 1. Put the source in private GitHub

Create a private repository named `oursolver`. Extract the ZIP. Upload the contents of the `oursolver` folder so `package.json`, `src`, `scripts`, `public` and `dist` are at the repository root. Do not upload `node_modules`. Keep the repository private; the deployed website itself is public.

## 2. Connect Cloudflare Pages

In Cloudflare, open Workers & Pages, create a Pages application, and import the GitHub repository. Authorize access to this repository. Select these build settings:

| Setting | Value |
| --- | --- |
| Production branch | main |
| Framework preset | None |
| Root directory | Repository root (leave blank) |
| Build command | npm run build |
| Output directory | dist |
| Node version | 22 (also supplied by .node-version) |

Dependency versions are locked. For the first deployment, the included `dist` also supports a no-build fallback: use `exit 0` and output `dist`. With this fallback, remember to regenerate and commit dist whenever content changes. The normal build method does this during deployment.

Open the assigned pages.dev address and test the homepage, all six tools, a guide and a missing URL. Subsequent pushes to main trigger deployments. Do not paste secrets into this project; no runtime credentials are required.

## 3. Use www while retaining NameSilo DNS

The configured canonical hostname is **www.oursolver.com**.

First add `www.oursolver.com` under the Pages project's Custom domains. Then, at the authoritative DNS provider, create the `www` CNAME pointing to the exact pages.dev hostname Cloudflare assigns. Remove a conflicting www record only after checking its current purpose. Wait for the custom domain and certificate to become active.

A subdomain can use external DNS. Standard Pages hosting of the apex `oursolver.com` requires Cloudflare nameservers. Registration can remain at NameSilo.

Your owned domain is listed for resale. Its listing and sale landing page are separate from this website. Before modifying a marketplace-managed record, confirm with NameSilo whether your listing uses that hostname. Do not assume DNS changes preserve its sale landing page. The apex can remain on the sale landing page while www hosts the tools if your listing configuration allows it.

A root-to-www redirect is a separate task. A DNS CNAME alone is not an HTTP redirect. If you want the root to send visitors to the tools, use an HTTPS-capable 301/308 redirect service and verify both http://oursolver.com and https://oursolver.com. Do not overwrite the auction/sale landing configuration until you decide to replace it. This package cannot configure that external redirect.

## 4. Launch checks

- Confirm `https://www.oursolver.com` loads with a valid certificate.
- Test uploads and downloads on your desktop and phone with disposable sample files.
- Test all six tools, including an impossible compression target, invalid page ranges and clear/reset.
- Check browser console and Network; file contents should not be sent to a server.
- Verify a nonexistent route returns HTTP 404 and the custom error page.
- Open `/sitemap.xml` and `/robots.txt` on the final hostname.
- Check canonical URLs and social previews use the chosen production origin.
- Confirm `_headers` is applied and file processing works with that security policy.
- Inspect mobile layouts at 360px and 390px, keyboard focus and 200% zoom.
- Review About, Privacy and Terms against your actual ownership and hosting configuration; add a real public contact method when available.
- Create a Search Console property, complete its verification and submit the sitemap. Inspect the homepage and tool URLs. Indexing and rankings are not guaranteed.
- After the custom domain works, consider redirecting the production pages.dev hostname to the canonical hostname using Cloudflare's documented procedure. Keep preview deployments out of indexing and check response headers.

No analytics, advertising or tracking cookies are added by the application. If you add them, update the privacy notice and any consent behavior before enabling them.

## Change the canonical address

Edit `origin` in `site.config.json` and rebuild, or set the build environment variable `SITE_URL` to the full HTTPS origin without a path. Canonicals, sitemap entries, structured data and social URLs are generated from that one value. Update redirects and Search Console to match.

## Official references

- Custom domains: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Static deployment: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- GitHub integration: https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/
- Production pages.dev redirect: https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/

Instructions were checked against Cloudflare documentation on 29 October 2026; account UI labels may change.
