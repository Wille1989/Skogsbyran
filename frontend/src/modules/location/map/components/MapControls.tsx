import { useState } from 'react';
import { IconPlus, IconMinus, IconFocus2 } from '@tabler/icons-react';
import type { MapAdapter } from '../adapters/MapAdapter';

export function MapControls({ map, onFit }: { map: MapAdapter; onFit: () => void }) {
    const [layer, setLayer] = useState(map.getBasemap());

    return (
        <div className="map-controls" role="group" aria-label="Kartkontroller">
            <button
                type="button"
                aria-label="Zooma in"
                onClick={() => map.setZoom(map.getZoom() + 1)}
            >
                <IconPlus size={19} />
            </button>
            <button
                type="button"
                aria-label="Zooma ut"
                onClick={() => map.setZoom(map.getZoom() - 1)}
            >
                <IconMinus size={19} />
            </button>
            <button type="button" aria-label="Visa hela fastigheten" onClick={onFit}>
                <IconFocus2 size={19} />
            </button>
            <label>
                Baskarta
                <select
                    value={layer}
                    onChange={(event) => {
                        map.setBasemap(event.target.value);
                        setLayer(event.target.value);
                    }}
                >
                    {map.basemaps.map((item) => (
                        <option key={item.id} value={item.id}>
                            {item.label}
                        </option>
                    ))}
                </select>
            </label>
        </div>
    );
}
