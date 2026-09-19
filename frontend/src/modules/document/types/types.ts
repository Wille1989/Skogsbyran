export const documentTypes = [
      "bid_form",
      "prospect",
      "property_map",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export type PendingDocument = {
      uiId: string;
      title: string;
      file: File;
};

export type UploadDocumentInput = {
      propertyId: string;
      type?: DocumentType;
      title?: string;
      file: File;
};

export type DeleteDocumentInput = {
      propertyId: string;
      documentId: string;
};

export type UpdateDocumentInput = {
      propertyId: string;
      documentId: string;
      title: string;
};

export type DocumentItem = {
      propertyId: string;
      documentId: string;
      type: DocumentType | "document";
      title: string;
      url: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
};
