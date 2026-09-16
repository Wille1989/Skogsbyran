import { useState, type ReactNode } from "react";
import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { IconWorld, IconClock, IconChevronDown } from "@tabler/icons-react";
import type { FormDetails, ListingStatus } from "./types";
import { listingStatusOptions, scheduleSummary } from "./publication";
import "./PublicationFields.css";

type Props = { control: Control<FormDetails>; setValue: UseFormSetValue<FormDetails>; cover?: ReactNode };

function DateTimeFields({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
    const [date = "", time = ""] = value.split("T");
    return <div className="publication-date-time">
        <label>Datum<input type="date" aria-label={`${label}: datum`} value={date} onInput={event => onChange(`${event.currentTarget.value}T${time}`)} /></label>
        <label>Tid<input type="time" aria-label={`${label}: tid`} value={time} onInput={event => onChange(`${date}T${event.currentTarget.value}`)} /></label>
    </div>;
}

export function PublicationFields({ control, setValue, cover }: Props) {
    const [panel, setPanel] = useState<"publication" | "status" | null>(null);
    const [isVisible, publishAt, scheduledListingStatus, scheduledStatusAt, listingStatus] = useWatch({ control, name: ["isVisible", "publishAt", "scheduledListingStatus", "scheduledStatusAt", "listingStatus"] });
    const statusLabel = (status: ListingStatus | null) => listingStatusOptions.find(option => option.value === status)?.label ?? "Välj status";
    const toggle = (next: "publication" | "status") => setPanel(current => current === next ? null : next);

    return <div className="publication-fields">
        <button type="button" className="publication-toggle" aria-expanded={panel === "publication"} aria-controls="publication-panel" onClick={() => toggle("publication")}>
            <IconWorld /><span><strong>Publicering</strong><small>{isVisible ? "Publicerad" : "Avpublicerad"}{publishAt !== null && ` · Schemalagd ${scheduleSummary(publishAt)}`}</small></span><IconChevronDown />
        </button>
        <button type="button" className="publication-toggle" aria-expanded={panel === "status"} aria-controls="status-schedule-panel" onClick={() => toggle("status")}>
            <IconClock /><span><strong>Schemalägg status</strong><small>{scheduledStatusAt === null ? "Ingen schemaläggning" : `${statusLabel(listingStatus)} → ${statusLabel(scheduledListingStatus)} · ${scheduleSummary(scheduledStatusAt)}`}</small></span><IconChevronDown />
        </button>
        <div className="publication-cover-area">
            <div hidden={panel !== null}>{cover}</div>
            <section id="publication-panel" className="publication-panel" hidden={panel !== "publication"} aria-label="Publiceringsinställningar">
                <h3>Publiceringsinställningar</h3>
                <label>Publiceringsstatus<select value={String(isVisible)} onChange={event => {
                    const visible = event.target.value === "true";
                    setValue("isVisible", visible);
                    if (visible) setValue("publishAt", null);
                }}><option value="false">Avpublicerad</option><option value="true">Publicerad</option></select></label>
                <label className="publication-checkbox"><input type="checkbox" checked={publishAt !== null} disabled={isVisible} onChange={event => setValue("publishAt", event.target.checked ? "" : null)} />Schemalägg publicering</label>
                {publishAt !== null && <><DateTimeFields label="Publicering" value={publishAt} onChange={value => setValue("publishAt", value)} /><p className="publication-info">Fastigheten publiceras automatiskt {scheduleSummary(publishAt)}.</p></>}
            </section>
            <section id="status-schedule-panel" className="publication-panel" hidden={panel !== "status"} aria-label="Schemalägg statusändring">
                <h3>Schemalägg statusändring</h3>
                <label className="publication-checkbox"><input type="checkbox" checked={scheduledStatusAt !== null} onChange={event => {
                    setValue("scheduledStatusAt", event.target.checked ? "" : null);
                    setValue("scheduledListingStatus", event.target.checked ? listingStatus : null);
                }} />Schemalägg statusändring</label>
                {scheduledStatusAt !== null && <><label>Ny status<select value={scheduledListingStatus ?? listingStatus} onChange={event => setValue("scheduledListingStatus", event.target.value as ListingStatus)}>{listingStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
                    <DateTimeFields label="Statusändring" value={scheduledStatusAt} onChange={value => setValue("scheduledStatusAt", value)} /><p className="publication-info">Status ändras till {statusLabel(scheduledListingStatus)} {scheduleSummary(scheduledStatusAt)}.</p></>}
            </section>
        </div>
        <small className="publication-timezone">Tider anges i {Intl.DateTimeFormat().resolvedOptions().timeZone}.</small>
    </div>;
}
