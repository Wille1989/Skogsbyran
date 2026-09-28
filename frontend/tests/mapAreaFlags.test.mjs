import { build } from 'esbuild';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Run with: node tests/mapAreaFlags.test.mjs
const result = await build({
    stdin: {
        resolveDir: fileURLToPath(new URL('../', import.meta.url)),
        loader: 'tsx',
        contents: `
            import assert from 'node:assert/strict';
            import { renderToStaticMarkup } from 'react-dom/server';
            import { MapOverlays } from './src/modules/location/map/components/MapOverlays';
            import { fitProperty } from './src/modules/location/map/helpers/view';
            const polygon = [{lat: 57, lng: 14}, {lat: 58, lng: 14}, {lat: 57, lng: 15}];
            const areas = [
                {id: 'north', name: 'Norra skogen', polygon},
                {id: 'south', name: '', polygon: polygon.map(p => ({lat: p.lat - 2, lng: p.lng}))},
            ];
            let fitted;
            const map = {project: p => ({x: p.lng, y: p.lat}), fitBounds: b => {fitted = b}};
            const options = {polygon, marker: null, areas, readOnly: true};
            const render = overrides => renderToStaticMarkup(<MapOverlays map={map} options={{...options, ...overrides}} />);
            const html = render({});
            assert.equal((html.match(/class="map-area-flag"/g) || []).length, 2);
            assert.ok(html.includes('Zooma till Norra skogen'));
            assert.ok(html.includes('Zooma till Område 2'));
            assert.ok(!render({areas: []}).includes('map-area-flag'));
            assert.ok(!render({readOnly: false}).includes('map-area-flag'));
            fitProperty(map, areas[1].polygon);
            assert.deepEqual(fitted, {north: 56, south: 55, east: 15, west: 14});
            console.log('Area flag rendering and area zoom checks passed.');
        `,
    },
    bundle: true,
    packages: 'external',
    platform: 'node',
    format: 'cjs',
    jsx: 'automatic',
    write: false,
});
new Function('require', result.outputFiles[0].text)(createRequire(import.meta.url));
