import type { FormDetails } from "../../property/details/types";
import type { ImageFile } from "../../property/images/data/types";
import type { DocumentItem } from "../../property/documents/types";
import type { PropertyArea } from "../../property/map/data/types";
import type { PropertyLocationResponse } from "../../property/location/types";

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
    properties: ResponseProperty[];
};
