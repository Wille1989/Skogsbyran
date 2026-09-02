import { useMutation } from "@tanstack/react-query";
import { patchDetails } from "../details/api";
import { uploadDocument } from "../documents/api";
import { uploadImages } from "../images/data/api";
import { updateLocation } from "../location/api";
import { createArea } from "../map/data/api";
import { create, getById } from "./api";
import type { CreatePropertyInput } from "./types";

export function useCreatePropertyMutation() {
    return useMutation({
        mutationFn: async (input: CreatePropertyInput) => {
            const shouldPublish = input.details.isVisible;
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

            if (input.images.length > 0) {
                await uploadImages({
                    propertyId,
                    images: input.images,
                });
            }

            for (const document of input.documents) {
                await uploadDocument(propertyId, undefined, document.file, document.title);
            }

            if (input.location) {
                await updateLocation(propertyId, input.location);
            }

            for (const area of input.areas) {
                await createArea(propertyId, area);
            }

            if (shouldPublish) {
                await patchDetails(propertyId, {
                    isVisible: true,
                });
            }

            return getById(propertyId);
        },
    });
}
