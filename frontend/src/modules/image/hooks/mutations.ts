import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { 
      uploadImages,
       updateImages, 
       deleteImages
} from "../api/api.ts";
import {
      type UploadImagesInput,
      type UpdateImagesInput,
      type DeleteImagesInput
} from "../types/types.ts";
import { propertyQueryKeys } from "@/modules/property/api/queryKeys.ts";

async function invalidatePropertyQueries(queryClient: QueryClient, propertyId: string): Promise<void> {
      await Promise.all([
            queryClient.invalidateQueries({
                  queryKey: propertyQueryKeys.byId(propertyId)
            }),

            queryClient.invalidateQueries({
                  queryKey: propertyQueryKeys.all
            }),
      ]);
}

export function useUploadImagesMutation() {
      const queryClient = useQueryClient();

      return useMutation({
            mutationFn: (input: UploadImagesInput) =>
                  uploadImages(input),

            onSuccess: async(_data, variables) => {
                  await invalidatePropertyQueries(
                        queryClient, 
                        variables.propertyId
                  );
            },
      });
}

export function useUpdateImagesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: UpdateImagesInput) =>
            updateImages(input),

        onSuccess: async (_data, variables) => {
            await invalidatePropertyQueries(
                queryClient,
                variables.propertyId
            );
        },
    });
}

export function useDeleteImagesMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: DeleteImagesInput) =>
            deleteImages(input),

        onSuccess: async (_data, variables) => {
            await invalidatePropertyQueries(
                queryClient,
                variables.propertyId
            );
        },
    });
}