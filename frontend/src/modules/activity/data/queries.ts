import { useQuery } from "@tanstack/react-query";
import { getLatestActivity } from "./api";

export function useLatestActivity() {
    return useQuery({
        queryKey: ["activity", "latest"],
        queryFn: getLatestActivity,
    });
}
