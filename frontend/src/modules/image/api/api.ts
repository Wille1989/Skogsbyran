import { baseURL } from "@/shared/config/baseURL.ts";
import { ApiError, apiFetch, apiUpload } from "@/shared/api/apiFetch.ts";
import {
      type DeleteImagesInput,
      type ImageFile,
      type NewImageFile,
      type UpdateImagesInput,
      type UploadImagesInput,
} from "../types/types.ts";

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
      // Matches upload_max_filesize in backend/Dockerfile; check all files before sending a batch.
      const oversized = images.filter(image => image.file.size > 20 * 1024 * 1024);
      if (oversized.length) {
            throw new ApiError("Bilderna är för stora.", 422, { errors: Object.fromEntries(oversized.map(image => [
                  image.file.name,
                  [`Bilden är ${(image.file.size / (1024 * 1024)).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} MB. Högst 20 MB per bild tillåts. Minska bildens storlek och välj den igen.`],
            ])) });
      }
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
                  }).catch((error: unknown) => {
                        if (!(error instanceof ApiError)) throw error;
                        const errors: Record<string, string[]> = {};
                        if (error.status === 422 && typeof error.details === "object" && error.details !== null && "errors" in error.details) {
                              const validation = error.details.errors;
                              if (typeof validation === "object" && validation !== null) for (const [key, messages] of Object.entries(validation)) {
                                    const image = batch[Number(key.split(".")[1])];
                                    const label = image ? image.file.name : "Bilder";
                                    const text = (Array.isArray(messages) ? messages : [messages]).filter(message => typeof message === "string").join(" ");
                                    errors[label + " · " + key] = [key.endsWith(".file")
                                          ? "Bilden kunde inte godkännas. Välj en fungerande JPG-, PNG- eller WebP-bild på högst 20 MB. Serverns besked: " + text
                                          : text];
                              }
                        }
                        if (error.status === 413) {
                              errors["Bildserie " + (index + 1)] = ["Servern avvisade uppladdningen som för stor. Minska filstorleken. Berörda filer: " + batch.map(image => image.file.name).join(", ")];
                        }
                        throw new ApiError(error.message, error.status, { errors, files: batch.map(image => ({ name: image.file.name, bytes: image.file.size })) });
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
