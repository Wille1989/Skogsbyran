import { DocumentItem } from "./DocumentItem.tsx";
import { Form } from "./Form.tsx";
import type { DocumentItem as DocumentItemType } from "./types.ts";

type DocumentsProps = {
    propertyId: string;
    documents: DocumentItemType[];
};

export function Documents({propertyId, documents}: DocumentsProps) {
    return (
        <section className="documents">
            <header className="documents-header">
                <h2>Fastighetsdokument</h2>
            </header>

            <Form propertyId={propertyId} />

            {documents.length > 0 ? (
                <div className="documents-list">
                    {documents.map((document) => (
                        <DocumentItem
                            key={document.documentId}
                            document={document}
                        />
                    ))}
                </div>
            ) : (
                <p>Det finns inga dokument uppladdade ännu.</p>
            )}
        </section>
    );
}