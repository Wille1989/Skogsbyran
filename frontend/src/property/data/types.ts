import type { FormDetails } from "../details/types";
import type { PendingDocument } from "../documents/types";
import type { NewImageFile } from "../images/data/types";
import type { PropertyLocationPayload } from "../location/types";
import type { PropertyAreaPayload } from "../map/data/types";

export type CreatePropertyInput = {
    details: FormDetails;
    images: NewImageFile[];
    areas: PropertyAreaPayload[];
    location: PropertyLocationPayload | null;
    documents: PendingDocument[];
};
