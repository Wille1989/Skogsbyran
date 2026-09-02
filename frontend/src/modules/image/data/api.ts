import { baseURL } from "@/shared/data/baseURL.ts";
import {  apiFetch } from "@/shared/data/apiFetch.ts";
import {
      type DeleteImagesInput,
      type ImageFile,
      type NewImageFile,
      type UpdateImagesInput,
      type UploadImagesInput,
} from "./types.ts";

export function buildUploadFormData(images: NewImageFile[]): FormData {
      const formData = new FormData();

      images.forEach((image, index) => {
            formData.append(`images[${index}][file]`, image.file);
            formData.append(`images[${index}][position]`, String(image.position));
            formData.append(`images[${index}][isPrimary]`, image.isPrimary ? "1" : "0" );
            formData.append(`images[${index}][details]`, JSON.stringify(image.details));
            formData.append(`images[${index}][adjustments]`, JSON.stringify(image.adjustments));
      });

      return formData;
}

export function uploadImages({propertyId, images}: UploadImagesInput): Promise<ImageFile[]> {
      return apiFetch<ImageFile[]>(`${baseURL}/property/${propertyId}/images`, {
            method: "POST",
            body: buildUploadFormData(images)
      })
}

export function updateImages({propertyId, images}: UpdateImagesInput): Promise<ImageFile[]>  {
      return apiFetch<ImageFile[]>(`${baseURL}/property/${propertyId}/images`, {
            method: "PATCH",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ images })
      })
}

export function deleteImages({propertyId, imageIds}: DeleteImagesInput): Promise<void> {
      return apiFetch<void>(`${baseURL}/property/${propertyId}/images`, {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ imageIds })
      });
}
