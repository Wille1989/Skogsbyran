import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchDetails } from "../details/api";
import { deleteDocument, updateDocumentTitle, uploadDocument } from "@/modules/document/api";
import { deleteImages, updateImages, uploadImages } from "@/modules/image/data/api";
import { updateLocation } from "@/modules/location/api";
import { createArea, deleteArea, updateArea } from "@/modules/location/map/data/api";
import type { ResponseProperty, ResponseGetProperty, ResponseGetProperties } from "@/modules/property/data/types";
import type { PropertyArea } from "@/modules/location/map/data/types";
import { runSaveSteps, type SaveStep } from "./saveProgress";
import { getById, remove } from "./api";
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

export function useDeletePropertyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: remove,
    retry: false,
    onSuccess: async (_data, propertyId) => {
      await queryClient.cancelQueries({ queryKey: propertyQueryKeys.byId(propertyId) });
      await queryClient.cancelQueries({ queryKey: propertyQueryKeys.all });
      queryClient.removeQueries({ queryKey: propertyQueryKeys.byId(propertyId) });
      queryClient.setQueriesData<ResponseGetProperties>({ queryKey: propertyQueryKeys.all }, current => current
        ? { ...current, properties: current.properties.filter(property => property.propertyId !== propertyId) }
        : current);
      void queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

export function useSavePropertyChangesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    retry: false,
    mutationFn: async (input: EditPropertyInput): Promise<ResponseProperty> => {
      const detailsPatch = changedDetails(input.initialDetails, input.details);
      const locationPatch = changedLocationPayload(input.initialLocation, input.location);
      const areas = areaChanges(input.initialAreas, input.areas);
      const documents = documentChanges(input.documents);
      // Keep acknowledged Area writes as the baseline if a later request fails.
      // The page retains its draft, including the ID returned for a newly created area.
      const rememberArea = (areaId: string, saved?: PropertyArea): void => {
        queryClient.setQueryData<ResponseGetProperty>(propertyQueryKeys.byId(input.propertyId), current => {
          if (!current) return current;
          const storedAreas = current.property.areas;
          let nextAreas = storedAreas.filter(area => area.id !== areaId);
          if (saved) {
            nextAreas = storedAreas.some(area => area.id === areaId)
              ? storedAreas.map(area => area.id === areaId ? saved : area)
              : [...storedAreas, saved];
          }
          return { ...current, property: { ...current.property, areas: nextAreas } };
        });
      };

      const steps: SaveStep[] = [];
      const add = (phase: SaveStep["phase"], title: string, run: SaveStep["run"]) => steps.push({ phase, title, run });
      if (input.imageChanges.removedImageIds.length) add("images", "Tar bort " + input.imageChanges.removedImageIds.length + " bilder",
        () => deleteImages({ propertyId: input.propertyId, imageIds: input.imageChanges.removedImageIds }));
      if (input.imageChanges.updatedImages.length) {
        const updates = input.imageChanges.updatedImages;
        const changes = [
          updates.some(image => image.position !== undefined) ? "bildordning" : "",
          updates.some(image => image.isPrimary !== undefined) ? "huvudbild" : "",
          updates.some(image => image.details !== undefined) ? "bildtexter" : "",
          updates.some(image => image.adjustments !== undefined) ? "bildjusteringar" : "",
        ].filter(Boolean);
        add("images", "Sparar bildändringar", report => {
          report(0, changes.join(" · "));
          return updateImages({ propertyId: input.propertyId, images: updates });
        });
      }
      if (input.imageChanges.newImages.length) steps.push({ phase: "images", title: "Laddar upp nya bilder", weight: 75,
        run: (report, acknowledge) => uploadImages({ propertyId: input.propertyId, images: input.imageChanges.newImages,
          onProgress: progress => report(progress.fraction, progress.detail, progress.title), onBatchSaved: acknowledge }) });
      if (locationPatch) add("location", "Sparar adress och kartpunkter", () => updateLocation(input.propertyId, locationPatch));
      for (const areaId of areas.removedAreaIds) add("areas", "Tar bort kartområde", async () => {
        await deleteArea(input.propertyId, areaId); rememberArea(areaId);
      });
      for (const area of areas.updatedAreas) add("areas", "Uppdaterar kartområde", async () => {
        const saved = await updateArea(input.propertyId, area.areaId, area.payload); rememberArea(saved.id, saved);
      });
      for (const area of areas.createdAreas) add("areas", "Sparar nytt kartområde", async () => {
        const saved = await createArea(input.propertyId, area.payload);
        input.onAreaCreated?.(area.draft, saved); rememberArea(saved.id, saved);
      });
      for (const documentId of documents.removedDocumentIds) add("documents", "Tar bort dokument", () => deleteDocument(input.propertyId, documentId));
      for (const document of documents.renamedDocuments) add("documents", "Sparar dokumentnamn", () => updateDocumentTitle(input.propertyId, document.documentId, document.title));
      for (const [index, document] of input.pendingDocuments.entries()) add("documents", "Laddar upp dokument " + (index + 1) + " av " + input.pendingDocuments.length,
        () => uploadDocument(input.propertyId, undefined, document.file, document.title));
      if (hasObjectKeys(detailsPatch)) add("details", "Sparar fastighetsinformation", () => patchDetails(input.propertyId, detailsPatch));
      let refreshed: ResponseProperty | undefined;
      steps.push({ phase: "finalizing", title: "Kontrollerar de sparade ändringarna", write: false,
        run: async () => { refreshed = (await getById(input.propertyId)).property;
          if (refreshed?.propertyId !== input.propertyId) throw new Error("Unexpected property response"); } });
      await runSaveSteps(steps, input.onProgress, "Ändringarna är sparade", () => input.propertyId);
      return refreshed!;
    },
    onSuccess: async (property, variables) => {
      if (variables.scope === "map") {
        // Preserve the other sections' baseline and unsaved form values.
        queryClient.setQueryData<ResponseGetProperty>(propertyQueryKeys.byId(variables.propertyId), current => current
          ? { ...current, property: { ...current.property, location: property.location, areas: property.areas } }
          : { property });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: propertyQueryKeys.all }),
          queryClient.invalidateQueries({ queryKey: propertyQueryKeys.areas(variables.propertyId) }),
        ]);
        return;
      }
      queryClient.setQueryData(propertyQueryKeys.byId(variables.propertyId), { property });

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
