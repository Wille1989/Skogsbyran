import type { FormDetails, ListingStatus } from "./types";

export const listingStatusOptions: Array<{ value: ListingStatus; label: string }> = [
    { value: "upcoming", label: "Kommande" },
    { value: "available", label: "Till salu" },
    { value: "bidding", label: "Budgivning" },
    { value: "reserved", label: "Reserverad" },
    { value: "sold", label: "Såld" },
];

// The form uses browser-local wall time; API timestamps always carry UTC explicitly.
export function localDateTime(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function utcDateTime(local: string | null): string | null {
    if (local === null) return null;
    const date = new Date(local);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local) || !Number.isFinite(date.getTime()) || localDateTime(date.toISOString()) !== local) {
        throw new Error("Ange giltigt datum och tid för varje aktiv schemaläggning.");
    }
    return date.toISOString();
}

export function publicationPayload(values: FormDetails, publishNow: boolean): FormDetails {
    const isVisible = publishNow || values.isVisible;
    return {
        ...values,
        isVisible,
        publishAt: isVisible ? null : utcDateTime(values.publishAt),
        scheduledStatusAt: utcDateTime(values.scheduledStatusAt),
    };
}

export function scheduleSummary(local: string | null): string {
    if (!local || !Number.isFinite(new Date(local).getTime())) return "Välj datum och tid";
    return new Date(local).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
