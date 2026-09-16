import { RecentActivity } from "@/modules/activity/presentation/RecentActivity";
import { useAnalyticsStatistics } from "@/modules/analytics/data/queries";
import type { StatisticsPeriod } from "@/modules/analytics/data/types";
import { useState } from "react";
import { IconPointer, IconUsers, IconCalendar, IconChartPie, IconFileDescription, IconPhoto, IconAlertTriangle } from "@tabler/icons-react";
import { plannedEvents, quickStatus } from "../data/overviewFixtures";

const periods: { value: StatisticsPeriod; label: string; days: number }[] = [
    { value: "week", label: "Vecka", days: 7 }, { value: "month", label: "Månad", days: 30 },
    { value: "quarter", label: "Kvartal", days: 90 }, { value: "year", label: "År", days: 365 },
];

export function OverviewPage() {
    const [period, setPeriod] = useState<StatisticsPeriod>("week");
    const { data, isPending, isError, refetch } = useAnalyticsStatistics(period);
    const selected = data?.data;
    const days = periods.find(item => item.value === period)!.days;
    const metrics = [
        { title: "Fastighetsklick", metric: selected?.property_click, icon: IconPointer },
        { title: "Antal besök", metric: selected?.visitor, icon: IconUsers },
        { title: "Bildklick", metric: selected?.image_click, icon: IconPhoto },
    ];
    return <div className="admin-overview">
        <header className="admin-page-heading"><div><span className="admin-eyebrow">ADMIN / ÖVERSIKT</span><h1>Översikt</h1><p>Här kan du se aktivitet, besöksstatistik och planering för dina fastigheter.</p></div></header>
        <p className="admin-notice"><strong>Delvis exempeldata.</strong> Planerade händelser och snabbstatus visar fortfarande exempel.</p>
        <section className="admin-card admin-statistics" aria-labelledby="statistics-title">
            <div className="admin-card-heading"><h2 id="statistics-title">Statistik</h2><div className="admin-tabs" aria-label="Statistikperiod">{periods.map(item => <button type="button" key={item.value} aria-pressed={period === item.value} onClick={() => setPeriod(item.value)}>{item.label}</button>)}</div></div>
            <p>Senaste {days} dagarna. Besök räknas per sidladdning, inte som unika personer.</p>
            {isPending ? <p role="status">Laddar statistik…</p> : isError ? <p role="alert">Statistiken kunde inte hämtas. <button type="button" onClick={() => void refetch()}>Försök igen</button></p> : selected && <>
                <div className="admin-metrics" aria-live="polite">{metrics.map(({ title, metric, icon: Icon }) => <div className="admin-metric" key={title}>
                    <span className="admin-round-icon"><Icon size={29} stroke={1.5} /></span><div><span>{title}</span><strong>{metric?.count.toLocaleString("sv-SE")}</strong><span className="admin-trend">{metric?.change == null ? "Ingen jämförelsedata" : `${metric.change > 0 ? "+" : ""}${metric.change.toLocaleString("sv-SE")} %`}</span><small>jämfört med föregående {days} dagar</small></div>
                </div>)}</div>
                {metrics.every(({ metric }) => metric?.count === 0) && <p>Inga registrerade händelser under perioden.</p>}
            </>}
        </section>
        <div className="admin-overview-grid">
            <section className="admin-card admin-events"><div className="admin-card-heading"><h2><IconCalendar />Planerade händelser</h2><span className="admin-example-label">Exempel</span></div>
                <ul className="admin-event-list">{plannedEvents.map(event => <li key={event.day}>
                    <div className="admin-event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
                    <div className="admin-event-copy"><strong>{event.title}</strong><span>{event.property}</span><small>Kl. {event.time}</small></div><span className={`admin-badge tone-${event.tone}`}>{event.category}</span>
                </li>)}</ul>
            </section>
            <div className="admin-overview-side">
                <RecentActivity />
                <section className="admin-card"><div className="admin-card-heading"><h2><IconChartPie />Snabbstatus</h2><span className="admin-example-label">Exempel</span></div>
                    <ul className="admin-quick-list">{quickStatus.map((item, index) => { const Icon = [IconAlertTriangle, IconPhoto, IconFileDescription][index]; return <li key={item.title}><span className={`admin-round-icon tone-${item.tone}`}><Icon size={24} /></span><div><strong>{item.title}</strong><span>{item.count} fastigheter</span></div></li>; })}</ul>
                </section>
            </div>
        </div>
    </div>;
}
