import { useRef, useState, type ChangeEvent } from "react";
import type { PendingDocument } from "./types";
import "./PendingDocuments.css";

type PendingDocumentsProps = {
  documents: PendingDocument[];
  onChange: (documents: PendingDocument[]) => void;
};

function createUiId(): string {
  return crypto.randomUUID();
}

function isPdfFile(file: File): boolean {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function titleFromFile(file: File): string {
  return file.name.replace(/\.pdf$/i, "");
}

export function PendingDocuments({ documents, onChange }: PendingDocumentsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>): void => {
    const selectedFiles = Array.from(event.target.files ?? []);
    const pdfFiles = selectedFiles.filter(isPdfFile);

    if (pdfFiles.length !== selectedFiles.length) {
      setError("Endast PDF-filer kan läggas till.");
    } else {
      setError(null);
    }

    onChange([
      ...documents,
      ...pdfFiles.map((file) => ({
        uiId: createUiId(),
        title: titleFromFile(file),
        file,
      })),
    ]);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const updateTitle = (uiId: string, title: string): void => {
    onChange(documents.map((document) => (document.uiId === uiId ? { ...document, title } : document)));
  };

  const removeDocument = (uiId: string): void => {
    onChange(documents.filter((document) => document.uiId !== uiId));
  };

  return (
    <section className="pending-documents document-form">
      <div className="create-section-copy">
        <strong>Dokument</strong>
        <p>Lägg till en eller flera PDF:er. De laddas upp först när fastigheten sparas.</p>
      </div>

      <div className="form-field">
        <label htmlFor="pending-documents">PDF-dokument</label>
        <input
          ref={fileInputRef}
          id="pending-documents"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={handleFilesSelected}
        />
      </div>

      {documents.length > 0 ? (
        <div className="pending-documents-list">
          {documents.map((document) => (
            <article className="pending-document-card" key={document.uiId}>
              <div className="form-field">
                <label htmlFor={`pending-document-title-${document.uiId}`}>Dokumentnamn</label>
                <input
                  id={`pending-document-title-${document.uiId}`}
                  value={document.title}
                  onChange={(event) => updateTitle(document.uiId, event.target.value)}
                />
              </div>

              <span>{document.file.name}</span>

              <button type="button" className="button button-danger" onClick={() => removeDocument(document.uiId)}>
                Ta bort
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
