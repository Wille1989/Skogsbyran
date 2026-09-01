import { baseURL } from "../../shared/data/baseURL.ts";
import { apiFetch } from "../../shared/data/apiFetch.ts";
import { buildAuthHeaders } from "../../user/data/authSession.ts";
import  {
      type DocumentItem,
      type DocumentType,
} from "./types.ts";

function buildDocumentFormData(file: File, type: DocumentType): FormData {
    const formData = new FormData();

    formData.append("document", file);
    formData.append("type", type);

    return formData;
}

export function uploadDocument(propertyId: string, type: DocumentType, file: File): Promise<DocumentItem> {
    return apiFetch<DocumentItem>(`${baseURL}/${propertyId}/document/upload`,
        {
            method: "POST",
            headers: buildAuthHeaders(),
            body: buildDocumentFormData(file, type)
        }
    );
}

export function deleteDocument(propertyId: string, documentId: string): Promise<void> {
    return apiFetch<void>(`${baseURL}/${propertyId}/document/${documentId}/delete`, 
        {
            method: "DELETE",
            headers: buildAuthHeaders(),
        }
    );
}