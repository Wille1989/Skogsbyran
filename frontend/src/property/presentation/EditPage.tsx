import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { usePropertyByIdQuery } from "../data/queries";
import { DetailsForm } from "../details/Form";
import { usePatchDetailsMutation } from "../details/mutations";
import { useImageFiles } from "../images/data/useImageFiles";
import { ImageDropZone } from "../images/presentation/FileDropContainer.tsx";
import { ImageEditDialog } from "../images/presentation/ImageEditDialog.tsx";
import { Documents } from "../documents/Documents";
import { type FormDetails } from "../details/types";
import { type ImageFile } from "../images/data/types";

import "./EditPage.css";
import "../../shared/presentation/spinner.css";

export function EditPage() {
    const { propertyId = "" } = useParams<{ propertyId: string }>();
    const { data, isPending, error } = usePropertyByIdQuery(propertyId);
    const updateDetails = usePatchDetailsMutation();
    const imageFiles = useImageFiles();
    const { images, initializeImages } = imageFiles;
    const [editingImageId, setEditingImageId] = useState<string | null>(null);

    const property = data?.property;

    useEffect(() => {
      if (!property) {
          return;
      }

      initializeImages(property.images);
    }, [property, initializeImages]);

    if (isPending) {
      return <div className="spinner" />;
    }

    if (error || !property) {
      return (
          <section className="property-detail-shell-section">
              <h1>Redigering kunde inte öppnas</h1>

              <p>Fastigheten gick inte att läsa in.</p>
          </section>
      );
    }

    const editingImage = images.find((image): image is ImageFile =>
      !("file" in image) && image.imageId === editingImageId) ?? null;

    const handleDetailsSubmit = (details: FormDetails): void => {
      updateDetails.mutate({
          propertyId: property.propertyId,
          patch: details,
      });
    };

    return (
      <>
        <main className="update-section-shell">
        <h1>Redigera fastighet</h1>

        <div className="update-section-grid">
          <section className="property-details">
            <DetailsForm
              initialValues={property.details}
              onSubmit={handleDetailsSubmit}
            />
          </section>

          <section className="property-images">
            <ImageDropZone
              imageFiles={imageFiles}
              onEditExistingImage={setEditingImageId}
            />
          </section>

          <section className="property-documents">
            <Documents
              propertyId={property.propertyId}
              documents={property.documents}
            />
          </section>

          {/*
          <section className="property-map">
          <MapEditor
          propertyId={
          property.propertyId
          }
          areas={
          property.areas
          }
          />
          </section>
          */}
        </div>
        </main>

        {editingImage && (
          <ImageEditDialog
            propertyId={property.propertyId}
            image={editingImage}
            onClose={() => setEditingImageId(null)}
          />
        )}
    </>
  );
}