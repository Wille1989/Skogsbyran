import type { ListingStatus } from "../details/types";
import type { ImageFile } from "../images/data/types";
import type { ResponseProperty } from "../../shared/data/response";

export type PropertyListingSection = {
  title: string;
  properties: ResponseProperty[];
};

const currentStatuses: ListingStatus[] = ["available", "bidding", "reserved"];
const upcomingStatuses: ListingStatus[] = ["upcoming"];
const soldStatuses: ListingStatus[] = ["sold"];

export const listingStatusLabels: Record<ListingStatus, string> = {
  available: "Till salu",
  upcoming: "Kommande",
  bidding: "Budgivning pågår",
  reserved: "Reserverad",
  sold: "Förmedlad",
};

export function getPrimaryImage(images: ImageFile[]): ImageFile | null {
  return images.find((image) => image.isPrimary) ?? images[0] ?? null;
}

export function groupPropertiesByStatus(properties: ResponseProperty[]): PropertyListingSection[] {
  return [
    {
      title: "Aktuella fastigheter",
      properties: properties.filter((property) => currentStatuses.includes(property.details.listingStatus)),
    },
    {
      title: "Kommande",
      properties: properties.filter((property) => upcomingStatuses.includes(property.details.listingStatus)),
    },
    {
      title: "Förmedlade",
      properties: properties.filter((property) => soldStatuses.includes(property.details.listingStatus)),
    },
  ].filter((section) => section.properties.length > 0);
}

export function formatPrice(price: string): string {
  const numericPrice = Number(price.replace(/[^\d]/g, ""));

  if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
    return price;
  }

  return `${new Intl.NumberFormat("sv-SE").format(numericPrice)} kr`;
}

export function locationLabel(property: ResponseProperty): string {
  const parts = [
    property.location?.city,
    property.location?.municipality &&
      property.location.municipality !== property.location.city
      ? property.location.municipality
      : null,
  ].filter(Boolean);

  return parts.join(" · ");
}
