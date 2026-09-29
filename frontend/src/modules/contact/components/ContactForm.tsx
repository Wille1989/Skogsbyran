import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApiError } from '@/shared/api/apiFetch';
import { sendContact, type ContactValues } from '../api/api';

export function ContactForm() {
    const confirmation = useRef<HTMLDialogElement>(null);
    const [feedback, setFeedback] = useState<{ message: string; failed: boolean } | null>(null);
    const sending = useRef(false);
    const { register, handleSubmit, reset, setError, watch, formState: { errors, isSubmitting } } = useForm<ContactValues>({
        defaultValues: { name: '', email: '', phone: '', message: '', website: '' },
    });
    const lettersRemaining = Math.max(0, 10 - (watch('message').match(/\p{L}/gu)?.length ?? 0));

    async function submit(values: ContactValues) {
        if (sending.current) return;
        sending.current = true;
        setFeedback(null);

        try {
            const response = await sendContact(values);
            reset();
            setFeedback({ message: response.message, failed: false });
            confirmation.current?.showModal();
        } catch (error) {
            if (error instanceof ApiError && error.status === 422) {
                const details = error.details;
                if (typeof details === 'object' && details !== null && 'errors' in details
                    && typeof details.errors === 'object' && details.errors !== null) {
                    const fields = details.errors;
                    for (const field of ['name', 'email', 'phone', 'message'] as const) {
                        if (field in fields) {
                            const messages: unknown = fields[field as keyof typeof fields];
                            if (Array.isArray(messages) && typeof messages[0] === 'string') {
                                setError(field, { type: 'server', message: messages[0] });
                            }
                        }
                    }
                }
            }
            const message = error instanceof ApiError && error.status === 429
                ? 'Du har gjort för många försök. Vänta en stund och försök igen.'
                : error instanceof ApiError && error.status === 422
                    ? 'Kontrollera uppgifterna i formuläret och försök igen.'
                    : 'Vi kunde inte bekräfta att meddelandet skickades. Försök igen senare eller kontakta oss via telefon eller e-post.';
            setFeedback({ message, failed: true });
        } finally {
            sending.current = false;
        }
    }

    return (
        <form className="form contact-form" noValidate aria-busy={isSubmitting} onChange={() => setFeedback(null)} onSubmit={handleSubmit(submit)}>
            <div className="form-field">
                <label htmlFor="contact-name">Namn (obligatoriskt)</label>
                <input maxLength={120} readOnly={isSubmitting} id="contact-name" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined}
                    {...register('name', { validate: value => Boolean(value.trim()) || 'Ange ditt namn.' })} />
                {errors.name && <p id="contact-name-error" className="form-error" role="alert">{errors.name.message}</p>}
            </div>
            <p id="contact-method-hint">Ange e-postadress och/eller telefonnummer.</p>
            <div className="form-field">
                <label htmlFor="contact-email">E-postadress</label>
                <input maxLength={254} readOnly={isSubmitting} id="contact-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={`contact-method-hint${errors.email ? ' contact-email-error' : ''}`}
                    {...register('email', {
                        deps: ['phone'],
                        validate: (value, values) => {
                            if (!value.trim() && !values.phone.trim()) return 'Ange e-postadress eller telefonnummer.';
                            return !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Ange en giltig e-postadress.';
                        },
                    })} />
                {errors.email && <p id="contact-email-error" className="form-error" role="alert">{errors.email.message}</p>}
            </div>
            <div className="form-field">
                <label htmlFor="contact-phone">Telefon</label>
                <input maxLength={50} readOnly={isSubmitting} id="contact-phone" type="tel" autoComplete="tel" aria-invalid={Boolean(errors.phone)} aria-describedby={`contact-method-hint${errors.phone ? ' contact-phone-error' : ''}`} {...register('phone', {
                        deps: ['email'],
                        validate: (value, values) => {
                            if (!value.trim() && !values.email.trim()) return 'Ange e-postadress eller telefonnummer.';
                            return !value.trim() || /^[0-9+() .-]{5,50}$/.test(value.trim()) || 'Ange ett giltigt telefonnummer.';
                        },
                    })} />
            </div>
            {errors.phone && <p id="contact-phone-error" className="form-error" role="alert">{errors.phone.message}</p>}
            <div className="form-field">
                <label htmlFor="contact-message">Meddelande (obligatoriskt)</label>
                <textarea id="contact-message" rows={4} maxLength={5000} required readOnly={isSubmitting} aria-invalid={Boolean(errors.message)} aria-describedby={`contact-message-count${errors.message ? ' contact-message-error' : ''}`} {...register('message', {
                    validate: value => (value.match(/\p{L}/gu)?.length ?? 0) >= 10 || 'Skriv ett meddelande med minst 10 bokstäver.',
                    maxLength: { value: 5000, message: 'Meddelandet får innehålla högst 5000 tecken.' },
                })} />
                <small id="contact-message-count" className="contact-message-count" role="status">{lettersRemaining > 0 ? `${lettersRemaining} bokstäver kvar innan du kan skicka` : 'Minst 10 bokstäver – klart att skicka'}</small>
            </div>
            {errors.message && <p id="contact-message-error" className="form-error" role="alert">{errors.message.message}</p>}
            <div className="contact-honeypot" aria-hidden="true">
                <label htmlFor="contact-website">Lämna detta fält tomt</label>
                <input id="contact-website" tabIndex={-1} autoComplete="off" {...register('website')} />
            </div>
            <div className="form-actions"><button type="submit" className="form-submit" disabled={isSubmitting}>{isSubmitting ? 'Skickar…' : 'Skicka meddelande'}</button></div>
            {feedback && <p className={feedback.failed ? 'form-error' : undefined} role={feedback.failed ? 'alert' : 'status'}>{feedback.message}</p>}
            <dialog ref={confirmation} className="contact-confirmation" aria-labelledby="contact-confirmation-title" aria-describedby="contact-confirmation-description" onClose={event => event.stopPropagation()}>
                <span className="contact-confirmation-icon" aria-hidden="true">✓</span>
                <h2 id="contact-confirmation-title">Tack för ditt meddelande!</h2>
                <p id="contact-confirmation-description">Ditt meddelande har skickats. Vi återkommer så snart vi kan.</p>
                <button type="button" className="contact-close" autoFocus onClick={() => confirmation.current?.close()}>Stäng</button>
            </dialog>
        </form>
    );
}
