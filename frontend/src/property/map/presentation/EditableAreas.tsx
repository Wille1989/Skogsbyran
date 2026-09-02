import { createDefaultAreaDraft } from "../data/areaDraft";
import { PropertyAreaEditor } from "./PropertyAreaEditor";
import type { EditableAreaDraft } from "../../data/editDrafts";

type EditableAreasProps = {
  areas: EditableAreaDraft[];
  onChange: (areas: EditableAreaDraft[]) => void;
};

export function EditableAreas({ areas, onChange }: EditableAreasProps) {
  const visibleAreas = areas;

  const updateArea = (index: number, area: EditableAreaDraft): void => {
    onChange(visibleAreas.map((currentArea, currentIndex) => (currentIndex === index ? area : currentArea)));
  };

  const removeArea = (index: number): void => {
    onChange(visibleAreas.filter((_, currentIndex) => currentIndex !== index));
  };

  return (
    <section className="property-areas area-form-card">
      <div className="create-section-copy">
        <strong>Områden</strong>
        <p>Skapa, ändra eller ta bort områden. Ändringarna skickas område för område när du sparar.</p>
      </div>

      <div className="create-area-list">
        {visibleAreas.map((area, index) => (
          <div className="create-area-card" key={area.id ?? index}>
            <div className="create-area-card-header">
              <strong>Område {index + 1}</strong>
              <button type="button" className="button button-danger" onClick={() => removeArea(index)}>
                Ta bort område
              </button>
            </div>

            <PropertyAreaEditor
              mode="edit"
              value={area}
              onChange={(nextArea) => updateArea(index, { ...nextArea, id: area.id })}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        className="button"
        onClick={() => onChange([...visibleAreas, createDefaultAreaDraft()])}
      >
        Lägg till område
      </button>
    </section>
  );
}
