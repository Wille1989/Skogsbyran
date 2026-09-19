import type { MapAdapter, MapFactory, MapIssueListener } from '../../adapters/MapAdapter';
import type { Coordinates } from '../../data/types';
import type { MapBounds, ScreenPoint } from '../../domain/map';
import { DEFAULT_VIEW } from '../../domain/map';
import { loadMapLibrary, mapsAuthErrorEvent, mapsAuthErrorMessage } from './loader';

export const createGoogleMap: MapFactory = async (element, onError) => {
    await loadMapLibrary();

    return new GoogleMapAdapter(element, onError);
};

class GoogleMapAdapter implements MapAdapter {
    readonly basemaps = [
        { id: 'roadmap', label: 'Karta' },
        { id: 'satellite', label: 'Flygbild' },
        { id: 'terrain', label: 'Terräng' },
    ];
    private map: google.maps.Map;
    private projection: google.maps.OverlayView;
    private views = new Set<() => void>();
    private listeners: google.maps.MapsEventListener[] = [];
    private authError: () => void;
    private disposed = false;

    constructor(
        private element: HTMLElement,
        onError: MapIssueListener,
    ) {
        this.map = new google.maps.Map(element, {
            ...DEFAULT_VIEW,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: 'cooperative',
            tilt: 0,
            heading: 0,
            styles: [
                { featureType: 'poi', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', stylers: [{ visibility: 'off' }] },
                { featureType: 'road', elementType: 'geometry', stylers: [{ saturation: -80 }] },
                {
                    featureType: 'landscape.natural',
                    elementType: 'geometry',
                    stylers: [{ color: '#e7eadf' }],
                },
            ],
        });
        this.projection = new google.maps.OverlayView();
        this.projection.onAdd = () => {};
        this.projection.draw = () => this.views.forEach((listener) => listener());
        this.projection.onRemove = () => {};
        this.projection.setMap(this.map);
        this.listeners.push(
            this.map.addListener('bounds_changed', () =>
                this.views.forEach((listener) => listener()),
            ),
        );
        this.authError = () => {
            if (!this.disposed) {
                onError({ kind: 'fatal', message: mapsAuthErrorMessage });
            }
        };
        window.addEventListener(mapsAuthErrorEvent, this.authError);
    }

    getBasemap() {
        return this.map.getMapTypeId() ?? 'roadmap';
    }

    setBasemap(id: string) {
        if (!this.basemaps.some((layer) => layer.id === id)) {
            throw new Error('Okänd baskarta.');
        }
        this.map.setMapTypeId(id);
        this.map.setTilt(0);
    }

    getCenter(): Coordinates {
        return this.map.getCenter()?.toJSON() ?? DEFAULT_VIEW.center;
    }

    setCenter(position: Coordinates) {
        this.map.panTo(position);
    }

    getZoom() {
        return this.map.getZoom() ?? DEFAULT_VIEW.zoom;
    }

    setZoom(zoom: number) {
        this.map.setZoom(Math.max(0, Math.min(22, zoom)));
    }

    fitBounds(bounds: MapBounds) {
        this.map.fitBounds(bounds, 48);
    }

    project(position: Coordinates): ScreenPoint | null {
        const projection = this.projection.getProjection();
        if (!projection) {
            return null;
        }
        const point = projection.fromLatLngToContainerPixel(new google.maps.LatLng(position));

        return point ? { x: point.x, y: point.y } : null;
    }

    unproject(point: ScreenPoint): Coordinates | null {
        return (
            this.projection
                .getProjection()
                ?.fromContainerPixelToLatLng(new google.maps.Point(point.x, point.y))
                ?.toJSON() ?? null
        );
    }

    onClick(listener: (position: Coordinates) => void) {
        const event = this.map.addListener('click', (value: google.maps.MapMouseEvent) => {
            if (value.latLng) {
                listener(value.latLng.toJSON());
            }
        });
        this.listeners.push(event);

        return () => event.remove();
    }

    onViewChange(listener: () => void) {
        this.views.add(listener);

        return () => {
            this.views.delete(listener);
        };
    }

    setPanEnabled(enabled: boolean) {
        this.map.setOptions({
            gestureHandling: enabled ? 'cooperative' : 'none',
            draggable: enabled,
        });
    }

    resize() {
        google.maps.event.trigger(this.map, 'resize');
        this.views.forEach((listener) => listener());
    }

    destroy() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;
        window.removeEventListener(mapsAuthErrorEvent, this.authError);
        this.listeners.forEach((listener) => listener.remove());
        this.views.clear();
        this.projection.setMap(null);
        google.maps.event.clearInstanceListeners(this.map);
        this.element.replaceChildren();
    }
}
