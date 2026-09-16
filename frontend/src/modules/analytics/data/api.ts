import { apiFetch } from "@/shared/data/apiFetch";
import { baseURL } from "@/shared/data/baseURL";
import type { AnalyticsEvent, AnalyticsStatistics, StatisticsPeriod } from "./types";

// Best effort: analytics failures must not interrupt navigation or the gallery.
export function recordEvent(event: AnalyticsEvent): void {
    void apiFetch<void>(`${baseURL}/analytics/events`, {
        method: "POST",
        credentials: "omit",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
    }).catch(() => undefined);
}

export function getStatistics(period: StatisticsPeriod): Promise<{ data: AnalyticsStatistics }> {
    return apiFetch(`${baseURL}/analytics/statistics?period=${period}`);
}
