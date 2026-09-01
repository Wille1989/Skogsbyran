import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { type FormDetails, type ListingStatus } from './types';
import './Form.css';

type FormProps = {
        initialValues?: FormDetails;
        onSubmit: (data: FormDetails) => void;
};

const defaultValues: FormDetails = {
        title: '',
        caption: '',
        price: '',
        size: '',
        slug: '',
        listingStatus: 'available',
        isVisible: true
};

const listingStatusOptions: Array<{ value: ListingStatus; label: string }> = [
        { value: 'upcoming', label: 'Kommande' },
        { value: 'available', label: 'Till salu' },
        { value: 'bidding', label: 'Budgivning' },
        { value: 'reserved', label: 'Reserverad' },
        { value: 'sold', label: 'Såld' },
];

export function DetailsForm({ initialValues, onSubmit }: FormProps) {
        const {register, handleSubmit, reset, formState: { errors }, } = useForm<FormDetails>({defaultValues});

        useEffect(() => {
                if (initialValues) {
                        reset(initialValues ?? defaultValues);
                }
        }, [initialValues, reset]);

        return (
        <form id="property-form" onSubmit={handleSubmit(onSubmit)} className="form details-form">
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
                                                placeholder="Ex. 3 500 000"
                                                {...register("price")}
                                        />
                                </div>

                                <div className="form-field">
                                         <label htmlFor="size">Storlek (hektar)</label>
                                        <input
                                                id="size"
                                                placeholder="Ex. 135"
                                                {...register("size")}
                                        />
                                </div>

                                <div className="form-field">
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

                                <div className="form-field form-field-checkbox">
                                        <input
                                                id="isVisible"
                                                type="checkbox"
                                                {...register("isVisible")}
                                        />
                                        <label htmlFor="isVisible">Synlig publikt</label>
                                </div>

                                <div className="form-field">
                                        <label htmlFor="caption">Fastighetsbeskrivning</label>
                                        <textarea
                                                id="caption"
                                                rows={15}
                                                placeholder="Beskriv fastigheten här"
                                                {...register("caption")}
                                        />
                                </div>
                        </div>
                </div>
        </form>
        );
}
