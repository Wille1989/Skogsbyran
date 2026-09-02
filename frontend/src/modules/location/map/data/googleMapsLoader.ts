import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const googleMapsMapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

let googleMapsLoader: Promise<typeof google> | null = null;
let optionsAreSet = false;

export function loadGoogleMaps(): Promise<typeof google> {
  if (window.google?.maps) {
    return Promise.resolve(window.google);
  }

  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key saknas i frontendens miljovariabler."));
  }

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
    ]).then(() => window.google);
  }

  return googleMapsLoader;
}
