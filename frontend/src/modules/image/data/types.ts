export type ImageResizeOptions = {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: string;
};

export type ImageFormValues = ImageDetails & ImageAdjustments;

export type ImageDetails = {
    caption: string;
    altText: string;
};

export type ImageAdjustments = {
    brightness: number;
    saturation: number;
    contrast: number;
    gamma: number;
};

export type ImageFile = {
    imageId: string;
    urls: ImageUrls;
    position: number;
    isPrimary: boolean;
    details: ImageDetails;
    adjustments: ImageAdjustments;
    createdAt?: string;
    updatedAt?: string;
};

export type NewImageFile = {
    uiId: string;
    file: File;
    previewUrl: string;
    position: number;
    isPrimary: boolean;
    details: ImageDetails;
    adjustments: ImageAdjustments;
};

export type UpdateImagesInput = {
    propertyId: string;
    images: UpdateImageInput[];
};

export type UploadImagesInput = {
    propertyId: string;
    images: NewImageFile[];
};

export type DeleteImagesInput = {
    propertyId: string;
    imageIds: string[];
};

export type UpdateImageInput = {
    imageId: string;
    position?: number;
    isPrimary?: boolean;
    details?: Partial<ImageDetails>;
    adjustments?: Partial<ImageAdjustments>;
};

type ImageUrls = {
      thumbnail: string;
      medium: string;
      large: string;
}

export type ImageChanges = {
    newImages: NewImageFile[];
    updatedImages: UpdateImageInput[];
    removedImageIds: string[];
};

export type EditableImage = ImageFile | NewImageFile;