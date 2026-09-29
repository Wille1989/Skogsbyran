import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import type { FormDetails, ListingStatus } from "../types/types";
import { listingStatusOptions, scheduleSummary } from "../helpers/publication";
import "./PublicationFields.css";

type Props = { control: Control<FormDetails>; setValue: UseFormSetValue<FormDetails> };

export function PublicationFields({ control, setValue }: Props) {
    const [isVisible, publishAt, scheduledListingStatus, scheduledStatusAt, listingStatus] = useWatch({
        control, name: ["isVisible", "publishAt", "scheduledListingStatus", "scheduledStatusAt", "listingStatus"],
    });
    const visibility = isVisible ? "visible" : publishAt !== null ? "scheduled" : "hidden";

    return <div className="publication-fields">
        <section className="publication-panel" aria-labelledby="publication-title">
            <h3 id="publication-title">Synlighet på hemsidan</h3>
            <label>Publicering<select value={visibility} onChange={event => {
                setValue("isVisible", event.target.value === "visible", { shouldDirty: true });
                setValue("publishAt", event.target.value === "scheduled" ? publishAt ?? "" : null, { shouldDirty: true });
            }}>
                <option value="hidden">Dold – endast i administrationen</option>
                <option value="visible">Publicerad – synlig för besökare</option>
                <option value="scheduled">Publicera vid valt datum</option>
            </select></label>
            {visibility === "scheduled" && <label>Publicera datum och tid
                <input type="datetime-local" required value={publishAt ?? ""} onChange={event => setValue("publishAt", event.target.value, { shouldDirty: true })} />
            </label>}
            <p className="publication-info">{visibility === "visible" ? "Fastigheten blir synlig för besökare när du sparar." : visibility === "scheduled" ? "Fastigheten är dold fram till vald tid. Spara för att aktivera schemat." : "Fastigheten visas inte för besökare. Du kan fortsätta arbeta med den här."}</p>
        </section>
        <section className="publication-panel" aria-labelledby="listing-status-title">
            <h3 id="listing-status-title">Försäljningsstatus</h3>
            <label>Status på fastigheten<select value={listingStatus} onChange={event => setValue("listingStatus", event.target.value as ListingStatus, { shouldDirty: true })}>
                {listingStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select></label>
            <p className="publication-info">Beskriver försäljningen, till exempel Till salu eller Såld. Statusen ändrar inte om fastigheten är synlig.</p>
            <label className="publication-checkbox"><input type="checkbox" checked={scheduledStatusAt !== null} onChange={event => {
                setValue("scheduledStatusAt", event.target.checked ? "" : null, { shouldDirty: true });
                setValue("scheduledListingStatus", event.target.checked ? listingStatus : null, { shouldDirty: true });
            }} />Ändra status automatiskt senare</label>
            {scheduledStatusAt !== null && <>
                <label>Byt till<select value={scheduledListingStatus ?? listingStatus} onChange={event => setValue("scheduledListingStatus", event.target.value as ListingStatus, { shouldDirty: true })}>
                    {listingStatusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select></label>
                <label>Byt status datum och tid<input type="datetime-local" required value={scheduledStatusAt} onChange={event => setValue("scheduledStatusAt", event.target.value, { shouldDirty: true })} /></label>
                <p className="publication-info">Planerad ändring: {scheduleSummary(scheduledStatusAt)}. Aktiveras när du sparar.</p>
            </>}
        </section>
        {(publishAt !== null || scheduledStatusAt !== null) && <small className="publication-timezone">Tider anges i {Intl.DateTimeFormat().resolvedOptions().timeZone}.</small>}
        <p className="publication-info">Alla ändringar ovan börjar gälla när du sparar fastigheten.</p>
    </div>;
}
