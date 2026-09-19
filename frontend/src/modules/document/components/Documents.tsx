import { DocumentItem } from "./DocumentItem.tsx";
import { DocumentUploadForm } from "./DocumentUploadForm.tsx";
import type { DocumentItem as DocumentItemType } from "../types/types.ts";
import './Documents.css';
import { documentPresentation } from '../helpers/documentPresentation';

type DocumentsProps = {
    propertyId: string;
    documents: DocumentItemType[];
    canManage?: boolean;
};

export function Documents({propertyId, documents, canManage = false}: DocumentsProps) {
    return (
        <section className="documents" aria-label="Dokument">
            <header className="documents-header">
                <h2>Dokument</h2>
            </header>

            {canManage && <DocumentUploadForm propertyId={propertyId} />}

            {documents.length > 0 ? (
                <div className="documents-list">
                    {[...documents].sort((a, b) => documentPresentation(a).order - documentPresentation(b).order).map((document) => (
                        <DocumentItem
                            key={document.documentId}
                            document={document}
                            canManage={canManage}
                        />
                    ))}
                </div>
            ) : (
                <p>Det finns inga dokument uppladdade ännu.</p>
            )}
        </section>
    );
}
