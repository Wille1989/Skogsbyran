import "./googleMap.css";

type AreaEditorMode = "polygon" | "marker";

type PropertyAreaDrawingToolsProps = {
  mode: AreaEditorMode;
  onSetPolygonMode: () => void;
  onSetMarkerMode: () => void;
  onRemoveLastPolygonPoint: () => void;
  onResetArea: () => void;
};

export function PropertyAreaDrawingTools({
  mode,
  onSetPolygonMode,
  onSetMarkerMode,
  onRemoveLastPolygonPoint,
  onResetArea,
}: PropertyAreaDrawingToolsProps) {
  return (
    <div className="area-toolbar">
      <button
        type="button"
        className="property-link-button"
        onClick={onSetPolygonMode}
        aria-pressed={mode === "polygon"}
      >
        Rita polygon
      </button>

      <button
        type="button"
        className="property-link-button"
        onClick={onSetMarkerMode}
        aria-pressed={mode === "marker"}
      >
        Sätt fastighetspunkt
      </button>

      <button
        type="button"
        className="property-link-button"
        onClick={onRemoveLastPolygonPoint}
      >
        Ta bort sista punkt
      </button>

      <button
        type="button"
        className="property-link-button"
        onClick={onResetArea}
      >
        Rensa karta
      </button>
    </div>
  );
}
