import { useRef, useState } from "react";
import { createDefaultAreaDraft, buildAreaPayload } from "@/modules/location/map/data/areaDraft";
import { useImageFiles } from "@/modules/image/data/useImageFiles";
import { useCreatePropertyMutation } from "../data/mutations";
import type { FormDetails } from "../details/types";
import type { PropertyAreaDraft } from "@/modules/location/map/data/types";
import { PendingDocuments } from "@/modules/document/PendingDocuments";
import type { PendingDocument } from "@/modules/document/types";
import { buildLocationPayload, createDefaultLocationDraft, type PropertyLocationDraft } from "@/modules/location/types";
import type { SavePropertyProgress } from "../data/types";
import { preparingProgress, PropertySaveError } from "../data/saveProgress";
import { PropertyForm } from "@/modules/admin/presentation/PropertyForm";

export function CreatePage() {
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
        onSuccess: result => setCreatedId(result.property.propertyId),
        onSettled: () => { saving.current = false; },
      });
    } catch (error) {
      saving.current = false;
      setValidationError(error instanceof Error ? error.message : "Kontrollera kartuppgifterna.");
      setSaveProgress(null);
    }
  };

  return <PropertyForm title="Skapa ny fastighet" submitLabel="Skapa fastighet" onSubmit={handleSubmit}
    imageFiles={imageFiles} isSaving={createProperty.isPending} saveBlocked={blocked}
    location={location} onLocationChange={setLocation} areas={areaDrafts} onAreasChange={setAreaDrafts}
    documents={<PendingDocuments documents={documents} onChange={setDocuments} />}
    error={validationError} progress={saveProgress}
    fieldErrors={failure?.fieldErrors}
    reviewUrl={createdId ? "/admin/properties/" + createdId + "/edit" : failure?.requiresReview ? failure.propertyId ? "/admin/properties/" + failure.propertyId + "/edit" : "/admin/properties" : undefined}
  />;
}
