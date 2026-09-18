import './ShowPage.css';
import './PropertyDetail.css';
import { lazy, Suspense, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconCoins, IconTrees, IconMapPin, IconPhone, IconMail, IconTag } from '@tabler/icons-react';
import { useCurrentUserQuery } from '@/modules/auth/data/auth.hooks';
import { usePropertyByIdQuery } from '../data/queries';
import { Images } from '@/modules/image/presentation/Images';
import { Documents } from '@/modules/document/Documents';
import { ContactContext } from '@/modules/contact/presentation/ContactContext';
import { formatHectares, formatPrice, listingStatusLabels, locationLabel } from './propertyListing';
import { LoadingSpinner } from '@/shared/presentation/LoadingSpinner';
const PropertyMapView = lazy(() => import('@/modules/location/map/presentation/PropertyMapView').then(module => ({ default: module.PropertyMapView })));

export function ShowPage() {
  const { propertyId = '' } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const { data: currentUser, isError: authError } = useCurrentUserQuery();
  const isAdmin = !authError && currentUser?.isAdmin === true;
  const openContact = useContext(ContactContext);
  if (isPending) return <LoadingSpinner />;
  if (error || !data?.property) return <section className="property-detail-page"><Link to="/">Tillbaka</Link><h1>Fastigheten kunde inte hämtas</h1><p role="alert">{error instanceof Error ? error.message : "Det gick inte att läsa in fastigheten just nu."}</p></section>;
  const property = data.property;
  const { details, location, areas } = property;
  const place = locationLabel(property);
  const address = [location?.address, location?.postalCode, place].filter(Boolean).join(', ');
  const marker = (location?.latitude != null && location.longitude != null ? { lat: location.latitude, lng: location.longitude } : null);
  const hasMap = Boolean(areas.length || marker || location?.pois.length);
  const images = [...property.images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.position - b.position);
  const facts = [
    ...(details.price ? [{ label: 'Pris', value: formatPrice(details.price), icon: IconCoins }] : []),
    ...(details.size ? [{ label: 'Areal', value: formatHectares(details.size), icon: IconTrees }] : []),
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
        {images.length ? <Images key={property.propertyId} propertyId={property.propertyId} images={images} propertyTitle={details.title} canEdit={isAdmin} /> : <div className="detail-no-image">Det finns inga bilder för fastigheten ännu.</div>}
      </div>
      <div className="detail-columns">
        <div className="detail-content">
          <section className="detail-description"><h2>Beskrivning</h2><p>{details.caption || "Det finns ingen beskrivning av fastigheten ännu."}</p></section>
          <Documents propertyId={property.propertyId} documents={property.documents} canManage={isAdmin} />
        </div>
        <aside className="detail-sidebar" aria-label="Fastighetsfakta och kontakt">
          <section className="detail-facts">
            <h2>Fastighetsfakta</h2>
            <dl>{facts.map(({ label, value, icon: Icon }) => <div key={label}><dt><Icon size={26} stroke={1.3} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}</dl>
          </section>
          <section className="detail-contact">
            <div className="detail-contact-intro"><h2>Har du frågor<br />om fastigheten?</h2><p>Kontakta Skogsbyrån för mer information om fastigheten.</p>{openContact && <button type="button" className="detail-pill" onClick={openContact}>Kontakta oss <IconArrowRight size={20} aria-hidden="true" /></button>}</div>
            <address><a href="tel:+46761354649"><IconPhone size={19} aria-hidden="true" />0761-35 46 49</a><a href="mailto:skogsbyran.jonkoping@telia.com"><IconMail size={19} aria-hidden="true" />skogsbyran.jonkoping@telia.com</a><a href="mailto:magnustrana@gmail.com"><IconMail size={19} aria-hidden="true" />magnustrana@gmail.com</a><span><IconMapPin size={19} aria-hidden="true" />Tranhult 11, 562 91 Månsarp</span></address>
          </section>
        </aside>
      </div>
      <section className="detail-map-section" aria-labelledby="detail-map-title">
        <h2 id="detail-map-title">Läge &amp; karta</h2>
        <p>{address ? address + '. ' : ''}{hasMap ? 'Utforska fastighetens läge och områden i kartan.' : 'Ingen kartdata har sparats för fastigheten.'}</p>
        {hasMap && <div className="detail-map-frame"><Suspense fallback={<p role="status">Kartan hämtas…</p>}><PropertyAreaMap key={property.propertyId} polygon={areas[0]?.polygon ?? []} otherPolygons={areas.slice(1).map(area => area.polygon)} marker={marker} pois={location?.pois} readOnly /></Suspense></div>}
        {location?.pois.length ? <ul className="detail-map-pois">{location.pois.map((poi, index) => <li key={poi.id ?? index}><strong>{poi.name}</strong>{poi.description && <span> – {poi.description}</span>}</li>)}</ul> : null}
      </section>
    </article>
  );
}

