import { useMutation } from "@tanstack/react-query";
import { patchDetails } from "../details/api";
import { uploadDocument } from "../documents/api";
import { uploadImages } from "../images/data/api";
import { updateLocation } from "../location/api";
import { createArea } from "../map/data/api";
import { create, getById } from "./api";
import type { CreatePropertyInput } from "./types";

function reportProgress(input: CreatePropertyInput, completedSteps: number, totalSteps: number, label: string): void {
    input.onProgress?.({
        percent: Math.min(100, Math.round((completedSteps / totalSteps) * 100)),
        label,
    });
}

export function useCreatePropertyMutation() {
    return useMutation({
        mutationFn: async (input: CreatePropertyInput) => {
            const shouldPublish = input.details.isVisible;
            const totalSteps =
                1 +
                (input.images.length > 0 ? 1 : 0) +
                input.documents.length +
                (input.location ? 1 : 0) +
                input.areas.length +
                (shouldPublish ? 1 : 0) +
                1;
            let completedSteps = 0;

            reportProgress(input, completedSteps, totalSteps, "Skapar fastigheten...");

            const created = await create({
                ...input,
                details: {
                    ...input.details,
                    isVisible: false,
                },
                images: [],
                areas: [],
            });
            const propertyId = created.property.propertyId;
            completedSteps += 1;
            reportProgress(input, completedSteps, totalSteps, "Fastigheten är skapad.");

            if (input.images.length > 0) {
                reportProgress(input, completedSteps, totalSteps, "Laddar upp bilder...");
                await uploadImages({
                    propertyId,
                    images: input.images,
                });
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, "Bilderna är uppladdade.");
            }

            for (const [index, document] of input.documents.entries()) {
                reportProgress(input, completedSteps, totalSteps, `Laddar upp dokument ${index + 1} av ${input.documents.length}...`);
                await uploadDocument(propertyId, undefined, document.file, document.title);
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, `Dokument ${index + 1} är uppladdat.`);
            }

            if (input.location) {
                reportProgress(input, completedSteps, totalSteps, "Sparar plats och POIs...");
                await updateLocation(propertyId, input.location);
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, "Plats och POIs är sparade.");
            }

            for (const [index, area] of input.areas.entries()) {
                reportProgress(input, completedSteps, totalSteps, `Sparar område ${index + 1} av ${input.areas.length}...`);
                await createArea(propertyId, area);
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, `Område ${index + 1} är sparat.`);
            }

            if (shouldPublish) {
                reportProgress(input, completedSteps, totalSteps, "Publicerar fastigheten...");
                await patchDetails(propertyId, {
                    isVisible: true,
                });
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, "Fastigheten är publicerad.");
            }

            reportProgress(input, completedSteps, totalSteps, "Hämtar färdig fastighet...");
            const property = await getById(propertyId);
            reportProgress(input, totalSteps, totalSteps, "Klart.");

            return property;
        },
    });
}
