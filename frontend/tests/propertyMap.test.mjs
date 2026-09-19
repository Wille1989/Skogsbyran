import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import ts from 'typescript';

// Run the actual pure TS domain modules with the project's existing compiler.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../src');
const cache = new Map();
function load(file) {
  const path = resolve(root, file.endsWith('.ts') ? file : `${file}.ts`);
  if (cache.has(path)) return cache.get(path);
  const module = { exports: {} };
  cache.set(path, module.exports);
  const code = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const nativeRequire = createRequire(path);
  const require = name => name.startsWith('@/') ? load(name.slice(2))
    : name.startsWith('.') ? load(resolve(dirname(path), name)) : nativeRequire(name);
  new Function('module', 'exports', 'require', code)(module, module.exports, require);
  return module.exports;
}
const { buildAreaPayload, isValidCoordinate } = load('modules/location/map/helpers/areaDraft');
const { filterMapData } = load('modules/location/map/helpers/mapPresentation');
const { buildLocationPayload, createDefaultLocationDraft } = load('modules/location/types/types');
const { areaChanges, locationDraftFromProperty, areaDraftsFromProperty } = load('modules/property/helpers/editDrafts');
const polygon = [{ lat: 59.3, lng: 18.1 }, { lat: 59.31, lng: 18.12 }, { lat: 59.32, lng: 18.1 }];
const poi = { id: '7', name: 'Brygga', description: 'Vid sjön', latitude: 59.31, longitude: 18.11 };

test('coordinates reject missing, partial, nonfinite and out-of-range data', () => {
  for (const value of [null, undefined, {}, { lat: 59 }, { lat: NaN, lng: 18 }, { lat: 91, lng: 18 }, { lat: 59, lng: 181 }, { lat: '59', lng: 18 }]) assert.equal(isValidCoordinate(value), false);
  assert.equal(isValidCoordinate(polygon[0]), true);
});
test('polygon payload preserves lat/lng order and the supplied closing point', () => {
  const closed = [...polygon, polygon[0]];
  assert.deepEqual(buildAreaPayload({ name: ' Skifte ', polygon: closed }), { name: 'Skifte', polygon: closed });
  assert.equal(buildAreaPayload({ name: 'Nytt', polygon: [] }), null);
  for (const points of [polygon.slice(0, 2), [polygon[0], polygon[0], polygon[0]]]) assert.throws(() => buildAreaPayload({ name: 'Fel', polygon: points }), /tre olika/);
});
test('filters never alter the domain data and keep all areas and POI', () => {
  const data = Object.freeze({ polygons: Object.freeze([polygon, polygon]), marker: polygon[0], pois: Object.freeze([poi, { ...poi, id: '8' }]) });
  const before = JSON.stringify(data);
  assert.deepEqual(filterMapData(data, 'area'), { polygons: data.polygons, marker: null, pois: [] });
  assert.deepEqual(filterMapData(data, 'poi'), { polygons: [], marker: data.marker, pois: data.pois });
  assert.deepEqual(filterMapData(data, 'all'), data);
  assert.equal(JSON.stringify(data), before);
  assert.deepEqual(filterMapData({ polygons: [], marker: null, pois: [] }, 'all'), { polygons: [], marker: null, pois: [] });
});
test('POI hydration and payload preserve metadata and coordinates, never uiId', () => {
  const location = { ...createDefaultLocationDraft(), latitude: 59.3, longitude: 18.1, pois: [poi, { ...poi, id: '8', name: 'Hus' }] };
  const draft = locationDraftFromProperty({ location });
  assert.equal(draft.pois.length, 2);
  assert.deepEqual(buildLocationPayload(draft).pois, location.pois);
  assert.equal('uiId' in buildLocationPayload(draft).pois[0], false);
  assert.throws(() => buildLocationPayload({ ...draft, longitude: null }), /ogiltiga/);
  assert.throws(() => buildLocationPayload({ ...draft, pois: [{ ...draft.pois[0], latitude: 100 }] }), /ogiltiga/);
});
test('hydrated polygons retain identity; invalid edits fail before writes', () => {
  const saved = [{ id: '1', name: 'Skifte', polygon }];
  const draft = areaDraftsFromProperty({ areas: saved });
  assert.deepEqual(areaChanges(saved, draft), { createdAreas: [], updatedAreas: [], removedAreaIds: [] });
  assert.throws(() => areaChanges(saved, [{ ...draft[0], polygon: [] }]), /tom polygon/);
  assert.deepEqual(areaChanges(saved, []).removedAreaIds, ['1']);
  assert.equal(areaChanges(saved, [{ ...draft[0], name: 'Ändrat' }]).updatedAreas[0].areaId, '1');
});

