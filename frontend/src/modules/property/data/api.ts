import { baseURL } from "@/shared/data/baseURL";
import { apiFetch } from "@/shared/data/apiFetch";
import { 
    type ResponseGetProperty,
    type ResponseGetProperties } from "@/modules/property/data/types";
import { type CreatePropertyInput } from "./types";

export function getById(propertyId: string): Promise<ResponseGetProperty> {
    return apiFetch<ResponseGetProperty>(`${baseURL}/property/${propertyId}`,
        {
            method: "GET",
            credentials: "omit",
        }
    );
}

export function getAll(): Promise<ResponseGetProperties> {
    return apiFetch<ResponseGetProperties>(`${baseURL}/properties`,
        {
            method: "GET",
            credentials: "omit",
        }
    );
}

export function create(input: CreatePropertyInput): Promise<ResponseGetProperty> {
    const formData = new FormData();

    formData.append(
        "details",
        JSON.stringify(input.details)
    );

    formData.append(
        "areas",
        JSON.stringify(input.areas)
    );

    input.images.forEach((image, index) => {
        formData.append(
            `images[${index}][file]`,
            image.file
        );

        formData.append(
            `images[${index}][position]`,
            String(image.position)
        );

        formData.append(
            `images[${index}][isPrimary]`,
            image.isPrimary ? "1" : "0"
        );

        formData.append(
            `images[${index}][details]`,
            JSON.stringify(image.details)
        );

        formData.append(
            `images[${index}][adjustments]`,
            JSON.stringify(image.adjustments)
        );
    });

    return apiFetch<ResponseGetProperty>(`${baseURL}/property`,
        {
            method: "POST",
            body: formData,
        }
    );
}

export function remove(propertyId: string): Promise<void> {
    return apiFetch<void>(`${baseURL}/property/${propertyId}`,
        {
            method: "DELETE",
        }
    );
}
