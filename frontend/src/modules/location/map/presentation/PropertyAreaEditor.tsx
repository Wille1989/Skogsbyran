import { useState } from "react";
import { calculateAreaSquareMeters } from "../data/areaMath";
import { PropertyAreaMap } from "./PropertyAreaMap";
import type { Coordinates, PropertyAreaDraft } from "../data/types";
import "./googleMap.css";

type Props = {
  mode: "create" | "edit";
  value: PropertyAreaDraft;
  onChange: (value: PropertyAreaDraft) => void;
  mainMarker?: Coordinates | null;
};

export function PropertyAreaEditor({ value, onChange, mainMarker = null }: Props) {
  const [drawing, setDrawing] = useState(true);
  return <section className="property-area-entry property-area-entry-inline">
    <label className="form-field"><span>Namn på område</span>
      <input maxLength={120} value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} />
    </label>
    <div className="area-toolbar">
      <button type="button" aria-pressed={drawing} onClick={() => setDrawing(!drawing)}>{drawing ? "Avsluta ritning" : "Redigera polygon"}</button>
      <button type="button" disabled={!value.polygon.length} onClick={() => onChange({ ...value, polygon: value.polygon.slice(0, -1) })}>Ta bort sista punkt</button>
      <button type="button" onClick={() => onChange({ ...value, polygon: [] })}>Rensa polygon</button>
    </div>
    <p>{drawing ? "Klicka för att lägga till hörn. Dra hörn eller mittpunkter för att ändra gränsen. Högerklicka ett hörn för att ta bort det." : "Polygonen är låst för redigering. Du kan flytta och zooma kartan."}</p>
    <PropertyAreaMap polygon={value.polygon} marker={mainMarker} mode={drawing ? "polygon" : "navigate"}
      onPolygonChange={polygon => onChange({ ...value, polygon })} />
    <p>Punkter: {value.polygon.length} · Ungefärlig kartarea: {(calculateAreaSquareMeters(value.polygon) / 10000).toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ha</p>
    <p>Kartarean beräknas från polygonen. Fastighetens angivna areal ändras inte.</p>
  </section>;
}
