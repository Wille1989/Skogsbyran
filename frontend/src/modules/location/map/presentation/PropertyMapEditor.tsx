import { useRef, useState } from 'react';
import type { MapMode } from '../data/types';
import {
    IconSearch,
    IconPolygon,
    IconFlag,
    IconMapPin,
    IconX,
    IconDeviceFloppy,
} from '@tabler/icons-react';
import type { EditableAreaDraft } from '@/modules/property/data/editDrafts';
import type { LocationPoiDraft, PropertyLocationDraft } from '../../types';
import { LocationEditor } from '../../LocationEditor';
import { calculateAreaSquareMeters } from '../data/areaMath';
import { locationFromAddress } from '../data/locationFromAddress';
import { createPoi, updatePoi as updatePoiDraft } from '../features/poi';
import { editPolygon } from '../features/drawing';
import { PropertyAreaMap } from './PropertyAreaMap';

type Props = {
    location: PropertyLocationDraft;
    onLocationChange: (location: PropertyLocationDraft) => void;
    areas: EditableAreaDraft[];
    onAreasChange: (areas: EditableAreaDraft[]) => void;
    disabled?: boolean;
    onSave?: () => Promise<void>;
    saving?: boolean;
    saveStatus?: string;
    saveError?: boolean;
    saveBlocked?: boolean;
    dirty?: boolean;
    reviewUrl?: string;
};

type Tool = MapMode | 'search';

