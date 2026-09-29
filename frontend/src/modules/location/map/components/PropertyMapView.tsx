import type { MapData, MapFilter, PropertyArea } from '../types/types';
import { useState } from 'react';
import { IconMapPin } from '@tabler/icons-react';
import { filterMapData } from '../helpers/mapPresentation';
import { PropertyAreaMap } from './PropertyAreaMap';

export function PropertyMapView({ data, areas, locationLabel }: { data: MapData; areas: PropertyArea[]; locationLabel?: string }) {
    const [filter, setFilter] = useState<MapFilter>('all');
    const visible = filterMapData(data, filter);

    return (
        <section className="property-map-view">
            <div className="property-map-toolbar">
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
              {locationLabel && <p className="property-map-location"><IconMapPin size={24} stroke={1.5} aria-hidden="true" /><span>{locationLabel}</span></p>}
            </div>
            <PropertyAreaMap
                areas={filter === 'poi' ? [] : areas}
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
