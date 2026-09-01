import {
    useMutation,
    useQueryClient,
} from "@tanstack/react-query";

import {
    createArea,
    deleteArea,
    updateArea,
} from "./api";

import { propertyQueryKeys } from "../../data/queryKeys";

import type { PropertyAreaPayload } from "./types";

type CreateAreaInput = {
    propertyId: string;
    payload: PropertyAreaPayload;
};

type UpdateAreaInput = {
    propertyId: string;
    areaId: string;
    payload: PropertyAreaPayload;
};

type DeleteAreaInput = {
    propertyId: string;
    areaId: string;
};

export function useCreateAreaMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            propertyId,
            payload,
        }: CreateAreaInput) =>
            createArea(propertyId, payload),

        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.areas(
                    variables.propertyId
                ),
            });

            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.byId(
                    variables.propertyId
                ),
            });
        },
    });
}

export function useUpdateAreaMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            propertyId,
            areaId,
            payload,
        }: UpdateAreaInput) =>
            updateArea(
                propertyId,
                areaId,
                payload
            ),

        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.areas(
                    variables.propertyId
                ),
            });

            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.byId(
                    variables.propertyId
                ),
            });
        },
    });
}

export function useDeleteAreaMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            propertyId,
            areaId,
        }: DeleteAreaInput) =>
            deleteArea(propertyId, areaId),

        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.areas(
                    variables.propertyId
                ),
            });

            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.byId(
                    variables.propertyId
                ),
            });
        },
    });
}
