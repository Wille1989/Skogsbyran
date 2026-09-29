import type { DragEvent } from "react";
import { IconCrown, IconPencil, IconTrash } from "@tabler/icons-react";
import type { EditableImage } from "../types/types";

type ImageItemProps = {
    image: EditableImage;
    index: number;
    onRemove: (index: number) => void;
    onSetPrimary: (index: number) => void;
    onEdit?: (imageId: string) => void;
    onDragStart: (event: DragEvent<HTMLDivElement>, index: number) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>, index: number) => void;
};

export function ImageItem({ image, index, onRemove, onSetPrimary, onEdit, onDragStart, onDragOver, onDrop }: ImageItemProps) {
    const source = "file" in image ? image.previewUrl : image.urls.medium;
    return <div className={`image-preview-item${image.isPrimary ? " is-primary" : ""}`} draggable onDragStart={event => onDragStart(event, index)} onDragOver={onDragOver} onDrop={event => onDrop(event, index)}>
        <div className="admin-image-preview"><img src={source} alt={image.details.altText || `Förhandsvisning av bild ${index + 1}`} loading="lazy" decoding="async" draggable={false} />
        {image.isPrimary && <span className="admin-image-primary"><IconCrown size={18} />Omslagsbild</span>}
        </div>
        <div className="admin-image-actions" draggable={false} onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}>
                <button type="button" className="image-action-cover" title="Gör till omslagsbild" disabled={image.isPrimary} onClick={() => onSetPrimary(index)}><IconCrown size={16} />Omslagsbild</button>
                {!("file" in image) && onEdit && <button type="button" className="image-action-edit" onClick={() => onEdit(image.imageId)}><IconPencil size={16} />Redigera</button>}
                <button type="button" className="image-action-remove" onClick={() => onRemove(index)}><IconTrash size={16} />Ta bort</button>
        </div>
    </div>;
}
