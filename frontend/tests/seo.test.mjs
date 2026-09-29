import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { renderPage } from '../dist-ssr/entry-server.js';

// Run after npm run build. No real mail, credentials or external API calls.
const template = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.ok(readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8').includes('skogsbyran-static-'));
assert.match(template, /sizes="192x192" href="\/icon\/pwa-192.png"/);
const favicon = readFileSync(new URL('../dist/icon/pwa-192.png', import.meta.url));
assert.equal(favicon.readUInt32BE(16), 192);
assert.equal(favicon.readUInt32BE(20), 192);
const property = {
  propertyId: '42', details: { title: 'Skog & mark $&', caption: 'En fastighet nära Månsarp. </script><script>alert(1)</script>', isVisible: true, listingStatus: 'available', price: '1000000', size: '34' },
  images: [], documents: [], areas: [], location: { city: 'Månsarp', municipality: 'Jönköping', pois: [] },
};
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async url => new Response(JSON.stringify(String(url).endsWith('/properties') ? { properties: [property, { ...property, propertyId: 'hidden', details: { ...property.details, isVisible: false } }] } : { property }), { status: 200 });
  const home = await renderPage('/', template);
  assert.equal(home.status, 200);
  assert.match(home.body, /href="\/property\/42"/);
  assert.match(home.body, /application\/ld\+json/);
  const about = await renderPage('/om-oss', template);
  assert.match(about.body, /<title>Om Skogsbyrån/);
  assert.match(about.body, /Tranhult 11/);
  const detail = await renderPage('/property/42', template);
  assert.equal(detail.status, 200);
  assert.match(detail.body, /Skog &amp; mark \$&amp;/);
  assert.match(detail.body, /name="robots" content="index,follow"/);
  assert.match(detail.body, /rel="canonical" href="https:\/\/skogsbyran.vercel.app\/property\/42"/);
  assert.ok(!detail.body.includes('</script><script>alert(1)'));
  assert.match(detail.body, /\\u003c\/script>/);
  const sitemap = await renderPage('/sitemap.xml', template);
  assert.equal(sitemap.type, 'application/xml');
  assert.match(sitemap.body, /\/property\/42/);
  assert.ok(!sitemap.body.includes('hidden'));
  const robots = await renderPage('/robots.txt', template);
  assert.equal(robots.type, 'text/plain');
  assert.match(robots.body, /Sitemap: https:/);
  assert.equal((await renderPage('/missing', template)).status, 404);
  property.details.isVisible = false;
  assert.equal((await renderPage('/property/42', template)).status, 404);
  globalThis.fetch = async () => new Response('', { status: 404 });
  assert.equal((await renderPage('/property/42', template)).status, 404);
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal((await renderPage('/property/42', template)).status, 503);
  assert.equal((await renderPage('/sitemap.xml', template)).status, 503);
  console.log('SEO checks passed: rendered content, escaping, sitemap, robots, 404 and 503.');
} finally { globalThis.fetch = originalFetch; }
