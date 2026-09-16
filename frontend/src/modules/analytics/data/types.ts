export type AnalyticsEvent =
    | { event_type: "visitor" }
    | { event_type: "property_click"; property_id: string }
    | { event_type: "image_click"; property_id: string; image_id: string };

export type StatisticsPeriod = "week" | "month" | "quarter" | "year";
export type AnalyticsMetric = { count: number; change: number | null };
export type AnalyticsStatistics = {
    property_click: AnalyticsMetric;
    visitor: AnalyticsMetric;
    image_click: AnalyticsMetric;
};
