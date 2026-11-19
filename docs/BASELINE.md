# Modernization baseline — 19 November 2026

Existing production: https://ink-page-pdf-editor.vercel.app/ . Repository and deployment remain unchanged.

## Inventory before changes

Static HTML/CSS/classic JavaScript; no framework, package manifest, build, lint, typecheck or test scripts. Vercel serves repository root. PDF.js 3.11.174 (Apache-2.0) previews PDFs, pdf-lib 1.17.1 (MIT) writes them. PDF.js uses isEvalSupported:false. Optional external Google Fonts. No analytics, ad scripts, backend or document network uploads in source.

app.js: multiple signature/stamp image import, selection, drag, proportional width, current/all/range application, opt-in localStorage library and deletion, numbering format/start/font/position, PDF download. Single-page preview, next/previous. Missing Remove/Replace, zoom, thumbnails, typed/drawn signatures, most public pages.

merge.js: PDF/images, groups, filenames, page reorder/rotate/duplicate/delete, insertion of blank pages/files, split items, context menus, keyboard shortcuts, undo/redo, preview, individual/group/selection/full downloads, encrypted-preview rendering fallback. IndexedDB database ink-page v1, store kv, key merge persists source bytes and ordering. Restored on reload. User-approved encrypted PDFs that open with empty password render as images when copying is unsupported.

## Risks / migration constraints

Keep ink-page IndexedDB v1 and merge key unchanged. Do not delete or clear on initialization. Existing signature keys ink-page-stamps and ink-page-signature must migrate only after successful durable storage; do not silently discard. No signature assets saved without opt-in. Original files remain unchanged. Removing active sign document is different from clearing merge workspace and all browser data.

PDF.js 3.11 is outdated; evaluate modern ESM migration and keep eval disabled. Existing minified dependency prevents meaningful type analysis; add checked shared utilities and JS syntax checks. Existing errors reproduced: three owner ISO PDFs are encrypted and cannot be directly read by pdf-lib; rendering fallback works. Canvas memory, 100+ pages, mixed page geometry, keyboard operation and persistent restore need regression checks.

## Phases and acceptance

1. Baseline + shared validation/range/geometry helpers + test/build scripts.
2. Safe document disposal, remove/replace/cancel/same-file and limits.
3. Lazy continuous viewer, active thumbnails, zoom, page jump, rotation, text search, accurate placement/export.
4. Draw/type/upload signature, resize, opacity, rotation, duplication, layering, annotation and opt-in library.
5. Preserve merge, add split/extract, PDF images/ZIP, images-to-PDF controls, watermark, compression with honest tradeoffs, metadata, text export.
6. Static routes, substantive guides/policies, responsive shell, accessibility and SEO.
7. Disabled ads scaffold, security headers and primary-source readiness notes. No ad activation, paid resources or account changes.
8. Automated checks + actual browser export and responsive QA + same Vercel production deployment + report.

Baseline tests from prior work: four rotated pages normal/compat export, mixed PDF/image merge, synthetic invalid-object recovery and actual four owner ISO files. Those original PDFs are private test inputs outside repository and must never be committed.
