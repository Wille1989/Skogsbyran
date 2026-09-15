import { useState, type ChangeEvent } from "react";
import { PropertyAreaMap } from "./map/presentation/PropertyAreaMap";
import type { Coordinates } from "./map/data/types";
import type { LocationPoiDraft, PropertyLocationDraft } from "./types";
import "./LocationEditor.css";

type LocationEditorProps = { value: PropertyLocationDraft; onChange: (value: PropertyLocationDraft) => void; polygons?: Coordinates[][] };

export function LocationEditor({ value, onChange, polygons }: LocationEditorProps) {
  const [mode, setMode] = useState<"marker" | "poi" | "navigate">("navigate");
  const [movingPoi, setMovingPoi] = useState<string | null>(null);
  const updateField = (field: keyof PropertyLocationDraft) => (event: ChangeEvent<HTMLInputElement>): void => {
    onChange({
      ...value,
      [field]: event.target.value,
    });
  };

  const updatePoi = (uiId: string, patch: Partial<LocationPoiDraft>): void => {
    onChange({
      ...value,
      pois: value.pois.map((poi) => (poi.uiId === uiId ? { ...poi, ...patch } : poi)),
    });
  };

  const removePoi = (uiId: string): void => {
    if (movingPoi === uiId) setMovingPoi(null);
    onChange({
      ...value,
      pois: value.pois.filter((poi) => poi.uiId !== uiId),
    });
  };

  return (
    <section className="location-editor form">
      <div className="create-section-copy">
        <strong>Fastighetens plats och POI</strong>
        <p>Sök adress eller välj huvudposition i kartan. Lägg till namngivna platser som bostadshus, sjö och brygga. Dra markörerna för att flytta dem.</p>
      </div>

      <div className="location-grid">
        <div className="location-fields">

          <div className="form-field">
            <label htmlFor="property-address">Adress</label>
            <input id="property-address" value={value.address} onChange={updateField("address")} />
          </div>

          <div className="location-field-row">
            <div className="form-field">
              <label htmlFor="property-postal-code">Postnummer</label>
              <input id="property-postal-code" value={value.postalCode} onChange={updateField("postalCode")} />
            </div>

            <div className="form-field">
              <label htmlFor="property-city">Ort</label>
              <input id="property-city" value={value.city} onChange={updateField("city")} />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="property-municipality">Kommun</label>
            <input id="property-municipality" value={value.municipality} onChange={updateField("municipality")} />
          </div>
        </div>

        <div className="location-map-shell">
          <div className="area-toolbar">
            <button type="button" aria-pressed={mode === "navigate"} onClick={() => setMode("navigate")}>Navigera</button>
            <button type="button" aria-pressed={mode === "marker"} onClick={() => setMode("marker")}>Sätt huvudposition</button>
            <button type="button" aria-pressed={mode === "poi" && movingPoi === null} onClick={() => { setMovingPoi(null); setMode("poi"); }}>Lägg till POI</button>
            <button type="button" onClick={() => onChange({ ...value, latitude: null, longitude: null })}>Ta bort huvudposition</button>
          </div>
          <p>{mode === "navigate" ? "Flytta och zooma kartan." : mode === "marker" ? "Klicka för att sätta huvudpositionen." : movingPoi ? "Klicka för att flytta vald POI till en ny plats." : "Klicka för att lägga till en POI-flagga."}</p>
          <PropertyAreaMap
            polygon={[]} otherPolygons={polygons} mode={mode}
            marker={value.latitude !== null && value.longitude !== null ? { lat: value.latitude, lng: value.longitude } : null}
            pois={value.pois}
            onSetMarker={position => onChange({ ...value, latitude: position.lat, longitude: position.lng })}
            onAddressSelect={({ position, ...address }) => onChange({ ...value, ...address, latitude: position.lat, longitude: position.lng })}
            onAddPoi={position => {
              if (movingPoi) {
                updatePoi(movingPoi, { latitude: position.lat, longitude: position.lng });
                setMovingPoi(null);
                setMode("navigate");
                return;
              }
              onChange({ ...value, pois: [...value.pois, {
              uiId: crypto.randomUUID(), name: `POI ${value.pois.length + 1}`, description: "", latitude: position.lat, longitude: position.lng,
            }] }); }}
            onMovePoi={(index, position) => updatePoi(value.pois[index].uiId, { latitude: position.lat, longitude: position.lng })}
          />
        </div>
      </div>

      <div className="poi-list">
        {value.pois.map((poi) => (
          <article className="poi-card" key={poi.uiId}>
            <div className="location-field-row">
              <div className="form-field">
                <label htmlFor={`poi-name-${poi.uiId}`}>Namn</label>
                <input
                  id={`poi-name-${poi.uiId}`}
                  maxLength={120}
                  value={poi.name}
                  onChange={(event) => updatePoi(poi.uiId, { name: event.target.value })}
                />
              </div>

              <button type="button" className="button" onClick={() => { setMovingPoi(poi.uiId); setMode("poi"); }}>Flytta i kartan</button>
              <button type="button" className="button button-danger" onClick={() => removePoi(poi.uiId)}>
                Ta bort POI
              </button>
            </div>

            <div className="form-field">
              <label htmlFor={`poi-description-${poi.uiId}`}>Beskrivning</label>
              <input
                id={`poi-description-${poi.uiId}`}
                value={poi.description}
                onChange={(event) => updatePoi(poi.uiId, { description: event.target.value })}
                placeholder="Ex. 3 km till badplats"
              />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
