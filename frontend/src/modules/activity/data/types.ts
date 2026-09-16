export type ActivityEventType =
    | "property_created"
    | "property_updated"
    | "images_uploaded"
    | "property_published"
    | "property_unpublished";

export type ActivityEvent = {
    id: string;
    eventType: ActivityEventType;
    property: { propertyId: string; title: string; city: string | null } | null;
    occurredAt: string;
};
