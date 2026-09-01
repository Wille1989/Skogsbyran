import { useImageFiles } from "../data/useImageFiles";
import { useFileDropContainer } from "../data/useFileDropContainer";

import { ImageItem } from "./ImageItem";

import "./FileDropContainer.css";

type DropZoneProps = {
    imageFiles: ReturnType<typeof useImageFiles>;
    onEditExistingImage?: (imageId: string) => void;
};

export function ImageDropZone({imageFiles, onEditExistingImage}: DropZoneProps) {
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
            <label>Bilder</label>

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