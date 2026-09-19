import {
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";

import { useUploadDocumentMutation } from "../hooks/mutations.ts";

import {
    documentTypes,
    type DocumentType,
} from "../types/types.ts";
import "./DocumentUploadForm.css";

type FormProps = {
    propertyId: string;
};

const documentTypeLabels: Record<DocumentType, string> = {
    bid_form: "Budblankett",
    prospect: "Prospekt",
    property_map: "Fastighetskarta",
};

function isPdfFile(file: File): boolean {
    return (
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );
}

export function DocumentUploadForm({ propertyId }: FormProps) {
    const uploadDocument = useUploadDocumentMutation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [type, setType] = useState<DocumentType>(documentTypes[0]);
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>
    ): void => {
        const selectedFile = event.target.files?.[0] ?? null;

        if (selectedFile && !isPdfFile(selectedFile)) {
            setFile(null);
            setError("Endast PDF-filer kan laddas upp.");
            return;
        }

        setFile(selectedFile);
        setError(null);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement> ): void => {
        event.preventDefault();

        if (!propertyId) {
            setError("Fastigheten saknar id.");
            return;
        }

        if (!file) {
            setError("Välj en PDF-fil.");
            return;
        }

        setError(null);

        uploadDocument.mutate(
            {
                propertyId,
                type,
                file,
            },
            {
                onSuccess: () => {
                    setFile(null);

                    if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                    }
                },
            }
        );
    };

    const mutationError =
        uploadDocument.error instanceof Error
            ? uploadDocument.error.message
            : null;

    return (
        <form
            className="document-form"
            onSubmit={handleSubmit}
        >
            <div className="form-field">
                <label htmlFor="document-type">
                    Dokumenttyp
                </label>

                <select
                    id="document-type"
                    value={type}
                    onChange={(event) =>
                        setType(event.target.value as DocumentType)
                    }
                    disabled={uploadDocument.isPending}
                >
                    {documentTypes.map((documentType) => (
                        <option
                            key={documentType}
                            value={documentType}
                        >
                            {documentTypeLabels[documentType]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-field">
                <label htmlFor="document-file">
                    PDF-fil
                </label>

                <input
                    ref={fileInputRef}
                    id="document-file"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={handleFileChange}
                    disabled={uploadDocument.isPending}
                />

                {file && (
                    <span className="document-form-selected-file">
                        Vald fil: {file.name}
                    </span>
                )}
            </div>

            <button
                type="submit"
                className="button"
                disabled={!file || uploadDocument.isPending}
            >
                {uploadDocument.isPending
                    ? "Laddar upp..."
                    : "Ladda upp dokument"}
            </button>

            {(error || mutationError) && (
                <p className="form-error" role="alert">
                    {error ?? mutationError}
                </p>
            )}
        </form>
    );
}
