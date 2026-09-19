import { useEffect, useRef } from 'react';
import type { PropertyMapOptions } from '../data/usePropertyMap';
import { editPolygon, type DrawingAction } from './drawing';

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
