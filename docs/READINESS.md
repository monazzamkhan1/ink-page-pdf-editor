# AdSense, Search Console and PDF dependency research

Checked 19 November 2026. Public documentation research only; no Google or Vercel account changes were made.

## Hosted-domain eligibility

Google permits AdSense site additions for domains, for subdomains on platforms listed in the Public Suffix List, and for platform-partner sites. The current official Public Suffix List explicitly includes `vercel.app`. Therefore `ink-page-pdf-editor.vercel.app` appears to meet Google's published domain-format rule. This is an inference from those two primary sources, **not confirmation of acceptance or AdSense approval**. The owner must add this exact hostname in their AdSense account and let Google validate it. Do not buy a domain or move the site simply to claim readiness.

- [Google: Site management is changing](https://support.google.com/adsense/answer/12170421?hl=en)
- [Official Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat) (`vercel.app` entry under Vercel)
- [Google: Add a new site](https://support.google.com/adsense/answer/12169212?hl=en)

## Readiness and owner checklist

1. Publish substantial tool instructions, clear navigation, truthful privacy/cookie/terms pages, genuine support/contact details, and working downloads. Do not invent a support email or company identity.
2. Owner supplies the actual AdSense publisher ID and explicitly approves activation. Keep every ad script and request disabled until then. Review/account acceptance and serving eligibility remain Google's decisions.
3. Obtain the owner's actual Search Console verification token. Use a **URL-prefix property** for `https://ink-page-pdf-editor.vercel.app/`; HTML meta-tag or HTML-file verification is available without owning DNS for `vercel.app`. Keep the token after verification. Submit the real sitemap and inspect public routes. No private PDF/blob URLs belong in the sitemap.
4. When approved for activation, publish `/ads.txt` with the exact account publisher ID and Google's specified syntax, at this site's effective root. The account ID must match. Do not ship a fabricated `pub-` ID or fake ads.txt approval.
5. Before personalized ads for EEA/UK/Switzerland traffic, configure a Google-certified CMP integrated with the IAB TCF. A homemade cookie banner or a generic `consent=true` flag is not a substitute. Default-denied states and no-ad behavior should remain until an actual consent integration is approved and configured.
6. Place future clearly labelled, reserved-height ad slots on educational pages only, away from file uploads, downloads, delete buttons, signatures and the PDF canvas. Never self-click ads as QA.

Primary sources:

- [Search Console ownership verification](https://support.google.com/webmasters/answer/9008080?hl=en)
- [Google ads.txt crawling and exact account ID](https://support.google.com/adsense/answer/7679060?hl=en)
- [Google publisher ID](https://support.google.com/adsense/answer/105516?ctx=as2)
- [Google CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en)

## PDF.js audit and migration recommendation

The vendored `pdfjs-dist 3.11.174` falls in CVE-2024-4367's affected range (`<=4.1.392`). Mozilla's official workaround is `isEvalSupported:false`; the baseline code already applies it. A workaround is not an upgrade. Version 4.2.67 fixed that advisory.

The newer CVE-2026-16633 affects `>=5.6.83, <6.2.108`, involving PDF scripting and insufficient CSP; official workarounds disable scripting or enforce CSP. Version 4.10.38 is outside both published affected ranges, but is an older release, and absence from these two ranges is not a blanket security guarantee.

Prefer **6.5.438 legacy ESM**, the current stable release, for the modernized tool pages, with `isEvalSupported:false`, `enableScripting:false` and compatible restrictive CSP. Ship matching worker/module versions. Current upstream support guidance: modern build targets latest Chrome/Firefox; legacy build supports Chrome125+, Chromium Edge, and Safari18+ mostly. Older Safari must not be claimed tested/supported. Note the 6.x API removal of `PDFDocumentProxy.destroy()`—retain the `PDFDocumentLoadingTask` and destroy that task during disposal/replacement. Test encrypted ISO fixtures, lazy thumbnails, mixed rotations and export after upgrading.

- [Mozilla advisory CVE-2024-4367](https://github.com/mozilla/pdf.js/security/advisories/GHSA-wgrm-67xf-hhpq)
- [Reviewed CVE-2026-16633 range and fix](https://github.com/advisories/GHSA-hq66-cqwq-w95j)
- [Official releases including current stable6.5.438 and API changes](https://github.com/mozilla/pdf.js/releases)
- [Current browser-support FAQ](https://github.com/mozilla/pdf.js/wiki/Frequently-Asked-Questions)
- [PDF.js Apache2.0 license](https://github.com/mozilla/pdf.js/blob/master/LICENSE)

## pdf-lib audit

The official release page still identifies `1.17.1` as latest. The official security page publishes no advisories and has no security policy. This does not establish that no vulnerabilities exist. Retaining the existing version with strict input limits, client-side processing, regression fixtures and honest encrypted-PDF recovery is safer than substituting an unreviewed fork during this upgrade. pdf-lib uses MIT; retain the license notice. Password encryption/decryption, full XFA handling and certificate-based signatures should remain deferred rather than promised.

- [pdf-lib releases](https://github.com/Hopding/pdf-lib/releases)
- [pdf-lib security page](https://github.com/Hopding/pdf-lib/security)
- [pdf-lib repository: capabilities and encryption limitations](https://github.com/Hopding/pdf-lib)
- [pdf-lib MIT license](https://github.com/Hopding/pdf-lib/blob/master/LICENSE.md)

## Truthful limits in final report

No Google account, real publisher ID, real Search Console token, verified support address, certified CMP configuration or account review was supplied here. The deliverable can prepare these integration points and documentation while keeping them disabled. No AdSense approval, legal compliance certification, universal browser support, zero-vulnerability guarantee or Lighthouse score may be invented.
