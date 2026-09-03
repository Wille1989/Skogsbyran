import { Link } from "react-router-dom";
import { type PropertyListingItem } from "@/modules/property/data/types";
import { useCurrentUserQuery } from "@/modules/auth/data/auth.hooks";
import {
  formatPrice,
  listingStatusLabels,
  locationLabel,
} from "./propertyListing";
import "./PropertyCard.css";
import { IconPencil } from "@tabler/icons-react";

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
    <article className="property-card">
      {isAdmin ? (
        <Link
          to={`/dashboard/property/edit/${property.propertyId}`}
          className="edit"
          aria-label={`Redigera ${property.details.title}`}
        >
          <IconPencil size={20} stroke={1.5} />
        </Link>
      ) : null}

      <Link
        to={`/property/${property.propertyId}`}
        className="card-link"
        aria-label={`Visa ${property.details.title}`}
      >
        {primaryImage ? (
          <div className="image-frame">
            <img
              src={primaryImage.urls.large || primaryImage.urls.medium}
              alt={primaryImage.details.altText || property.details.title}
              loading="lazy"
              decoding="async"
            />
          </div>
        ) : null}

        <div className="body">
          <span className="status">
            {listingStatusLabels[property.details.listingStatus]}
          </span>

          <div className="heading">
            <h3>{property.details.title}</h3>

            {property.details.price ? (
              <span className="price">
                {formatPrice(property.details.price)}
              </span>
            ) : null}
          </div>

          {meta ? <p className="meta">{meta}</p> : null}

          {property.details.caption ? (
            <p className="caption">
              {property.details.caption}
            </p>
          ) : null}

          <span className="cta">Visa fastighet →</span>
        </div>
      </Link>
    </article>
  );
}
