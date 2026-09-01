import "./ShowPage.css";
import "../../shared/presentation/spinner.css";
import { useNavigate, useParams } from "react-router-dom";
import { isCurrentUserAdmin } from "../../user/data/authSession.ts";
import { usePropertyByIdQuery } from "../../property/data/queries.ts";
import { Details } from "../../property/details/Details.tsx";
import { Images } from "../../property/images/presentation/Images.tsx";
import { Documents } from "../../property/documents/Documents.tsx";

export function ShowPage()
{
  const navigate = useNavigate();
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const isAdmin = isCurrentUserAdmin();

  if(isPending) {
     return <div className="spinner" />
  }

  if (error || !data?.property) {
      return (
          <section className="property-detail-shell">
              <h1>Fastigheten kunde inte hämtas</h1>

              <p>Det gick inte att läsa in fastigheten just nu.</p>
          </section>
      );
  }

  const property = data.property;

  return (
    <main className="property-detail-shell">
        <button
            type="button"
            className="property-detail-backlink"
            onClick={() => navigate("/")}
        >
            Tillbaka
        </button>

        <Details
            details={{
                title: property.details.title,  
                caption: property.details.caption,
                price: property.details.price,
                size: property.details.size,
            }}
        />

        <Images
            propertyId={property.propertyId}
            images={property.images}
            propertyTitle={property.details.title}
            canEdit={isAdmin}
        />

        <Documents
            propertyId={property.propertyId}
            documents={property.documents}
        />

        {/*
        <Map
            propertyId={property.propertyID}
            areas={property.areas}
            canEdit={isAdmin}
        />
        */}
    </main>
  );
}