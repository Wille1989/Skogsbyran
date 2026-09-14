import { useState } from "react";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { usePropertiesQuery } from "../data/queries";
import { PropertyCard } from "./PropertyCard";
import { groupPropertiesByStatus } from "./propertyListing";
import "./IndexPage.css";

const filters = [
  { title: "Aktuella fastigheter", label: "Till salu" },
  { title: "Kommande", label: "Kommande" },
  { title: "Förmedlade", label: "Sålda" },
];

export function IndexPage() {
  const { data, isPending, error } = usePropertiesQuery();
  const [selected, setSelected] = useState(filters[0].title);
  const sections = groupPropertiesByStatus(data?.properties ?? []);
  const activeSection = sections.find(section => section.title === selected) ?? sections[0];

  return (
    <>
      <section id="fastigheter" className="property-index" aria-labelledby="property-index-title">
        <h2 id="property-index-title">Fastigheter till salu</h2>
        <div className="property-filters" role="group" aria-label="Filtrera fastigheter efter status">
          {filters.map(filter => {
            const count = sections.find(section => section.title === filter.title)?.properties.length ?? 0;
            return (
              <button key={filter.title} type="button" disabled={count === 0 || isPending || Boolean(error)}
                aria-pressed={activeSection?.title === filter.title} aria-controls="property-results"
                onClick={count > 0 ? () => setSelected(filter.title) : undefined}>
                {filter.label} ({count})
              </button>
            );
          })}
        </div>
        <div id="property-results" className="property-listing-stack" aria-live="polite" aria-busy={isPending}>
          {isPending ? <p>Fastigheter hämtas...</p> : error ? <p role="alert">Det gick inte att läsa in fastigheterna just nu.</p> : activeSection ? (
            activeSection.properties.map(property => <PropertyCard property={property} key={property.propertyId} />)
          ) : <p>Det finns inga fastigheter publicerade ännu.</p>}
        </div>
      </section>
      <section className="home-about" aria-labelledby="home-about-title">
        <div className="home-about-inner">
          <div className="home-about-copy">
            <p className="home-about-eyebrow">Om Skogsbyrån</p>
            <h2 id="home-about-title">Skog och mark.<br />Med dina intressen i fokus.</h2>
            <p>Skogsbyrån i Jönköping arbetar med rådgivning och fastighetsförmedling för dig som äger, köper eller säljer skog, mark och lantbruksfastigheter.</p>
            <p>Vi är oberoende av organisationer, banker och andra aktörer. Vårt fokus ligger på kundens intressen och på den lösning som passar fastigheten och situationen bäst.</p>
            <p>Vår ambition är att skapa goda förutsättningar för en trygg och väl genomförd försäljning.</p>
            <Link className="home-about-link" to="/om-oss">Läs mer om Skogsbyrån <IconArrowRight size={20} aria-hidden="true" /></Link>
          </div>
          <div className="home-about-images" aria-hidden="true">
            <div className="home-about-landscape"><img src="/images/landscape.png" alt="" loading="lazy" /></div>
            <img className="home-about-detail" src="/images/woodland.webp" alt="" loading="lazy" />
            <p className="home-about-note">Skog, mark<br />och möjligheter.</p>
          </div>
        </div>
      </section>
    </>
  );
}
