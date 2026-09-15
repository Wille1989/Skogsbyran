// Demonstration data only. These values are never sent to property APIs.
export type StatisticsPeriod = "Vecka" | "Månad" | "Kvartal" | "År";
export const statistics: Record<StatisticsPeriod, { clicks: number; visitors: number; views: number; changes: [number, number, number]; comparison: string }> = {
    Vecka: { clicks: 1248, visitors: 892, views: 2401, changes: [12, 8, 15], comparison: "föregående vecka" },
    Månad: { clicks: 4920, visitors: 3104, views: 9680, changes: [9, 6, 11], comparison: "föregående månad" },
    Kvartal: { clicks: 14850, visitors: 9630, views: 28400, changes: [7, 10, 13], comparison: "föregående kvartal" },
    År: { clicks: 58600, visitors: 36200, views: 112400, changes: [18, 14, 21], comparison: "föregående år" },
};
export const plannedEvents = [
    { day: "12", month: "okt", title: "Visning", property: "Tallvägen 12, Ljusdal", time: "14:00–16:00", category: "Visning", tone: "green" },
    { day: "14", month: "okt", title: "Fotografering", property: "Björkbacken 5, Sundsvall", time: "10:00–12:00", category: "Marknadsföring", tone: "blue" },
    { day: "17", month: "okt", title: "Publicering på webbplats", property: "Skogsdalen 1, Östersund", time: "09:00", category: "Publicering", tone: "purple" },
    { day: "22", month: "okt", title: "Värdering", property: "Granliden 3, Hudiksvall", time: "13:00–15:00", category: "Värdering", tone: "amber" },
    { day: "25", month: "okt", title: "Uppföljning med kund", property: "Tallheden 7, Härnösand", time: "11:00", category: "Möte", tone: "green" },
];
export const recentActivity = [
    { type: "create", title: "Ny fastighet skapad", property: "Björkbacken 5, Sundsvall", time: "2 timmar sedan" },
    { type: "image", title: "Bilder uppladdade", property: "Tallvägen 12, Ljusdal", time: "5 timmar sedan" },
    { type: "edit", title: "Fastighet uppdaterad", property: "Granliden 3, Hudiksvall", time: "1 dag sedan" },
    { type: "publish", title: "Publicerad på webbplatsen", property: "Skogsdalen 1, Östersund", time: "2 dagar sedan" },
    { type: "contact", title: "Ny intresseanmälan", property: "Tallheden 7, Härnösand", time: "2 dagar sedan" },
] as const;
export const quickStatus = [
    { title: "Saknar pris", count: 3, tone: "red" },
    { title: "Saknar bilder", count: 5, tone: "amber" },
    { title: "Ej publicerade", count: 2, tone: "neutral" },
];

export type CompletenessPreview = { percent: number; warnings: string[] };
export const completenessExamples: CompletenessPreview[] = [
    { percent: 100, warnings: [] }, { percent: 85, warnings: ["Saknar pris"] },
    { percent: 100, warnings: [] }, { percent: 60, warnings: ["Saknar huvudbild", "Saknar dokument"] },
    { percent: 100, warnings: [] }, { percent: 90, warnings: ["Saknar dokument"] },
    { percent: 75, warnings: ["Saknar pris"] }, { percent: 100, warnings: [] },
];
