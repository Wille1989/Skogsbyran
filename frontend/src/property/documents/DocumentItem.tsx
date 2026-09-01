import { useDeleteDocumentMutation } from "./mutations.ts";
import  { type DocumentItem as DocumentItemType } from "./types.ts";

type DocumentItemProps = {
    document: DocumentItemType;
};

export function DocumentItem({document}: DocumentItemProps) {
    const deleteDocument = useDeleteDocumentMutation();

    const handleDelete = (): void => {
        deleteDocument.mutate({
            propertyId: document.propertyId,
            documentId: document.documentId,
        });
    };

    return (
        <article className="document-item">
            <div className="document-item-content">
                <strong>
                    {document.title || document.originalName}
                </strong>

                <span>{document.originalName}</span>
            </div>

            <div className="document-item-actions">
                <a
                    href={document.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-button"
                >
                    Öppna PDF
                </a>

                <button
                    type="button"
                    className="button button-danger"
                    onClick={handleDelete}
                    disabled={deleteDocument.isPending}
                >
                    {deleteDocument.isPending ? "Tar bort..." : "Ta bort"}
                </button>
            </div>

            {deleteDocument.error instanceof Error && (
                <p className="form-error" role="alert">
                    {deleteDocument.error.message}
                </p>
            )}
        </article>
    );
}