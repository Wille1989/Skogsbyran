import { type Coordinates } from "../data/types";
import { useEffect, useRef, useState } from "react";
import "./googleMap.css";

type PropertyAreaMapProps = {
  polygon: Coordinates[];
  marker: Coordinates | null;
  mode: "polygon" | "marker";
  onAddPolygonPoint: (point: Coordinates) => void;
  onSetMarker: (marker: Coordinates) => void;
  readOnly?: boolean;
};

type GoogleMapsLibrary = {
  Map: new (element: HTMLElement, options: Record<string, unknown>) => GoogleMapInstance;
  Marker: new (options: Record<string, unknown>) => GoogleMarkerInstance;
  Polygon: new (options: Record<string, unknown>) => GooglePolygonInstance;
  Polyline: new (options: Record<string, unknown>) => GooglePolylineInstance;
  LatLngBounds: new () => GoogleLatLngBoundsInstance;
};

type GoogleMapMouseEvent = {
  latLng?: {
    lat: () => number;
    lng: () => number;
  } | null;
};

type GoogleMapInstance = {
  addListener: (eventName: string, handler: (event: GoogleMapMouseEvent) => void) => GoogleMapsListener;
  fitBounds: (bounds: GoogleLatLngBoundsInstance) => void;
  panTo: (position: Coordinates) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMapsListener = {
  remove: () => void;
};

type GoogleOverlay = {
  setMap: (map: GoogleMapInstance | null) => void;
};

type GoogleMarkerInstance = GoogleOverlay & {
  setPosition: (position: Coordinates) => void;
};

type GooglePolygonInstance = GoogleOverlay;
type GooglePolylineInstance = GoogleOverlay;

type GoogleLatLngBoundsInstance = {
  extend: (point: Coordinates) => void;
};

declare global {
  interface Window {
    google?: {
      maps: GoogleMapsLibrary;
    };
  }
}

const DEFAULT_CENTER: Coordinates = {
  lat: 59.3293,
  lng: 18.0686,
};

const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
let googleMapsLoader: Promise<GoogleMapsLibrary> | null = null;

function roundCoordinate(value: number) {
  return Math.round(value * 1000000) / 1000000;
}

function getGoogleMapsLibrary(): Promise<GoogleMapsLibrary> {
  if (window.google?.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (!mapsApiKey) {
    return Promise.reject(new Error("Google Maps API key saknas i frontendens miljovariabler."));
  }

  if (googleMapsLoader) {
    return googleMapsLoader;
  }

  googleMapsLoader = new Promise<GoogleMapsLibrary>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps) {
          resolve(window.google.maps);
          return;
        }

        reject(new Error("Google Maps laddades men kartbiblioteket hittades inte."));
      });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps-skriptet kunde inte laddas.")));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsApiKey}`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = "true";
    script.onload = () => {
      if (window.google?.maps) {
        resolve(window.google.maps);
        return;
      }

      reject(new Error("Google Maps laddades men kartbiblioteket hittades inte."));
    };
    script.onerror = () => reject(new Error("Google Maps-skriptet kunde inte laddas."));
    document.head.appendChild(script);
  });

  return googleMapsLoader;
}

function getMapCenter(polygon: Coordinates[], marker: Coordinates | null): Coordinates {
  if (marker) {
    return marker;
  }

  if (polygon.length > 0) {
    return polygon[0];
  }

  return DEFAULT_CENTER;
}

