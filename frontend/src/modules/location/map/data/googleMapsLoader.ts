import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
export const googleMapsMapId = (import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined)
  || (import.meta.env.DEV ? "DEMO_MAP_ID" : undefined);

let googleMapsLoader: Promise<typeof google> | null = null;
let optionsAreSet = false;
let authenticationFailed = false;
export const mapsAuthErrorEvent = "property-map-auth-error";
export const mapsAuthErrorMessage = "Google Maps nekade åtkomst. Kontrollera API-nyckel, tillåtna webbplatser och aktiverade Google API:er.";

export function loadGoogleMaps(): Promise<typeof google> {
  if (authenticationFailed) return Promise.reject(new Error(mapsAuthErrorMessage));
  if (!apiKey) {
    return Promise.reject(new Error("Google Maps API key saknas i frontendens miljovariabler."));
  }

  if (!googleMapsMapId) return Promise.reject(new Error("Google Maps map ID saknas i frontendens miljövariabler."));

  if (!googleMapsLoader) {
    if (!optionsAreSet) {
      const mapsWindow = window as Window & { gm_authFailure?: () => void };
      const previous = mapsWindow.gm_authFailure;
      mapsWindow.gm_authFailure = () => {
        authenticationFailed = true;
        window.dispatchEvent(new Event(mapsAuthErrorEvent));
        previous?.();
      };
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
