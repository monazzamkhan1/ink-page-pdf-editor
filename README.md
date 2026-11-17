# Ink & Page

A single-page, browser-local PDF signature and page numbering editor. No backend, account or document upload service required.

## Use

1. Upload a PDF.
2. Choose a saved PNG/JPG/WebP signature image. Transparent PNG is recommended.
3. Drag and resize the signature, then click **Apply to this page** or **Apply to All Pages**. Reapply to all pages after moving to update other pages.
4. Optionally enable page numbering and select format, position, starting number and first PDF page.
5. Download the edited PDF.

Remember signature stores the image in this browser's local storage only. Use Forget saved signature on shared computers. PDF contents remain in browser memory. A signature image is a visual mark, not a certificate-based digital signature. Editing a digitally signed PDF can invalidate its existing cryptographic signatures. Password-protected PDFs must be unlocked first.

## Merge PDF tab

Second tab, **Merge PDF**: add many PDFs/images, reorder (drag the ⠿ handle, or ▲▼ / ◀▶ buttons on touch), delete files or pages, select pages (shift-click for a range) and **Group** them into one item, then **Create PDF**. The list is auto-saved in this browser's IndexedDB, so switching tabs, creating a PDF, or reloading does not clear it. Use *Remove everything* on shared computers. Right-click (or ⋯) on a file or page for: rotate, duplicate, blank page, add PDFs/images at a position, split, copy to new item, reverse, preview, download just that item, merge selected pages into one PDF. Ctrl+Z / Ctrl+Y = undo/redo. *Sign / Number it* sends the merged PDF to the first tab.

## GitHub + Vercel

Upload the contents of this folder to a GitHub repository. Import that repository in Vercel with Framework Preset **Other**, no build command, and output directory `.`. Deploy. The included vercel.json supplies the static configuration. No environment variables are required.

For local preview, use any static HTTP server, such as `python -m http.server 8080`, and open http://localhost:8080. Serve over HTTPS in production.

## Dependencies

Vendored PDF.js 3.11.174 (Apache-2.0) and pdf-lib 1.17.1 (MIT). Their bundled copyright/license notices are retained. Google Fonts are optional; system fonts work offline. No document content is sent to Google Fonts.

## Signature tab: several images

Add a signature, a stamp, etc. together; tap an image to select it, drag it into place, Apply. Tick "Apply all images together" to place everything at once, or type pages like `1,3-5,last`. One download contains all of them.

## Merge recovery

Normal merging preserves PDF text. If copying a PDF fails, the editor retries pages individually and renders incompatible pages from the local PDF.js preview. A completion message reports how many pages were exported as images. Those pages retain their visible appearance and rotation, but text is no longer selectable and interactive fields are flattened.

Enable **Compatibility mode (PDF pages as images)** to render all PDF pages directly when a troublesome document still fails. This can take longer and produce a larger download, particularly for large groups. Pages render one at a time at up to 144 DPI with a canvas size limit. Nothing is uploaded and the saved source files, groups and page order are not removed by export. If a page cannot render, the error identifies its source file and page instead of silently omitting it.
