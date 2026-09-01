import { baseURL } from "../../shared/data/baseURL";
import { apiFetch } from "../../shared/data/apiFetch";
import { buildAuthHeaders } from "../../user/data/authSession";
import { type FormDetails } from "./types";
  
export function patchDetails(propertyId: string, patch: Partial<FormDetails>): Promise<void> {
      return apiFetch<void>(`${baseURL}/${propertyId}/details/patch`, {
            method: "PATCH",
            headers: buildAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(patch),
      });
}