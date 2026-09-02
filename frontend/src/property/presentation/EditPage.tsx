import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { ResponseProperty } from "../../shared/data/response";
import "../../shared/presentation/spinner.css";
import { useSavePropertyChangesMutation } from "../data/editMutations";
import {
  areaDraftsFromProperty,
  documentDraftsFromProperty,
  locationDraftFromProperty,
  type EditableAreaDraft,
  type EditableDocumentDraft,
} from "../data/editDrafts";
import { usePropertyByIdQuery } from "../data/queries";
import { DetailsForm } from "../details/Form";
import { type FormDetails } from "../details/types";
import { EditableDocuments } from "../documents/EditableDocuments";
import { type PendingDocument } from "../documents/types";
import { useImageFiles } from "../images/data/useImageFiles";
import { type ImageFile } from "../images/data/types";
import { ImageDropZone } from "../images/presentation/FileDropContainer.tsx";
import { ImageEditDialog } from "../images/presentation/ImageEditDialog.tsx";
import { LocationEditor } from "../location/LocationEditor";
import { createDefaultLocationDraft, type PropertyLocationDraft } from "../location/types";
import { EditableAreas } from "../map/presentation/EditableAreas";
import "./EditPage.css";

function initialDetails(property: ResponseProperty | undefined): FormDetails | null {
  return property?.details ?? null;
}

export function EditPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const saveChanges = useSavePropertyChangesMutation();
  const imageFiles = useImageFiles();
  const { images, initializeImages } = imageFiles;
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [loadedPropertyId, setLoadedPropertyId] = useState<string | null>(null);
  const [location, setLocation] = useState<PropertyLocationDraft>(createDefaultLocationDraft);
  const [areas, setAreas] = useState<EditableAreaDraft[]>([]);
  const [documents, setDocuments] = useState<EditableDocumentDraft[]>([]);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>([]);

  const property = data?.property;

  useEffect(() => {
    if (!property || loadedPropertyId === property.propertyId) {
      return;
    }

    initializeImages(property.images);
    setLocation(locationDraftFromProperty(property));
    setAreas(areaDraftsFromProperty(property));
    setDocuments(documentDraftsFromProperty(property));
    setPendingDocuments([]);
    setLoadedPropertyId(property.propertyId);
  }, [initializeImages, loadedPropertyId, property]);

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

  const handleSave = (details: FormDetails): void => {
    saveChanges.mutate({
      propertyId: property.propertyId,
      details,
      initialDetails: property.details,
      imageChanges: imageFiles.buildChanges(),
      location,
      initialLocation: property.location,
      areas,
      initialAreas: property.areas,
      documents,
      pendingDocuments,
    });
  };

  return (
    <>
      <main className="update-section-shell">
        <div className="edit-page-header">
          <div>
            <span>Admin</span>
            <h1>Redigera fastighet</h1>
          </div>

          {saveChanges.isSuccess ? (
            <p className="edit-save-status">Förändringarna är sparade.</p>
          ) : null}
        </div>

        <div className="update-section-grid">
          <section className="property-details">
            <DetailsForm
              initialValues={initialDetails(property) ?? undefined}
              onSubmit={handleSave}
            />
          </section>

          <section className="property-images">
            <ImageDropZone
              imageFiles={imageFiles}
              onEditExistingImage={setEditingImageId}
            />
          </section>

          <section className="property-location">
            <LocationEditor value={location} onChange={setLocation} />
          </section>

          <EditableAreas areas={areas} onChange={setAreas} />

          <section className="property-documents">
            <EditableDocuments
              documents={documents}
              pendingDocuments={pendingDocuments}
              onDocumentsChange={setDocuments}
              onPendingDocumentsChange={setPendingDocuments}
            />
          </section>

          {saveChanges.error instanceof Error ? (
            <p className="form-error" role="alert">
              {saveChanges.error.message}
            </p>
          ) : null}

          <div className="form-actions edit-form-actions">
            <button
              type="submit"
              form="property-form"
              className="form-submit"
              disabled={saveChanges.isPending}
            >
              {saveChanges.isPending ? "Sparar förändringarna..." : "Spara förändringarna"}
            </button>
          </div>
        </div>
      </main>

      {editingImage ? (
        <ImageEditDialog
          propertyId={property.propertyId}
          image={editingImage}
          onClose={() => setEditingImageId(null)}
        />
      ) : null}
    </>
  );
}
