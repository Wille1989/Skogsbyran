import { MapAddressSearch, type SelectedAddress } from "./MapAddressSearch";
import { usePropertyMap, type PropertyMapOptions } from "../data/usePropertyMap";
import { isValidCoordinate } from "../data/areaDraft";
import "./googleMap.css";

type Props = PropertyMapOptions & { onAddressSelect?: (address: SelectedAddress) => void };

export function PropertyAreaMap(props: Props) {
  const points = [...props.polygon, ...(props.otherPolygons?.flat() ?? []),
    ...(props.marker ? [props.marker] : []),
    ...(props.pois?.map(poi => ({ lat: poi.latitude, lng: poi.longitude })) ?? [])];
  if (!points.every(isValidCoordinate)) return <p className="form-error" role="alert">Kartdata innehåller ogiltiga koordinater.</p>;
  return <LoadedPropertyAreaMap {...props} />;
}

function LoadedPropertyAreaMap(props: Props) {
  const { elementRef, map, error } = usePropertyMap(props);
  return (
    <div className="mock-map-shell">
      {!props.readOnly && map && <MapAddressSearch onSelect={(address) => {
        map.panTo(address.position);
        map.setZoom(15);
        props.onAddressSelect?.(address);
      }} />}
      {error ? <p className="form-error" role="alert">{error}</p> : !map && <p role="status">Kartan laddas…</p>}
      <div ref={elementRef} className="mock-map google-map" aria-label="Karta över fastigheten" />
      {props.readOnly && !props.marker && !props.polygon.length && !props.otherPolygons?.length && !props.pois?.length
        ? <p>Ingen kartdata har sparats för fastigheten.</p> : null}
    </div>
  );
}
