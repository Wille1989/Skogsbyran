import { Link } from "react-router-dom";
import { usePropertiesQuery } from "../data/queries";
import "./IndexPage.css";

export function IndexPage() {
  const { data, isPending, error } = usePropertiesQuery();
  const properties = data?.properties ?? [];

  if (isPending) {
    return (
      <section className="property-index">
        <p>Fastigheter hämtas...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="property-index">
        <h2>Fastigheter kunde inte hämtas</h2>
        <p>Det gick inte att läsa in fastigheterna just nu.</p>
      </section>
    );
  }

  if (properties.length === 0) {
    return (
      <section className="property-index">
        <h2>Fastigheter till salu</h2>
        <p>Det finns inga fastigheter publicerade ännu.</p>
      </section>
    );
  }

  return (
    <section className="property-index" aria-labelledby="property-index-title">
      <div>
        <h2 id="property-index-title">Fastigheter till salu</h2>
      </div>

      <div className="product-grid-card">
        {properties.map((property) => {
          const primaryImage = property.images[0] ?? null;
          const secondaryImages = property.images.slice(1, 3);

          return (
            <article className="container" key={property.propertyId}>
              <div className="property-card-container">
                <Link
                  to={`/property/${property.propertyId}`}
                  className="property-card-click-target"
                  aria-label={`Visa ${property.details.title}`}
                />

                <div className="property-card-copy">
                  <span className="property-card-kicker">Fastighet</span>
                  <h3>{property.details.title}</h3>
                  {property.details.caption ? (
                    <p>{property.details.caption}</p>
                  ) : null}

                  <div className="property-card-facts">
                    {property.details.price ? (
                      <span className="property-card-price">{property.details.price} kr</span>
                    ) : null}
                    {property.details.size ? (
                      <span className="property-card-price">{property.details.size} ha</span>
                    ) : null}
                  </div>
                </div>

                {primaryImage ? (
                  <div className="property-card-hero">
                    <img
                      className="property-card-image"
                      src={primaryImage.urls.medium}
                      alt={primaryImage.details.altText || property.details.title}
                      loading="lazy"
                      decoding="async"
                    />
                    {primaryImage.details.caption ? (
                      <span className="property-card-badge">
                        {primaryImage.details.caption}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {secondaryImages.length > 0 ? (
                  <div className="property-card-secondary-images">
                    {secondaryImages.map((image) => (
                      <img
                        key={image.imageId}
                        className="property-card-secondary-image"
                        src={image.urls.thumbnail}
                        alt={image.details.altText || property.details.title}
                        loading="lazy"
                        decoding="async"
                      />
                    ))}
                  </div>
                ) : null}

                <span className="property-card-overlay-link">
                  Visa fastighet
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
