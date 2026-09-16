import { useEffect, useState } from "react";
import { IconClock, IconEye, IconEyeOff, IconFileDescription, IconPhoto, IconPencil, IconTrash } from "@tabler/icons-react";
import { useLatestActivity } from "../data/queries";
import type { ActivityEventType } from "../data/types";
import { relativeTime } from "./relativeTime";

const presentation = {
    property_created: { title: "Ny fastighet skapad", icon: IconFileDescription },
    property_deleted: { title: "Fastighet raderad", icon: IconTrash },
    property_updated: { title: "Fastighet uppdaterad", icon: IconPencil },
    images_uploaded: { title: "Bilder uppladdade", icon: IconPhoto },
    property_published: { title: "Publicerad på webbplatsen", icon: IconEye },
    property_unpublished: { title: "Avpublicerad från webbplatsen", icon: IconEyeOff },
} satisfies Record<ActivityEventType, { title: string; icon: typeof IconEye }>;

export function RecentActivity() {
    const { data, isPending, isError, refetch } = useLatestActivity();
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = window.setInterval(() => setNow(Date.now()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    return <section className="admin-card">
        <div className="admin-card-heading"><h2><IconClock />Senaste aktivitet</h2></div>
        {isPending ? <p role="status">Laddar aktivitet…</p>
            : isError ? <p role="alert">Aktiviteten kunde inte hämtas. <button type="button" onClick={() => void refetch()}>Försök igen</button></p>
                : data?.data.length === 0 ? <p>Inga aktiviteter ännu.</p>
                    : <ul className="admin-activity-list">{data?.data.map(activity => {
                        const { title, icon: Icon } = presentation[activity.eventType];
                        const propertyText = activity.property
                            ? [activity.property.title, activity.property.city].filter(Boolean).join(", ")
                            : "Borttagen fastighet";
                        return <li key={activity.id}>
                            <span className="admin-round-icon"><Icon size={22} /></span>
                            <div><strong>{title}</strong>{activity.eventType !== "property_deleted" && <span>{propertyText}</span>}</div>
                            <small><time dateTime={activity.occurredAt} title={new Date(activity.occurredAt).toLocaleString("sv-SE")}>{relativeTime(activity.occurredAt, now)}</time></small>
                        </li>;
                    })}</ul>}
    </section>;
}
