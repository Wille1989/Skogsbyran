import { useEffect } from 'react';
import { useLocation, matchPath } from 'react-router-dom';
import { usePropertyByIdQuery } from '@/modules/property/hooks/queries';
import { pageMetadata } from '../seo';

export function Seo() {
  const { pathname } = useLocation();
  const id = matchPath('/property/:propertyId', pathname)?.params.propertyId || '';
  const { data, error } = usePropertyByIdQuery(id);
  const metadata = pageMetadata(pathname, data?.property, Boolean(error));
  useEffect(() => {
    document.title = metadata.title;
    const tags = {
      'name:description': metadata.description, 'name:robots': metadata.index ? 'index,follow' : 'noindex,follow',
      'property:og:title': metadata.title, 'property:og:description': metadata.description,
      'property:og:url': metadata.canonical, 'property:og:type': 'website', 'property:og:locale': 'sv_SE',
    };
    for (const [key, content] of Object.entries(tags)) {
      const separator = key.indexOf(':');
      const attribute = key.slice(0, separator), value = key.slice(separator + 1);
      const tag = document.head.querySelector(`meta[${attribute}="${value}"]`) || document.createElement('meta');
      tag.setAttribute(attribute, value);
      tag.setAttribute('content', content);
      document.head.appendChild(tag);
    }
    const canonical = document.head.querySelector('link[rel="canonical"]') || document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    canonical.setAttribute('href', metadata.canonical);
    document.head.appendChild(canonical);
  }, [metadata.title, metadata.description, metadata.canonical, metadata.index]);
  return null;
}
