import { baseURL } from "@/shared/data/baseURL.ts";
import { apiFetch } from "@/shared/data/apiFetch.ts";
import  {
      type DocumentItem,
      type DocumentType,
} from "./types.ts";

export async function downloadDocument(url: string): Promise<Blob> {
    const response = await fetch(url, { credentials: "omit" });
    if (!response.ok) throw new Error("Document download failed");
    return response.blob();
}

function buildDocumentFormData(file: File, type: DocumentType): FormData {
    const formData = new FormData();

    formData.append("document", file);
    formData.append("type", type);

    return formData;
}

function buildNamedDocumentFormData(file: File, title?: string, type?: DocumentType): FormData {
    const formData = new FormData();

    formData.append("document", file);

    if (title) {
        formData.append("title", title);
    }

    if (type) {
        formData.append("type", type);
    }

    return formData;
}

export function uploadDocument(propertyId: string, type: DocumentType | undefined, file: File, title?: string): Promise<DocumentItem> {
    return apiFetch<DocumentItem>(`${baseURL}/property/${propertyId}/documents`,
        {
            method: "POST",
            body: type && !title ? buildDocumentFormData(file, type) : buildNamedDocumentFormData(file, title, type)
        }
    );
}

export function deleteDocument(propertyId: string, documentId: string): Promise<void> {
    return apiFetch<void>(`${baseURL}/property/${propertyId}/documents/${documentId}`,
        {
            method: "DELETE",
        }
    );
}

export function updateDocumentTitle(propertyId: string, documentId: string, title: string): Promise<DocumentItem> {
    return apiFetch<DocumentItem>(`${baseURL}/property/${propertyId}/documents/${documentId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ title }),
        }
    );
}
