import { baseURL } from "@/shared/data/baseURL.ts";
import {  apiFetch } from "@/shared/data/apiFetch.ts";
import {
      type DeleteImagesInput,
      type ImageFile,
      type NewImageFile,
      type UpdateImagesInput,
      type UploadImagesInput,
} from "./types.ts";

const IMAGE_UPLOAD_BATCH_MAX_BYTES = 6 * 1024 * 1024;

function batchImages(images: NewImageFile[]): NewImageFile[][] {
      const batches: NewImageFile[][] = [];
      let batch: NewImageFile[] = [];
      let bytes = 0;

      for (const image of images) {
            if (batch.length > 0 && bytes + image.file.size > IMAGE_UPLOAD_BATCH_MAX_BYTES) {
                  batches.push(batch);
                  batch = [];
                  bytes = 0;
            }
            batch.push(image);
            bytes += image.file.size;
      }

      if (batch.length > 0) batches.push(batch);
      return batches;
}

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

export async function uploadImages({propertyId, images}: UploadImagesInput): Promise<ImageFile[]> {
      let uploaded: ImageFile[] = [];
      for (const batch of batchImages(images)) {
            // Each response contains the property's complete image collection.
            uploaded = await apiFetch<ImageFile[]>(`${baseURL}/property/${propertyId}/images`, {
                  method: "POST",
                  body: buildUploadFormData(batch)
            });
      }
      return uploaded;
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
