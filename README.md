# Ink & Page — PDF Tools

Edit, sign and organize PDFs in your browser. Production remains https://ink-page-pdf-editor.vercel.app/ . Static client-side app: no document backend, subscriptions, analytics or active advertisements.

## Build and develop

Node 20+; development used Node 24. Install the locked development dependency with `pnpm install --frozen-lockfile`.

- Build: `node scripts/build.mjs` (or `pnpm build`).
- Lint/syntax: `node scripts/check.mjs`.
- Typecheck: `node node_modules/typescript/bin/tsc --noEmit` (shared JSDoc core only).
- Tests: `node --test --test-isolation=none tests/*.test.cjs`.

Serve dist/ with a static HTTP server that maps directory routes to index.html. Vercel runs the build and serves dist with clean URLs/security headers. Existing main-branch deployment remains connected. No environment variables are required for PDF tools.

## Source map

- editor.html, app.js, merge.js: preserved markup and existing visual mark, page numbering, grouping, ordering, undo/redo and encrypted-PDF recovery workflows.
- modern.js: document disposal/reset, continuous viewer, lazy rendering, thumbnails, zoom/search, visual mark editing and export.
- toolkit.js: split/extract, image/ZIP, image-based compression, metadata and text export.
- core.js: shared validation, ranges, reset and geometry; TypeScript/JSDoc checked.
- boot.js: PDF.js ESM loading only on tool pages; merge hydration deferred until requested.
- scripts/build.mjs and catalog.mjs: static routes, metadata, tool instructions, sitemap/robots.
- content.json: original guides and policy/contact content. Owner support address remains unconfigured.
- studio.css: navy/teal tokens and responsive layout, extending legacy style.css foundations.
- site.js: navigation, theme and confirmed local-data clearing.
- ads-config.js / ads-slot.js: disabled future integration seam only. No publisher ID, ads.txt, network script, consent grant or active ad requests.
- docs/: baseline, sourced readiness research and final implementation/QA report.

## Working tools

/tools/sign-pdf, /tools/merge-pdf, /tools/split-pdf, /tools/organize-pdf, /tools/extract-pages, /tools/pdf-to-jpg (also PNG), /tools/jpg-to-pdf, /tools/page-numbers, /tools/watermark-pdf, /tools/compress-pdf, /tools/metadata and /tools/pdf-to-text.

Visual signatures, text, date/checkmark and box marks are image overlays, not identity verification or certificate-based signatures. Editing may invalidate existing cryptographic signatures. Encrypted/incompatible PDFs may render as images: text and interactive fields flatten and completion reports this. Password-required files must first be opened and saved unlocked with their password. No password bypass, OCR, Word/Excel or form-filling feature is advertised.

Compression uses JPEG page rendering, loses text selectability and may increase size. Page rendering is capped at 8 million pixels. Limits: 100 MB/file, 1500 pages, 400 MB merge workspace; practical memory limits can be lower on phones.

PDF.js legacy baseline supports modern Chromium/Firefox and mostly Safari 18+. Only Chromium desktop/mobile-viewport tests actually performed are claimed; no physical iOS/Android or screen-reader certification.

## Storage and migration

Active editor PDF: memory only. Remove/Replace clears document-specific state, workers and canvases; opt-in reusable images can remain. Original device files are never overwritten.

Keep IndexedDB ink-page v1, kv store, merge key unchanged. Merge file bytes/order persist until cleared. Opt-in signature images use signatures in that store. Legacy ink-page-stamps / ink-page-signature localStorage migrate only after successful IndexedDB storage. No automatic database reset. Browser storage is not encrypted. Forget images / Remove PDF / Clear all local data are explicit user controls with loss confirmations.

## Owner configuration and AdSense

Edit brand/navigation in scripts/build.mjs; tools in catalog.mjs; guides/policies/contact in content.json. Supply a verified support/privacy contact and operator details rather than inventing them. Legal text is a draft requiring owner review.

Optionally set SEARCH_CONSOLE_VERIFICATION to the owner's actual public token in Vercel; rebuild, verify a URL-prefix Search Console property and submit /sitemap.xml.

Read docs/READINESS.md before advertising. Google rules plus the Public Suffix List appear to allow this vercel.app hostname format; actual eligibility/approval remain external decisions. Owner must supply a real publisher ID, explicitly approve ads, configure the appropriate certified CMP/default-denied consent, add narrow Google CSP allowances, then integrate actual rendering and exact approved ads.txt. Editors remain ad-free. Future educational slots must reserve height, be labeled Advertisement, and stay away from file/actions. The disabled scaffold cannot itself serve ads. No domain purchase is needed for this preparation.

## Dependencies

Vendored PDF.js 6.5.438 legacy ESM (Apache-2.0), pdf-lib 1.17.1 (MIT), JSZip 3.10.1 (MIT/GPL dual; used under MIT). Notices retained in vendor/. PDF.js 3.11 scripts retired. PDF eval/scripting and WASM-dependent codecs are disabled; unusual codecs may fail rather than make external calls. TypeScript 5.9.3 is a pinned development checker. Upstream advisory review and known limitations are in docs/READINESS.md.
