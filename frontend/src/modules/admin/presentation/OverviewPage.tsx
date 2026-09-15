import { useState } from "react";
import { IconPointer, IconUsers, IconEye, IconCalendar, IconClock, IconChartPie, IconArrowUpRight, IconFileDescription, IconPhoto, IconPencil, IconUser, IconAlertTriangle } from "@tabler/icons-react";
import { statistics, plannedEvents, recentActivity, quickStatus, type StatisticsPeriod } from "../data/overviewFixtures";

const activityIcons = { create: IconFileDescription, image: IconPhoto, edit: IconPencil, publish: IconEye, contact: IconUser };
const periods: StatisticsPeriod[] = ["Vecka", "Månad", "Kvartal", "År"];

export function OverviewPage() {
    const [period, setPeriod] = useState<StatisticsPeriod>("Vecka");
    const selected = statistics[period];
    const metrics = [
        { title: "Klickstatistik", value: selected.clicks, icon: IconPointer },
        { title: "Antal besökare", value: selected.visitors, icon: IconUsers },
        { title: "Sidvisningar", value: selected.views, icon: IconEye },
    ];
    return <div className="admin-overview">
        <header className="admin-page-heading"><div><span className="admin-eyebrow">ADMIN / ÖVERSIKT</span><h1>Översikt</h1><p>Här kan du se aktivitet, besöksstatistik och planering för dina fastigheter.</p></div></header>
        <p className="admin-notice"><strong>Förhandsvisning med exempeldata.</strong> Statistik, händelser, aktivitet och snabbstatus är ännu inte kopplade till dina fastigheter.</p>
        <section className="admin-card admin-statistics" aria-labelledby="statistics-title">
            <div className="admin-card-heading"><h2 id="statistics-title">Statistik</h2><div className="admin-tabs" aria-label="Statistikperiod">{periods.map(item => <button type="button" key={item} aria-pressed={period === item} onClick={() => setPeriod(item)}>{item}</button>)}</div></div>
            <div className="admin-metrics" aria-live="polite">{metrics.map(({ title, value, icon: Icon }, index) => <div className="admin-metric" key={title}>
                <span className="admin-round-icon"><Icon size={29} stroke={1.5} /></span><div><span>{title}</span><strong>{value.toLocaleString("sv-SE")}</strong><span className="admin-trend"><IconArrowUpRight size={18} /> +{selected.changes[index]} %</span><small>jämfört med {selected.comparison}</small></div>
            </div>)}</div>
        </section>
        <div className="admin-overview-grid">
            <section className="admin-card admin-events"><div className="admin-card-heading"><h2><IconCalendar />Planerade händelser</h2><span className="admin-example-label">Exempel</span></div>
                <ul className="admin-event-list">{plannedEvents.map(event => <li key={event.day}>
                    <div className="admin-event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
                    <div className="admin-event-copy"><strong>{event.title}</strong><span>{event.property}</span><small>Kl. {event.time}</small></div><span className={`admin-badge tone-${event.tone}`}>{event.category}</span>
                </li>)}</ul>
            </section>
            <div className="admin-overview-side">
                <section className="admin-card"><div className="admin-card-heading"><h2><IconClock />Senaste aktivitet</h2><span className="admin-example-label">Exempel</span></div>
                    <ul className="admin-activity-list">{recentActivity.map(activity => { const Icon = activityIcons[activity.type]; return <li key={activity.type}><span className="admin-round-icon"><Icon size={22} /></span><div><strong>{activity.title}</strong><span>{activity.property}</span></div><small>{activity.time}</small></li>; })}</ul>
                </section>
                <section className="admin-card"><div className="admin-card-heading"><h2><IconChartPie />Snabbstatus</h2><span className="admin-example-label">Exempel</span></div>
                    <ul className="admin-quick-list">{quickStatus.map((item, index) => { const Icon = [IconAlertTriangle, IconPhoto, IconFileDescription][index]; return <li key={item.title}><span className={`admin-round-icon tone-${item.tone}`}><Icon size={24} /></span><div><strong>{item.title}</strong><span>{item.count} fastigheter</span></div></li>; })}</ul>
                </section>
            </div>
        </div>
    </div>;
}
