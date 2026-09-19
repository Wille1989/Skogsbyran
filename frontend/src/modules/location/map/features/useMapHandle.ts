import {
    useEffect,
    useRef,
    useState,
    type KeyboardEvent,
    type PointerEvent,
    type ButtonHTMLAttributes,
} from 'react';
import type { MapAdapter } from '../adapters/MapAdapter';
import type { Coordinates } from '../data/types';
import type { ScreenPoint } from '../domain/map';

export type HandleInteraction = {
    map: MapAdapter;
    position: Coordinates;
    screen: ScreenPoint;
    onMove?: (position: Coordinates) => void;
    onStart?: () => void;
    onCancel?: () => void;
    onRemove?: () => void;
    onActivate?: () => void;
};

export function useMapHandle({
    map,
    position,
    screen,
    onMove,
    onStart,
    onCancel,
    onRemove,
    onActivate,
}: HandleInteraction) {
    const drag = useRef<{
        id: number;
        start: ScreenPoint;
        origin: Coordinates;
        moved: boolean;
    } | null>(null);
    const suppressClick = useRef(false);
    const [moving, setMoving] = useState(false);

    useEffect(
        () => () => {
            if (drag.current) {
                map.setPanEnabled(true);
            }
        },
        [map],
    );
    const coordinateAt = (event: PointerEvent<HTMLButtonElement>) => {
        const frame = event.currentTarget.parentElement!.getBoundingClientRect();

        return map.unproject({ x: event.clientX - frame.left, y: event.clientY - frame.top });
    };

    function cancel() {
        if (!drag.current) {
            return;
        }
        if (drag.current.moved) {
            if (onCancel) {
                onCancel();
            } else {
                onMove?.(drag.current.origin);
            }
        }
        drag.current = null;
        setMoving(false);
        map.setPanEnabled(true);
    }

    function keyboard(event: KeyboardEvent<HTMLButtonElement>) {
        if (event.key === 'Escape' && drag.current) {
            event.stopPropagation();
            cancel();

            return;
        }
        if ((event.key === 'Delete' || event.key === 'Backspace') && onRemove) {
            event.preventDefault();
            onRemove();

            return;
        }
        if (!onMove) {
            return;
        }
        const offsets: Record<string, ScreenPoint> = {
            ArrowLeft: { x: -5, y: 0 },
            ArrowRight: { x: 5, y: 0 },
            ArrowUp: { x: 0, y: -5 },
            ArrowDown: { x: 0, y: 5 },
        };
        const offset = offsets[event.key];
        if (!offset) {
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        const next = map.unproject({ x: screen.x + offset.x, y: screen.y + offset.y });
        if (next) {
            onStart?.();
            onMove(next);
        }
    }
    const handlers: ButtonHTMLAttributes<HTMLButtonElement> = {
        onKeyDown: keyboard,
        onClick: (event) => {
            event.stopPropagation();
            if (suppressClick.current) {
                suppressClick.current = false;

                return;
            }
            onActivate?.();
        },
        onContextMenu: (event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove?.();
        },
        onPointerDown: (event) => {
            event.stopPropagation();
            suppressClick.current = false;
            if (!onMove || event.button !== 0) {
                return;
            }
            event.preventDefault();
            event.currentTarget.focus();
            drag.current = {
                id: event.pointerId,
                origin: position,
                start: { x: event.clientX, y: event.clientY },
                moved: false,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
            map.setPanEnabled(false);
            setMoving(true);
        },
        onPointerMove: (event) => {
            const active = drag.current;
            if (!active || active.id !== event.pointerId) {
                return;
            }
            event.stopPropagation();
            if (
                !active.moved &&
                Math.hypot(event.clientX - active.start.x, event.clientY - active.start.y) < 3
            ) {
                return;
            }
            const point = coordinateAt(event);
            if (point) {
                if (!active.moved) {
                    onStart?.();
                }
                active.moved = true;
                onMove?.(point);
            }
        },
        onPointerUp: (event) => {
            if (!drag.current || drag.current.id !== event.pointerId) {
                return;
            }
            event.stopPropagation();
            const moved = drag.current.moved;
            drag.current = null;
            setMoving(false);
            map.setPanEnabled(true);
            event.currentTarget.releasePointerCapture(event.pointerId);
            // Native click follows pointerup. Prevent midpoint insertion a second time.
            suppressClick.current = moved;
        },
        onPointerCancel: cancel,
        onLostPointerCapture: () => {
            if (drag.current) {
                cancel();
            }
        },
    };

    return { moving, handlers };
}
