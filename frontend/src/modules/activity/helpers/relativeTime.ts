const formatter = new Intl.RelativeTimeFormat("sv-SE", { numeric: "always" });

export function relativeTime(timestamp: string, now: number): string {
    const seconds = Math.max(0, Math.floor((now - Date.parse(timestamp)) / 1000));
    if (seconds < 60) return "Nyss";
    if (seconds < 3600) return formatter.format(-Math.floor(seconds / 60), "minute");
    if (seconds < 86400) return formatter.format(-Math.floor(seconds / 3600), "hour");
    return formatter.format(-Math.floor(seconds / 86400), "day");
}
