import { type Coordinates } from "../data/types";
import "./googleMap.css";

type PropertyAreaFormProps = {
  name: string;
  coordinateLat: string;
  coordinateLng: string;
  polygon: Coordinates[];
  marker: Coordinates | null;
  previewAreaSquareMeters: number;
  onNameChange: (name: string) => void;
  onCoordinateLatChange: (value: string) => void;
  onCoordinateLngChange: (value: string) => void;
  onAddCoordinateAsPolygonPoint: () => void;
  onSetMarkerFromCoordinates: () => void;
};

export function PropertyAreaForm({
  name,
  coordinateLat,
  coordinateLng,
  polygon,
  marker,
  previewAreaSquareMeters,
  onNameChange,
  onCoordinateLatChange,
  onCoordinateLngChange,
  onAddCoordinateAsPolygonPoint,
  onSetMarkerFromCoordinates,
}: PropertyAreaFormProps) {
  return (
    <div className="area-form-card">
      <label className="form-field">
        <span>Namn på område</span>
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
        />
      </label>

      <div className="area-coordinate-grid">
        <label className="form-field">
          <span>Latitud</span>
          <input
            type="number"
            step="0.000001"
            value={coordinateLat}
            onChange={(event) => onCoordinateLatChange(event.target.value)}
          />
        </label>

        <label className="form-field">
          <span>Longitud</span>
          <input
            type="number"
            step="0.000001"
            value={coordinateLng}
            onChange={(event) => onCoordinateLngChange(event.target.value)}
          />
        </label>
      </div>

      <div className="area-toolbar">
        <button
          type="button"
          className="property-link-button"
          onClick={onAddCoordinateAsPolygonPoint}
        >
          Lägg till polygonpunkt
        </button>

        <button
          type="button"
          className="property-link-button"
          onClick={onSetMarkerFromCoordinates}
        >
          Sätt markör från koordinater
        </button>
      </div>

      <div className="area-stats">
        <span>Punkter: {polygon.length}</span>

        <span>
          Förhandsarea: {(previewAreaSquareMeters / 10000).toFixed(2)} ha
        </span>

        <span>
          Markör:{" "}
          {marker
            ? `${marker.lat.toFixed(4)}, ${marker.lng.toFixed(4)}`
            : "Ej satt"}
        </span>
      </div>
    </div>
  );
}
