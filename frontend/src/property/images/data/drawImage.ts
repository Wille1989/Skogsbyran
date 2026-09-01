import { type ImageAdjustments } from "./types.ts";

export function drawImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement, adjustments: ImageAdjustments): void {
      const { brightness, contrast, saturation } = adjustments;
      const { width, height } = ctx.canvas;

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      ctx.filter = `
      brightness(${brightness})
      contrast(${contrast})
      saturate(${saturation})
      `;

      ctx.drawImage(img, 0, 0, width, height);

      ctx.restore();
}