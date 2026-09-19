import { baseURL } from "@/shared/config/baseURL";
import { apiFetch } from "@/shared/api/apiFetch";
import { type FormDetails } from "../types/types";
  
export function patchDetails(propertyId: string, patch: Partial<FormDetails>): Promise<void> {
      return apiFetch<void>(`${baseURL}/property/${propertyId}/details`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
      });
}
