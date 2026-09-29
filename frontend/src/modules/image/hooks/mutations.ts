import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { updateImages } from "../api/api.ts";
import { type UpdateImagesInput } from "../types/types.ts";
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
