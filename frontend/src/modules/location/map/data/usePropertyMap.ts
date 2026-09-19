import { useEffect, useRef, useState } from 'react';
import type { MapAdapter, MapFactory, MapIssue } from '../adapters/MapAdapter';
import { mapRuntime } from '../providers/runtime';
import { fitProperty } from '../features/view';
import { editPolygon } from '../features/drawing';
import type { Coordinates } from './types';
import type { PropertyLocationPayload } from '../../types';

export type PropertyMapOptions = {
    polygon: Coordinates[];
    otherPolygons?: Coordinates[][];
    marker: Coordinates | null;
    pois?: PropertyLocationPayload['pois'];
    mode?: 'polygon' | 'marker' | 'poi' | 'navigate';
    readOnly?: boolean;
    onPolygonChange?: (polygon: Coordinates[]) => void;
    onSetMarker?: (marker: Coordinates) => void;
    onAddPoi?: (position: Coordinates) => void;
    onMovePoi?: (index: number, position: Coordinates) => void;
};

export function mapPoints(options: PropertyMapOptions): Coordinates[] {
    return [
        ...options.polygon,
        ...(options.otherPolygons?.flat() ?? []),
        ...(options.marker ? [options.marker] : []),
        ...(options.pois?.map((poi) => ({ lat: poi.latitude, lng: poi.longitude })) ?? []),
    ];
}

export function usePropertyMap(
    options: PropertyMapOptions,
    createMap: MapFactory = mapRuntime.createMap,
) {
    const elementRef = useRef<HTMLDivElement>(null);
    const latest = useRef(options);
    const fitted = useRef<string | null>(null);
    const [map, setMap] = useState<MapAdapter | null>(null);
    const [mapSize, setMapSize] = useState('');
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState<MapIssue | null>(null);

    useEffect(() => {
        latest.current = options;
    }, [options]);

    useEffect(() => {
        let disposed = false;
        let instance: MapAdapter | undefined;
        let frame = 0;
        const cleanups: Array<() => void> = [];
        const element = elementRef.current;
        if (!element) {
            return;
        }
        setError(null);
        setMap(null);

        // Each asynchronous initialization owns its own DOM host.
        const host = document.createElement('div');
        host.className = 'map-engine';
        element.append(host);
        void createMap(host, (issue) => {
            if (disposed) {
                return;
            }
            setError((current) => (current?.kind === 'fatal' ? current : issue));
        })
            .then((adapter) => {
                if (disposed) {
                    adapter.destroy();

                    return;
                }
                instance = adapter;
                cleanups.push(
                    adapter.onViewChange(() => {
                        if (frame) {
                            return;
                        }
                        frame = requestAnimationFrame(() => {
                            frame = 0;
                            if (!disposed) {
                                setRevision((value) => value + 1);
                            }
                        });
                    }),
                );
                cleanups.push(
                    adapter.onClick((point) => {
                        const current = latest.current;
                        if (current.readOnly) {
                            return;
                        }
                        if (current.mode === 'polygon') {
                            const polygon = editPolygon(current.polygon, { type: 'add', position: point });
                            // Consecutive input events may arrive before React commits props.
                            latest.current = { ...current, polygon };
                            current.onPolygonChange?.(polygon);
                        }
                        if (current.mode === 'marker') {
                            current.onSetMarker?.(point);
                        }
                        if (current.mode === 'poi') {
                            current.onAddPoi?.(point);
                        }
                    }),
                );
                fitted.current = null;
                setMap(adapter);
            })
            .catch(() => {
                if (!disposed) {
                    setError({
                        kind: 'fatal',
                        message:
                            'Kartan kunde inte startas. Kontrollera kartkonfigurationen och anslutningen.',
                    });
                }
            });

        return () => {
            disposed = true;
            host.remove();
            cancelAnimationFrame(frame);
            cleanups.forEach((cleanup) => cleanup());
            instance?.destroy();
        };
    }, [createMap]);

    useEffect(() => {
        if (!map || !elementRef.current) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            if (!entry.contentRect.width || !entry.contentRect.height) {
                return;
            }
            map.resize();
            setMapSize(`${entry.contentRect.width},${entry.contentRect.height}`);
        });
        observer.observe(elementRef.current);

        return () => observer.disconnect();
    }, [map]);

    useEffect(() => {
        if (!map) {
            return;
        }
        const points = mapPoints(options);
        const signature = JSON.stringify(points) + (options.readOnly ? mapSize : '');
        if (options.readOnly ? fitted.current === signature : fitted.current !== null) {
            return;
        }
        fitted.current = signature;
        fitProperty(map, points);
    }, [map, options, mapSize]);

    return { elementRef, map, error, revision };
}
