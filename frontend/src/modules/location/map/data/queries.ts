import { useQuery } from "@tanstack/react-query";

import { getAreas } from "./api";
import { propertyQueryKeys } from "@/modules/property/data/queryKeys";

export function useAreasQuery(
    propertyId: string
) {
    return useQuery({
        queryKey: propertyQueryKeys.areas(
            propertyId
        ),

        queryFn: () =>
            getAreas(propertyId),

        enabled: propertyId.length > 0,

        staleTime: 1000 * 60 * 5,
    });
}
