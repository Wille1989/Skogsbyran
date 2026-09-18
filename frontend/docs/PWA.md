# PWA

The frontend uses a static manifest and a small service worker emitted by the
existing Vite build. No additional dependencies are required.

`public/icon/skogsbyranIcon.png` is the unchanged source artwork (48×48).
The 192×192 and 512×512 PNGs and 180×180 Apple touch icon are resized copies.
The 512×512 maskable variant centers a 352×352 copy on an opaque background
sampled from the source, keeping the letter within the maskable safe circle.
Upscaling cannot add detail; a higher-resolution copy of the same artwork would
improve installed icon sharpness. Variants were generated with Windows
System.Drawing using high-quality bicubic interpolation, without new packages.

The manifest launches `/` in standalone mode, with Swedish branding and the
existing cream-50 and cream-100 colors. HTML retains the original favicon and
adds the manifest, theme color and Apple icon.

## Cache and update behavior

The build generates an exact allowlist of compiled `assets/` files and the five
icon files. Installation caches these files without credentials. The cache name
is a hash of the worker, compiled assets and icon contents. Only query-free,
same-origin GET requests on this allowlist can use the cache. Requests carrying
an Authorization header also bypass it. Cache misses use the network.

HTML navigation, manifest requests, backend JSON, admin/property data, uploaded
media, third-party resources and all mutations remain network-only. Static admin
JavaScript is cached, but contains no fetched admin data. There is deliberately
no offline HTML fallback; launching or refreshing requires a connection.

Registration runs once from `src/main.tsx`, only in production on secure origins.
Failures do not prevent app startup. New workers wait for existing tabs/windows
to close; there is no forced activation or reload prompt. Activation deletes only
older `skogsbyran-static-` caches.

## Hosting and verification

No frontend hosting/rewrite configuration is committed in this repository.
Deploy the entire `dist/` directory at the origin root over HTTPS. Keep the
existing BrowserRouter fallback to `index.html` for frontend routes, including
direct `/property/:id` and `/admin/...` requests. API routes must still reach the
backend. Serve real files before the SPA fallback:

- `/sw.js`: JavaScript MIME type, `Cache-Control: no-cache` (never immutable).
- `/manifest.webmanifest`: `application/manifest+json`, revalidate on requests.
- `/index.html` and non-fingerprinted `/icon/` files: revalidate on requests.
- Fingerprinted `/assets/` files: long-lived immutable caching is appropriate.

Do not rewrite missing service-worker or asset requests to HTML. Publish assets
before the new HTML/worker and retain previous hashed assets during deployment
so already-open clients can still load their lazy chunks.

Run `npm run build`, `npm run lint`, then `node --test pwa/pwa.test.mjs`.
For browser verification, run `npm run preview -- --host 127.0.0.1` and open the
reported URL (localhost is a secure-context exception). In browser Application
tools check manifest icons, installation and the activated worker; reload once
to get a controlled client. Confirm property/admin navigation and network API
requests while online. Close all app tabs/windows when checking an update.
Check the installed icon on desktop, Android and iOS devices as available.
