import { useMutation } from "@tanstack/react-query";
import { patchDetails } from "../details/api";
import { uploadDocument } from "@/modules/document/api";
import { uploadImages } from "@/modules/image/data/api";
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
            const hasSchedule = input.details.publishAt !== null || input.details.scheduledStatusAt !== null;
            const totalSteps =
                1 +
                (input.images.length > 0 ? 1 : 0) +
                input.documents.length +
                (shouldPublish || hasSchedule ? 1 : 0) +
                1;
            let completedSteps = 0;

            reportProgress(input, completedSteps, totalSteps, "Skapar fastigheten...");

            const created = await create({
                ...input,
                details: {
                    ...input.details,
                    isVisible: false,
                    publishAt: null,
                    scheduledListingStatus: null,
                    scheduledStatusAt: null,
                },
                images: [],
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

            if (shouldPublish || hasSchedule) {
                reportProgress(input, completedSteps, totalSteps, "Sparar publiceringsinställningar...");
                await patchDetails(propertyId, {
                    isVisible: shouldPublish,
                    publishAt: input.details.publishAt,
                    scheduledListingStatus: input.details.scheduledListingStatus,
                    scheduledStatusAt: input.details.scheduledStatusAt,
                });
                completedSteps += 1;
                reportProgress(input, completedSteps, totalSteps, "Publiceringsinställningarna är sparade.");
            }

            reportProgress(input, completedSteps, totalSteps, "Hämtar färdig fastighet...");
            const property = await getById(propertyId);
            reportProgress(input, totalSteps, totalSteps, "Klart.");

            return property;
        },
    });
}
