import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconCrown, IconPhoto, IconMapPin } from "@tabler/icons-react";
import { DetailsForm } from "@/modules/property/details/Form";
import type { FormDetails } from "@/modules/property/details/types";
import { ImageDropZone } from "@/modules/image/presentation/FileDropContainer";
import type { useImageFiles } from "@/modules/image/data/useImageFiles";
import { LocationEditor } from "@/modules/location/LocationEditor";
import { EditableAreas } from "@/modules/location/map/presentation/EditableAreas";
import type { EditableAreaDraft } from "@/modules/property/data/editDrafts";
import type { PropertyLocationDraft } from "@/modules/location/types";
import type { CreatePropertyProgress } from "@/modules/property/data/types";

type Props = {
    title: string;
    subtitle?: string;
    initialDetails?: FormDetails;
    onSubmit: (details: FormDetails) => void;
    imageFiles: ReturnType<typeof useImageFiles>;
    onEditImage?: (imageId: string) => void;
    documents: ReactNode;
    location: PropertyLocationDraft;
    onLocationChange: (location: PropertyLocationDraft) => void;
    areas: EditableAreaDraft[];
    onAreasChange: (areas: EditableAreaDraft[]) => void;
    isSaving: boolean;
    submitLabel: string;
    error?: string | null;
    progress?: CreatePropertyProgress | null;
    saved?: boolean;
};

type SeoPreview = { title: string; description: string; slug: string; keywords: string };

function SeoFields({ slug }: { slug: string }) {
    const [preview, setPreview] = useState<SeoPreview>({ title: "", description: "", slug, keywords: "" });
    return <section className="admin-card admin-seo"><div className="admin-card-heading"><h2>SEO-inställningar</h2><span className="admin-example-label">Förhandsvisning</span></div><p>Dessa fält sparas inte ännu.</p>
        <label>Meta-titel<input value={preview.title} maxLength={60} placeholder="Ex. Skogsfastighet i Mora | Skogsbyrån" onChange={event => setPreview({ ...preview, title: event.target.value })} /><small className="admin-counter">{preview.title.length}/60</small></label>
        <label>Meta-beskrivning<textarea value={preview.description} maxLength={160} rows={3} placeholder="Beskriv fastigheten för sökresultatet" onChange={event => setPreview({ ...preview, description: event.target.value })} /><small className="admin-counter">{preview.description.length}/160</small></label>
        <div className="admin-field-pair"><label>URL-slug<input value={preview.slug} placeholder="skogsfastighet-i-mora" onChange={event => setPreview({ ...preview, slug: event.target.value })} /></label><label>Nyckelord (valfritt)<input value={preview.keywords} placeholder="skog, mark, fastighet" onChange={event => setPreview({ ...preview, keywords: event.target.value })} /></label></div>
    </section>;
}

export function PropertyForm(props: Props) {
    const primary = props.imageFiles.images.find(image => image.isPrimary);
    const cover = primary ? ("file" in primary ? primary.previewUrl : primary.urls.medium) : null;
    const mainMarker = props.location.latitude !== null && props.location.longitude !== null
        ? { lat: props.location.latitude, lng: props.location.longitude } : null;
    return <div className="admin-property-form" aria-busy={props.isSaving}>
        <Link to="/admin/properties" className="admin-back"><IconArrowLeft size={17} />Tillbaka till fastigheter</Link>
        <header className="admin-page-heading"><div><h1>{props.title}</h1><p>{props.subtitle || "Fyll i informationen nedan för att skapa fastigheten."}</p></div><button type="submit" form="property-form" className="admin-button is-primary" disabled={props.isSaving}><IconDeviceFloppy size={18} />{props.isSaving ? "Sparar…" : props.submitLabel}</button></header>
        {props.error && <p className="admin-error" role="alert">{props.error}</p>}
        {props.saved && <p className="admin-notice" role="status">Förändringarna är sparade.</p>}
        {props.progress && <div className="admin-save-progress" role="status"><progress max={100} value={props.progress.percent} /><span>{props.progress.percent}% · {props.progress.label}</span></div>}
        <div className="admin-form-sections">
            <section className="admin-card admin-basic"><h2>Grundinformation</h2><DetailsForm isSaving={props.isSaving} initialValues={props.initialDetails} onSubmit={props.onSubmit} cover={<div className="admin-cover"><span>Omslagsbild</span>{cover ? <div><img src={cover} alt={primary?.details.altText || "Fastighetens omslagsbild"} /><span className="admin-cover-badge"><IconCrown size={15} />Omslagsbild</span></div> : <div className="admin-cover-empty"><IconPhoto size={32} /><span>Välj en omslagsbild i bildhanteringen nedan.</span></div>}</div>} /></section>
            <div className="admin-two-columns"><section className="admin-card admin-documents">{props.documents}</section><SeoFields key={props.initialDetails?.slug ?? "create"} slug={props.initialDetails?.slug ?? ""} /></div>
            <section className="admin-card admin-images"><ImageDropZone imageFiles={props.imageFiles} onEditExistingImage={props.onEditImage} /></section>
            <section className="admin-card admin-map-section"><div className="admin-card-heading"><div><h2><IconMapPin size={23} />Karta och områden</h2><p>Markera fastighetens gränser och lägg till eventuella delområden.</p></div></div>
                <LocationEditor value={props.location} onChange={props.onLocationChange} polygons={props.areas.map(area => area.polygon)} />
                <EditableAreas areas={props.areas} onChange={props.onAreasChange} mainMarker={mainMarker} />
            </section>
        </div>
    </div>;
}
