import './ShowPage.css';
import './PropertyDetail.css';
import { lazy, Suspense } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft, IconCoins, IconTrees, IconMapPin, IconTag } from '@tabler/icons-react';
import { usePropertyByIdQuery } from '../hooks/queries';
import { Images } from '@/modules/image/components/Images';
import { Documents } from '@/modules/document/components/Documents';
import { formatHectares, formatPrice, listingStatusLabels, locationLabel } from '../helpers/propertyListing';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
const PropertyMapView = lazy(() => import('@/modules/location/map/components/PropertyMapView').then(module => ({ default: module.PropertyMapView })));

export function ShowPage() {
  const { propertyId = '' } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  if (isPending) return <LoadingSpinner />;
  if (error || !data?.property) return <section className="property-detail-page"><Link to="/">Tillbaka</Link><h1>Fastigheten kunde inte hämtas</h1><p role="alert">{error instanceof Error ? error.message : "Det gick inte att läsa in fastigheten just nu."}</p></section>;
  const property = data.property;
  const { details, location, areas } = property;
  const place = locationLabel(property);
  const mapLocation = [location?.postalCode, location?.municipality, location?.city].filter(Boolean).join(' · ');
  const marker = (location?.latitude != null && location.longitude != null ? { lat: location.latitude, lng: location.longitude } : null);
  const hasMap = Boolean(areas.length || marker || location?.pois.length);
  const images = [...property.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  const facts = [
    ...(details.price ? [{ label: 'Pris', value: formatPrice(details.price), icon: IconCoins }] : []),
    ...(details.size ? [{ label: 'Areal', value: formatHectares(details.size), icon: IconTrees }] : []),
    ...(location?.address ? [{ label: 'Adress', value: location.address, icon: IconMapPin }] : []),
    ...(location?.postalCode || location?.city ? [{ label: 'Postort', value: [location.postalCode, location.city].filter(Boolean).join(' '), icon: IconMapPin }] : []),
    ...(location?.municipality ? [{ label: 'Kommun', value: location.municipality, icon: IconMapPin }] : place ? [{ label: 'Ort', value: place, icon: IconMapPin }] : []),
    { label: 'Status', value: listingStatusLabels[details.listingStatus], icon: IconTag },
  ];
  return (
    <article className="property-detail-page">
      <Link to="/" className="detail-pill detail-back"><IconArrowLeft size={19} aria-hidden="true" />Tillbaka</Link>
      <header className="detail-heading">
        <h1>{details.title}</h1>
      </header>
      <div className="detail-gallery">
        <span className="detail-status">{listingStatusLabels[details.listingStatus]}</span>
        {images.length ? <Images key={property.propertyId} propertyId={property.propertyId} images={images} propertyTitle={details.title} canEdit={false} /> : <div className="detail-no-image">Det finns inga bilder för fastigheten ännu.</div>}
      </div>
      <section className="detail-facts" aria-label="Fastighetsfakta">
        <h2>Fastighetsfakta</h2>
        <dl>{facts.map(({ label, value, icon: Icon }) => <div key={label}><dt><Icon size={26} stroke={1.3} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <div className="detail-description-documents">
        <section className="detail-description"><h2>Om fastigheten</h2><p>{details.caption || "Det finns ingen beskrivning av fastigheten ännu."}</p></section>
        <Documents propertyId={property.propertyId} documents={property.documents} />
      </div>
      <section className="detail-map-section" aria-labelledby="detail-map-title">
        <h2 id="detail-map-title">Läge &amp; karta</h2>
        {!hasMap && <p>Ingen kartdata har sparats för fastigheten.</p>}
        {hasMap && !import.meta.env.SSR && <div className="detail-map-frame"><Suspense fallback={<p role="status">Kartan hämtas…</p>}><PropertyMapView key={property.propertyId} areas={areas} locationLabel={mapLocation} data={{ polygons: areas.map(area => area.polygon), marker, pois: location?.pois ?? [] }} /></Suspense></div>}
      </section>
    </article>
  );
}
