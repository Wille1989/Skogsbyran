import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderPage } from '../dist-ssr/entry-server.js';

const template = readFileSync(join(process.cwd(), 'dist/index.html'), 'utf8');

export default async function handler(request, response) {
  const path = '/' + String(request.query.path || '').replace(/^\/+|\/+$/g, '');
  const result = await renderPage(path, template);
  response.setHeader('Content-Type', `${result.type}; charset=utf-8`);
  response.setHeader('Cache-Control', 'private, no-store');
  if (result.status === 503) response.setHeader('Retry-After', '60');
  if (result.status !== 200 || process.env.VERCEL_ENV === 'preview') response.setHeader('X-Robots-Tag', 'noindex');
  response.status(result.status).send(result.body);
}
