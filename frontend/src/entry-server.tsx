import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider, dehydrate } from '@tanstack/react-query';
import Layout from './shared/components/Layout';
import { IndexPage } from './modules/property/pages/IndexPage';
import { AboutPage } from './modules/about/pages/AboutPage';
import { ShowPage } from './modules/property/pages/ShowPage';
import { propertyQueryKeys } from './modules/property/api/queryKeys';
import type { ResponseGetProperties, ResponseGetProperty } from './modules/property/types/types';
import { business, escapeHtml, metadataHtml, pageMetadata, siteUrl } from './shared/seo';

async function publicData(path: string) {
  const response = await fetch(`https://skogsbyran.onrender.com${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Public API returned ${response.status}`);
  return response.json();
}

export async function renderPage(path: string, template: string) {
  const client = new QueryClient(); // Never share visitor data between requests.
  let status = 200;
  let property: ResponseGetProperty['property'] | undefined;
  let page;
  try {
    if (path === '/robots.txt') return { status, type: 'text/plain', body: `User-agent: *\nAllow: /\nDisallow: /backend/\nDisallow: /api/\nSitemap: ${siteUrl}/sitemap.xml\n` };
    if (path === '/sitemap.xml') {
      const data = await publicData('/properties') as ResponseGetProperties;
      const paths = ['/', '/om-oss', ...data.properties.filter(p => p.details.isVisible).map(p => `/property/${encodeURIComponent(p.propertyId)}`)];
      return { status, type: 'application/xml', body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${escapeHtml(siteUrl + p)}</loc></url>`).join('')}</urlset>` };
    }
    if (path === '/') {
      const data = await publicData('/properties');
      if (!data) throw new Error('Missing property listing');
      client.setQueryData(propertyQueryKeys.all, data);
      page = <IndexPage />;
    } else if (path === '/om-oss') page = <AboutPage />;
    else if (/^\/property\/[^/]+$/.test(path)) {
      const id = decodeURIComponent(path.split('/')[2]);
      const data = await publicData(`/property/${encodeURIComponent(id)}`) as ResponseGetProperty | null;
      if (data?.property.details.isVisible) {
        property = data.property;
        client.setQueryData(propertyQueryKeys.byId(id), data);
        page = <ShowPage />;
      } else status = 404;
    } else status = 404;
  } catch {
    // An unavailable API must not turn a valid property into a permanent 404.
    status = 503;
    page = <section><h1>Sidan kunde inte hämtas just nu</h1><p>Försök igen om en liten stund.</p></section>;
  }
  if (status === 404) page = <section><h1>Sidan hittades inte</h1><p>Adressen finns inte eller är inte tillgänglig.</p><a href="/">Till startsidan</a></section>;
  const metadata = pageMetadata(path, property, status !== 200);
  if (status !== 200) metadata.index = false;
  if (status === 503) { metadata.title = 'Tillfälligt otillgänglig | Skogsbyrån'; metadata.description = 'Försök igen om en liten stund.'; }
  const content = renderToString(<StaticRouter location={path}><QueryClientProvider client={client}><Layout><Routes><Route path="/property/:propertyId" element={page} /><Route path="*" element={page} /></Routes></Layout></QueryClientProvider></StaticRouter>);
  const state = JSON.stringify(dehydrate(client)).replace(/</g, '\\u003c');
  client.clear();
  const schema = status === 200 ? `<script type="application/ld+json">${JSON.stringify(business).replace(/</g, '\\u003c')}</script>` : '';
  return { status, type: 'text/html', body: template.replace(/<title>.*?<\/title>/s, () => metadataHtml(metadata) + schema).replace('<div id="root"></div>', () => `<div id="root">${content}</div><script id="page-data" type="application/json">${state}</script>`) };
}
