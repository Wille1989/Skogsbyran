import { baseURL } from "@/shared/config/baseURL";
import { apiFetch } from "@/shared/api/apiFetch";
import type { PropertyLocationPayload } from "../types/types";

export function updateLocation(propertyId: string, location: PropertyLocationPayload): Promise<PropertyLocationPayload> {
  return apiFetch<PropertyLocationPayload>(`${baseURL}/property/${propertyId}/location`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(location),
  });
}
