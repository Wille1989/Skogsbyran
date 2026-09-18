import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const dist = resolve(import.meta.dirname, '../dist');
const source = readFileSync(resolve(dist, 'sw.js'), 'utf8');

function worker() {
  const handlers = {};
  const deleted = [];
  let precached;
  const cache = {
    addAll: async requests => { precached = requests; },
    match: async () => new Response('cached static file'),
  };
  runInNewContext(source, {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, handler) => { handlers[name] = handler; } },
    URL,
    Request: class extends Request {
      constructor(url, options) { super(new URL(url, 'https://example.test'), options); }
    },
    caches: {
      open: async () => cache,
      keys: async () => ['unrelated-cache', 'skogsbyran-static-old'],
      delete: async key => { deleted.push(key); },
    },
    fetch: async () => new Response('network'),
  });
  return { handlers, deleted, get precached() { return precached; } };
}

test('production manifest and icon files are valid', () => {
  const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.webmanifest'), 'utf8'));
  assert.equal(manifest.name, 'Skogsbyrån');
  assert.equal(manifest.short_name, 'Skogsbyrån');
  assert.equal(manifest.lang, 'sv-SE');
  assert.equal(manifest.display, 'standalone');
  for (const key of ['id', 'start_url', 'scope']) assert.equal(manifest[key], '/');
  assert.equal(manifest.theme_color, '#FCFAF5');
  assert.equal(manifest.background_color, '#F8F6EE');
  for (const icon of [...manifest.icons, { src: '/icon/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = readFileSync(resolve(dist, '.' + icon.src));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  const html = readFileSync(resolve(dist, 'index.html'), 'utf8');
  assert.match(html, /rel="manifest" href="\/manifest.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon"/);
  assert.doesNotMatch(html, /vite\.svg/);
});

test('installation precaches only existing compiled assets and icons', async () => {
  const w = worker();
  await new Promise((resolve, reject) => w.handlers.install({ waitUntil: promise => promise.then(resolve, reject) }));
  assert.ok(w.precached.length > 5);
  for (const request of w.precached) {
    const path = new URL(request.url).pathname;
    assert.match(path, /^\/(assets|icon)\//);
    assert.ok(existsSync(resolve(dist, '.' + path)), path);
    assert.equal(request.credentials, 'omit');
    assert.equal(request.cache, 'reload');
  }
});

test('activation cleans only this application’s previous static caches', async () => {
  const w = worker();
  await new Promise((resolve, reject) => w.handlers.activate({ waitUntil: promise => promise.then(resolve, reject) }));
  assert.deepEqual(w.deleted, ['skogsbyran-static-old']);
});

test('API, mutations, navigation, third-party and authenticated traffic bypass cache', () => {
  const { handlers } = worker();
  const requests = [
    ...['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => new Request('https://example.test/property/123', { method })),
    new Request('https://example.test/admin/properties'),
    new Request('https://backend.test/properties'),
    new Request('https://example.test/icon/pwa-192.png?dynamic=1'),
    new Request('https://example.test/icon/pwa-192.png', { headers: { Authorization: 'Bearer test' } }),
    new Request('https://example.test/icon/pwa-192.png', { method: 'POST' }),
    { url: 'https://example.test/property/123', method: 'GET', mode: 'navigate', headers: new Headers() },
  ];
  for (const request of requests) handlers.fetch({ request, respondWith: () => assert.fail(`Intercepted ${request.method} ${request.url}`) });
});

test('known static icon is served from the versioned cache', async () => {
  const { handlers } = worker();
  let response;
  handlers.fetch({ request: new Request('https://example.test/icon/pwa-192.png'), respondWith: promise => { response = promise; } });
  assert.equal(await (await response).text(), 'cached static file');
});
