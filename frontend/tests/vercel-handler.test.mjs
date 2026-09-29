import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

// Vercel starts the function from the repository root, not frontend/.
const originalCwd = process.cwd();
try {
  process.chdir(fileURLToPath(new URL('../../', import.meta.url)));
  const { default: handler } = await import('../api/page.js');
  for (const [path, status, type, expected] of [
    ['robots.txt', 200, 'text/plain', 'Sitemap:'],
    ['om-oss', 200, 'text/html', 'Tranhult 11'],
    ['missing-page', 404, 'text/html', 'Sidan hittades inte'],
  ]) {
    const response = {
      headers: {},
      setHeader(name, value) { this.headers[name] = value; },
      status(value) { this.statusCode = value; return this; },
      send(value) { this.body = value; },
    };
    await handler({ query: { path } }, response);
    assert.equal(response.statusCode, status);
    assert.ok(response.headers['Content-Type'].startsWith(type));
    assert.ok(response.body.includes(expected));
    if (status === 404) assert.equal(response.headers['X-Robots-Tag'], 'noindex');
  }
  console.log('Vercel handler passed from repository root: robots, HTML and 404.');
} finally {
  process.chdir(originalCwd);
}
