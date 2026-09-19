import type { PropertyMapOptions, DrawingAction } from '../types/types';
import { useEffect, useRef } from 'react';

import { editPolygon } from '../helpers/drawing';

export function usePolygonEditing(options: PropertyMapOptions) {
    const latest = useRef(options);

    useEffect(() => {
        latest.current = options;
    }, [options]);

    function change(action: DrawingAction) {
        const current = latest.current;
        if (current.readOnly || current.mode !== 'polygon') {
            return;
        }

        const polygon = editPolygon(current.polygon, action);
        // A midpoint inserts and moves before React commits the new props.
        latest.current = { ...current, polygon };
        current.onPolygonChange?.(polygon);
    }

    return { editing: !options.readOnly && options.mode === 'polygon', change };
}
