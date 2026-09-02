import { Link } from "react-router-dom";
import type { PropertyListingItem } from "@/modules/property/data/types";
import { useCurrentUserQuery } from "@/modules/auth/data/auth.hooks";
import {
  formatPrice,
  listingStatusLabels,
  locationLabel,
} from "./propertyListing";

type PropertyCardProps = {
  property: PropertyListingItem;
};

function propertyMeta(property: PropertyListingItem): string {
  return [
    locationLabel(property),
    property.details.size ? `${property.details.size} ha` : null,
  ].filter(Boolean).join(" · ");
}

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.primaryImage;
  const meta = propertyMeta(property);
  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.isAdmin ?? false;

  return (
    <article className="property-listing-card-shell">
      {isAdmin ? (
        <Link
          to={`/dashboard/property/edit/${property.propertyId}`}
          className="property-listing-card-edit"
          aria-label={`Redigera ${property.details.title}`}
        >
          Redigera
        </Link>
      ) : null}

      <Link
        to={`/property/${property.propertyId}`}
        className="property-listing-card"
        aria-label={`Visa ${property.details.title}`}
      >
        {primaryImage ? (
          <div className="property-listing-card-image-frame">
            <img
              className="property-listing-card-image"
              src={primaryImage.urls.large || primaryImage.urls.medium}
              alt={primaryImage.details.altText || property.details.title}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className="property-listing-card-body">
          <span className="property-listing-card-status">
            {listingStatusLabels[property.details.listingStatus]}
          </span>

          <div className="property-listing-card-heading">
            <h3>{property.details.title}</h3>

            {property.details.price ? (
              <span className="property-listing-card-price">
                {formatPrice(property.details.price)}
              </span>
            ) : null}
          </div>

          {meta ? <p className="property-listing-card-meta">{meta}</p> : null}

          {property.details.caption ? (
            <p className="property-listing-card-caption">
              {property.details.caption}
            </p>
          ) : null}

          <span className="property-listing-card-cta">Visa fastighet →</span>
        </div>
      </Link>
    </article>
  );
}
