import type { FormDetails } from "../details/types";
import type { NewImageFile } from "../images/data/types";
import type { PropertyAreaPayload } from "../map/data/types";

export type CreatePropertyInput = {
    details: FormDetails;
    images: NewImageFile[];
    areas: PropertyAreaPayload[];
};