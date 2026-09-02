import { createPortal } from "react-dom";
import { useId } from "react";
import { ImageForm } from "./Form";
import { useUpdateImagesMutation } from "../data/mutations.ts";
import {
    type ImageFile,
    type ImageFormValues,
} from "../data/types.ts";

type ImageEditDialogProps = {
    propertyId: string;
    image: ImageFile;
    onClose: () => void;
};

export function ImageEditDialog({propertyId, image, onClose}: ImageEditDialogProps) {
    const dialogTitleId = useId();
    const updateImages = useUpdateImagesMutation();

    const initialValues: ImageFormValues = {
        ...image.details,
        ...image.adjustments,
    };

    const handleSubmit = (values: ImageFormValues): void => {
        updateImages.mutate(
            {
                propertyId,
                images: [
                    {
                        imageId: image.imageId,
                        details: {
                            caption: values.caption,
                            altText: values.altText,
                        },

                        adjustments: {
                            brightness: values.brightness,
                            saturation: values.saturation,
                            contrast: values.contrast,
                            gamma: values.gamma,
                        },
                    },
                ],
            },
            {
                onSuccess: onClose,
            }
        );
    };

    return createPortal(
        <div className="image-edit-overlay" onClick={onClose} role="presentation">
            <div className="image-edit-dialog" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId} onClick={(event) => event.stopPropagation()}>
                <header className="image-edit-header">
                    <h2 id={dialogTitleId}>
                        Redigera bild
                    </h2>

                    <button type="button" className="image-edit-close" onClick={onClose} aria-label="Stäng bildredigering">
                        ×
                    </button>
                </header>

                <ImageForm
                    imageUrl={image.urls.large}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                />

                {updateImages.error instanceof Error && (
                    <p className="form-error" role="alert">
                        {updateImages.error.message}
                    </p>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        form="image-form"
                        className="form-submit"
                        disabled={updateImages.isPending}
                    >
                        {updateImages.isPending
                            ? "Sparar..."
                            : "Spara bild"}
                    </button>
                </div>
            </div>
        </div>,

        document.body
    );
}
