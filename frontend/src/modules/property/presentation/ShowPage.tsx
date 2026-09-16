import './ShowPage.css';
import './PropertyDetail.css';
import { lazy, Suspense, useContext, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft, IconArrowRight, IconCoins, IconTrees, IconMapPin, IconPhone, IconMail } from '@tabler/icons-react';
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
  const mapDialog = useRef<HTMLDialogElement>(null);
  const [mapOpen, setMapOpen] = useState(false);
  if (isPending) return <LoadingSpinner />;
  if (error || !data?.property) return <section className="property-detail-page"><Link to="/">Tillbaka</Link><h1>Fastigheten kunde inte hämtas</h1><p>Det gick inte att läsa in fastigheten just nu.</p></section>;
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
    ...(place ? [{ label: 'Läge', value: place, icon: IconMapPin }] : []),
  ];
  return (
    <article className="property-detail-page">
      <Link to="/" className="detail-pill detail-back"><IconArrowLeft size={19} aria-hidden="true" />Tillbaka</Link>
      <header className="detail-heading">
        <h1>{details.title}</h1>
        <div className="detail-meta">{facts.map(({ label, value, icon: Icon }) => <span key={label}><Icon size={27} stroke={1.3} aria-hidden="true" /><span><span className="sr-only">{label}: </span>{value}</span></span>)}</div>
      </header>
      <div className="detail-gallery">
        <span className="detail-status">{listingStatusLabels[details.listingStatus]}</span>
        {images.length ? <Images key={property.propertyId} propertyId={property.propertyId} images={images} propertyTitle={details.title} canEdit={isAdmin} /> : <div className="detail-no-image">Det finns inga bilder för fastigheten ännu.</div>}
      </div>
      <div className="detail-columns">
        <div className="detail-content">
          {details.caption && <section className="detail-description"><h2>Beskrivning</h2><p>{details.caption}</p></section>}
          {(address || hasMap) && <section className="detail-location"><h2>Läge</h2>{address && <p>{address}</p>}{hasMap && <button type="button" className="detail-pill" onClick={() => { setMapOpen(true); mapDialog.current?.showModal(); }}>Visa på karta <IconArrowRight size={20} aria-hidden="true" /></button>}</section>}
          {!hasMap && <p>Ingen kartdata har sparats för fastigheten.</p>}
          <Documents propertyId={property.propertyId} documents={property.documents} canManage={isAdmin} />
        </div>
        <aside className="detail-sidebar" aria-label="Fastighetsfakta och kontakt">
          <section className="detail-facts">
            <h2>Fastighetsfakta</h2>
            <dl>{facts.map(({ label, value, icon: Icon }) => <div key={label}><dt><Icon size={26} stroke={1.3} aria-hidden="true" />{label}</dt><dd>{value}</dd></div>)}<div><dt>Status</dt><dd>{listingStatusLabels[details.listingStatus]}</dd></div></dl>
            {openContact && <button type="button" className="detail-pill detail-primary" onClick={openContact}>Kontakta oss <IconArrowRight size={20} aria-hidden="true" /></button>}
          </section>
          <section className="detail-contact">
            <div className="detail-contact-intro"><h2>Har du frågor<br />om fastigheten?</h2><p>Kontakta Skogsbyrån för mer information om fastigheten.</p>{openContact && <button type="button" className="detail-pill" onClick={openContact}>Kontakta oss <IconArrowRight size={20} aria-hidden="true" /></button>}</div>
            <address><a href="tel:+46761354649"><IconPhone size={19} aria-hidden="true" />0761-35 46 49</a><a href="mailto:skogsbyran.jonkoping@telia.com"><IconMail size={19} aria-hidden="true" />skogsbyran.jonkoping@telia.com</a><a href="mailto:magnustrana@gmail.com"><IconMail size={19} aria-hidden="true" />magnustrana@gmail.com</a><span>Tranhult 11, 562 91 Månsarp</span></address>
          </section>
        </aside>
      </div>
      {hasMap && <dialog className="detail-map-dialog" ref={mapDialog} aria-labelledby="detail-map-title" onClose={() => setMapOpen(false)}>
        <header><h2 id="detail-map-title">{details.title} – karta</h2><button type="button" className="detail-pill" onClick={() => mapDialog.current?.close()} autoFocus>Stäng</button></header>
        {mapOpen && <Suspense fallback={<p>Kartan hämtas…</p>}><PropertyMapView key={property.propertyId} data={{ polygons: areas.map(area => area.polygon), marker, pois: location?.pois ?? [] }} /></Suspense>}
      </dialog>}
    </article>
  );
}