const { editPolygon } = load('modules/location/map/helpers/drawing');
const { createPoi, updatePoi, removePoi } = load('modules/location/map/helpers/poi');
const { locationFromAddress } = load('modules/location/map/helpers/locationFromAddress');
const { fitProperty, showAddress } = load('modules/location/map/helpers/view');
const { lantmaterietBasemaps } = load('modules/location/map/providers/lantmateriet/basemaps');

test('own drawing handles empty drafts, insert, move, remove and clear without mutating saved geometry', () => {
  const saved = structuredClone(polygon);
  let draft = [];
  for (const position of polygon) draft = editPolygon(draft, { type: 'add', position });
  draft = editPolygon(draft, { type: 'insert', index: 1, position: { lat: 59.305, lng: 18.11 } });
  draft = editPolygon(draft, { type: 'move', index: 1, position: { lat: 59.306, lng: 18.11 } });
  assert.equal(draft.length, 4);
  assert.equal(draft[1].lat, 59.306);
  assert.deepEqual(editPolygon(draft, { type: 'remove', index: 1 }), saved);
  assert.deepEqual(editPolygon(draft, { type: 'clear' }), []);
  assert.deepEqual(polygon, saved);
  assert.throws(() => editPolygon(draft, { type: 'add', position: { lat: 95, lng: 18 } }), /Ogiltig/);
});

test('own POI operations survive the existing hydration and API payload boundary', () => {
  const first = createPoi(polygon[0], 1, 'test-1');
  const second = createPoi(polygon[1], 2, 'test-2');
  const changed = updatePoi([first, second], first.uiId, { name: 'Brygga', longitude: 18.2 });
  assert.equal(first.longitude, polygon[0].lng);
  assert.equal(changed[0].longitude, 18.2);
  const draft = { ...createDefaultLocationDraft(), pois: removePoi(changed, 'test-2') };
  const payload = buildLocationPayload(draft);
  assert.equal(payload.pois.length, 1);
  assert.equal(payload.pois[0].name, 'Brygga');
  assert.equal('uiId' in payload.pois[0], false);
  assert.equal(locationDraftFromProperty({ location: payload }).pois[0].longitude, 18.2);
});

test('geocoder conversion preserves POI and keeps vendor IDs at the persistence boundary', () => {
  const original = { ...createDefaultLocationDraft(), googlePlaceId: 'old', pois: [createPoi(polygon[0], 1, 'test')] };
  const result = { label: 'Plats', coordinates: polygon[1], address: 'Gatan 1', postalCode: '12345', city: 'Ort', municipality: 'Kommun', countryCode: 'SE', source: { provider: 'nominatim', id: 'external' } };
  const next = locationFromAddress(original, result);
  assert.equal(next.googlePlaceId, '');
  assert.equal(next.latitude, polygon[1].lat);
  assert.equal(next.pois, original.pois);
  assert.equal(locationFromAddress(original, { ...result, source: { provider: 'google', id: 'place' } }).googlePlaceId, 'place');
});

test('view commands accept only domain coordinates and handle address bounds or a single point', () => {
  const commands = [];
  const map = { setCenter: p => commands.push(['center', p]), setZoom: z => commands.push(['zoom', z]), fitBounds: b => commands.push(['bounds', b]) };
  fitProperty(map, polygon);
  assert.deepEqual(commands.pop(), ['bounds', { north: 59.32, south: 59.3, east: 18.12, west: 18.1 }]);
  showAddress(map, { coordinates: polygon[0] });
  assert.deepEqual(commands, [['center', polygon[0]], ['zoom', 15]]);
  commands.length = 0;
  const bounds = { north: 60, south: 59, east: 19, west: 18 };
  showAddress(map, { coordinates: polygon[0], bounds });
  assert.deepEqual(commands, [['bounds', bounds]]);
});

test('Lantmäteriet layers are only advertised when their authorized URLs are configured', () => {
  assert.deepEqual(lantmaterietBasemaps({}), []);
  const layers = lantmaterietBasemaps({ topographyStyle: '/maps/style.json', orthophotoTiles: '/maps/ortho/{z}/{x}/{y}' });
  assert.equal(layers.length, 2);
  assert.equal(layers[0].kind, 'style');
  assert.equal(layers[1].kind, 'raster');
});
