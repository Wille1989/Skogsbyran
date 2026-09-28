import { useEffect, useRef } from 'react';
import type { ScreenPoint } from '../types/types';

type Props = {
    screen: ScreenPoint;
    name: string;
    label: string;
    focus: boolean;
    onChange: (name: string) => void;
};

export function MapNameInput({ screen, name, label, focus, onChange }: Props) {
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focus) {
            input.current?.focus({ preventScroll: true });
            input.current?.select();
        }
    }, [focus]);

    return <input
        ref={input}
        className="map-name-input"
        style={{ left: screen.x, top: screen.y }}
        aria-label={label}
        title={label}
        placeholder={label}
        value={name}
        maxLength={120}
        onChange={event => onChange(event.target.value)}
        onPointerDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
        onDoubleClick={event => event.stopPropagation()}
        onKeyDown={event => {
            event.stopPropagation();
            if (event.key === 'Enter' || event.key === 'Escape') {
                event.preventDefault();
                event.currentTarget.blur();
            }
        }}
    />;
}
