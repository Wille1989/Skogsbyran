import { importLibrary, setOptions } from '@googlemaps/js-api-loader';

let configured = false;

let authenticationFailed = false;

export const mapsAuthErrorEvent = 'property-map-auth-error';

export const mapsAuthErrorMessage =
    'Google Maps nekade åtkomst. Kontrollera API-nyckel, tillåtna webbplatser och aktiverade Google API:er.';

function configure() {
    if (authenticationFailed) {
        throw new Error(mapsAuthErrorMessage);
    }
    if (configured) {
        return;
    }
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!key) {
        throw new Error('Google Maps API-nyckel saknas.');
    }
    const mapsWindow = window as Window & { gm_authFailure?: () => void };
    const previous = mapsWindow.gm_authFailure;
    mapsWindow.gm_authFailure = () => {
        authenticationFailed = true;
        window.dispatchEvent(new Event(mapsAuthErrorEvent));
        previous?.();
    };
    setOptions({ key, v: 'weekly' });
    configured = true;
}

export async function loadMapLibrary(): Promise<void> {
    configure();
    await importLibrary('maps');
    if (authenticationFailed) {
        throw new Error(mapsAuthErrorMessage);
    }
}

export async function loadPlacesLibrary(): Promise<void> {
    configure();
    await importLibrary('places');
    if (authenticationFailed) {
        throw new Error(mapsAuthErrorMessage);
    }
}
