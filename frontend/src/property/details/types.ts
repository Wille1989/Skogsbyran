export type PatchDetails = {
      propertyId: string,
      patch: Partial<FormDetails>
}

export type FormDetails = {
      title: string;
      caption: string;
      price: string;
      size: string;
};
