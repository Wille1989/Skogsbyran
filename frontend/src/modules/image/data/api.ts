import { baseURL } from "@/shared/data/baseURL.ts";
import { apiFetch, apiUpload } from "@/shared/data/apiFetch.ts";
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

export async function uploadImages({propertyId, images, onProgress, onBatchSaved}: UploadImagesInput): Promise<ImageFile[]> {
      onProgress?.({ fraction: 0, title: "Förbereder " + images.length + " bilder", detail: "Delar upp bilderna i bildserier." });
      const batches = batchImages(images);
      const totalBytes = images.reduce((sum, image) => sum + image.file.size, 0);
      let confirmedBytes = 0;
      let confirmedImages = 0;
      let uploaded: ImageFile[] = [];
      const megabytes = (bytes: number) => (bytes / (1024 * 1024)).toLocaleString("sv-SE", { maximumFractionDigits: 1 });
      for (const [index, batch] of batches.entries()) {
            const batchBytes = batch.reduce((sum, image) => sum + image.file.size, 0);
            const series = "Bildserie " + (index + 1) + " av " + batches.length + " · " + batch.length + " bilder";
            const fraction = (bytes: number) => totalBytes ? bytes / totalBytes : index / batches.length;
            onProgress?.({ fraction: fraction(confirmedBytes), title: "Paketerar bilder", detail: series });
            const body = buildUploadFormData(batch);
            onProgress?.({ fraction: fraction(confirmedBytes), title: "Laddar upp bilder", detail: series + " · " + confirmedImages + " av " + images.length + " bilder sparade" });
            // Multipart progress includes field overhead; map its fraction onto the
            // batch's file bytes. Reserve 5% for server acknowledgement per batch.
            uploaded = await apiUpload<ImageFile[]>(
                  baseURL + "/property/" + propertyId + "/images", body, progress => {
                        const ratio = progress.sent ? 1 : progress.total ? Math.min(1, progress.loaded / progress.total) : 0;
                        const bytes = confirmedBytes + batchBytes * ratio;
                        onProgress?.({ fraction: fraction(confirmedBytes + batchBytes * ratio * 0.95),
                              title: progress.sent ? "Bearbetar bilder" : "Laddar upp bilder",
                              detail: series + " · " + (progress.sent ? "Filerna är skickade. Väntar på att bilderna sparas." : progress.total ? megabytes(bytes) + " av " + megabytes(totalBytes) + " MB skickade" : megabytes(progress.loaded) + " MB skickade i denna bildserie; total storlek saknas.") });
                  });
            if (!Array.isArray(uploaded)) throw new Error("Invalid image collection response");
            confirmedBytes += batchBytes;
            confirmedImages += batch.length;
            onBatchSaved?.("Bildserie " + (index + 1) + " av " + batches.length + " sparad (" + batch.length + " bilder)");
            onProgress?.({ fraction: totalBytes ? confirmedBytes / totalBytes : (index + 1) / batches.length,
                  title: "Bilder sparade", detail: confirmedImages + " av " + images.length + " bilder sparade" });
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
