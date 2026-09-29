import { PublicationFields } from "./PublicationFields";
import { localDateTime, publicationPayload } from "../helpers/publication";
import { useEffect, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { type FormDetails } from '../types/types';
import './DetailsForm.css';

type FormProps = {
        initialValues?: FormDetails;
        cover?: ReactNode;
        isSaving?: boolean;
        serverErrors?: Record<string, string>;
        onSubmit: (data: FormDetails) => void;
};

const defaultValues: FormDetails = {
        title: '',
        caption: '',
        price: '',
        size: '',
        slug: '',
        listingStatus: 'available',
        isVisible: false,
        publishAt: null,
        scheduledListingStatus: null,
        scheduledStatusAt: null,
};

export function DetailsForm({ initialValues, onSubmit, cover, isSaving = false, serverErrors }: FormProps) {
        const {register, handleSubmit, reset, control, setValue, setError, clearErrors, formState: { errors }, } = useForm<FormDetails>({defaultValues});

        useEffect(() => {
                if (initialValues) {
                        reset({ ...initialValues, publishAt: localDateTime(initialValues.publishAt), scheduledStatusAt: localDateTime(initialValues.scheduledStatusAt) });
                }
        }, [initialValues, reset]);

        useEffect(() => {
                if (!serverErrors) return;
                for (const [field, message] of Object.entries(serverErrors)) {
                        if (field in defaultValues) setError(field as keyof FormDetails, { type: "server", message });
                }
        }, [serverErrors, setError]);


        return (
        <form id="property-form" onSubmit={handleSubmit(values => {
                clearErrors("root");
                try { onSubmit(publicationPayload(values, false)); }
                catch (error) { setError("root", { message: error instanceof Error ? error.message : "Kontrollera schemaläggningen." }); }
        })} className="form details-form">
                {Object.keys(errors).length > 0 && <div className="form-error" role="alert">
                        <strong>Fastigheten kunde inte sparas. Rätta följande:</strong>
                        <ul>{Object.entries(errors).map(([field, error]) => <li key={field}>{error.message}</li>)}</ul>
                        <p>Dina uppgifter finns kvar i formuläret.</p>
                </div>}
                <div className="form-grid">
                        <div className="form-column">
                                <div className="form-field">
                                        <label htmlFor="title">Fastighetens titel</label>
                                        <input
                                                id="title"
                                                placeholder="Ex. Skogsgård i Dalarna"
                                                aria-invalid={errors.title ? "true" : "false"}
                                                aria-describedby={errors.title ? "details-title-error" : undefined}
                                                {...register("title", { required: "Skriv en titel för fastigheten.", maxLength: { value: 150, message: "Titeln får vara högst 150 tecken." }})}
                                        />
                                        {errors.title ? (
                                                <p id="details-title-error" className="form-error" role="alert">
                                                        {errors.title.message}
                                                </p>
                                        ) : null}
                                </div>

                                <div className="form-field">
                                        <label htmlFor="price">Pris (SEK)</label>
                                        <input
                                                id="price"
                                                aria-invalid={!!errors.price}
                                                aria-describedby={errors.price ? "price-error" : undefined}
                                                inputMode="numeric"
                                                placeholder="Ex. 3 500 000"
                                                {...register("price", { validate: value => !value || /^\d[\d\s]*$/.test(value.trim()) || "Pris: skriv hela kronor, till exempel 3 500 000. Använd inte bokstäver, minus eller decimaler." })}
                                        />
                                        {errors.price && <p id="price-error" className="form-error">{errors.price.message}</p>}
                                </div>

                                <div className="form-field">
                                         <label htmlFor="size">Storlek (hektar)</label>
                                        <input
                                                id="size"
                                                aria-invalid={!!errors.size}
                                                aria-describedby={errors.size ? "size-error" : undefined}
                                                inputMode="decimal"
                                                placeholder="Ex. 135"
                                                {...register("size", { validate: value => !value || /^\d+(?:[,.]\d+)?$/.test(value.replace(/\s/g, "")) || "Areal: skriv antal hektar, till exempel 135 eller 12,5. Använd inte bokstäver eller minus." })}
                                        />
                                        {errors.size && <p id="size-error" className="form-error">{errors.size.message}</p>}
                                </div>

                                <div className="form-field">
                                        <label htmlFor="caption">Fastighetsbeskrivning</label>
                                        <textarea
                                                id="caption"
                                                rows={15}
                                                maxLength={700}
                                                placeholder="Beskriv fastigheten här"
                                                {...register("caption", { maxLength: { value: 700, message: "Beskrivningen får innehålla högst 700 tecken." } })}
                                        />
                                        {errors.caption && <p className="form-error" role="alert">{errors.caption.message}</p>}
                                </div>
                        </div>
                        <aside className="admin-details-side"><PublicationFields control={control} setValue={setValue} cover={cover} /></aside>
                </div>
                {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
                <div className="publication-save-actions">
                    <button className="admin-button" type="submit" disabled={isSaving}>Spara fastigheten</button>
                </div>
        </form>
        );
}
