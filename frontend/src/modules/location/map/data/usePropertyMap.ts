import { useEffect, useRef, useState } from "react";
import { googleMapsMapId, loadGoogleMaps } from "./googleMapsLoader";
import type { Coordinates } from "./types";
import type { PropertyLocationPayload } from "../../types";

export type PropertyMapOptions = {
  polygon: Coordinates[];
  otherPolygons?: Coordinates[][];
  marker: Coordinates | null;
  pois?: PropertyLocationPayload["pois"];
  mode?: "polygon" | "marker" | "poi" | "navigate";
  readOnly?: boolean;
  onPolygonChange?: (polygon: Coordinates[]) => void;
  onSetMarker?: (marker: Coordinates) => void;
  onAddPoi?: (position: Coordinates) => void;
  onMovePoi?: (index: number, position: Coordinates) => void;
};

const DEFAULT_CENTER: Coordinates = { lat: 59.3293, lng: 18.0686 };

export function usePropertyMap(options: PropertyMapOptions) {
  const elementRef = useRef<HTMLDivElement>(null);
  const latest = useRef(options);
  const polygonRef = useRef<google.maps.Polygon | null>(null);
  const syncing = useRef(false);
  const fitted = useRef(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { latest.current = options; }, [options]);

  useEffect(() => {
    let disposed = false;
    let overlay: google.maps.Polygon | null = null;
    const listeners: google.maps.MapsEventListener[] = [];
    void loadGoogleMaps().then(() => {
      if (disposed || !elementRef.current) return;
      const instance = new google.maps.Map(elementRef.current, {
        center: DEFAULT_CENTER, zoom: 6, mapId: googleMapsMapId,
        streetViewControl: false, mapTypeControl: true, fullscreenControl: false,
        clickableIcons: false, gestureHandling: "cooperative",
      });
      overlay = new google.maps.Polygon({
        map: instance, paths: latest.current.polygon,
        strokeColor: "#14532d", strokeWeight: 3, fillColor: "#14532d", fillOpacity: 0.18,
      });
      polygonRef.current = overlay;
      const path = overlay.getPath();
      const change = (): void => {
        if (!syncing.current && !latest.current.readOnly) latest.current.onPolygonChange?.(path.getArray().map(point => point.toJSON()));
      };
      for (const event of ["set_at", "insert_at", "remove_at"]) listeners.push(path.addListener(event, change));
      const click = (event: google.maps.MapMouseEvent): void => {
        const current = latest.current;
        if (current.readOnly || !event.latLng) return;
        const point = event.latLng.toJSON();
        if (current.mode === "polygon") current.onPolygonChange?.([...current.polygon, point]);
        if (current.mode === "marker") current.onSetMarker?.(point);
        if (current.mode === "poi") current.onAddPoi?.(point);
      };
      listeners.push(instance.addListener("click", click));
      listeners.push(overlay.addListener("click", (event: google.maps.PolyMouseEvent) => {
        if (event.vertex === undefined && event.edge === undefined) click(event);
      }));
      listeners.push(overlay.addListener("contextmenu", (event: google.maps.PolyMouseEvent) => {
        if (!latest.current.readOnly && latest.current.mode === "polygon" && event.vertex !== undefined) path.removeAt(event.vertex);
      }));
      fitted.current = false;
      setMap(instance);
    }).catch((reason: unknown) => {
      if (!disposed) setError(reason instanceof Error ? reason.message : "Google Maps kunde inte laddas.");
    });
    return () => {
      disposed = true;
      listeners.forEach(listener => listener.remove());
      overlay?.setMap(null);
      polygonRef.current = null;
    };
  }, []);

  useEffect(() => {
    const overlay = polygonRef.current;
    if (!map || !overlay) return;
    overlay.setEditable(!options.readOnly && options.mode === "polygon");
    overlay.setOptions({ clickable: !options.readOnly && options.mode === "polygon" });
    const path = overlay.getPath();
    const current = path.getArray().map(point => point.toJSON());
    if (JSON.stringify(current) === JSON.stringify(options.polygon)) return;
    syncing.current = true;
    path.clear();
    options.polygon.forEach(point => path.push(new google.maps.LatLng(point)));
    syncing.current = false;
  }, [map, options.polygon, options.mode, options.readOnly]);

  useEffect(() => {
    if (!map) return;
    const overlays = options.otherPolygons?.map(paths => new google.maps.Polygon({
      map, paths, clickable: false, strokeColor: "#14532d", fillColor: "#14532d", fillOpacity: 0.18,
    })) ?? [];
    return () => overlays.forEach(overlay => overlay.setMap(null));
  }, [map, options.otherPolygons]);

  useEffect(() => {
    if (!map) return;
    const markers: google.maps.marker.AdvancedMarkerElement[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const createMarker = (position: Coordinates, title: string, label: string | null, move?: (point: Coordinates) => void): void => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map, position, title, gmpDraggable: !options.readOnly && !!move,
        collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
      });
      if (label !== null) {
        const flag = document.createElement("span");
        flag.className = "map-poi-flag";
        flag.textContent = `⚑ ${label}`;
        marker.append(flag);
      }
      if (!options.readOnly && move) listeners.push(marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
        if (event.latLng) move(event.latLng.toJSON());
      }));
      markers.push(marker);
    };
    if (options.marker) createMarker(options.marker, "Fastighetens huvudposition", null,
      options.onSetMarker ? point => latest.current.onSetMarker?.(point) : undefined);
    options.pois?.forEach((poi, index) => createMarker(
      { lat: poi.latitude, lng: poi.longitude }, `${poi.name}: ${poi.description}`, poi.name,
      options.onMovePoi ? point => latest.current.onMovePoi?.(index, point) : undefined,
    ));
    return () => {
      listeners.forEach(listener => listener.remove());
      markers.forEach(marker => { marker.map = null; });
    };
  }, [map, options.marker, options.pois, options.readOnly, options.onSetMarker, options.onMovePoi]);

  useEffect(() => {
    if (!map || fitted.current) return;
    const points = [
      ...options.polygon, ...(options.otherPolygons?.flat() ?? []),
      ...(options.marker ? [options.marker] : []),
      ...(options.pois?.map(poi => ({ lat: poi.latitude, lng: poi.longitude })) ?? []),
    ];
    fitted.current = true;
    if (!points.length) return;
    const bounds = new google.maps.LatLngBounds();
    points.forEach(point => bounds.extend(point));
    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      map.setCenter(points[0]);
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 40);
    }
  }, [map, options.polygon, options.otherPolygons, options.marker, options.pois]);
  return { elementRef, map, error };
}
