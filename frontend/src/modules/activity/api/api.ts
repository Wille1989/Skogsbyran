import { apiFetch } from "@/shared/api/apiFetch";
import { baseURL } from "@/shared/config/baseURL";
import type { ActivityEvent } from "../types/types";

export function getLatestActivity(): Promise<{ data: ActivityEvent[] }> {
    return apiFetch(`${baseURL}/activity`);
}
