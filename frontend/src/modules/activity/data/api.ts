import { apiFetch } from "@/shared/data/apiFetch";
import { baseURL } from "@/shared/data/baseURL";
import type { ActivityEvent } from "./types";

export function getLatestActivity(): Promise<{ data: ActivityEvent[] }> {
    return apiFetch(`${baseURL}/activity`);
}
