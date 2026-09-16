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
const { buildAreaPayload, isValidCoordinate } = load('modules/location/map/data/areaDraft');
const { filterMapData } = load('modules/location/map/data/mapPresentation');
const { buildLocationPayload, createDefaultLocationDraft } = load('modules/location/types');
const { areaChanges, locationDraftFromProperty, areaDraftsFromProperty } = load('modules/property/data/editDrafts');
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
