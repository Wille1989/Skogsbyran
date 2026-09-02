import { usePropertiesQuery } from "../data/queries";
import { PropertyCard } from "./PropertyCard";
import { groupPropertiesByStatus } from "./propertyListing";
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

  const sections = groupPropertiesByStatus(properties);

  return (
    <section className="property-index" aria-labelledby="property-index-title">
      <div>
        <h2 id="property-index-title">Fastigheter till salu</h2>
      </div>

      {sections.map((section) => (
        <section
          className="property-listing-section"
          key={section.title}
          aria-labelledby={`property-section-${section.title}`}
        >
          <h3 id={`property-section-${section.title}`}>{section.title}</h3>

          <div className="property-listing-stack">
            {section.properties.map((property) => (
              <PropertyCard property={property} key={property.propertyId} />
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
