import { DocumentItem } from "./DocumentItem.tsx";
import { Form } from "./Form.tsx";
import type { DocumentItem as DocumentItemType } from "./types.ts";
import './Documents.css';

type DocumentsProps = {
    propertyId: string;
    documents: DocumentItemType[];
    canManage?: boolean;
};

export function Documents({propertyId, documents, canManage = false}: DocumentsProps) {
    return (
        <section className="documents">
            <header className="documents-header">
                <h2>Dokument</h2>
                <p>Här hittar du tillgängliga dokument om fastigheten.</p>
            </header>

            {canManage && <Form propertyId={propertyId} />}

            {documents.length > 0 ? (
                <div className="documents-list">
                    {documents.map((document) => (
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
