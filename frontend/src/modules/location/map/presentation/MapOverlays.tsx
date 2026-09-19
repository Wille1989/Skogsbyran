import type { Coordinates, PropertyMapOptions, ScreenPoint } from '../data/types';
import type { MapAdapter } from '../adapters/MapAdapter';

import { usePolygonEditing } from '../features/usePolygonEditing';
import { MapHandle } from './MapHandle';

export function MapOverlays({ map, options }: { map: MapAdapter; options: PropertyMapOptions }) {
    const { editing, change } = usePolygonEditing(options);
    const points = (polygon: Coordinates[]) =>
        polygon
            .map((point) => map.project(point))
            .filter((point): point is ScreenPoint => point !== null);
    const primary = points(options.polygon);
    const asPoints = (polygon: ScreenPoint[]) =>
        polygon.map((point) => `${point.x},${point.y}`).join(' ');

    return (
        <div className="map-overlays" aria-label="Fastighetens kartobjekt">
            <svg className="map-geometries" aria-hidden="true">
                {options.otherPolygons?.map((polygon, index) => (
                    <polygon
                        key={index}
                        points={asPoints(points(polygon))}
                        className="map-polygon is-secondary"
                    />
                ))}
                {primary.length >= 3 ? (
                    <polygon points={asPoints(primary)} className="map-polygon" />
                ) : (
                    <polyline points={asPoints(primary)} className="map-polygon is-draft" />
                )}
            </svg>
            {editing &&
                options.polygon.map((position, index) => {
                    const screen = map.project(position);

                    return (
                        screen && (
                            <MapHandle
                                key={`vertex-${index}`}
                                map={map}
                                position={position}
                                screen={screen}
                                kind="map-vertex"
                                label={`Hörn ${index + 1}. Dra eller använd piltangenter. Delete tar bort hörnet.`}
                                onMove={(position) => change({ type: 'move', index, position })}
                                onRemove={() => change({ type: 'remove', index })}
                            />
                        )
                    );
                })}
            {editing &&
                options.polygon.length >= 2 &&
                options.polygon.map((point, index) => {
                    // Two-point drafts have one edge; closed polygons also have a final edge.
                    if (options.polygon.length === 2 && index === 1) {
                        return null;
                    }
                    const next = options.polygon[(index + 1) % options.polygon.length];
                    const edgeStart = map.project(point);
                    const edgeEnd = map.project(next);
                    if (!edgeStart || !edgeEnd) {
                        return null;
                    }
                    const screen = {
                        x: (edgeStart.x + edgeEnd.x) / 2,
                        y: (edgeStart.y + edgeEnd.y) / 2,
                    };
                    const position = map.unproject(screen);
                    if (!position) {
                        return null;
                    }

                    return (
                        <MapHandle
                            key={`edge-${index}`}
                            map={map}
                            position={position}
                            screen={screen}
                            kind="map-midpoint"
                            label={`Lägg till hörn på kant ${index + 1}`}
                            onStart={() => change({ type: 'insert', index: index + 1, position })}
                            onMove={(position) =>
                                change({ type: 'move', index: index + 1, position })
                            }
                            onCancel={() => change({ type: 'remove', index: index + 1 })}
                            onActivate={() =>
                                change({ type: 'insert', index: index + 1, position })
                            }
                        />
                    );
                })}
            {options.marker &&
                (() => {
                    const screen = map.project(options.marker);

                    return (
                        screen && (
                            <MapHandle
                                map={map}
                                position={options.marker}
                                screen={screen}
                                kind="map-main-marker"
                                label="Fastighetens huvudposition"
                                onMove={
                                    !options.readOnly && options.mode === 'marker'
                                        ? options.onSetMarker
                                        : undefined
                                }
                            />
                        )
                    );
                })()}
            {options.pois?.map((poi, index) => {
                const position = { lat: poi.latitude, lng: poi.longitude };
                const screen = map.project(position);

                return (
                    screen && (
                        <MapHandle
                            key={poi.id ?? index}
                            map={map}
                            position={position}
                            screen={screen}
                            kind="map-poi"
                            text={poi.name}
                            label={`${poi.name}${poi.description ? ': ' + poi.description : ''}`}
                            onMove={
                                !options.readOnly && options.mode === 'poi' && options.onMovePoi
                                    ? (position) => options.onMovePoi?.(index, position)
                                    : undefined
                            }
                        />
                    )
                );
            })}
        </div>
    );
}
