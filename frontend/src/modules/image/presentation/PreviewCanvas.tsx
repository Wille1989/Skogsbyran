import { drawImage } from "../data/drawImage.ts";
import { useEffect, useRef, type RefObject } from "react";
import { type ImageAdjustments } from "../data/types.ts";

type PreviewCanvasProps = {
    imageRef: RefObject<HTMLImageElement | null>;
    adjustments: ImageAdjustments;
}

export function PreviewCanvas({ imageRef, adjustments }: PreviewCanvasProps) {
      const canvasRef = useRef<HTMLCanvasElement>(null);

      useEffect(() => {
            const canvas = canvasRef.current;
            const img = imageRef.current;

            if (!canvas || !img) return;

            const draw = (): void => {
                  if (img.naturalWidth === 0 || img.naturalHeight === 0) {
                        return;
                  }

                  canvas.width = img.naturalWidth;
                  canvas.height = img.naturalHeight;

                  const ctx = canvas.getContext("2d");

                  if (!ctx) return;

                  drawImage(ctx, img, adjustments);
            };

            if (img.complete) {
                  draw();
                  return;
            }

            img.addEventListener("load", draw);

            return () => {
                  img.removeEventListener("load", draw);
            };

      },[adjustments, imageRef])

      return <canvas ref={canvasRef} className="image-preview-canvas"/>;
}