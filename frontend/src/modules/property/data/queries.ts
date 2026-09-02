import { useQuery } from "@tanstack/react-query";
import { propertyQueryKeys } from "./queryKeys";
import { getAll, getById } from "./api";
import { type ResponseGetProperty } from "@/modules/property/data/types";

export function usePropertiesQuery() {
        return useQuery({
                queryKey: propertyQueryKeys.all,
                queryFn: getAll,
        })
};

export function usePropertyByIdQuery(propertyId: string) {
        return useQuery<ResponseGetProperty>({
                queryKey: propertyQueryKeys.byId(propertyId),
                queryFn: () => getById(propertyId),
                enabled: propertyId.length > 0,
        })
}
