import { useEffect, useId, useRef, useState } from "react";
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawSelectMode,
  type GeoJSONStoreFeatures,
} from "terra-draw";
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter";
import { type Coordinates } from "../data/types";
import { googleMapsMapId, loadGoogleMaps } from "../data/googleMapsLoader";
import "./googleMap.css";

type PropertyAreaMapProps = {
  polygon: Coordinates[];
  marker: Coordinates | null;
  mode: "polygon" | "marker";
  onPolygonChange: (polygon: Coordinates[]) => void;
  onSetMarker: (marker: Coordinates) => void;
  readOnly?: boolean;
};

const DEFAULT_CENTER: Coordinates = {
  lat: 59.3293,
  lng: 18.0686,
};

function roundCoordinate(value: number): number {
  return Math.round(value * 1000000) / 1000000;
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

function toPolygonFeature(polygon: Coordinates[]): GeoJSONStoreFeatures | null {
  if (polygon.length < 3) {
    return null;
  }

  const ring = polygon.map((point) => [point.lng, point.lat]);
  ring.push([polygon[0].lng, polygon[0].lat]);

  return {
    id: "property-area-draft",
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
    properties: {
      mode: "polygon",
    },
  } as GeoJSONStoreFeatures;
}

function extractPolygon(features: GeoJSONStoreFeatures[]): Coordinates[] {
  const feature = features.find((candidate) => candidate.geometry.type === "Polygon");

  if (!feature || feature.geometry.type !== "Polygon") {
    return [];
  }

  const ring: unknown[] = feature.geometry.coordinates[0] ?? [];
  const openRing: Array<[number, number]> = ring
    .slice(0, -1)
    .filter((coordinate): coordinate is [number, number] =>
      Array.isArray(coordinate) &&
      coordinate.length >= 2 &&
      typeof coordinate[0] === "number" &&
      typeof coordinate[1] === "number",
    );

  return openRing.map(([lng, lat]) => ({
    lat: roundCoordinate(lat),
    lng: roundCoordinate(lng),
  }));
}

export function PropertyAreaMap({
  polygon,
  marker,
  mode,
  onPolygonChange,
  onSetMarker,
  readOnly = false,
}: PropertyAreaMapProps) {
  const mapElementId = useId().replace(/:/g, "");
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const polygonOverlayRef = useRef<google.maps.Polygon | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const modeRef = useRef(mode);
  const onPolygonChangeRef = useRef(onPolygonChange);
  const onSetMarkerRef = useRef(onSetMarker);
  const initialCenterRef = useRef(getMapCenter(polygon, marker));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    modeRef.current = mode;
    onPolygonChangeRef.current = onPolygonChange;
    onSetMarkerRef.current = onSetMarker;
    drawRef.current?.setMode(mode === "polygon" ? "polygon" : "select");
  }, [mode, onPolygonChange, onSetMarker]);

  useEffect(() => {
    let isCancelled = false;

    async function setupMap(): Promise<void> {
      if (!mapElementRef.current || mapRef.current) {
        return;
      }

      try {
        const googleMaps = await loadGoogleMaps();

        if (isCancelled || !mapElementRef.current) {
          return;
        }

        const map = new googleMaps.maps.Map(mapElementRef.current, {
          center: initialCenterRef.current,
          zoom: 7,
          mapId: googleMapsMapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          clickableIcons: !readOnly,
          gestureHandling: readOnly ? "none" : "auto",
          cameraControl: false,
        });

        mapRef.current = map;

        if (!readOnly) {
          clickListenerRef.current = map.addListener("click", (event: google.maps.MapMouseEvent) => {
            if (modeRef.current !== "marker" || !event.latLng) {
              return;
            }

            onSetMarkerRef.current({
              lat: roundCoordinate(event.latLng.lat()),
              lng: roundCoordinate(event.latLng.lng()),
            });
          });

          map.addListener("projection_changed", () => {
            if (drawRef.current || isCancelled) {
              return;
            }

            const draw = new TerraDraw({
              adapter: new TerraDrawGoogleMapsAdapter({
                lib: googleMaps.maps,
                map,
                coordinatePrecision: 7,
              }),
              modes: [
                new TerraDrawPolygonMode({
                  editable: true,
                  showCoordinatePoints: true,
                }),
                new TerraDrawSelectMode({
                  flags: {
                    polygon: {
                      feature: {
                        draggable: true,
                        coordinates: {
                          draggable: true,
                          midpoints: true,
                          deletable: true,
                        },
                      },
                    },
                  },
                }),
              ],
            });

            drawRef.current = draw;
            draw.start();
            draw.on("ready", () => {
              const initialFeature = toPolygonFeature(polygon);

              if (initialFeature) {
                draw.addFeatures([initialFeature]);
                draw.setMode("select");
              } else {
                draw.setMode(modeRef.current === "polygon" ? "polygon" : "select");
              }
            });
            draw.on("change", () => {
              onPolygonChangeRef.current(extractPolygon(draw.getSnapshot()));
            });
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
      if (markerRef.current) {
        markerRef.current.map = null;
      }
      markerRef.current = null;
      polygonOverlayRef.current?.setMap(null);
      polygonOverlayRef.current = null;
      drawRef.current?.stop();
      drawRef.current = null;
      mapRef.current = null;
      setIsReady(false);
    };
  }, [mapElementId, polygon, readOnly]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.map = null;
    }
    markerRef.current = null;

    if (marker) {
      markerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: marker,
        title: "Fastighetspunkt",
      });
    }

    if (!readOnly) {
      return;
    }

    polygonOverlayRef.current?.setMap(null);
    polygonOverlayRef.current = null;

    if (polygon.length >= 3) {
      polygonOverlayRef.current = new google.maps.Polygon({
        map,
        paths: polygon,
        strokeColor: "#14532d",
        strokeOpacity: 1,
        strokeWeight: 3,
        fillColor: "#14532d",
        fillOpacity: 0.18,
      });
    }
  }, [isReady, marker, polygon, readOnly]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isReady) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
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
  }, [isReady, marker, polygon]);

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
          Google Maps och Terra Draw ar aktiva. Rita polygonen i kartan eller satt punktmarkoren.
        </div>
      ) : null}
      <div
        id={mapElementId}
        ref={mapElementRef}
        className={`mock-map google-map ${readOnly ? "is-readonly" : ""} ${isReady ? "is-ready" : "is-loading"}`}
        role="img"
        aria-label="Google-karta for fastighetsomraden"
      />
    </div>
  );
}
