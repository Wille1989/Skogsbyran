export const propertyQueryKeys = {
      all: ["properties"] as const,
      byId: (propertyId: string) => ["property", propertyId] as const, 
      areas: (propertyId: string) => ["property", propertyId, "areas"] as const,
};
