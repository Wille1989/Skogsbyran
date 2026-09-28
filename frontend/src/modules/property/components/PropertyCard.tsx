import { Link } from "react-router-dom";
import { recordEvent } from "@/modules/analytics/api/api";
import { type PropertyListingItem } from "@/modules/property/types/types";
import { formatHectares, formatPrice, listingStatusLabels, locationLabel } from "../helpers/propertyListing";
import { IconArrowRight, IconMapPin, IconTrees } from "@tabler/icons-react";
import "./PropertyCard.css";

type PropertyCardProps = { property: PropertyListingItem };

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.primaryImage;
  const location = locationLabel(property);

  return (
    <article className="property-card">
      <Link to={`/property/${property.propertyId}`} onClick={() => recordEvent({ event_type: "property_click", property_id: property.propertyId })} onAuxClick={event => { if (event.button === 1) recordEvent({ event_type: "property_click", property_id: property.propertyId }); }} className="card-link" aria-label={`Visa ${property.details.title}`}>
        <div className="image-frame">
          <span className="status">{listingStatusLabels[property.details.listingStatus]}</span>
          {primaryImage ? (
            <img
                src={primaryImage.urls.medium || primaryImage.urls.large}
                srcSet={primaryImage.urls.medium ? `${primaryImage.urls.medium} 800w, ${primaryImage.urls.large} 1600w` : undefined}
                sizes="(max-width: 760px) calc(100vw - 58px), (max-width: 1368px) calc(54.5vw - 40px), 705px"
                alt={property.details.title} loading="lazy" decoding="async"
            />
          ) : <span className="image-placeholder">Bild saknas</span>}
        </div>
        <div className="body">
          <div className="heading">
            <h3>{property.details.title}</h3>
            {property.details.price && <span className="price">{formatPrice(property.details.price)}</span>}
          </div>
          <div className="meta">
            {property.details.size && <span><IconTrees size={24} stroke={1.3} aria-hidden="true" />{formatHectares(property.details.size)}</span>}
            {location && <span><IconMapPin size={24} stroke={1.3} aria-hidden="true" />{location}</span>}
          </div>
          <div className="card-summary">
            {property.details.caption && <p className="caption">{property.details.caption}</p>}
            <span className="cta" aria-hidden="true"><IconArrowRight size={23} stroke={1.5} /></span>
          </div>
        </div>
      </Link>
    </article>
  );
}
