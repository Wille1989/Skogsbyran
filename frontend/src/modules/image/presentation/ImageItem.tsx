import { type DragEvent } from "react";
import { 
      type EditableImage, 
      type NewImageFile } 
from "../data/types";

type ImageItemProps = {
      image: EditableImage;
      index: number;

      onRemove: (index: number) => void;
      onSetPrimary: (index: number) => void;
      onEdit?: (imageId: string) => void;

      onDragStart: (
            event: DragEvent<HTMLDivElement>,
            index: number
      ) => void;

      onDragOver: (
            event: DragEvent<HTMLDivElement>
      ) => void;

      onDrop: (
            event: DragEvent<HTMLDivElement>,
            index: number
      ) => void;
};         

function isNewImage(image: EditableImage): image is NewImageFile {
      return "file" in image;
}

export function ImageItem({
      image,
      index,
      onRemove,
      onSetPrimary,
      onEdit,
      onDragStart,
      onDragOver,
      onDrop,
}: ImageItemProps) {
    const isNew = isNewImage(image);

    const imageSource = isNew
        ? image.previewUrl
        : image.urls.thumbnail;

    return (
        <div
            className="image-preview-item"
            draggable
            onDragStart={(event) =>
                onDragStart(event, index)
            }
            onDragOver={onDragOver}
            onDrop={(event) =>
                onDrop(event, index)
            }
        >
            <img
                src={imageSource}
                alt={
                    image.details.altText ||
                    `Förhandsvisning av bild ${index + 1}`
                }
                loading="lazy"
                decoding="async"
                draggable={false}
            />

            <span className="image-order-badge">
                #{image.position + 1}
            </span>

            <button
                type="button"
                className={`image-primary-toggle ${
                    image.isPrimary
                        ? "is-active"
                        : ""
                }`}
                onClick={() =>
                    onSetPrimary(index)
                }
                aria-pressed={image.isPrimary}
            >
                {image.isPrimary
                    ? "Primär"
                    : "Välj till primär"}
            </button>

            {!isNew && onEdit && (
                <button
                    type="button"
                    className="image-action image-edit"
                    onClick={() =>
                        onEdit(image.imageId)
                    }
                    aria-label={`Redigera bild ${index + 1}`}
                >
                    E
                </button>
            )}

            <button
                type="button"
                className="image-action image-remove"
                onClick={() =>
                    onRemove(index)
                }
                aria-label={`Ta bort bild ${index + 1}`}
            >
                ×
            </button>
        </div>
    );
}