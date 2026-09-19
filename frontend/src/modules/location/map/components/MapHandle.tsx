import type { HandleInteraction } from '../types/types';
import { IconFlag, IconMapPin } from '@tabler/icons-react';
import { useMapHandle } from '../hooks/useMapHandle';

type Props = HandleInteraction & {
    label: string;
    kind: 'map-vertex' | 'map-midpoint' | 'map-main-marker' | 'map-poi';
    text?: string;
};

export function MapHandle({ label, kind, text, ...interaction }: Props) {
    const { moving, handlers } = useMapHandle(interaction);
    const className = ['map-handle', kind, moving ? 'is-moving' : ''].filter(Boolean).join(' ');

    return (
        <button
            type="button"
            className={className}
            style={{ left: interaction.screen.x, top: interaction.screen.y }}
            aria-label={label}
            title={label}
            {...handlers}
        >
            {kind === 'map-poi' && (
                <>
                    <IconFlag size={16} aria-hidden="true" />
                    <span>{text}</span>
                </>
            )}
            {kind === 'map-main-marker' && <IconMapPin size={26} aria-hidden="true" />}
        </button>
    );
}
