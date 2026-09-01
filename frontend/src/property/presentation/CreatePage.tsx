import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DetailsForm } from "../details/Form";
import { ImageDropZone } from "../images/presentation/FileDropContainer.tsx";
import { createDefaultAreaDraft, buildAreaPayload } from "../map/data/areaDraft.ts";
import { useImageFiles } from "../images/data/useImageFiles";
import { useCreatePropertyMutation } from "../data/mutations.ts";
import { type FormDetails } from "../details/types";
import { type PropertyAreaDraft } from "../map/data/types";
import "./CreatePage.css";

export function CreatePage() {
  const navigate = useNavigate();
  const createProperty = useCreatePropertyMutation();
  const imageFiles = useImageFiles();
  const [areaDraft,setAreaDraft] = useState<PropertyAreaDraft>(createDefaultAreaDraft);
  const handleSubmit = (details: FormDetails): void => {
    const imageChanges = imageFiles.buildChanges();
    const area = buildAreaPayload(areaDraft);

    createProperty.mutate(
      {
        details, 
        images: imageChanges.newImages,
        areas: area ? [area] : [],
      },
      {
        onSuccess: () => {
          imageFiles.clearImages();

          setAreaDraft(createDefaultAreaDraft());

          navigate("/");
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
      
        <div className="form-actions">
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