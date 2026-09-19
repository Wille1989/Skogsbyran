import { useQuery } from "@tanstack/react-query";
import { propertyQueryKeys } from "../api/queryKeys";
import { getAll, getById, getAdminProperties } from "../api/api";
import { type ResponseGetProperty } from "@/modules/property/types/types";

export function usePropertiesQuery() {
        return useQuery({
                queryKey: propertyQueryKeys.all,
                queryFn: getAll,
        })
};

export function useAdminPropertiesQuery() {
        return useQuery({ queryKey: [...propertyQueryKeys.all, "admin"], queryFn: getAdminProperties });
}

export function usePropertyByIdQuery(propertyId: string) {
        return useQuery<ResponseGetProperty>({
                queryKey: propertyQueryKeys.byId(propertyId),
                queryFn: () => getById(propertyId),
                enabled: propertyId.length > 0,
        })
}
