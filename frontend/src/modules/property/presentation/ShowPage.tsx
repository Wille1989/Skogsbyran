import "./ShowPage.css";
import "@/shared/presentation/spinner.css";
import { useNavigate, useParams } from "react-router-dom";
import { useCurrentUserQuery } from "@/modules/auth/data/auth.hooks.ts";
import { usePropertyByIdQuery } from "@/modules/property/data/queries.ts";
import { Details } from "@/modules/property/details/Details.tsx";
import { Images } from "@/modules/image/presentation/Images.tsx";
import { Documents } from "@/modules/document/Documents.tsx";

export function ShowPage()
{
  const navigate = useNavigate();
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const { data: currentUser } = useCurrentUserQuery();
  const isAdmin = currentUser?.isAdmin ?? false;

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
            details={property.details}
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
    </main>
  );
}
