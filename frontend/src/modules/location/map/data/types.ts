export type Coordinates = {
    lat: number;
    lng: number;
};

export type PropertyArea = {
    id: string;
    propertyId: string;
    name: string;
    polygon: Coordinates[];
    marker: Coordinates;
    areaSquareMeters: number;
    areaHectares: number;
    createdAt?: string;
    updatedAt?: string;
};

export type PropertyAreaCollection = {
    propertyId: string;
    totalAreaSquareMeters: number;
    areas: PropertyArea[];
};

export type PropertyAreaPayload = {
    name: string;
    polygon: Coordinates[];
    marker: Coordinates;
};

export type PropertyAreaDraft = {
    name: string;
    polygon: Coordinates[];
    marker: Coordinates | null;
};