import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDefaultAreaDraft, buildAreaPayload } from "@/modules/location/map/data/areaDraft.ts";
import { useImageFiles } from "@/modules/image/data/useImageFiles";
import { useCreatePropertyMutation } from "../data/mutations.ts";
import { type FormDetails } from "../details/types";
import { type PropertyAreaDraft } from "@/modules/location/map/data/types";
import { PendingDocuments } from "@/modules/document/PendingDocuments.tsx";
import { type PendingDocument } from "@/modules/document/types.ts";
import { buildLocationPayload, createDefaultLocationDraft, type PropertyLocationDraft } from "@/modules/location/types.ts";
import { type CreatePropertyProgress } from "../data/types.ts";
import { PropertyForm } from "@/modules/admin/presentation/PropertyForm";

export function CreatePage() {
  const navigate = useNavigate();
  const createProperty = useCreatePropertyMutation();
  const imageFiles = useImageFiles();
  const [areaDrafts, setAreaDrafts] = useState<PropertyAreaDraft[]>([createDefaultAreaDraft()]);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [location, setLocation] = useState<PropertyLocationDraft>(createDefaultLocationDraft);
  const [saveProgress, setSaveProgress] = useState<CreatePropertyProgress | null>(null);

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (details: FormDetails): void => {
    setValidationError(null);
    try {
      setSaveProgress({
        percent: 0,
        label: "Förbereder sparning...",
      });

      const imageChanges = imageFiles.buildChanges();
      const areas = areaDrafts.flatMap((areaDraft) => {
        const area = buildAreaPayload(areaDraft);

        return area ? [area] : [];
      });

      createProperty.mutate(
        {
          details,
          images: imageChanges.newImages,
          areas,
          location: buildLocationPayload(location),
          documents,
          onProgress: setSaveProgress,
        },
        {
          onSuccess: () => {
            imageFiles.clearImages();
            setAreaDrafts([createDefaultAreaDraft()]);
            setDocuments([]);
            setLocation(createDefaultLocationDraft());

            navigate("/admin/properties");
          },
          onError: () => {
            setSaveProgress((currentProgress) => ({
              percent: currentProgress?.percent ?? 0,
              label: "Sparningen avbröts. Kontrollera felmeddelandet och försök igen.",
            }));
          },
        }
      );
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Kartdata kunde inte valideras.");
      setSaveProgress(null);
    }
  };

  return <PropertyForm
    title="Skapa ny fastighet" submitLabel="Skapa fastighet" onSubmit={handleSubmit}
    imageFiles={imageFiles} isSaving={createProperty.isPending}
    location={location} onLocationChange={setLocation} areas={areaDrafts} onAreasChange={setAreaDrafts}
    documents={<PendingDocuments documents={documents} onChange={setDocuments} />}
    error={validationError || (createProperty.error instanceof Error ? createProperty.error.message : null)}
    progress={saveProgress}
  />;
}
