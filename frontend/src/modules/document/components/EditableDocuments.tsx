import { IconFileDescription } from "@tabler/icons-react";
import { PendingDocuments } from "./PendingDocuments";
import type { PendingDocument } from "../types/types";
import type { EditableDocumentDraft } from "@/modules/property/helpers/editDrafts";
import "./EditableDocuments.css";

type EditableDocumentsProps = {
  documents: EditableDocumentDraft[];
  pendingDocuments: PendingDocument[];
  onDocumentsChange: (documents: EditableDocumentDraft[]) => void;
  onPendingDocumentsChange: (documents: PendingDocument[]) => void;
};

export function EditableDocuments({
  documents,
  pendingDocuments,
  onDocumentsChange,
  onPendingDocumentsChange,
}: EditableDocumentsProps) {
  const visibleDocuments = documents.filter((document) => !document.isRemoved);

  const updateTitle = (documentId: string, title: string): void => {
    onDocumentsChange(
      documents.map((document) =>
        document.documentId === documentId ? { ...document, title } : document,
      ),
    );
  };

  const markRemoved = (documentId: string): void => {
    onDocumentsChange(
      documents.map((document) =>
        document.documentId === documentId ? { ...document, isRemoved: true } : document,
      ),
    );
  };

  return (
    <section className="editable-documents document-form">
      <PendingDocuments documents={pendingDocuments} onChange={onPendingDocumentsChange} />

      {visibleDocuments.length > 0 ? (
        <div className="editable-document-list">
          {visibleDocuments.map((document) => (
            <article className="editable-document-card" key={document.documentId}>
              <IconFileDescription size={22} aria-hidden="true" />
              <div className="form-field">
                <label htmlFor={`document-title-${document.documentId}`}>Dokumentnamn</label>
                <input
                  id={`document-title-${document.documentId}`}
                  value={document.title}
                  onChange={(event) => updateTitle(document.documentId, event.target.value)}
                />
              </div>

              <div className="document-file-info"><span className="document-save-state">{document.title.trim() === document.originalTitle ? "Sparat" : "Namnändring inte sparad"}</span><a href={document.url} target="_blank" rel="noopener noreferrer" className="editable-document-link" aria-label={`Öppna PDF: ${document.title}`}>
                Öppna PDF
              </a></div>

              <button type="button" className="button button-danger" onClick={() => markRemoved(document.documentId)}>
                Ta bort
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>Det finns inga dokument uppladdade ännu.</p>
      )}


    </section>
  );
}
