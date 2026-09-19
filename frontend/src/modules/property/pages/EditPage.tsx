import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { preparingProgress, PropertySaveError } from "../services/saveProgress";
import type { SavePropertyProgress } from "../types/types";
import type { ResponseProperty } from "@/modules/property/types/types";
import { LoadingSpinner } from "@/shared/components/LoadingSpinner.tsx";
import { useDeletePropertyMutation, useSavePropertyChangesMutation } from "../hooks/editMutations";
import {
  areaDraftsFromProperty,
  documentDraftsFromProperty,
  locationDraftFromProperty,
  mapSaveInput,
  areaChanges,
  changedLocationPayload,
  type EditableAreaDraft,
  type EditableDocumentDraft,
} from "@/modules/property/helpers/editDrafts";
import { usePropertyByIdQuery } from "../hooks/queries";
import { type FormDetails } from "../details/types/types";
import { EditableDocuments } from "@/modules/document/components/EditableDocuments";
import { type PendingDocument } from "@/modules/document/types/types";
import { useImageFiles } from "@/modules/image/hooks/useImageFiles";
import { type ImageFile } from "@/modules/image/types/types";
import { ImageEditDialog } from "@/modules/image/components/ImageEditDialog.tsx";
import { createDefaultLocationDraft, type PropertyLocationDraft } from "@/modules/location/types/types";
import { PropertyForm } from "@/modules/property/components/PropertyForm";

function initialDetails(property: ResponseProperty | undefined): FormDetails | null {
  return property?.details ?? null;
}

export function EditPage() {
  const { propertyId = "" } = useParams<{ propertyId: string }>();
  const { data, isPending, error } = usePropertyByIdQuery(propertyId);
  const saveChanges = useSavePropertyChangesMutation();
  const saveMap = useSavePropertyChangesMutation();
  const deleteProperty = useDeletePropertyMutation();
  const navigate = useNavigate();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const deleting = useRef(false);
  const saving = useRef(false);
  const [saveProgress, setSaveProgress] = useState<SavePropertyProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapProgress, setMapProgress] = useState<SavePropertyProgress | null>(null);
  const mapFailure = saveMap.error instanceof PropertySaveError ? saveMap.error : null;
  const failure = saveChanges.error instanceof PropertySaveError ? saveChanges.error : null;
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

        <p role="alert">{error instanceof Error ? error.message : "Fastigheten gick inte att läsa in."}</p>
      </section>
    );
  }

  const editingImage = images.find((image): image is ImageFile =>
    !("file" in image) && image.imageId === editingImageId) ?? null;

  const handleSave = (details: FormDetails): void => {
    if (deleting.current || saving.current || failure?.requiresReview || mapFailure?.requiresReview) return;
    saving.current = true;
    setValidationError(null);
    setSaveProgress(preparingProgress(false));
    try {
      saveChanges.mutate(
        {
          propertyId: property.propertyId,
          details,
          initialDetails: property.details,
          onProgress: setSaveProgress,
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
          onSettled: () => { saving.current = false; },
          onError: error => {
            if (!(error instanceof PropertySaveError)) {
              setSaveProgress(null);
              setValidationError("Kontrollera kartområden, koordinater och bilduppgifter innan du sparar igen.");
            }
          },
          onSuccess: (savedProperty) => {
            setMapError(null);
            setMapProgress(null);
            saveMap.reset();
            initializeImages(savedProperty.images);
            setLocation(locationDraftFromProperty(savedProperty));
            setAreas(areaDraftsFromProperty(savedProperty));
            setDocuments(documentDraftsFromProperty(savedProperty));
            setPendingDocuments([]);
            setLoadedPropertyId(savedProperty.propertyId);
          },
        },
      );
    } catch {
      saving.current = false;
      setSaveProgress(null);
      setValidationError("Kontrollera bilduppgifterna innan du sparar igen.");
    }
  };

  const handleDelete = (): void => {
    if (deleting.current || saving.current || saveChanges.isPending) return;
    deleting.current = true;
    deleteProperty.mutate(property.propertyId, {
      onSuccess: () => navigate("/admin/properties", { replace: true }),
      onError: () => { deleting.current = false; },
    });
  };

  let mapDirty = true;
  try {
    const changes = areaChanges(property.areas, areas);
    mapDirty = !!changedLocationPayload(property.location, location)
      || !!(changes.createdAreas.length || changes.updatedAreas.length || changes.removedAreaIds.length);
  } catch { /* Invalid drafts still need the save action to display validation. */ }

  const handleMapSave = async (): Promise<void> => {
    if (saving.current || deleting.current || failure?.requiresReview || mapFailure?.requiresReview) return;
    saving.current = true;
    setMapError(null);
    setMapProgress(preparingProgress(false));
    try {
      const savedProperty = await saveMap.mutateAsync({
        ...mapSaveInput(property, location, areas),
        onProgress: setMapProgress,
        onAreaCreated: (draft, saved) => setAreas(current => current.map(area => area === draft ? { ...area, id: saved.id } : area)),
      });
      setLocation(locationDraftFromProperty(savedProperty));
      setAreas(areaDraftsFromProperty(savedProperty));
    } catch (error) {
      setMapError(error instanceof Error ? error.message : "Kartan kunde inte sparas. Ditt utkast finns kvar.");
      setMapProgress(null);
    } finally { saving.current = false; }
  };

  return (
    <>
      <PropertyForm
        title="Redigera fastighet" subtitle={property.details.title} submitLabel="Spara ändringar"
        initialDetails={initialDetails(property) ?? undefined} onSubmit={handleSave}
        imageFiles={imageFiles} onEditImage={setEditingImageId} isSaving={saveChanges.isPending || deleteProperty.isPending}
        isDeleting={deleteProperty.isPending}
        onSaveMap={handleMapSave} isMapSaving={saveMap.isPending}
        mapSaveStatus={mapError ?? (saveMap.isPending ? mapProgress?.title ?? "Sparar karta…" : mapDirty ? "Kartan har osparade ändringar." : "Kartan är sparad.")}
        mapSaveError={!!mapError} mapSaveBlocked={!!mapFailure?.requiresReview || !!failure?.requiresReview}
        mapDirty={mapDirty}
        mapReviewUrl={mapFailure?.requiresReview ? "/admin/properties/" + property.propertyId + "/edit" : undefined}
        onDelete={() => { deleteProperty.reset(); deleteDialog.current?.showModal(); }}
        location={location} onLocationChange={setLocation} areas={areas} onAreasChange={setAreas}
        documents={<EditableDocuments documents={documents} pendingDocuments={pendingDocuments} onDocumentsChange={setDocuments} onPendingDocumentsChange={setPendingDocuments} />}
        error={validationError} progress={saveProgress} saveBlocked={!!failure?.requiresReview || !!mapFailure?.requiresReview}
        fieldErrors={failure?.fieldErrors}
        reviewUrl={failure?.requiresReview ? "/admin/properties/" + property.propertyId + "/edit" : undefined}
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
