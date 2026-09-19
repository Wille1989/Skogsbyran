import { useState } from 'react';
import { filterMapData, type MapData, type MapFilter } from '../data/mapPresentation';
import { PropertyAreaMap } from './PropertyAreaMap';

export function PropertyMapView({ data }: { data: MapData }) {
    const [filter, setFilter] = useState<MapFilter>('all');
    const visible = filterMapData(data, filter);

    return (
        <section className="property-map-view">
            <div className="area-toolbar map-filter" role="group" aria-label="Visa i kartan">
                {(
                    [
                        ['area', 'Område'],
                        ['poi', 'POI'],
                        ['all', 'Allt'],
                    ] as const
                ).map(([value, label]) => (
                    <button
                        type="button"
                        className="detail-pill"
                        key={value}
                        aria-pressed={filter === value}
                        onClick={() => setFilter(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <PropertyAreaMap
                polygon={visible.polygons[0] ?? []}
                otherPolygons={visible.polygons.slice(1)}
                marker={visible.marker}
                pois={visible.pois}
                readOnly
            />
            {visible.pois.length > 0 && (
                <ul>
                    {visible.pois.map((poi, index) => (
                        <li key={poi.id ?? index}>
                            <strong>{poi.name}</strong>
                            {poi.description && ` – ${poi.description}`}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
