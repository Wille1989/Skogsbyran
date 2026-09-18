import { PublicationFields } from "./PublicationFields";
import { listingStatusOptions, localDateTime, publicationPayload } from "./publication";
import { useEffect, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { type FormDetails } from './types';
import './Form.css';

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

        const isVisible = useWatch({ control, name: "isVisible" });

        return (
        <form id="property-form" onSubmit={handleSubmit((values, event) => {
                clearErrors("root");
                const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter;
                const publishNow = submitter instanceof HTMLButtonElement && submitter.value === "publish";
                try { onSubmit(publicationPayload(values, publishNow)); }
                catch (error) { setError("root", { message: error instanceof Error ? error.message : "Kontrollera schemaläggningen." }); }
        })} className="form details-form">
                <div className="form-grid">
                        <div className="form-column">
                                <div className="form-field">
                                        <label htmlFor="title">Fastighetens titel</label>
                                        <input
                                                id="title"
                                                placeholder="Ex. Skogsgård i Dalarna"
                                                aria-invalid={errors.title ? "true" : "false"}
                                                aria-describedby={errors.title ? "details-title-error" : undefined}
                                                {...register("title", { required: "Titel krävs"})}
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
                                                placeholder="Ex. 3 500 000"
                                                {...register("price")}
                                        />
                                </div>

                                <div className="form-field">
                                         <label htmlFor="size">Storlek (hektar)</label>
                                        <input
                                                id="size"
                                                aria-invalid={!!errors.size}
                                                placeholder="Ex. 135"
                                                {...register("size")}
                                        />
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
                        <aside className="admin-details-side">                                <div className="form-field">
                                        <label htmlFor="listingStatus">Status</label>
                                        <select
                                                id="listingStatus"
                                                {...register("listingStatus", { required: "Status krävs" })}
                                        >
                                                {listingStatusOptions.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                                {option.label}
                                                        </option>
                                                ))}
                                        </select>
                                </div>

                                <p className="admin-status-hint">Status, publicering och schemaläggning sparas med fastigheten.</p>
                                <PublicationFields control={control} setValue={setValue} cover={cover} /></aside>
                </div>
                {errors.root && <p className="form-error" role="alert">{errors.root.message}</p>}
                <div className="publication-save-actions">
                    <button className="admin-button" type="submit" disabled={isSaving}>Spara</button>
                    {!isVisible && <button className="admin-button is-primary" type="submit" name="intent" value="publish" disabled={isSaving}>Spara och publicera</button>}
                </div>
        </form>
        );
}
