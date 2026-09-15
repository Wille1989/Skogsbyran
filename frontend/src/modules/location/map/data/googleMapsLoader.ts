import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const googleMapsMapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)
  || (import.meta.env.DEV ? "DEMO_MAP_ID" : undefined);

let googleMapsLoader: Promise<typeof google> | null = null;
let optionsAreSet = false;

export function loadGoogleMaps(): Promise<typeof google> {
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key saknas i frontendens miljovariabler."));
  }

  if (!googleMapsMapId) return Promise.reject(new Error("Google Maps map ID saknas i frontendens miljövariabler."));

  if (!googleMapsLoader) {
    if (!optionsAreSet) {
      setOptions({
        key: apiKey,
        v: "weekly",
        libraries: ["places", "marker"],
      });
      optionsAreSet = true;
    }

    googleMapsLoader = Promise.all([
      importLibrary("maps"),
      importLibrary("places"),
      importLibrary("marker"),
    ]).then(() => window.google).catch((error: unknown) => {
      googleMapsLoader = null;
      throw error;
    });
  }

  return googleMapsLoader;
}
