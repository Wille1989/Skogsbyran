import { useRef, useState } from "react";
import { IconSearch, IconPolygon, IconFlag, IconMapPin, IconX } from "@tabler/icons-react";
import type { EditableAreaDraft } from "@/modules/property/data/editDrafts";
import type { LocationPoiDraft, PropertyLocationDraft } from "../../types";
import { LocationEditor } from "../../LocationEditor";
import { calculateAreaSquareMeters } from "../data/areaMath";
import { PropertyAreaMap } from "./PropertyAreaMap";

type Props = {
  location: PropertyLocationDraft;
  onLocationChange: (location: PropertyLocationDraft) => void;
  areas: EditableAreaDraft[];
  onAreasChange: (areas: EditableAreaDraft[]) => void;
  disabled?: boolean;
};
type Tool = "navigate" | "search" | "polygon" | "poi" | "marker";

export function PropertyMapEditor({ location, onLocationChange, areas, onAreasChange, disabled }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const details = useRef<HTMLDetailsElement>(null);
  const [open, setOpen] = useState(false);
  const [tool, setTool] = useState<Tool>("navigate");
  const [selectedArea, setSelectedArea] = useState(0);
  const [movingPoi, setMovingPoi] = useState<string | null>(null);
  const area = areas[selectedArea];
  const marker = location.latitude !== null && location.longitude !== null
    ? { lat: location.latitude, lng: location.longitude } : null;
  const updateArea = (patch: Partial<EditableAreaDraft>) => onAreasChange(areas.map((current, index) => index === selectedArea ? { ...current, ...patch } : current));
  const updatePoi = (uiId: string, patch: Partial<LocationPoiDraft>) => onLocationChange({ ...location, pois: location.pois.map(poi => poi.uiId === uiId ? { ...poi, ...patch } : poi) });
  const activate = (next: Tool) => {
    setMovingPoi(null);
    if (next === "polygon" && !area) {
      onAreasChange([...areas, { name: `Område ${areas.length + 1}`, polygon: [] }]);
      setSelectedArea(areas.length);
    }
    setTool(next);
  };
  const instruction = tool === "search" ? "Sök och välj en adress för att sätta huvudpositionen."
    : tool === "polygon" ? "Klicka för hörn. Dra hörn eller mittpunkter. Högerklicka på ett hörn för att ta bort det."
    : tool === "poi" ? movingPoi ? "Klicka för att flytta vald POI." : "Klicka för att sätta ut en POI."
    : tool === "marker" ? "Klicka för att sätta huvudpositionen." : "Inget verktyg aktivt. Flytta och zooma kartan.";

  return <>
    <div className="property-map-preview">
      <div inert><PropertyAreaMap polygon={areas[0]?.polygon ?? []} otherPolygons={areas.slice(1).map(item => item.polygon)} marker={marker} pois={location.pois} readOnly /></div>
      <button type="button" className="property-map-preview-open" disabled={disabled} onClick={() => {
        setOpen(true); setTool("navigate"); setMovingPoi(null); dialog.current?.showModal();
      }}><span><IconMapPin size={20} />Öppna kartan för redigering</span></button>
    </div>
    <p>{areas.filter(item => item.polygon.length).length} områden · {location.pois.length} POI. Kartändringar sparas när du sparar fastigheten.</p>
    <dialog ref={dialog} className="property-map-editor-dialog" aria-labelledby="property-map-editor-title" onClose={() => { setOpen(false); setTool("navigate"); setMovingPoi(null); }}>
      <header className="property-area-map-modal-header"><h2 id="property-map-editor-title">Redigera karta</h2><button type="button" className="admin-button" autoFocus onClick={() => dialog.current?.close()}><IconX size={18} />Stäng</button></header>
      {open && <div className="property-map-editor-content">
        <div className="property-map-tools">
          <div className="area-toolbar" role="group" aria-label="Kartverktyg">
            {([{ value: "search", label: "Sök adress", icon: IconSearch }, { value: "polygon", label: "Rita område", icon: IconPolygon }, { value: "poi", label: "Sätt ut POI", icon: IconFlag }, { value: "marker", label: "Huvudposition", icon: IconMapPin }] as const).map(({ value, label, icon: Icon }) =>
              <button type="button" className="admin-button" key={value} aria-pressed={tool === value} onClick={() => activate(value)}><Icon size={18} />{label}</button>)}
            <button type="button" className="admin-button" disabled={tool === "navigate"} onClick={() => activate("navigate")}>Avsluta verktyg</button>
          </div>
          <p role="status">{instruction}</p>
          {tool === "polygon" && area && <div className="area-toolbar map-area-tools">
            <label>Område<select value={selectedArea} onChange={event => setSelectedArea(Number(event.target.value))}>{areas.map((item, index) => <option key={item.id ?? index} value={index}>{item.name || `Område ${index + 1}`}</option>)}</select></label>
            <button type="button" className="admin-button" onClick={() => { onAreasChange([...areas, { name: `Område ${areas.length + 1}`, polygon: [] }]); setSelectedArea(areas.length); }}>Nytt område</button>
            <button type="button" className="admin-button" disabled={!area.polygon.length} onClick={() => updateArea({ polygon: area.polygon.slice(0, -1) })}>Ångra sista punkt</button>
            <button type="button" className="admin-button" disabled={!area.polygon.length} onClick={() => updateArea({ polygon: [] })}>Rensa polygon</button>
          </div>}
        </div>
        <PropertyAreaMap polygon={area?.polygon ?? []} otherPolygons={areas.filter((_, index) => index !== selectedArea).map(item => item.polygon)} marker={marker} pois={location.pois}
          mode={tool === "search" ? "navigate" : tool} showSearch={tool === "search"}
          onPolygonChange={polygon => updateArea({ polygon })}
          onSetMarker={tool === "marker" ? position => onLocationChange({ ...location, latitude: position.lat, longitude: position.lng }) : undefined}
          onAddressSelect={({ position, ...address }) => onLocationChange({ ...location, ...address, latitude: position.lat, longitude: position.lng })}
          onMovePoi={tool === "poi" ? (index, position) => updatePoi(location.pois[index].uiId, { latitude: position.lat, longitude: position.lng }) : undefined}
          onAddPoi={position => {
            if (movingPoi) { updatePoi(movingPoi, { latitude: position.lat, longitude: position.lng }); activate("navigate"); return; }
            onLocationChange({ ...location, pois: [...location.pois, { uiId: crypto.randomUUID(), name: `POI ${location.pois.length + 1}`, description: "", latitude: position.lat, longitude: position.lng }] });
          }} />
        <p className="map-draft-summary">{area ? `${area.polygon.length} punkter · ${(calculateAreaSquareMeters(area.polygon) / 10000).toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ha kartarea` : "Inget område"} · {location.pois.length} POI{marker && ` · Huvudposition: ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`}</p>
        <details ref={details} className="map-metadata"><summary>Adress, områdesnamn och POI ({location.pois.length})</summary>
          <LocationEditor value={location} onChange={onLocationChange} onMovePoi={uiId => { setMovingPoi(uiId); setTool("poi"); if (details.current) details.current.open = false; }} />
          <button type="button" className="admin-button" disabled={!marker} onClick={() => onLocationChange({ ...location, latitude: null, longitude: null })}>Ta bort huvudposition</button>
          {areas.map((item, index) => <div className="map-area-metadata" key={item.id ?? index}>
            <label>Namn på område {index + 1}<input maxLength={120} value={item.name} onChange={event => onAreasChange(areas.map((current, i) => i === index ? { ...current, name: event.target.value } : current))} /></label>
            <button type="button" className="admin-button" onClick={() => { setSelectedArea(index); setMovingPoi(null); setTool("polygon"); if (details.current) details.current.open = false; }}>Redigera gräns</button>
            <button type="button" className="admin-button is-danger" onClick={() => { onAreasChange(areas.filter((_, i) => i !== index)); setSelectedArea(0); activate("navigate"); }}>Ta bort område</button>
          </div>)}
          <p>Kartarean är ungefärlig. Fastighetens angivna areal ändras inte.</p>
        </details>
        <p>Utkastet behålls när du stänger kartan. Spara med fastighetens sparknapp.</p>
      </div>}
    </dialog>
  </>;
}
