// Demonstration data only. These values are never sent to property APIs.
export type CompletenessPreview = { percent: number; warnings: string[] };
export const completenessExamples: CompletenessPreview[] = [
    { percent: 100, warnings: [] }, { percent: 85, warnings: ["Saknar pris"] },
    { percent: 100, warnings: [] }, { percent: 60, warnings: ["Saknar huvudbild", "Saknar dokument"] },
    { percent: 100, warnings: [] }, { percent: 90, warnings: ["Saknar dokument"] },
    { percent: 75, warnings: ["Saknar pris"] }, { percent: 100, warnings: [] },
];
