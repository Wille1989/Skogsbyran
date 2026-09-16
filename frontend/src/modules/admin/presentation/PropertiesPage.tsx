import { useState } from "react";
import { Link } from "react-router-dom";
import { IconPlus, IconSearch, IconArrowRight, IconPhoto, IconAlertTriangle, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useAdminPropertiesQuery } from "@/modules/property/data/queries";
import { listingStatusLabels, locationLabel } from "@/modules/property/presentation/propertyListing";
import { completenessExamples, type CompletenessPreview } from "../data/overviewFixtures";
import type { PropertyListingItem } from "@/modules/property/data/types";

const filters = ["Alla", "Till salu", "Kommande", "Sålda", "Avpublicerade"] as const;
type Filter = typeof filters[number];
const pageSize = 8;

function matchesFilter(property: PropertyListingItem, filter: Filter): boolean {
    if (filter === "Alla") return true;
    if (filter === "Avpublicerade") return !property.details.isVisible;
    if (filter === "Kommande") return property.details.isVisible && property.details.listingStatus === "upcoming";
    if (filter === "Sålda") return property.details.isVisible && property.details.listingStatus === "sold";
    return property.details.isVisible && ["available", "bidding", "reserved"].includes(property.details.listingStatus);
}

function PropertyCompleteness({ preview }: { preview: CompletenessPreview }) {
    return <div className="admin-completeness"><div><progress max={100} value={preview.percent} aria-label="Kompletthet, exempeldata" /><span>{preview.percent}%</span></div>{preview.warnings.map(warning => <small key={warning}><IconAlertTriangle size={15} />Exempel: {warning}</small>)}</div>;
}

export function PropertiesPage() {
    const { data, isPending, error, refetch } = useAdminPropertiesQuery();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<Filter>("Alla");
    const [incomplete, setIncomplete] = useState(false);
    const [page, setPage] = useState(1);
    const rows = (data?.properties ?? []).map((property, index) => ({ property, preview: completenessExamples[index % completenessExamples.length] }));
    const matching = rows.filter(({ property, preview }) =>
        matchesFilter(property, filter) && (!incomplete || preview.percent < 100)
        && `${property.details.title} ${locationLabel(property)}`.toLocaleLowerCase("sv-SE").includes(search.trim().toLocaleLowerCase("sv-SE")));
    const pages = Math.max(1, Math.ceil(matching.length / pageSize));
    const currentPage = Math.min(page, pages);
    const visible = matching.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    return <div>
        <header className="admin-page-heading"><div><span className="admin-eyebrow">ADMIN / FASTIGHETER</span><h1>Fastigheter</h1><p>Hantera och redigera dina fastigheter.{data && ` ${rows.length} fastigheter hämtade.`}</p></div><Link className="admin-button is-primary" to="/admin/properties/create"><IconPlus size={20} />Ny fastighet</Link></header>
        <div className="admin-property-toolbar">
            <label className="admin-search"><IconSearch size={21} /><input type="search" aria-label="Sök fastighet" placeholder="Sök fastighet…" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} /></label>
            <div className="admin-tabs" aria-label="Filtrera fastigheter">{filters.map(item => <button key={item} type="button" aria-pressed={filter === item} onClick={() => { setFilter(item); setPage(1); }}>{item}</button>)}</div>
            <label className="admin-checkbox"><input type="checkbox" checked={incomplete} onChange={event => { setIncomplete(event.target.checked); setPage(1); }} />Endast ofullständiga <small>(exempel)</small></label>
        </div>
        <p className="admin-list-note">Listan visar publicerade och avpublicerade fastigheter. Status är verklig; kompletthet och dess filter använder exempeldata. Ändringsdatum saknas i API-svaret.</p>
        {isPending ? <div className="admin-card" role="status">Hämtar fastigheter…</div> : error ? <div className="admin-card" role="alert"><p>Fastigheterna kunde inte hämtas.</p><button type="button" className="admin-button" onClick={() => void refetch()}>Försök igen</button></div> : <section className="admin-card admin-table-card" aria-label="Fastigheter">
            <div className="admin-table-scroll"><table className="admin-property-table"><thead><tr><th scope="col">Fastighet</th><th scope="col">Status</th><th scope="col">Kompletthet <small>Exempel</small></th><th scope="col">Senast ändrad</th><th scope="col">Åtgärd</th></tr></thead>
                <tbody>{visible.map(({ property, preview }) => <tr key={property.propertyId}>
                    <td><Link to={`/admin/properties/${property.propertyId}/edit`} className="admin-property-name">{property.primaryImage ? <img src={property.primaryImage.urls.large} alt="" loading="lazy" /> : <span className="admin-property-thumbnail"><IconPhoto /></span>}<span><strong>{property.details.title}</strong><small>{locationLabel(property) || "Ort saknas"}</small></span></Link></td>
                    <td><span className={`admin-badge tone-${!property.details.isVisible ? "amber" : property.details.listingStatus === "upcoming" ? "blue" : property.details.listingStatus === "sold" ? "neutral" : "green"}`}>{listingStatusLabels[property.details.listingStatus]}</span><small className="admin-muted">{property.details.isVisible ? "Publicerad" : "Avpublicerad"}</small></td>
                    <td><PropertyCompleteness preview={preview} /></td><td className="admin-muted">Ej tillgängligt</td>
                    <td><Link className="admin-button" to={`/admin/properties/${property.propertyId}/edit`} aria-label={`Redigera ${property.details.title}`}>Redigera<IconArrowRight size={18} /></Link></td>
                </tr>)}</tbody>
            </table></div>
            {!visible.length && <p className="admin-empty">Inga fastigheter matchar ditt urval.</p>}
            <footer className="admin-pagination"><span>{matching.length ? `Visar ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, matching.length)} av ${matching.length} fastigheter` : "0 fastigheter"}</span><div><button type="button" aria-label="Föregående sida" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><IconChevronLeft size={18} /></button><span aria-live="polite">Sida {currentPage} av {pages}</span><button type="button" aria-label="Nästa sida" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><IconChevronRight size={18} /></button></div></footer>
        </section>}
    </div>;
}
