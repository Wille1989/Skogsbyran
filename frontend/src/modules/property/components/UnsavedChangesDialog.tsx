import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";

const fieldLabels: Record<string, string> = {
    title: "Fastighetens titel", caption: "Fastighetsbeskrivning", price: "Pris", size: "Areal",
    slug: "Webbadress", listingStatus: "Försäljningsstatus", isVisible: "Publicering",
    publishAt: "Publiceringsdatum", scheduledListingStatus: "Schemalagd status", scheduledStatusAt: "Datum för statusbyte",
};

export function UnsavedChangesDialog({ fields, mapDirty, imageDirty, documentDirty, disabled, onSaveDraft, saveDraftError, saveDraftBlocked }: {
    onSaveDraft?: () => Promise<boolean>; saveDraftError?: string | null; saveDraftBlocked?: boolean;
    fields: string[]; mapDirty: boolean; imageDirty: boolean; documentDirty: boolean; disabled: boolean;
}) {
    const [savingDraft, setSavingDraft] = useState(false);
    const changes = [...fields.map(field => fieldLabels[field] ?? field),
        ...(mapDirty ? ["Adress, kartpunkter eller områden"] : []),
        ...(imageDirty ? ["Bilder, bildordning eller omslagsbild"] : []),
        ...(documentDirty ? ["Dokument"] : [])];
    const dirty = !disabled && changes.length > 0;
    const blocker = useBlocker(dirty);
    const dialog = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        if (blocker.state === "blocked") dialog.current?.showModal();
        else dialog.current?.close();
    }, [blocker.state]);
    useEffect(() => {
        if (!dirty) return;
        const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    return <dialog ref={dialog} className="property-delete-dialog" aria-labelledby="unsaved-title"
        onCancel={event => { if (savingDraft) { event.preventDefault(); return; } if (blocker.state === "blocked") blocker.reset(); }}>
        <h2 id="unsaved-title">Du har osparade ändringar</h2>
        <p>Du har ändrat följande:</p>
        <ul className="unsaved-changes-list">{changes.map(change => <li key={change}>{change}</li>)}</ul>
        <p>{onSaveDraft ? "Spara som en dold fastighet och fortsätt senare, eller kasta utkastet." : "Om du lämnar sidan försvinner ändringarna som inte har sparats."}</p>
        {saveDraftError && <p role="alert" className="admin-error">{saveDraftError}</p>}
        {savingDraft && <p role="status">Sparar utkast… Vänta tills sparningen är klar.</p>}
        <div className="admin-property-actions">
            {onSaveDraft && <button type="button" className="admin-button is-primary" disabled={savingDraft || saveDraftBlocked} onClick={async () => {
                setSavingDraft(true);
                try { if (await onSaveDraft() && blocker.state === "blocked") blocker.proceed(); }
                finally { setSavingDraft(false); }
            }}>Spara utkast</button>}
            <button type="button" className="admin-button" disabled={savingDraft} autoFocus onClick={() => { if (blocker.state === "blocked") blocker.reset(); }}>{onSaveDraft ? "Fortsätt skapa" : "Stanna kvar"}</button>
            <button type="button" className="admin-button" disabled={savingDraft} onClick={() => { if (blocker.state === "blocked") blocker.proceed(); }}>{onSaveDraft ? "Kasta utkast" : "Lämna utan att spara"}</button>
        </div>
    </dialog>;
}
