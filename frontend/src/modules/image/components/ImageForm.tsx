import { useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { type ImageFormValues } from "../types/types.ts";
import { PreviewCanvas } from "./PreviewCanvas.tsx";
import "./ImageForm.css";

type FormProps = {
      imageUrl: string;
      initialValues: ImageFormValues;
      onSubmit: (data: ImageFormValues) => void | Promise<void>;
};

export function ImageForm({ onSubmit, initialValues, imageUrl }: FormProps) {
      const imageRef = useRef<HTMLImageElement>(null);
      const { register, handleSubmit, reset, watch } = useForm<ImageFormValues>({defaultValues: initialValues});

      useEffect(() => {
            reset(initialValues);
      }, [initialValues, reset]);
   
      const brightness = watch("brightness");
      const contrast = watch("contrast");
      const gamma = watch("gamma");
      const saturation = watch("saturation");

    return (
      <form id="image-form" className="form image-form" onSubmit={handleSubmit(onSubmit)}>
            <div className="image-form-preview">
                <img ref={imageRef} src={imageUrl} alt="" hidden />

                <PreviewCanvas
                    imageRef={imageRef}
                    adjustments={{
                        brightness,
                        contrast,
                        gamma,
                        saturation,
                    }}
                />
            </div>

            <div className="image-form-details">
                <div className="form-field">
                    <label htmlFor="caption">
                        Beskrivning
                    </label>

                    <input
                        type="text"
                        id="caption"
                        placeholder="Ex. Vy från väst"
                        {...register("caption")}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="altText">
                        Alternativ text
                    </label>

                    <input
                        type="text"
                        id="altText"
                        placeholder="Ex. Vy över en skogsfastighet"
                        {...register("altText")}
                    />
                </div>
            </div>

            <div className="image-form-adjustments">
                <div className="form-field">
                    <label htmlFor="brightness">
                        Ljusstyrka
                    </label>

                    <input
                        type="range"
                        id="brightness"
                        min="0"
                        max="5"
                        step="0.01"
                        {...register("brightness", {
                            valueAsNumber: true,
                        })}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="contrast">
                        Kontrast
                    </label>

                    <input
                        type="range"
                        id="contrast"
                        min="0"
                        max="5"
                        step="0.01"
                        {...register("contrast", {
                            valueAsNumber: true,
                        })}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="gamma">
                        Gamma
                    </label>

                    <input
                        type="range"
                        id="gamma"
                        min="0"
                        max="5"
                        step="0.01"
                        {...register("gamma", {
                            valueAsNumber: true,
                        })}
                    />
                </div>

                <div className="form-field">
                    <label htmlFor="saturation">
                        Mättnad
                    </label>

                    <input
                        type="range"
                        id="saturation"
                        min="0"
                        max="5"
                        step="0.01"
                        {...register("saturation", {
                            valueAsNumber: true,
                        })}
                    />
                </div>
            </div>
        </form>
    );
}
