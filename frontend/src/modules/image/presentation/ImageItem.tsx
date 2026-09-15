import type { DragEvent } from "react";
import { IconCrown, IconDotsVertical, IconGripVertical, IconPencil, IconTrash } from "@tabler/icons-react";
import type { EditableImage } from "../data/types";

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
    const source = "file" in image ? image.previewUrl : image.urls.thumbnail;
    return <div className="image-preview-item" draggable onDragStart={event => onDragStart(event, index)} onDragOver={onDragOver} onDrop={event => onDrop(event, index)}>
        <img src={source} alt={image.details.altText || `Förhandsvisning av bild ${index + 1}`} loading="lazy" decoding="async" draggable={false} />
        <span className="image-order-badge" title={`Bild ${index + 1}, dra för att ändra ordning`}><IconGripVertical size={17} /></span>
        {image.isPrimary && <span className="admin-image-primary"><IconCrown size={13} />Omslagsbild</span>}
        <details className="admin-image-menu" onClick={event => event.stopPropagation()} onDragStart={event => event.stopPropagation()}>
            <summary aria-label={`Alternativ för bild ${index + 1}`}><IconDotsVertical size={18} /></summary>
            <div>
                <button type="button" disabled={image.isPrimary} onClick={event => { onSetPrimary(index); event.currentTarget.closest("details")?.removeAttribute("open"); }}><IconCrown size={16} />Gör till omslagsbild</button>
                {!("file" in image) && onEdit && <button type="button" onClick={event => { onEdit(image.imageId); event.currentTarget.closest("details")?.removeAttribute("open"); }}><IconPencil size={16} />Redigera</button>}
                <button type="button" onClick={() => onRemove(index)}><IconTrash size={16} />Ta bort</button>
            </div>
        </details>
    </div>;
}
