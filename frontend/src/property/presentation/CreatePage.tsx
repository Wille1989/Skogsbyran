import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DetailsForm } from "../details/Form";
import { ImageDropZone } from "../images/presentation/FileDropContainer.tsx";
import { createDefaultAreaDraft, buildAreaPayload } from "../map/data/areaDraft.ts";
import { useImageFiles } from "../images/data/useImageFiles";
import { useCreatePropertyMutation } from "../data/mutations.ts";
import { type FormDetails } from "../details/types";
import { type PropertyAreaDraft } from "../map/data/types";
import { PropertyAreaEditor } from "../map/presentation/PropertyAreaEditor.tsx";
import { PendingDocuments } from "../documents/PendingDocuments.tsx";
import { type PendingDocument } from "../documents/types.ts";
import { LocationEditor } from "../location/LocationEditor.tsx";
import { buildLocationPayload, createDefaultLocationDraft, type PropertyLocationDraft } from "../location/types.ts";
import { type CreatePropertyProgress } from "../data/types.ts";
import "./CreatePage.css";

export function CreatePage() {
  const navigate = useNavigate();
  const createProperty = useCreatePropertyMutation();
  const imageFiles = useImageFiles();
  const [areaDrafts, setAreaDrafts] = useState<PropertyAreaDraft[]>([createDefaultAreaDraft()]);
  const [documents, setDocuments] = useState<PendingDocument[]>([]);
  const [location, setLocation] = useState<PropertyLocationDraft>(createDefaultLocationDraft);
  const [saveProgress, setSaveProgress] = useState<CreatePropertyProgress | null>(null);

  const handleSubmit = (details: FormDetails): void => {
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

          navigate("/");
        },
        onError: () => {
          setSaveProgress((currentProgress) => ({
            percent: currentProgress?.percent ?? 0,
            label: "Sparningen avbröts. Kontrollera felmeddelandet och försök igen.",
          }));
        },
      }
    );
  };

  return (
    <main className="form-page">
      <div className="form-stack">
        <section className="property-details">
          <DetailsForm
              onSubmit={handleSubmit}
          />
        </section>

        <section className="property-images">
          <ImageDropZone
              imageFiles={imageFiles}
          />
      </section>

        <section className="property-location">
          <LocationEditor value={location} onChange={setLocation} />
        </section>

        <section className="property-areas area-form-card">
          <div className="create-section-copy">
            <strong>Områden</strong>
            <p>Skapa ett eller flera fristående områden. Varje område sparas först när hela fastigheten sparas.</p>
          </div>

          <div className="create-area-list">
            {areaDrafts.map((areaDraft, index) => (
              <div className="create-area-card" key={index}>
                <div className="create-area-card-header">
                  <strong>Område {index + 1}</strong>
                  {areaDrafts.length > 1 ? (
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => setAreaDrafts(areaDrafts.filter((_, draftIndex) => draftIndex !== index))}
                    >
                      Ta bort område
                    </button>
                  ) : null}
                </div>

                <PropertyAreaEditor
                  mode="create"
                  value={areaDraft}
                  onChange={(nextDraft) =>
                    setAreaDrafts(areaDrafts.map((draft, draftIndex) => (draftIndex === index ? nextDraft : draft)))
                  }
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            className="button"
            onClick={() => setAreaDrafts([...areaDrafts, createDefaultAreaDraft()])}
          >
            Lägg till område
          </button>
        </section>

        <section className="property-documents-create">
          <PendingDocuments documents={documents} onChange={setDocuments} />
        </section>

        {createProperty.error instanceof Error ? (
          <p className="form-error" role="alert">
            {createProperty.error.message}
          </p>
        ) : null}
      
        <div className="form-actions">
          {saveProgress ? (
            <div
              className={`create-progress ${createProperty.isPending ? "is-active" : "is-idle"}`}
              role="status"
              aria-live="polite"
            >
              <div className="create-progress-copy">
                <strong>{saveProgress.percent}%</strong>
                <span>{saveProgress.label}</span>
              </div>

              <div className="create-progress-track" aria-hidden="true">
                <div
                  className="create-progress-value"
                  style={{ width: `${saveProgress.percent}%` }}
                />
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            form="property-form"
            className="form-submit"
            disabled={createProperty.isPending}
          >
            {createProperty.isPending ? "Skapar fastigheten..." : "Skapa fastighet"}
          </button>
        </div>
      </div>
    </main>
  );
}
