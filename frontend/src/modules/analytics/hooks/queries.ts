import { useQuery } from "@tanstack/react-query";
import { getStatistics } from "../api/api";
import type { StatisticsPeriod } from "../types/types";

export function useAnalyticsStatistics(period: StatisticsPeriod) {
    return useQuery({
        queryKey: ["analytics", "statistics", period],
        queryFn: () => getStatistics(period),
    });
}
