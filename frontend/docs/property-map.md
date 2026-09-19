# Map module — frontend

## Reading the module

Start at `../sitemap.xml` for the frontend module index, then follow
`../src/modules/location/map/sitemap.xml` for every Map source file and its purpose.
These XML files are developer documentation, not public SEO sitemaps. Paths are
relative to the XML file containing them. Add new module inventories to the root
index and update the Map inventory whenever files are added, renamed or removed.

## Responsibilities and data flow

- `PropertyMapEditor` owns the open dialog, selected area and active tool.
  CreatePage/EditPage continue to own the editable location and area drafts.
- `PropertyAreaMap` composes search, controls and overlays. `usePropertyMap`
  owns the engine lifecycle, event subscriptions, resize and initial framing.
  Every asynchronous initialization gets an isolated DOM host. Late cleanup
  cannot remove a newer instance, including during React StrictMode replay.
- `usePolygonEditing` applies immutable drawing operations to the current draft.
  `useMapHandle` owns pointer capture, cancellation and keyboard movement.
  `MapHandle` and `MapOverlays` render shared HTML/SVG from domain coordinates.
- `MapAdapter` exposes camera, projection, events and basemaps. Google types
  are confined to `providers/google`; MapLibre types to `providers/maplibre`.
- `MapAddressSearch` calls `GeocoderAdapter`. A selected neutral result navigates
  through `features/view` and converts through `locationFromAddress`.
- `PropertyMapView` is the public read-only consumer. Its filters never change
  stored geometry. The editor preview remains frozen while its dialog is open.

Basemap changes affect only the engine's background. Geometry and POI remain
React/domain data. Fatal initialization/authentication errors disable map tools;
layer errors remain visible until the provider confirms a successful new load.
Selecting a layer does not itself clear an error.

## Existing persistence contract

Coordinates remain WGS84 `{ lat, lng }`; no GeoJSON migration was introduced.
Areas contain an ordered polygon with at least three distinct valid points.
The backend accepts and removes an explicitly repeated closing point. POI retain
name, description, latitude and longitude. Local `uiId` is never serialized.
`googlePlaceId` remains an optional compatibility field; non-Google searches clear
it. Approximate polygon area remains separate from the advertised property area.

Create uses the existing property creation request. Edit and Save map use the
existing location PUT and area POST/PUT/DELETE workflow. Save map supplies only
location/area changes, not other property fields. Multiple writes are not one
transaction; the existing partial-save review logic remains in place.

## Provider configuration

Google remains the default. Existing `VITE_GOOGLE_MAPS_API_KEY` is used.
The custom HTML markers no longer require a Google Map ID.

To opt into MapLibre at build time:

```text
VITE_MAP_PROVIDER=maplibre
VITE_GEOCODER_PROVIDER=nominatim
```

`VITE_MAP_STYLE_URL` optionally supplies a MapLibre-compatible style. Without it,
MapLibre uses OpenFreeMap Liberty. `VITE_GEOCODER_SEARCH_URL` can point to a
Nominatim-compatible search service. The public Nominatim service uses explicit
search rather than autocomplete, with per-browser throttling and caching.
That is not a global application rate limiter; choose an appropriate hosted or
self-hosted service before traffic exceeds the public service's usage policy.
Google Places is not paired with MapLibre by this configuration.

Optional Lantmäteriet configuration:

- `VITE_LANTMATERIET_TOPOGRAPHY_STYLE_URL`: an authorized style endpoint whose
  sources, sprites and fonts are also accessible to the browser.
- `VITE_LANTMATERIET_ORTHOPHOTO_TILES_URL`: an authorized raster tile template
  compatible with the MapLibre raster source. A raw WMS/WMTS service URL is not
  automatically an XYZ template; adapt the authorized service as required.

No Lantmäteriet credentials, proxy or subscription was created. Its configured
layers are not yet verified against a live authorized service. Do not put private
credentials in Vite variables: they are embedded in the browser bundle.

Official references investigated during the refactor:

- [Google autocomplete data](https://developers.google.com/maps/documentation/javascript/place-autocomplete-data)
- [MapLibre API](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
- [OpenFreeMap setup](https://openfreemap.org/quick_start/)
- [Nominatim policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Lantmäteriet topography vector tiles](https://geotorget.lantmateriet.se/geodataprodukter/topografi-visning-vector-tiles-api)
- [Lantmäteriet orthophoto](https://geotorget.lantmateriet.se/geodataprodukter/ortofoto-visning-api)

## Verification and limits

Use the repository commands `npm run lint` and `npm run build`. The existing
`node --test tests/propertyMap.test.mjs` checks the domain/payload boundary.
No automated tests were added or modified during the readability/lifecycle fix.

Manual browser checks use disposable local draft data, not published properties.
Google address search and selection, zoom to the result, and rendering under
StrictMode were checked on localhost:5173. Polygon corner movement, midpoint insertion,
basemap switching with unchanged geometry, POI creation/keyboard movement and
the custom zoom control were also checked with Google. Temporary browser-check
files were removed afterwards. Earlier MapLibre checks covered
polygon drawing, corner/midpoint dragging, deletion and POI movement.
A new live backend save/reload was not performed during this correction.
Lantmäteriet authentication, real mobile touch gestures and complex polygon
edge cases remain outside those checks. There is no new topology validation for
self-intersection or overlap.
