import { baseURL } from "../../../shared/data/baseURL";
import { apiFetch } from "../../../shared/data/apiFetch";
import { buildAuthHeaders } from "../../../user/data/authSession";
import {
    type PropertyAreaCollection,
    type PropertyArea,
    type PropertyAreaPayload,
} from "./types";

export function getAreas(propertyId: string): Promise<PropertyAreaCollection> {
    return apiFetch<PropertyAreaCollection>(
        `${baseURL}/property/${propertyId}/areas`,
        {
            method: "GET",
        }
    );
}

export function getArea(propertyId: string, areaId: string): Promise<PropertyArea> {
    return apiFetch<PropertyArea>(
        `${baseURL}/property/${propertyId}/area/${areaId}`,
        {
            method: "GET",
        }
    );
}

export function createArea(propertyId: string, payload: PropertyAreaPayload): Promise<PropertyArea> {
    return apiFetch<PropertyArea>(
        `${baseURL}/property/${propertyId}/area`,
        {
            method: "POST",
            headers: buildAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(payload),
        }
    );
}

export function updateArea(propertyId: string, areaId: string, payload: PropertyAreaPayload): Promise<PropertyArea> {
    return apiFetch<PropertyArea>(
        `${baseURL}/property/${propertyId}/area/${areaId}/update`,
        {
            method: "PUT",
            headers: buildAuthHeaders({
                "Content-Type": "application/json",
            }),
            body: JSON.stringify(payload),
        }
    );
}

export function deleteArea(propertyId: string, areaId: string): Promise<void> {
    return apiFetch<void>(
        `${baseURL}/property/${propertyId}/area/${areaId}/delete`,
        {
            method: "DELETE",
            headers: buildAuthHeaders(),
        }
    );
}
