import { Link } from "react-router-dom";
import { type PropertyListingItem } from "@/modules/property/data/types";
import { formatHectares, formatPrice, listingStatusLabels, locationLabel } from "./propertyListing";
import { IconArrowRight, IconMapPin, IconTrees } from "@tabler/icons-react";
import "./PropertyCard.css";

type PropertyCardProps = { property: PropertyListingItem };

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.primaryImage;
  const location = locationLabel(property);

  return (
    <article className="property-card">
      <Link to={`/property/${property.propertyId}`} className="card-link" aria-label={`Visa ${property.details.title}`}>
        <div className="image-frame">
          <span className="status">{listingStatusLabels[property.details.listingStatus]}</span>
          {primaryImage ? (
            <img src={primaryImage.urls.large} alt={property.details.title} loading="lazy" decoding="async" />
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