export function PropertyMapEditor({
    location,
    onLocationChange,
    areas,
    onAreasChange,
    disabled,
    onSave,
    saving = false,
    saveStatus,
    saveError,
    saveBlocked,
    dirty = true,
    reviewUrl,
}: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const details = useRef<HTMLDetailsElement>(null);
    const [open, setOpen] = useState(false);
    const [previewSnapshot, setPreviewSnapshot] = useState<{
        location: PropertyLocationDraft;
        areas: EditableAreaDraft[];
    } | null>(null);
    const [tool, setTool] = useState<Tool>('navigate');
    const [selectedArea, setSelectedArea] = useState(0);
    const [movingPoi, setMovingPoi] = useState<string | null>(null);
    const area = areas[selectedArea];
    const marker =
        location.latitude !== null && location.longitude !== null
            ? { lat: location.latitude, lng: location.longitude }
            : null;
    const previewLocation = previewSnapshot?.location ?? location;
    const previewAreas = previewSnapshot?.areas ?? areas;
    const previewMarker =
        previewLocation.latitude !== null && previewLocation.longitude !== null
            ? { lat: previewLocation.latitude, lng: previewLocation.longitude }
            : null;
    const updateArea = (patch: Partial<EditableAreaDraft>) =>
        onAreasChange(
            areas.map((current, index) =>
                index === selectedArea ? { ...current, ...patch } : current,
            ),
        );
    const updatePoi = (uiId: string, patch: Partial<LocationPoiDraft>) =>
        onLocationChange({ ...location, pois: updatePoiDraft(location.pois, uiId, patch) });
    const activate = (next: Tool) => {
        setMovingPoi(null);
        if (next === 'polygon' && !area) {
            onAreasChange([...areas, { name: `Område ${areas.length + 1}`, polygon: [] }]);
            setSelectedArea(areas.length);
        }
        setTool(next);
    };
    const instruction =
        tool === 'search'
            ? 'Sök och välj en adress för att sätta huvudpositionen.'
            : tool === 'polygon'
              ? 'Klicka för hörn. Dra hörn eller mittpunkter. Högerklicka på ett hörn för att ta bort det.'
              : tool === 'poi'
                ? movingPoi
                    ? 'Klicka för att flytta vald POI.'
                    : 'Klicka för att sätta ut en POI.'
                : tool === 'marker'
                  ? 'Klicka för att sätta huvudpositionen.'
                  : 'Inget verktyg aktivt. Flytta och zooma kartan.';

    return (
        <>
            <div className="property-map-preview">
                <div inert>
                    <PropertyAreaMap
                        polygon={previewAreas[0]?.polygon ?? []}
                        otherPolygons={previewAreas.slice(1).map((item) => item.polygon)}
                        marker={previewMarker}
                        pois={previewLocation.pois}
                        readOnly
                    />
                </div>
                <button
                    type="button"
                    className="property-map-preview-open"
                    disabled={disabled}
                    onClick={() => {
                        setPreviewSnapshot({ location, areas });
                        setOpen(true);
                        setTool('navigate');
                        setMovingPoi(null);
                        dialog.current?.showModal();
                    }}
                >
                    <span>
                        <IconMapPin size={20} />
                        Öppna kartan för redigering
                    </span>
                </button>
            </div>
            <p>
                {areas.filter((item) => item.polygon.length).length} områden ·{' '}
                {location.pois.length} POI.{' '}
                {onSave
                    ? 'Spara kartändringar i kartvyn eller tillsammans med fastigheten.'
                    : 'Kartutkastet sparas när fastigheten skapas.'}
            </p>
            <dialog
                ref={dialog}
                className="property-map-editor-dialog"
                aria-labelledby="property-map-editor-title"
                onCancel={(event) => {
                    if (saving) {
                        event.preventDefault();
                    }
                }}
                onClose={() => {
                    setOpen(false);
                    setPreviewSnapshot(null);
                    setTool('navigate');
                    setMovingPoi(null);
                }}
            >
                <header className="property-area-map-modal-header">
                    <h2 id="property-map-editor-title">Redigera karta</h2>
                    <button
                        type="button"
                        className="admin-button"
                        disabled={saving}
                        autoFocus
                        onClick={() => dialog.current?.close()}
                    >
                        <IconX size={18} />
                        Stäng
                    </button>
                </header>
                {open && (
                    <div className="property-map-editor-content" inert={saving}>
                        <div className="property-map-tools">
                            <div className="area-toolbar" role="group" aria-label="Kartverktyg">
                                {(
                                    [
                                        { value: 'search', label: 'Sök adress', icon: IconSearch },
                                        {
                                            value: 'polygon',
                                            label: 'Rita område',
                                            icon: IconPolygon,
                                        },
                                        { value: 'poi', label: 'Sätt ut POI', icon: IconFlag },
                                        {
                                            value: 'marker',
                                            label: 'Huvudposition',
                                            icon: IconMapPin,
                                        },
                                    ] as const
                                ).map(({ value, label, icon: Icon }) => (
                                    <button
                                        type="button"
                                        className="admin-button"
                                        key={value}
                                        aria-pressed={tool === value}
                                        onClick={() => activate(value)}
                                    >
                                        <Icon size={18} />
                                        {label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="admin-button"
                                    disabled={tool === 'navigate'}
                                    onClick={() => activate('navigate')}
                                >
                                    Avsluta verktyg
                                </button>
                            </div>
                            <p role="status">{instruction}</p>
                            {tool === 'polygon' && area && (
                                <div className="area-toolbar map-area-tools">
                                    <label>
                                        Område
                                        <select
                                            value={selectedArea}
                                            onChange={(event) =>
                                                setSelectedArea(Number(event.target.value))
                                            }
                                        >
                                            {areas.map((item, index) => (
                                                <option key={item.id ?? index} value={index}>
                                                    {item.name || `Område ${index + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <button
                                        type="button"
                                        className="admin-button"
                                        onClick={() => {
                                            onAreasChange([
                                                ...areas,
                                                { name: `Område ${areas.length + 1}`, polygon: [] },
                                            ]);
                                            setSelectedArea(areas.length);
                                        }}
                                    >
                                        Nytt område
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-button"
                                        disabled={!area.polygon.length}
                                        onClick={() =>
                                            updateArea({
                                                polygon: editPolygon(area.polygon, {
                                                    type: 'remove',
                                                    index: area.polygon.length - 1,
                                                }),
                                            })
                                        }
                                    >
                                        Ångra sista punkt
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-button"
                                        disabled={!area.polygon.length}
                                        onClick={() =>
                                            updateArea({
                                                polygon: editPolygon(area.polygon, {
                                                    type: 'clear',
                                                }),
                                            })
                                        }
                                    >
                                        Rensa polygon
                                    </button>
                                </div>
                            )}
                        </div>
                        <PropertyAreaMap
                            polygon={area?.polygon ?? []}
                            otherPolygons={areas
                                .filter((_, index) => index !== selectedArea)
                                .map((item) => item.polygon)}
                            marker={marker}
                            pois={location.pois}
                            readOnly={saving}
                            mode={tool === 'search' ? 'navigate' : tool}
                            showSearch={tool === 'search'}
                            onPolygonChange={(polygon) => updateArea({ polygon })}
                            onSetMarker={
                                tool === 'marker'
                                    ? (position) =>
                                          onLocationChange({
                                              ...location,
                                              latitude: position.lat,
                                              longitude: position.lng,
                                          })
                                    : undefined
                            }
                            onAddressSelect={(address) =>
                                onLocationChange(locationFromAddress(location, address))
                            }
                            onMovePoi={
                                tool === 'poi'
                                    ? (index, position) =>
                                          updatePoi(location.pois[index].uiId, {
                                              latitude: position.lat,
                                              longitude: position.lng,
                                          })
                                    : undefined
                            }
                            onAddPoi={(position) => {
                                if (movingPoi) {
                                    updatePoi(movingPoi, {
                                        latitude: position.lat,
                                        longitude: position.lng,
                                    });
                                    activate('navigate');

                                    return;
                                }
                                onLocationChange({
                                    ...location,
                                    pois: [
                                        ...location.pois,
                                        createPoi(position, location.pois.length + 1),
                                    ],
                                });
                            }}
                        />
                        <p className="map-draft-summary">
                            {area
                                ? `${area.polygon.length} punkter · ${(calculateAreaSquareMeters(area.polygon) / 10000).toLocaleString('sv-SE', { maximumFractionDigits: 2 })} ha kartarea`
                                : 'Inget område'}{' '}
                            · {location.pois.length} POI
                            {marker &&
                                ` · Huvudposition: ${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`}
                        </p>
                        <details ref={details} className="map-metadata">
                            <summary>Adress, områdesnamn och POI ({location.pois.length})</summary>
                            <LocationEditor
                                value={location}
                                onChange={onLocationChange}
                                onMovePoi={(uiId) => {
                                    setMovingPoi(uiId);
                                    setTool('poi');
                                    if (details.current) {
                                        details.current.open = false;
                                    }
                                }}
                            />
                            <button
                                type="button"
                                className="admin-button"
                                disabled={!marker}
                                onClick={() =>
                                    onLocationChange({
                                        ...location,
                                        latitude: null,
                                        longitude: null,
                                    })
                                }
                            >
                                Ta bort huvudposition
                            </button>
                            {areas.map((item, index) => (
                                <div className="map-area-metadata" key={item.id ?? index}>
                                    <label>
                                        Namn på område {index + 1}
                                        <input
                                            maxLength={120}
                                            value={item.name}
                                            onChange={(event) =>
                                                onAreasChange(
                                                    areas.map((current, i) =>
                                                        i === index
                                                            ? {
                                                                  ...current,
                                                                  name: event.target.value,
                                                              }
                                                            : current,
                                                    ),
                                                )
                                            }
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className="admin-button"
                                        onClick={() => {
                                            setSelectedArea(index);
                                            setMovingPoi(null);
                                            setTool('polygon');
                                            if (details.current) {
                                                details.current.open = false;
                                            }
                                        }}
                                    >
                                        Redigera gräns
                                    </button>
                                    <button
                                        type="button"
                                        className="admin-button is-danger"
                                        onClick={() => {
                                            onAreasChange(areas.filter((_, i) => i !== index));
                                            setSelectedArea(0);
                                            activate('navigate');
                                        }}
                                    >
                                        Ta bort område
                                    </button>
                                </div>
                            ))}
                            <p>Kartarean är ungefärlig. Fastighetens angivna areal ändras inte.</p>
                        </details>
                        <p>
                            {onSave
                                ? 'Spara karta sparar adress, huvudposition, POI och områden. Övriga fastighetsuppgifter sparas separat.'
                                : 'Fastigheten är inte skapad ännu. Kartan behålls som utkast och sparas när du klickar på Skapa fastighet.'}
                        </p>
                    </div>
                )}
                {open && (
                    <footer className="map-save-footer">
                        <div>
                            <p role={saveError ? 'alert' : 'status'}>
                                {onSave ? saveStatus : 'Kartutkast – ännu inte sparat på servern.'}
                            </p>
                            {reviewUrl && (
                                <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                                    Granska sparat resultat i en ny flik
                                </a>
                            )}
                        </div>
                        {onSave ? (
                            <button
                                type="button"
                                className="admin-button is-primary"
                                disabled={saving || saveBlocked || !dirty}
                                onClick={() => {
                                    activate('navigate');
                                    void onSave();
                                }}
                            >
                                <IconDeviceFloppy size={18} />
                                {saving ? 'Sparar karta…' : 'Spara karta'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="admin-button is-primary"
                                onClick={() => dialog.current?.close()}
                            >
                                Klart – behåll utkast
                            </button>
                        )}
                    </footer>
                )}
            </dialog>
        </>
    );
}
