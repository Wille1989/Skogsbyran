import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchDetails } from "./api.ts";
import { propertyQueryKeys } from "@/modules/property/data/queryKeys.ts";
import { type PatchDetails } from "./types.ts";

export function usePatchDetailsMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ propertyId, patch }: PatchDetails) => patchDetails(propertyId, patch),

            onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
            queryKey: propertyQueryKeys.byId(variables.propertyId),
            });

            void queryClient.invalidateQueries({
            queryKey: propertyQueryKeys.all,
            });
        },
    });
}