import { useEffect, useId, useRef, useState } from "react";
import type { SavePropertyProgress } from "../types/types";

type Props = { progress: SavePropertyProgress; busy: boolean; reviewUrl?: string };

export function PropertyProgressDialog({ progress, busy, reviewUrl }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const [copyMessage, setCopyMessage] = useState("");

    useEffect(() => {
        dialog.current?.showModal();
    }, [progress.status, busy]);

    return <dialog ref={dialog} className="property-progress-dialog" aria-labelledby={titleId}
        onCancel={event => { if (busy) event.preventDefault(); }}>
        <h2 id={titleId}>{busy ? "Sparar fastigheten" : progress.status === "success" ? "Klart!" : "Sparningen avbröts"}</h2>
        <div className={"admin-save-progress" + (progress.status === "error" ? " is-error" : "")}
            role={progress.status === "error" ? "alert" : "status"} aria-live="polite" aria-atomic="true">
            <progress aria-label="Sparning av fastighet" max={100} value={progress.percent} />
            <strong>{progress.percent}% · {progress.title}</strong>
            <p>{progress.detail}</p>
            {!!progress.issues?.length && <ul>{progress.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
        </div>
        {progress.supportReport && <details>
            <summary>Felsökningsinformation att skicka till support</summary>
            <p>Kopiera texten nedan och skicka den till den som hjälper dig med hemsidan.</p>
            <textarea aria-label="Felrapport" readOnly rows={8} value={progress.supportReport} style={{ width: "100%", boxSizing: "border-box", font: "inherit" }} />
            <button type="button" className="admin-button" onClick={async () => {
                try {
                    await navigator.clipboard.writeText(progress.supportReport!);
                    setCopyMessage("Felrapporten är kopierad.");
                } catch {
                    setCopyMessage("Markera och kopiera texten i rutan ovan.");
                }
            }}>Kopiera felrapport</button>
            <p role="status">{copyMessage}</p>
        </details>}
        {busy ? <p>Vänta tills sparningen är klar. Lämna inte sidan.</p> : <div className="admin-property-actions">
            {reviewUrl && <a className="admin-button is-primary" href={reviewUrl}
                target={progress.status === "error" ? "_blank" : undefined} rel="noopener noreferrer">
                {progress.status === "success" ? "Öppna fastigheten" : "Granska sparat resultat"}
            </a>}
            <button type="button" className="admin-button" onClick={() => dialog.current?.close()}>Stäng</button>
        </div>}
    </dialog>;
}
