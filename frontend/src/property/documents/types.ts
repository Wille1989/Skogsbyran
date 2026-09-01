export const documentTypes = [
      "bid_form",
      "prospect",
      "property_map",
] as const;

export type DocumentType = (typeof documentTypes)[number];

export type UploadDocumentInput = {
      propertyId: string;
      type: DocumentType;
      file: File;
};

export type DeleteDocumentInput = {
      propertyId: string;
      documentId: string;
};

export type DocumentItem = {
      propertyId: string;
      documentId: string;
      type: DocumentType;
      title: string;
      url: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
};
