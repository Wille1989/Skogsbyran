import type { AddressSearchResult, PropertyMapOptions, MapRuntime } from '../types/types';
import { MapAddressSearch } from './MapAddressSearch';
import { usePropertyMap, mapPoints } from '../hooks/usePropertyMap';
import { isValidCoordinate } from '../helpers/areaDraft';
import { mapRuntime } from '../providers/runtime';
import { fitProperty, showAddress } from '../helpers/view';
import { MapOverlays } from './MapOverlays';
import { MapControls } from './MapControls';
import './map.css';

type Props = PropertyMapOptions & {
    showSearch?: boolean;
    onAddressSelect?: (address: AddressSearchResult) => void;
    runtime?: MapRuntime;
};

export function PropertyAreaMap(props: Props) {
    if (!mapPoints(props).every(isValidCoordinate)) {
        return (
            <p className="form-error" role="alert">
                Kartdata innehåller ogiltiga koordinater.
            </p>
        );
    }

    return <LoadedPropertyAreaMap {...props} />;
}

function LoadedPropertyAreaMap(props: Props) {
    const runtime = props.runtime ?? mapRuntime;
    const { elementRef, map, error } = usePropertyMap(props, runtime.createMap);

    return (
        <div className="map-shell">
            {map && error?.kind !== 'fatal' && !props.readOnly && props.showSearch !== false && (
                <MapAddressSearch
                    createGeocoder={runtime.createGeocoder}
                    onSelect={(address) => {
                        if (map) {
                            showAddress(map, address);
                        }
                        props.onAddressSelect?.(address);
                    }}
                />
            )}
            {error && (
                <p className="form-error" role="alert">
                    {error.message}
                </p>
            )}
            {!error && !map && <p role="status">Kartan laddas…</p>}
            <div className="map-viewport">
                <div
                    ref={elementRef}
                    className={`property-map-canvas${props.readOnly ? ' is-readonly' : ''}`}
                    aria-label="Karta över fastigheten"
                />
                {map && error?.kind !== 'fatal' && <MapOverlays map={map} options={props} />}
                {map && error?.kind !== 'fatal' && (
                    <MapControls map={map} onFit={() => fitProperty(map, mapPoints(props))} />
                )}
            </div>
            {props.readOnly && !mapPoints(props).length && (
                <p>Ingen kartdata att visa med detta urval.</p>
            )}
        </div>
    );
}
