export type PatchDetails = {
      propertyId: string,
      patch: Partial<FormDetails>
}

export type ListingStatus = "upcoming" | "available" | "bidding" | "reserved" | "sold";

export type FormDetails = {
      title: string;
      caption: string;
      price: string;
      size: string;
      slug: string;
      listingStatus: ListingStatus;
      isVisible: boolean;
      publishAt: string | null;
      scheduledListingStatus: ListingStatus | null;
      scheduledStatusAt: string | null;
};
