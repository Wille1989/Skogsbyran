// Demonstration data only. These values are never sent to property APIs.
export const plannedEvents = [
    { day: "12", month: "okt", title: "Visning", property: "Tallvägen 12, Ljusdal", time: "14:00–16:00", category: "Visning", tone: "green" },
    { day: "14", month: "okt", title: "Fotografering", property: "Björkbacken 5, Sundsvall", time: "10:00–12:00", category: "Marknadsföring", tone: "blue" },
    { day: "17", month: "okt", title: "Publicering på webbplats", property: "Skogsdalen 1, Östersund", time: "09:00", category: "Publicering", tone: "purple" },
    { day: "22", month: "okt", title: "Värdering", property: "Granliden 3, Hudiksvall", time: "13:00–15:00", category: "Värdering", tone: "amber" },
    { day: "25", month: "okt", title: "Uppföljning med kund", property: "Tallheden 7, Härnösand", time: "11:00", category: "Möte", tone: "green" },
];
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
