import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

// Load the pure domain functions with the project's existing TypeScript compiler.
function moduleUrl(path, mocks = {}) {
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
  const linked = outputText.replace(/from "([^"]+)"/g, (_, specifier) => {
    if (specifier in mocks) return `from "data:text/javascript;base64,${Buffer.from(mocks[specifier]).toString("base64")}"`;
    const url = specifier.startsWith("@/") ? new URL("../src/" + specifier.slice(2), import.meta.url) : new URL(specifier, new URL(path, import.meta.url));
    return `from "${moduleUrl(url.href.endsWith('.ts') ? url.href : url.href + '.ts')}"`;
  });
  return `data:text/javascript;base64,${Buffer.from(linked).toString("base64")}`;
}

const { buildAreaPayload } = await import(moduleUrl("../src/modules/location/map/data/areaDraft.ts"));
const { buildLocationPayload, createDefaultLocationDraft } = await import(moduleUrl("../src/modules/location/types.ts"));
const { areaChanges } = await import(moduleUrl("../src/modules/property/data/editDrafts.ts"));
const { formatHectares } = await import(moduleUrl("../src/modules/property/presentation/propertyListing.ts"));
const polygon = [{ lat: 59, lng: 18 }, { lat: 59.01, lng: 18.02 }, { lat: 59.02, lng: 18 }];

test("polygon serialization keeps lat/lng and rejects partial and invalid geometry", () => {
  assert.deepEqual(buildAreaPayload({ name: "Skifte", polygon, marker: null }), { name: "Skifte", polygon });
  assert.equal(buildAreaPayload({ name: "Skifte", polygon: [] }), null);
  for (const invalid of [polygon.slice(0, 2), Array(3).fill(polygon[0]), [{ lat: 91, lng: 18 }, ...polygon], [{ lat: NaN, lng: 18 }, ...polygon]]) {
    assert.throws(() => buildAreaPayload({ name: "Skifte", polygon: invalid }));
  }
});

test("empty saved polygon is rejected instead of silently ignored; explicit area removal persists", () => {
  const area = { id: "1", name: "Skifte", polygon, marker: null };
  assert.throws(() => areaChanges([area], [{ ...area, polygon: [] }]));
  assert.deepEqual(areaChanges([area], []).removedAreaIds, ["1"]);
  assert.equal(areaChanges([area], [area]).updatedAreas.length, 0);
  assert.equal(areaChanges([], [area, { name: "Andra", polygon }]).createdAreas.length, 1);
});

test("main position and multiple overlapping POIs are independent; no polygon is required", () => {
  const draft = { ...createDefaultLocationDraft(), latitude: 59, longitude: 18, pois: [
    { uiId: "a", name: "Brygga", description: "", latitude: 59.1, longitude: 18.1 },
    { uiId: "b", name: "Sjö", description: "", latitude: 59.1, longitude: 18.1 },
  ] };
  const payload = buildLocationPayload(draft);
  assert.equal(payload.latitude, 59);
  assert.equal(payload.pois.length, 2);
  assert.equal("uiId" in payload.pois[0], false);
  assert.equal(buildLocationPayload({ ...draft, pois: [] }).pois.length, 0);
  assert.throws(() => buildLocationPayload({ ...draft, longitude: null }));
  assert.throws(() => buildLocationPayload({ ...draft, pois: [{ ...draft.pois[0], name: " " }] }));
});

test("declared hectares are formatted without deriving or rounding to a different source", () => {
  assert.equal(formatHectares("42.6000"), "42,6 ha");
  assert.equal(formatHectares("0"), "0 ha");
  assert.equal(formatHectares(""), "Areal saknas");
});

test("an acknowledged new Area is retained when a later save fails, so retry does not duplicate it", async () => {
  const draft = { name: "Skifte", polygon, marker: null };
  const saved = { ...draft, id: "42", propertyId: "1", areaSquareMeters: 10, areaHectares: 0.001 };
  const state = { cached: { property: { areas: [] } }, creates: 0, saved };
  globalThis.mapSaveTest = state;
  try {
    const { useSavePropertyChangesMutation } = await import(moduleUrl("../src/modules/property/data/editMutations.ts", {
      "@tanstack/react-query": `export const useMutation = options => options; export const useQueryClient = () => ({ setQueryData: (_key, update) => { globalThis.mapSaveTest.cached = update(globalThis.mapSaveTest.cached); } });`,
      "../details/api": "export const patchDetails = async () => {};",
      "@/modules/document/api": "export const deleteDocument = async () => {}; export const updateDocumentTitle = async () => {}; export const uploadDocument = async () => { throw new Error('Document upload failed'); };",
      "@/modules/image/data/api": "export const deleteImages = async () => {}; export const updateImages = async () => {}; export const uploadImages = async () => {};",
      "@/modules/location/api": "export const updateLocation = async () => {};",
      "@/modules/location/map/data/api": "export const createArea = async () => { globalThis.mapSaveTest.creates++; return globalThis.mapSaveTest.saved; }; export const updateArea = async () => {}; export const deleteArea = async () => {};",
      "./api": "export const getById = async () => globalThis.mapSaveTest.cached;",
    }));
    let drafts = [draft];
    const mutation = useSavePropertyChangesMutation();
    const input = () => ({ propertyId: "1", details: {}, initialDetails: {},
      imageChanges: { removedImageIds: [], updatedImages: [], newImages: [] },
      initialLocation: null, location: createDefaultLocationDraft(),
      initialAreas: state.cached.property.areas, areas: drafts, documents: [], pendingDocuments: [{ title: "Test" }],
      onAreaCreated: (original, area) => { drafts = drafts.map(entry => entry === original ? { ...entry, id: area.id } : entry); },
    });
    await assert.rejects(mutation.mutationFn(input()), /Document upload failed/);
    assert.equal(drafts[0].id, "42");
    assert.equal(state.cached.property.areas[0].id, "42");
    await assert.rejects(mutation.mutationFn(input()), /Document upload failed/);
    assert.equal(state.creates, 1);
    assert.deepEqual(drafts[0].polygon, polygon);
  } finally {
    delete globalThis.mapSaveTest;
  }
});
