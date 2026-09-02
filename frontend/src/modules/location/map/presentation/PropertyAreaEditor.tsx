import { type Coordinates } from "../data/types";
import { useEffect, useState } from "react";
import { calculateAreaSquareMeters } from "../data/areaMath";
import { PropertyAreaMap } from "./PropertyAreaMap";
import { PropertyAreaForm } from "./PropertyAreaForm";
import { PropertyAreaDrawingTools } from "./PropertyAreaDrawingTools";
import { DEFAULT_AREA_MARKER, createDefaultAreaDraft, roundCoordinate } from "../data/areaDraft";
import { type PropertyAreaDraft } from "../data/types";
import "./googleMap.css";
import { PropertyAreaMapModal } from "./PropertyAreaMapModal";
type AreaEditorMode = "polygon" | "marker";

type PropertyAreaEditorProps = {
  mode: "create" | "edit";
  value: PropertyAreaDraft;
  onChange: (value: PropertyAreaDraft) => void;
};

function parseCoordinate(value: string, fallback: number): number {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return roundCoordinate(parsedValue);
}

export function PropertyAreaEditor({
  value,
  onChange,
}: PropertyAreaEditorProps) {
  const [mode, setMode] = useState<AreaEditorMode>("polygon");
  const [isMapModalOpen, setIsMapModalOpen] = useState<boolean>(false);

  const [coordinateLat, setCoordinateLat] = useState<string>(
    (value.marker?.lat ?? DEFAULT_AREA_MARKER.lat).toString(),
  );

  const [coordinateLng, setCoordinateLng] = useState<string>(
    (value.marker?.lng ?? DEFAULT_AREA_MARKER.lng).toString(),
  );

  const previewAreaSquareMeters = calculateAreaSquareMeters(value.polygon);

  const coordinatePoint: Coordinates = {
    lat: parseCoordinate(coordinateLat, DEFAULT_AREA_MARKER.lat),
    lng: parseCoordinate(coordinateLng, DEFAULT_AREA_MARKER.lng),
  };

  useEffect(() => {
    if (!value.marker) {
      setCoordinateLat(DEFAULT_AREA_MARKER.lat.toString());
      setCoordinateLng(DEFAULT_AREA_MARKER.lng.toString());
      return;
    }

    setCoordinateLat(value.marker.lat.toString());
    setCoordinateLng(value.marker.lng.toString());
  }, [value.marker]);

  const resetAreaDraft = (): void => {
    onChange(createDefaultAreaDraft());
    setCoordinateLat(DEFAULT_AREA_MARKER.lat.toString());
    setCoordinateLng(DEFAULT_AREA_MARKER.lng.toString());
    setMode("polygon");
  };

  const onRemoveLastPolygonPoint = (): void => {
    onChange({
      ...value,
      polygon: value.polygon.slice(0, -1),
    });
  };

  const onPolygonChange = (polygon: Coordinates[]): void => {
    onChange({
      ...value,
      polygon,
    });
  };

  const onSetMarker = (marker: Coordinates): void => {
    onChange({
      ...value,
      marker,
    });

    setCoordinateLat(marker.lat.toString());
    setCoordinateLng(marker.lng.toString());
  };

  const onNameChange = (name: string): void => {
    onChange({
      ...value,
      name,
    });
  };

  const onAddCoordinateAsPolygonPoint = (): void => {
    onChange({
      ...value,
      polygon: [...value.polygon, coordinatePoint],
    });
  };

  const onSetMarkerFromCoordinates = (): void => {
    onChange({
      ...value,
      marker: coordinatePoint,
    });
  };
  
  return (
    <section className="property-area-entry property-area-entry-inline">
      <div className="property-area-entry-copy">
        <strong>Område och karta</strong>
        <p>Rita polygonen så kan kartdatan sparas tillsammans med fastigheten.</p>
      </div>

      <div className="area-editor">
        <PropertyAreaMap
          polygon={value.polygon}
          marker={value.marker}
          mode={mode}
          onPolygonChange={onPolygonChange}
          onSetMarker={onSetMarker}
          readOnly
        />

        <button
          type="button"
          className="property-area-map-open-button"
          onClick={() => setIsMapModalOpen(true)}
        >
          Redigera karta
        </button>

          <PropertyAreaMapModal
            isOpen={isMapModalOpen}
            title="Redigera karta"
            onClose={() => setIsMapModalOpen(false)}
          >
          <PropertyAreaDrawingTools
            mode={mode}
            onSetPolygonMode={() => setMode("polygon")}
            onSetMarkerMode={() => setMode("marker")}
            onRemoveLastPolygonPoint={onRemoveLastPolygonPoint}
            onResetArea={resetAreaDraft}
          />

          <PropertyAreaMap
            polygon={value.polygon}
            marker={value.marker}
            mode={mode}
            onPolygonChange={onPolygonChange}
            onSetMarker={onSetMarker}
            readOnly={false}
          />

          <PropertyAreaForm
            name={value.name}
            coordinateLat={coordinateLat}
            coordinateLng={coordinateLng}
            polygon={value.polygon}
            marker={value.marker}
            previewAreaSquareMeters={previewAreaSquareMeters}
            onNameChange={onNameChange}
            onCoordinateLatChange={setCoordinateLat}
            onCoordinateLngChange={setCoordinateLng}
            onAddCoordinateAsPolygonPoint={onAddCoordinateAsPolygonPoint}
            onSetMarkerFromCoordinates={onSetMarkerFromCoordinates}
          />
        </PropertyAreaMapModal>
      </div>
    </section>
  );
}
