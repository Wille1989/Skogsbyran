import { draftDetails } from "../details/helpers/publication";
import { useRef, useState } from "react";
import { useAdminNotification } from "@/modules/admin/hooks/useAdminNotification";
import { createDefaultAreaDraft, buildAreaPayload } from "@/modules/location/map/helpers/areaDraft";
import { useImageFiles } from "@/modules/image/hooks/useImageFiles";
import { useCreatePropertyMutation } from "../hooks/mutations";
import type { FormDetails } from "../details/types/types";
import type { PropertyAreaDraft } from "@/modules/location/map/types/types";
import { PendingDocuments } from "@/modules/document/components/PendingDocuments";
import type { PendingDocument } from "@/modules/document/types/types";
import { buildLocationPayload, createDefaultLocationDraft, type PropertyLocationDraft } from "@/modules/location/types/types";
import type { SavePropertyProgress } from "../types/types";
import { preparingProgress, PropertySaveError } from "../services/saveProgress";
import { UnsavedChangesDialog } from "../components/UnsavedChangesDialog";
import { useQueryClient } from "@tanstack/react-query";
import { propertyQueryKeys } from "../api/queryKeys";
import { PropertyForm } from "@/modules/property/components/PropertyForm";

export function CreatePage() {
  const queryClient = useQueryClient();
  const valuesRef = useRef<(() => FormDetails) | null>(null);
  const [dirtyFields, setDirtyFields] = useState<string[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  const notify = useAdminNotification();
  const createProperty = useCreatePropertyMutation();
  const saving = useRef(false);
  const imageFiles = useImageFiles();
  const [areaDrafts, setAreaDrafts] = useState<PropertyAreaDraft[]>([createDefaultAreaDraft()]);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [location, setLocation] = useState<PropertyLocationDraft>(createDefaultLocationDraft);
  const [saveProgress, setSaveProgress] = useState<SavePropertyProgress | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const failure = createProperty.error instanceof PropertySaveError ? createProperty.error : null;
  const blocked = !!createdId || !!failure?.requiresReview;

  const handleSubmit = (details: FormDetails): void => {
    if (saving.current || blocked) return;
    saving.current = true;
    setValidationError(null);
    setSaveProgress(preparingProgress(true));
    try {
      const imageChanges = imageFiles.buildChanges();
      const areas = areaDrafts.flatMap(draft => { const area = buildAreaPayload(draft); return area ? [area] : []; });
      createProperty.mutate({ details, images: imageChanges.newImages, areas,
        location: buildLocationPayload(location), documents, onProgress: setSaveProgress }, {
        onSuccess: result => {
          setCreatedId(result.property.propertyId);
          notify(`Fastigheten ”${result.property.details.title}” har skapats.`);
        },
        onSettled: () => { saving.current = false; },
      });
    } catch (error) {
      saving.current = false;
      setValidationError(error instanceof Error ? error.message : "Kontrollera kartuppgifterna.");
      setSaveProgress(null);
    }
  };

  const saveDraft = async (): Promise<boolean> => {
    if (saving.current || blocked || !valuesRef.current) return false;
    saving.current = true;
    setSavingDraft(true);
    setValidationError(null);
    try {
      const values = valuesRef.current();
      const details = draftDetails(values);
      const areas = areaDrafts.flatMap(draft => { const area = buildAreaPayload(draft); return area ? [area] : []; });
      const result = await createProperty.mutateAsync({ details, images: imageFiles.buildChanges().newImages,
        areas, location: buildLocationPayload(location), documents });
      setCreatedId(result.property.propertyId);
      await queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all });
      notify("Utkastet är sparat som en dold fastighet. Du hittar det i översikten.");
      return true;
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Utkastet kunde inte sparas. Dina uppgifter finns kvar.");
      return false;
    } finally { saving.current = false; setSavingDraft(false); }
  };

  const mapDirty = JSON.stringify(location) !== JSON.stringify(createDefaultLocationDraft())
    || JSON.stringify(areaDrafts) !== JSON.stringify([createDefaultAreaDraft()]);

  return <>
    <UnsavedChangesDialog fields={dirtyFields} mapDirty={mapDirty} imageDirty={imageFiles.images.length > 0}
      documentDirty={documents.length > 0} disabled={!!createdId} onSaveDraft={saveDraft}
      saveDraftError={validationError} saveDraftBlocked={blocked || createProperty.isPending} />
    <PropertyForm valuesRef={valuesRef} onDirtyFieldsChange={setDirtyFields} title="Skapa ny fastighet" submitLabel="Skapa fastighet" onSubmit={handleSubmit}
    imageFiles={imageFiles} isSaving={createProperty.isPending} saveBlocked={blocked}
    location={location} onLocationChange={setLocation} areas={areaDrafts} onAreasChange={setAreaDrafts}
    documents={<PendingDocuments documents={documents} onChange={setDocuments} />}
    error={validationError} progress={savingDraft ? null : saveProgress}
    fieldErrors={failure?.fieldErrors}
    reviewUrl={createdId ? "/admin/properties/" + createdId + "/edit" : failure?.requiresReview ? failure.propertyId ? "/admin/properties/" + failure.propertyId + "/edit" : "/admin" : undefined}
  /></>;
}
