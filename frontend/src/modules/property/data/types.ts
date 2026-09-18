import type { FormDetails } from "../details/types";
import type { PendingDocument } from "@/modules/document/types";
import type { DocumentItem } from "@/modules/document/types";
import type { NewImageFile } from "@/modules/image/data/types";
import type { ImageFile } from "@/modules/image/data/types";
import type { PropertyLocationPayload, PropertyLocationResponse } from "@/modules/location/types";
import type { PropertyArea, PropertyAreaPayload } from "@/modules/location/map/data/types";

export type ResponseProperty = {
    propertyId: string;
    details: FormDetails;
    images: ImageFile[];
    documents: DocumentItem[];
    areas: PropertyArea[];
    location: PropertyLocationResponse | null;
};

export type ResponseGetProperty = {
    property: ResponseProperty;
};

export type ResponseGetProperties = {
    properties: PropertyListingItem[];
};

export type PropertyListingImage = Pick<ImageFile, "imageId"> & {
    urls: Pick<ImageFile["urls"], "large">;
};

export type PropertyListingItem = {
    propertyId: string;
    details: FormDetails;
    primaryImage: PropertyListingImage | null;
    location: {
        city: string;
        municipality: string;
    } | null;
};

export type SavePropertyProgress = {
    status: "saving" | "success" | "error";
    phase: "preparing" | "details" | "images" | "location" | "areas" | "documents" | "finalizing";
    percent: number;
    title: string;
    detail: string;
};

export type CreatePropertyInput = {
    details: FormDetails;
    images: NewImageFile[];
    areas: PropertyAreaPayload[];
    location: PropertyLocationPayload | null;
    documents: PendingDocument[];
    onProgress?: (progress: SavePropertyProgress) => void;
};
