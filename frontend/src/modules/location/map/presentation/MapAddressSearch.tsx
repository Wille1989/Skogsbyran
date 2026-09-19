import { useEffect, useId, useRef, useState } from 'react';
import type {
    AddressSearchResult,
    AddressSuggestion,
    GeocoderAdapter,
    GeocoderFactory,
} from '../adapters/GeocoderAdapter';

export type SelectedAddress = AddressSearchResult;

export function MapAddressSearch({
    onSelect,
    createGeocoder,
}: {
    onSelect: (address: AddressSearchResult) => void;
    createGeocoder: GeocoderFactory;
}) {
    const id = useId();
    const [geocoder, setGeocoder] = useState<GeocoderAdapter | null>(null);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<AddressSuggestion[]>([]);
    const [busy, setBusy] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const request = useRef<AbortController | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        let disposed = false;
        let adapter: GeocoderAdapter | undefined;
        void createGeocoder()
            .then((value) => {
                if (disposed) {
                    value.dispose();

                    return;
                }
                adapter = value;
                setGeocoder(value);
            })
            .catch(() => {
                if (!disposed) {
                    setError(
                        'Adressökningen kunde inte startas. Du kan fortfarande välja plats i kartan.',
                    );
                }
            });

        return () => {
            disposed = true;
            request.current?.abort();
            clearTimeout(timer.current);
            adapter?.dispose();
        };
    }, [createGeocoder]);

    async function search(value: string) {
        clearTimeout(timer.current);
        request.current?.abort();
        if (!geocoder || value.trim().length < 3) {
            return;
        }
        const controller = new AbortController();
        request.current = controller;
        setBusy(true);
        setError('');
        setSearched(false);
        try {
            const matches = await geocoder.search(value.trim(), controller.signal);
            if (controller.signal.aborted) {
                return;
            }
            setResults(matches);
            setSearched(true);
        } catch (reason) {
            if (!controller.signal.aborted) {
                setError(reason instanceof Error ? reason.message : 'Adressen kunde inte hämtas.');
            }
        } finally {
            if (!controller.signal.aborted) {
                setBusy(false);
            }
        }
    }

    async function select(result: AddressSuggestion) {
        clearTimeout(timer.current);
        request.current?.abort();
        if (!geocoder) {
            return;
        }
        const controller = new AbortController();
        request.current = controller;
        setBusy(true);
        setError('');
        try {
            const address = await geocoder.resolve(result, controller.signal);
            if (controller.signal.aborted) {
                return;
            }
            setQuery(result.label);
            setResults([]);
            setSearched(false);
            onSelect(address);
        } catch (reason) {
            if (!controller.signal.aborted) {
                setError(reason instanceof Error ? reason.message : 'Platsen kunde inte hämtas.');
            }
        } finally {
            if (!controller.signal.aborted) {
                setBusy(false);
            }
        }
    }

    return (
        <div className="map-address-search">
            <label htmlFor={id}>Sök adress eller plats</label>
            <div className="map-search-input">
                <input
                    id={id}
                    value={query}
                    placeholder="Adress, ort"
                    autoComplete="off"
                    aria-controls={`${id}-results`}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void search(query);
                        }
                        if (event.key === 'Escape' && results.length) {
                            event.stopPropagation();
                            setResults([]);
                        }
                    }}
                    onChange={(event) => {
                        const value = event.target.value;
                        setQuery(value);
                        setResults([]);
                        setSearched(false);
                        setBusy(false);
                        setError('');
                        request.current?.abort();
                        clearTimeout(timer.current);
                        if (geocoder?.autocomplete && value.trim().length >= 3) {
                            timer.current = setTimeout(() => {
                                void search(value);
                            }, 350);
                        }
                    }}
                />
                <button
                    type="button"
                    className="admin-button"
                    disabled={!geocoder || busy || query.trim().length < 3}
                    onClick={() => {
                        void search(query);
                    }}
                >
                    Sök
                </button>
            </div>
            {busy && <p role="status">Söker…</p>}
            {error && <p role="alert">{error}</p>}
            <ul id={`${id}-results`} className="map-search-results" aria-label="Adressförslag">
                {results.map((result) => (
                    <li key={result.id}>
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                void select(result);
                            }}
                        >
                            {result.label}
                        </button>
                    </li>
                ))}
            </ul>
            {searched && !busy && !results.length && (
                <p role="status">Inga adresser hittades. Prova att ange ort också.</p>
            )}
            {geocoder && (
                <a
                    className="map-search-attribution"
                    href={geocoder.attribution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {geocoder.attribution.label}
                </a>
            )}
        </div>
    );
}
