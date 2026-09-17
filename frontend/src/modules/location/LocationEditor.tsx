import type { ChangeEvent } from "react";
import type { LocationPoiDraft, PropertyLocationDraft } from "./types";
import "./LocationEditor.css";

type LocationEditorProps = { value: PropertyLocationDraft; onChange: (value: PropertyLocationDraft) => void; onMovePoi: (uiId: string) => void };

export function LocationEditor({ value, onChange, onMovePoi }: LocationEditorProps) {
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
    onChange({
      ...value,
      pois: value.pois.filter((poi) => poi.uiId !== uiId),
    });
  };

  return (
    <section className="location-editor form">
      <div className="create-section-copy">
        <strong>Fastighetens plats och POI</strong>
        <p>Komplettera adressen och namnge dina POI. Ändringarna sparas med fastigheten.</p>
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

              <button type="button" className="button" onClick={() => onMovePoi(poi.uiId)}>Flytta i kartan</button>
              <button type="button" className="button button-danger" onClick={() => removePoi(poi.uiId)}>
                Ta bort POI
              </button>
            </div>

            <div className="form-field">
              <label htmlFor={`poi-description-${poi.uiId}`}>Beskrivning</label>
              <input
                id={`poi-description-${poi.uiId}`}
                maxLength={1000} value={poi.description}
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

