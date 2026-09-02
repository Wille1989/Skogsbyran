import {
    useEffect,
    useReducer,
    useRef,
} from "react";
import {
    imageReducer,
    type EditableImage,
} from "./imageReducer.ts";
import {
    type ImageAdjustments,
    type ImageChanges,
    type ImageDetails,
    type ImageFile,
    type NewImageFile,
    type UpdateImageInput,
} from "./types";

const DEFAULT_DETAILS: ImageDetails = {
    caption: "",
    altText: "Bild på objekt",
};

const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
    brightness: 1,
    saturation: 1,
    contrast: 1,
    gamma: 1,
};

function isNewImage(image: EditableImage): image is NewImageFile {
    return "file" in image;
}

function buildUpdate(original: ImageFile, current: ImageFile): UpdateImageInput | null {
    const update: UpdateImageInput = { imageId: current.imageId };

    if (original.position !== current.position) {
        update.position = current.position;
    }

    if (original.isPrimary !== current.isPrimary) {
        update.isPrimary = current.isPrimary;
    }

    if (JSON.stringify(original.details) !== JSON.stringify(current.details)) {
        update.details = current.details;
    }

    if (JSON.stringify(original.adjustments) !== JSON.stringify(current.adjustments)) {
        update.adjustments = current.adjustments;
    }

    return Object.keys(update).length > 1 ? update : null;
}

export function useImageFiles() {
    const [images, dispatch] = useReducer(imageReducer, []);
    const initialImagesRef = useRef<ImageFile[]>([]);
    const previewUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const previewUrls = previewUrlsRef.current;

        return () => {
            previewUrls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, []);

    function initializeImages(existingImages: ImageFile[]): void {
        previewUrlsRef.current.forEach((url) => {
            URL.revokeObjectURL(url);
        });
        previewUrlsRef.current.clear();
        initialImagesRef.current = structuredClone(existingImages);
        dispatch({
            type: "INITIALIZE",
            images: existingImages,
        });
    }

    function addFiles(files: File[]): void {
        const startPosition = images.length;
        const newImages: NewImageFile[] = files.map((file, index) => {
            const previewUrl = URL.createObjectURL(file);
            previewUrlsRef.current.add(previewUrl);

            return {
                uiId: crypto.randomUUID(),
                file,
                previewUrl,
                position: startPosition + index,
                isPrimary: false,
                details: {
                    ...DEFAULT_DETAILS,
                },
                adjustments: {
                    ...DEFAULT_ADJUSTMENTS,
                },
            };
        });

        dispatch({
            type: "ADD",
            images: newImages,
        });
    }

    function removeImage(index: number): void {
        const image = images[index];

        if (!image) return;

        if (isNewImage(image)) {
            URL.revokeObjectURL(image.previewUrl);
            previewUrlsRef.current.delete(image.previewUrl);
        }

        dispatch({
            type: "REMOVE",
            index,
        });
    }

    function clearImages(): void {
        images.filter(isNewImage).forEach((image) => {
            URL.revokeObjectURL(image.previewUrl);
            previewUrlsRef.current.delete(image.previewUrl);
        });

        dispatch({
            type: "CLEAR",
        });
    }

    function buildChanges(): ImageChanges {
        const newImages = images.filter(isNewImage);
        const existingImages = images.filter((image): image is ImageFile => !isNewImage(image));
        const removedImageIds = initialImagesRef.current
            .filter((original) => !existingImages.some((image) => image.imageId === original.imageId))
            .map((image) => image.imageId);

        const updatedImages = existingImages.flatMap((image) => {
            const original = initialImagesRef.current.find((item) => item.imageId === image.imageId);

            if (!original) return [];

            const update = buildUpdate(original, image);
            return update ? [update] : [];
        });

        return { newImages, updatedImages, removedImageIds };
    }

    function reorderImages(from: number, to: number): void {
        dispatch({
            type: "REORDER",
            from,
            to,
        });
    }

    function setPrimaryImage(index: number): void {
        dispatch({
            type: "SET_PRIMARY",
            index,
        });
    }

    return {
        images,
        initializeImages,
        addFiles,
        removeImage,
        clearImages,
        reorderImages,
        setPrimaryImage,
        buildChanges,
    };
}
