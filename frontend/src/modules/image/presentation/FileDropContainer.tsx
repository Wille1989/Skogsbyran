import { useRef } from "react";
import { IconPlus } from "@tabler/icons-react";
import { useImageFiles } from "../data/useImageFiles";
import { useFileDropContainer } from "../data/useFileDropContainer";

import { ImageItem } from "./ImageItem";

import "./FileDropContainer.css";

type DropZoneProps = {
    imageFiles: ReturnType<typeof useImageFiles>;
    onEditExistingImage?: (imageId: string) => void;
};

export function ImageDropZone({imageFiles, onEditExistingImage}: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const {
        images,
        addFiles,
        reorderImages,
        removeImage,
        setPrimaryImage,
    } = imageFiles;

    const {
        onDragLeaveDeactivate,
        onDragOverActivate,
        onDropFiles,
        onDragStart,
        onDragEnd,
        onDragOver,
        onDrop,
    } = useFileDropContainer(
        addFiles,
        reorderImages
    );

    return (
        <div className="form-field-image">
            <div className="admin-card-heading"><div><h2>Bilder</h2><p>Lägg till bilder och dra dem för att ändra ordningen. Välj en omslagsbild i bildens meny.</p></div><button type="button" className="admin-button" onClick={() => inputRef.current?.click()}><IconPlus size={18} />Lägg till bilder</button></div>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden aria-label="Välj bilder" onChange={event => { addFiles(Array.from(event.target.files ?? [])); event.target.value = ""; }} />

            <div
                className="drop-zone"
                onDragLeave={onDragLeaveDeactivate}
                onDragOver={onDragOverActivate}
                onDrop={onDropFiles}
                onDragEnd={onDragEnd}
            >
                <div className="image-preview-container">
                    {images.map((image, index) => {
                        const imageKey =
                            "file" in image
                                ? image.uiId
                                : image.imageId;

                        return (
                            <ImageItem
                                key={imageKey}
                                image={image}
                                index={index}
                                onRemove={removeImage}
                                onSetPrimary={setPrimaryImage}
                                onEdit={onEditExistingImage}
                                onDragStart={onDragStart}
                                onDragOver={onDragOver}
                                onDrop={onDrop}
                            />
                        );
                    })}
                </div>

                {images.length === 0 && (
                    <p className="drop-zone-placeholder">
                        Dra och släpp bilder här
                    </p>
                )}
            </div>
        </div>
    );
}