export function PropertyAreaMap({
  polygon,
  marker,
  mode,
  onAddPolygonPoint,
  onSetMarker,
  readOnly = false,
}: PropertyAreaMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<GoogleMapInstance | null>(null);
  const mapsRef = useRef<GoogleMapsLibrary | null>(null);
  const markerRef = useRef<GoogleMarkerInstance | null>(null);
  const polygonRef = useRef<GooglePolygonInstance | null>(null);
  const polylineRef = useRef<GooglePolylineInstance | null>(null);
  const clickListenerRef = useRef<GoogleMapsListener | null>(null);
  const modeRef = useRef(mode);
  const addPolygonPointRef = useRef(onAddPolygonPoint);
  const setMarkerRef = useRef(onSetMarker);
  const initialCenterRef = useRef(getMapCenter(polygon, marker));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
    addPolygonPointRef.current = onAddPolygonPoint;
    setMarkerRef.current = onSetMarker;
  }, [mode, onAddPolygonPoint, onSetMarker]);

  useEffect(() => {
    let isCancelled = false;

    async function setupMap() {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      try {
        const maps = await getGoogleMapsLibrary();

        if (isCancelled || !mapElementRef.current) {
          return;
        }

        mapsRef.current = maps;
        mapRef.current = new maps.Map(mapElementRef.current, {
          center: initialCenterRef.current,
          zoom: 6,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          draggable: !readOnly,
          clickableIcons: !readOnly,
          disableDoubleClickZoom: readOnly,
          keyboadshortcuts: !readOnly,
          gestureHandling: readOnly ?  "none" : "auto",
          cameraControl: false,
        });

        if (!readOnly) {
          clickListenerRef.current = mapRef.current.addListener("click", (event) => {
            if (!event.latLng) {
              return;
            }

            const point = {
              lat: roundCoordinate(event.latLng.lat()),
              lng: roundCoordinate(event.latLng.lng()),
            };

            if (modeRef.current === "marker") {
              setMarkerRef.current(point);
              return;
            }

            addPolygonPointRef.current(point);
          });
        }

        setIsReady(true);
      } catch (error) {
        if (!isCancelled) {
          setLoadError((error as Error).message || "Google Maps kunde inte laddas.");
        }
      }
    }

    void setupMap();

    return () => {
      isCancelled = true;
      clickListenerRef.current?.remove();
      clickListenerRef.current = null;
      markerRef.current?.setMap(null);
      polygonRef.current?.setMap(null);
      polylineRef.current?.setMap(null);
      markerRef.current = null;
      polygonRef.current = null;
      polylineRef.current = null;
      mapRef.current = null;
      mapsRef.current = null;
      setIsReady(false);
    };
  }, [readOnly]);

  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;

    if (!maps || !map) {
      return;
    }

    markerRef.current?.setMap(null);
    polygonRef.current?.setMap(null);
    polylineRef.current?.setMap(null);

    if (marker) {
      markerRef.current = new maps.Marker({
        map,
        position: marker,
      });
    } else {
      markerRef.current = null;
    }

    if (polygon.length >= 3) {
      polygonRef.current = new maps.Polygon({
        map,
        paths: polygon,
        strokeColor: "#14532d",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#14532d",
        fillOpacity: 0.18,
      });
      polylineRef.current = null;
    } else if (polygon.length >= 2) {
      polylineRef.current = new maps.Polyline({
        map,
        path: polygon,
        strokeColor: "#14532d",
        strokeOpacity: 1,
        strokeWeight: 3,
      });
      polygonRef.current = null;
    } else {
      polygonRef.current = null;
      polylineRef.current = null;
    }

    const bounds = new maps.LatLngBounds();
    let hasBounds = false;

    polygon.forEach((point) => {
      bounds.extend(point);
      hasBounds = true;
    });

    if (marker) {
      bounds.extend(marker);
      hasBounds = true;
    }

    if (hasBounds) {
      map.fitBounds(bounds);
      return;
    }

    map.panTo(DEFAULT_CENTER);
    map.setZoom(7);
  }, [marker, polygon]);

  if (loadError) {
    return (
      <div className="mock-map-shell">
        <div className="mock-map-banner mock-map-banner-error">{loadError}</div>
      </div>
    );
  }

  return (
    <div className="mock-map-shell">
      {!readOnly ? (
        <div className="mock-map-banner">
          Google Maps aktiv. Klicka i kartan for att {mode === "marker" ? "satta markoren" : "rita polygonen"}.
        </div>
      ) : null}
      <div
        ref={mapElementRef}
        className={`mock-map google-map ${readOnly ? "is-readonly" : ""} ${isReady ? "is-ready" : "is-loading"}`}
        role="img"
        aria-label="Google-karta för fastighetsområden"
      />
    </div>
  );
}
