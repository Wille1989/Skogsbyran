import { PropertyProgressDialog } from "./PropertyProgressDialog";
import { type Ref, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { IconArrowLeft, IconDeviceFloppy, IconMapPin } from "@tabler/icons-react";
import { DetailsForm } from "@/modules/property/details/components/DetailsForm";
import type { FormDetails } from "@/modules/property/details/types/types";
import { ImageDropZone } from "@/modules/image/components/ImageDropZone";
import type { useImageFiles } from "@/modules/image/hooks/useImageFiles";
import { PropertyMapEditor } from "@/modules/location/map/components/PropertyMapEditor";

import type { EditableAreaDraft } from "@/modules/property/helpers/editDrafts";
import type { PropertyLocationDraft } from "@/modules/location/types/types";
import type { SavePropertyProgress } from "@/modules/property/types/types";

type Props = {
    title: string;
    valuesRef?: Ref<() => FormDetails>;
    onDirtyFieldsChange?: (fields: string[]) => void;
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
    onSaveMap?: () => Promise<void>;
    isMapSaving?: boolean;
    mapSaveStatus?: string;
    mapSaveError?: boolean;
    mapSaveBlocked?: boolean;
    mapDirty?: boolean;
    mapReviewUrl?: string;
    submitLabel: string;
    error?: string | null;
    progress?: SavePropertyProgress | null;
    saved?: boolean;
    saveBlocked?: boolean;
    reviewUrl?: string;
    fieldErrors?: Record<string, string>;
    onDelete?: () => void;
    isDeleting?: boolean;
};

export function PropertyForm(props: Props) {
    return <div className="admin-property-form" aria-busy={props.isSaving}>
        <div className="admin-property-sticky">
            <Link to="/admin" className="admin-back"><IconArrowLeft size={22} aria-hidden="true" />Tillbaka till översikten</Link>
            <header className="admin-page-heading"><div><h1>{props.title}</h1><p className={props.subtitle ? "admin-property-title" : undefined}>{props.subtitle || "Fyll i informationen nedan för att skapa fastigheten."}</p></div></header>
            <div className="admin-property-actions">{props.onDelete && <button type="button" className="admin-button is-danger" disabled={props.isSaving || props.isMapSaving} onClick={props.onDelete}>{props.isDeleting ? "Raderar..." : "Radera fastighet"}</button>}<button type="submit" form="property-form" className="admin-button is-primary" disabled={props.isSaving || props.isMapSaving || props.saveBlocked}><IconDeviceFloppy size={18} />{props.isDeleting ? "Raderar..." : props.isSaving ? "Sparar…" : props.submitLabel}</button></div>
        </div>
        {props.error && <p className="admin-error" role="alert">{props.error}</p>}
        {props.saved && <p className="admin-notice" role="status">Förändringarna är sparade.</p>}
        {props.progress && !props.isDeleting && <PropertyProgressDialog progress={props.progress} busy={props.isSaving} reviewUrl={props.reviewUrl} />}
        {props.reviewUrl && <p className="admin-notice"><a href={props.reviewUrl} target={props.progress?.status === "error" ? "_blank" : undefined} rel="noopener noreferrer">{props.progress?.status === "success" ? "Öppna den skapade fastigheten" : "Granska sparat resultat i en ny flik"}</a>{props.progress?.status === "error" && " · Sparning är pausad här för att undvika dubbletter."}</p>}
        <div className="admin-form-sections" inert={props.isSaving || props.progress?.status === "success" && !!props.saveBlocked}>
            <section className="admin-card admin-basic"><h2>Grundinformation</h2><DetailsForm valuesRef={props.valuesRef} onDirtyFieldsChange={props.onDirtyFieldsChange} serverErrors={props.fieldErrors} initialValues={props.initialDetails} onSubmit={props.onSubmit} documents={<section className="admin-documents">{props.documents}</section>} /></section>
            <section className="admin-card admin-images"><ImageDropZone imageFiles={props.imageFiles} onEditExistingImage={props.onEditImage} /></section>
            <section className="admin-card admin-map-section"><div className="admin-card-heading"><div><h2><IconMapPin size={23} />Karta och områden</h2><p>Markera fastighetens gränser och lägg till eventuella delområden.</p></div></div>
                <PropertyMapEditor location={props.location} onLocationChange={props.onLocationChange} areas={props.areas} onAreasChange={props.onAreasChange} disabled={props.isSaving || props.saveBlocked} onSave={props.onSaveMap} saving={props.isMapSaving} saveStatus={props.mapSaveStatus} saveError={props.mapSaveError} saveBlocked={props.mapSaveBlocked} dirty={props.mapDirty} reviewUrl={props.mapReviewUrl} />
            </section>
        </div>
    </div>;
}

