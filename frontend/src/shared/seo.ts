import type { ResponseProperty } from '@/modules/property/types/types';

export const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://skogsbyran.vercel.app').replace(/\/+$/, '');
export const business = {
  '@context': 'https://schema.org', '@type': 'LocalBusiness',
  '@id': `${siteUrl}/#business`, name: 'Skogsbyrån i Jönköping', url: `${siteUrl}/`,
  telephone: '+46761354649', email: 'skogsbyran.jonkoping@telia.com',
  address: { '@type': 'PostalAddress', streetAddress: 'Tranhult 11', postalCode: '562 91', addressLocality: 'Månsarp', addressCountry: 'SE' },
};

export function pageMetadata(path: string, property?: ResponseProperty, missing = false) {
  const canonicalPath = path.replace(/\/+$/, '') || '/';
  let title = 'Sidan hittades inte | Skogsbyrån';
  let description = 'Adressen finns inte eller är inte tillgänglig.';
  let index = false;
  if (canonicalPath === '/') {
    title = 'Skogsbyrån Jönköping – skogs- och lantbruksfastigheter';
    description = 'Köp och sälj skog, mark och lantbruksfastigheter med Skogsbyrån i Jönköping. Oberoende rådgivning och fastighetsförmedling i södra Sverige.';
    index = true;
  } else if (canonicalPath === '/om-oss') {
    title = 'Om Skogsbyrån i Jönköping – rådgivning och förmedling';
    description = 'Lär känna Skogsbyrån i Jönköping. Mer än 30 års erfarenhet av rådgivning och förmedling av skog, mark och lantbruksfastigheter.';
    index = true;
  } else if (/^\/property\/[^/]+$/.test(canonicalPath) && !missing) {
    const place = [...new Set([property?.location?.city, property?.location?.municipality].filter(Boolean))].join(', ');
    title = property ? `${property.details.title}${place ? ` – ${place}` : ''} | Skogsbyrån` : 'Fastighet | Skogsbyrån';
    description = property?.details.caption.trim().replace(/\s+/g, ' ').slice(0, 160) || 'Se fastighetsbeskrivning, bilder, dokument och karta hos Skogsbyrån.';
    index = property?.details.isVisible === true;
  } else if (canonicalPath.startsWith('/admin')) {
    title = 'Administration | Skogsbyrån';
    description = 'Administration för Skogsbyrån.';
  }
  return { title, description, canonical: `${siteUrl}${canonicalPath}`, index };
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function metadataHtml(metadata: ReturnType<typeof pageMetadata>) {
  const { title, description, canonical, index } = metadata;
  const verification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION?.trim();
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="${index ? 'index,follow' : 'noindex,follow'}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="sv_SE">${verification ? `<meta name="google-site-verification" content="${escapeHtml(verification)}">` : ''}`;
}
