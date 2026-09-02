import { baseURL } from "../../shared/data/baseURL";
import { apiFetch } from "../../shared/data/apiFetch";
import { buildAuthHeaders } from "../../user/data/authSession";
import type { PropertyLocationPayload } from "./types";

export function updateLocation(propertyId: string, location: PropertyLocationPayload): Promise<PropertyLocationPayload> {
  return apiFetch<PropertyLocationPayload>(`${baseURL}/property/${propertyId}/location`, {
    method: "PUT",
    headers: buildAuthHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(location),
  });
}
