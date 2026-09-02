import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchDetails } from "../details/api";
import { deleteDocument, updateDocumentTitle, uploadDocument } from "../documents/api";
import { deleteImages, updateImages, uploadImages } from "../images/data/api";
import { updateLocation } from "../location/api";
import { createArea, deleteArea, updateArea } from "../map/data/api";
import { propertyQueryKeys } from "./queryKeys";
import {
  areaChanges,
  changedDetails,
  changedLocationPayload,
  documentChanges,
  type EditPropertyInput,
} from "./editDrafts";

function hasObjectKeys(value: object): boolean {
  return Object.keys(value).length > 0;
}

export function useSavePropertyChangesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: EditPropertyInput): Promise<void> => {
      const detailsPatch = changedDetails(input.initialDetails, input.details);
      const locationPatch = changedLocationPayload(input.initialLocation, input.location);
      const areas = areaChanges(input.initialAreas, input.areas);
      const documents = documentChanges(input.documents);

      if (hasObjectKeys(detailsPatch)) {
        await patchDetails(input.propertyId, detailsPatch);
      }

      if (input.imageChanges.removedImageIds.length > 0) {
        await deleteImages({
          propertyId: input.propertyId,
          imageIds: input.imageChanges.removedImageIds,
        });
      }

      if (input.imageChanges.updatedImages.length > 0) {
        await updateImages({
          propertyId: input.propertyId,
          images: input.imageChanges.updatedImages,
        });
      }

      if (input.imageChanges.newImages.length > 0) {
        await uploadImages({
          propertyId: input.propertyId,
          images: input.imageChanges.newImages,
        });
      }

      if (locationPatch) {
        await updateLocation(input.propertyId, locationPatch);
      }

      for (const areaId of areas.removedAreaIds) {
        await deleteArea(input.propertyId, areaId);
      }

      for (const area of areas.updatedAreas) {
        await updateArea(input.propertyId, area.areaId, area.payload);
      }

      for (const area of areas.createdAreas) {
        await createArea(input.propertyId, area);
      }

      for (const documentId of documents.removedDocumentIds) {
        await deleteDocument(input.propertyId, documentId);
      }

      for (const document of documents.renamedDocuments) {
        await updateDocumentTitle(input.propertyId, document.documentId, document.title);
      }

      for (const document of input.pendingDocuments) {
        await uploadDocument(input.propertyId, undefined, document.file, document.title);
      }
    },
    onSuccess: async (_data, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: propertyQueryKeys.byId(variables.propertyId),
        }),
        queryClient.invalidateQueries({
          queryKey: propertyQueryKeys.all,
        }),
        queryClient.invalidateQueries({
          queryKey: propertyQueryKeys.areas(variables.propertyId),
        }),
      ]);
    },
  });
}
