import type { Coordinates } from '../data/types';
import { isValidCoordinate } from '../data/areaDraft';

export type DrawingAction =
    | { type: 'add'; position: Coordinates }
    | { type: 'move'; index: number; position: Coordinates }
    | { type: 'insert'; index: number; position: Coordinates }
    | { type: 'remove'; index: number }
    | { type: 'clear' };

export function editPolygon(polygon: readonly Coordinates[], action: DrawingAction): Coordinates[] {
    if ('position' in action && !isValidCoordinate(action.position)) {
        throw new Error('Ogiltig kartpunkt.');
    }
    switch (action.type) {
        case 'add':
            return [...polygon, action.position];
        case 'move':
            return polygon.map((point, index) =>
                index === action.index ? action.position : point,
            );
        case 'insert':
            return [
                ...polygon.slice(0, action.index),
                action.position,
                ...polygon.slice(action.index),
            ];
        case 'remove':
            return polygon.filter((_, index) => index !== action.index);
        case 'clear':
            return [];
    }
}
