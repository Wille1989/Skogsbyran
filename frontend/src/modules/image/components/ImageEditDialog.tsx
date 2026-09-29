import { createPortal } from "react-dom";
import "./ImageEditDialog.css";
import { useEffect, useRef, useId, useMemo } from "react";
import { ImageForm } from "./ImageForm";
import { useUpdateImagesMutation } from "../hooks/mutations.ts";
import {
    type ImageFile,
    type ImageFormValues,
} from "../types/types.ts";

type ImageEditDialogProps = {
    propertyId: string;
    image: ImageFile;
    onClose: () => void;
};

export function ImageEditDialog({propertyId, image, onClose}: ImageEditDialogProps) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    useEffect(() => {
        const dialog = dialogRef.current;
        const previousFocus = document.activeElement;
        const overflow = document.body.style.overflow;
        dialog?.showModal();
        document.body.style.overflow = "hidden";
        return () => {
            dialog?.close();
            document.body.style.overflow = overflow;
            if (previousFocus instanceof HTMLElement) previousFocus.focus();
        };
    }, []);
    const dialogTitleId = useId();
    const updateImages = useUpdateImagesMutation();

    const initialValues = useMemo<ImageFormValues>(() => ({
        ...image.details,
        ...image.adjustments,
    }), [image.details, image.adjustments]);

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
        <dialog ref={dialogRef} className="image-edit-dialog" aria-labelledby={dialogTitleId}
            onCancel={event => { event.preventDefault(); if (!updateImages.isPending) onClose(); }}>
                <header className="image-edit-header">
                    <h2 id={dialogTitleId}>
                        Redigera bild
                    </h2>

                    <button type="button" className="image-edit-close" autoFocus disabled={updateImages.isPending} onClick={onClose} aria-label="Stäng bildredigering">
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
                    <button type="reset" form="image-form" className="image-edit-reset" disabled={updateImages.isPending}>Ångra ändringar</button>
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
        </dialog>,

        document.body
    );
}
