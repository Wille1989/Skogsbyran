import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { ResponseProperty } from "@/modules/property/data/types";
import { LoadingSpinner } from "@/shared/presentation/LoadingSpinner.tsx";
import { useDeletePropertyMutation, useSavePropertyChangesMutation } from "../data/editMutations";
import {
  areaDraftsFromProperty,
  documentDraftsFromProperty,
  locationDraftFromProperty,
  type EditableAreaDraft,
  type EditableDocumentDraft,
} from "@/modules/property/data/editDrafts";
import { usePropertyByIdQuery } from "../data/queries";
import { type FormDetails } from "../details/types";
import { EditableDocuments } from "@/modules/document/EditableDocuments";
import { type PendingDocument } from "@/modules/document/types";
import { useImageFiles } from "@/modules/image/data/useImageFiles";
import { type ImageFile } from "@/modules/image/data/types";
import { ImageEditDialog } from "@/modules/image/presentation/ImageEditDialog.tsx";
import { createDefaultLocationDraft, type PropertyLocationDraft } from "@/modules/location/types";
import { PropertyForm } from "@/modules/admin/presentation/PropertyForm";

function initialDetails(property: ResponseProperty | undefined): FormDetails | null {
  return property?.details ?? null;
}

export function EditPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const saveChanges = useSavePropertyChangesMutation();
  const deleteProperty = useDeletePropertyMutation();
  const navigate = useNavigate();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleting = useRef(false);
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

  if (isPending || (property && loadedPropertyId !== property.propertyId)) {
    return <LoadingSpinner />;
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
    if (deleting.current || saveChanges.isPending) return;
    saveChanges.mutate(
      {
        propertyId: property.propertyId,
        details,
        initialDetails: property.details,
        imageChanges: imageFiles.buildChanges(),
        location,
        initialLocation: property.location,
        areas,
        initialAreas: property.areas,
        onAreaCreated: (draft, saved) => setAreas(current => current.map(area => area === draft ? { ...area, id: saved.id } : area)),
        documents,
        pendingDocuments,
      },
      {
        onSuccess: (savedProperty) => {
          initializeImages(savedProperty.images);
          setLocation(locationDraftFromProperty(savedProperty));
          setAreas(areaDraftsFromProperty(savedProperty));
          setDocuments(documentDraftsFromProperty(savedProperty));
          setPendingDocuments([]);
          setLoadedPropertyId(savedProperty.propertyId);
        },
      },
    );
  };

  const handleDelete = (): void => {
    if (deleting.current || saveChanges.isPending) return;
    deleting.current = true;
    deleteProperty.mutate(property.propertyId, {
      onSuccess: () => navigate("/admin/properties", { replace: true }),
      onError: () => { deleting.current = false; },
    });
  };

  return (
    <>
      <PropertyForm
        title="Redigera fastighet" subtitle={property.details.title} submitLabel="Spara ändringar"
        initialDetails={initialDetails(property) ?? undefined} onSubmit={handleSave}
        imageFiles={imageFiles} onEditImage={setEditingImageId} isSaving={saveChanges.isPending || deleteProperty.isPending}
        isDeleting={deleteProperty.isPending}
        onDelete={() => { deleteProperty.reset(); deleteDialog.current?.showModal(); }}
        location={location} onLocationChange={setLocation} areas={areas} onAreasChange={setAreas}
        documents={<EditableDocuments documents={documents} pendingDocuments={pendingDocuments} onDocumentsChange={setDocuments} onPendingDocumentsChange={setPendingDocuments} />}
        error={saveChanges.error instanceof Error ? saveChanges.error.message : null} saved={saveChanges.isSuccess}
      />

      <dialog ref={deleteDialog} className="property-delete-dialog" aria-labelledby="property-delete-title"
        onCancel={event => { if (deleting.current) event.preventDefault(); }}>
        <h2 id="property-delete-title">Radera fastigheten?</h2>
        <p>Fastigheten samt tillhörande bilder, dokument och sparad data raderas permanent.</p>
        <p>Åtgärden kan inte ångras.</p>
        {deleteProperty.error && <p className="admin-error" role="alert">{deleteProperty.error.message}</p>}
        <div className="admin-property-actions">
          <button type="button" className="admin-button" autoFocus disabled={deleteProperty.isPending} onClick={() => deleteDialog.current?.close()}>Avbryt</button>
          <button type="button" className="admin-button is-danger" disabled={deleteProperty.isPending} onClick={handleDelete}>{deleteProperty.isPending ? "Raderar..." : "Radera fastighet"}</button>
        </div>
      </dialog>

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
