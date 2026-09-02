import { useMutation, useQueryClient } from "@tanstack/react-query";
import { propertyQueryKeys } from "../data/queryKeys.ts";
import { deleteDocument, uploadDocument } from "./api.ts";
import  { 
      type UploadDocumentInput,
       type DeleteDocumentInput } from "./types.ts";

export function useUploadDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            propertyId,
            type,
            title,
            file,
        }: UploadDocumentInput) =>
            uploadDocument(propertyId, type, file, title),

        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.byId(
                    variables.propertyId
                ),
            });
        },
    });
}

export function useDeleteDocumentMutation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            propertyId,
            documentId,
        }: DeleteDocumentInput) =>
            deleteDocument(propertyId, documentId),

        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({
                queryKey: propertyQueryKeys.byId(
                    variables.propertyId
                ),
            });
        },
    });
}
