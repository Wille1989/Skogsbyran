import { useState } from 'react';
import { useForm } from 'react-hook-form';

type ContactValues = { name: string; email: string; phone: string; message: string };

export function ContactForm() {
  const [validated, setValidated] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ContactValues>({
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  return (
    <form className="form contact-form" noValidate onChange={() => setValidated(false)} onSubmit={handleSubmit(() => setValidated(true))}>
      <p>Det går ännu inte att skicka formuläret. Kontakta oss gärna via telefon eller e-post nedan.</p>
      <div className="form-field">
        <label htmlFor="contact-name">Namn (obligatoriskt)</label>
        <input id="contact-name" autoComplete="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'contact-name-error' : undefined}
          {...register('name', { validate: value => Boolean(value.trim()) || 'Ange ditt namn.' })} />
        {errors.name && <p id="contact-name-error" className="form-error" role="alert">{errors.name.message}</p>}
      </div>
      <p id="contact-method-hint">Ange e-postadress och/eller telefonnummer.</p>
      <div className="form-field">
        <label htmlFor="contact-email">E-postadress</label>
        <input id="contact-email" type="email" autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={`contact-method-hint${errors.email ? ' contact-email-error' : ''}`}
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
        <input id="contact-phone" type="tel" autoComplete="tel" aria-describedby="contact-method-hint" {...register('phone', { deps: ['email'] })} />
      </div>
      <div className="form-field">
        <label htmlFor="contact-message">Meddelande (valfritt)</label>
        <textarea id="contact-message" rows={4} {...register('message')} />
      </div>
      <div className="form-actions"><button type="submit" className="form-submit">Kontrollera uppgifter</button></div>
      {validated && <p role="status">Uppgifterna är korrekt ifyllda. Inget har skickats eller sparats.</p>}
    </form>
  );
}
