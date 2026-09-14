import { Link } from "react-router-dom";
import { type PropertyListingItem } from "@/modules/property/data/types";
import { useCurrentUserQuery } from "@/modules/auth/data/auth.hooks";
import { formatPrice, listingStatusLabels, locationLabel } from "./propertyListing";
import { IconArrowRight, IconMapPin, IconPencil, IconTrees } from "@tabler/icons-react";
import "./PropertyCard.css";

type PropertyCardProps = { property: PropertyListingItem };

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.primaryImage;
  const location = locationLabel(property);
  const { data: currentUser } = useCurrentUserQuery();

  return (
    <article className="property-card">
      {currentUser?.isAdmin && (
        <Link to={`/dashboard/property/edit/${property.propertyId}`} className="edit" aria-label={`Redigera ${property.details.title}`}>
          <IconPencil size={20} stroke={1.5} />
        </Link>
      )}
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
            {property.details.size && <span><IconTrees size={24} stroke={1.3} aria-hidden="true" />{property.details.size} ha</span>}
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
