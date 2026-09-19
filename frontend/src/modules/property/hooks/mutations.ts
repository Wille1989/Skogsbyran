import { useMutation } from "@tanstack/react-query";
import { patchDetails } from "../details/api/api";
import { uploadDocument } from "@/modules/document/api/api";
import { uploadImages } from "@/modules/image/api/api";
import { create, getById } from "../api/api";
import type { CreatePropertyInput, ResponseGetProperty } from "../types/types";
import { runSaveSteps, type SaveStep } from "../services/saveProgress";

export function useCreatePropertyMutation() {
    return useMutation({
        retry: false,
        mutationFn: async (input: CreatePropertyInput) => {
            let propertyId: string | undefined;
            let result: ResponseGetProperty | undefined;
            const steps: SaveStep[] = [{ phase: "details", title: "Skapar fastigheten", run: async () => {
                const created = await create({ ...input, details: { ...input.details, isVisible: false,
                    publishAt: null, scheduledListingStatus: null, scheduledStatusAt: null }, images: [] });
                propertyId = created.property.propertyId;
            } }];
            const id = () => { if (!propertyId) throw new Error("Missing property ID"); return propertyId; };
            if (input.images.length) steps.push({ phase: "images", title: "Laddar upp bilder", weight: 75,
                run: (report, acknowledge) => uploadImages({ propertyId: id(), images: input.images,
                    onProgress: progress => report(progress.fraction, progress.detail, progress.title), onBatchSaved: acknowledge }) });
            for (const [index, document] of input.documents.entries()) steps.push({ phase: "documents",
                title: "Sparar dokument " + (index + 1) + " av " + input.documents.length,
                run: () => uploadDocument(id(), undefined, document.file, document.title) });
            if (input.details.isVisible || input.details.publishAt !== null || input.details.scheduledStatusAt !== null) {
                steps.push({ phase: "details", title: "Sparar publiceringsinställningar", run: () => patchDetails(id(), {
                    isVisible: input.details.isVisible, publishAt: input.details.publishAt,
                    scheduledListingStatus: input.details.scheduledListingStatus, scheduledStatusAt: input.details.scheduledStatusAt }) });
            }
            steps.push({ phase: "finalizing", title: "Kontrollerar den sparade fastigheten", write: false,
                run: async () => { result = await getById(id());
                    if (result?.property?.propertyId !== id()) throw new Error("Unexpected property response"); } });
            await runSaveSteps(steps, input.onProgress, "Fastigheten är skapad", () => propertyId);
            return result!;
        },
    });
}
