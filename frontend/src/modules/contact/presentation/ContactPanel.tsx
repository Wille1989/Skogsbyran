import { useRef, useState } from 'react';
import { ContactForm } from './ContactForm';
import './ContactPanel.css';

export function ContactPanel() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  function close() {
    dialog.current?.close();
  }

  return (
    <aside className="sticky-contact" aria-label="Kontakt">
      <button
        ref={trigger} type="button" className="contact-trigger"
        aria-expanded={open} aria-controls="contact-panel" aria-haspopup="dialog"
        onClick={() => { dialog.current?.showModal(); setOpen(true); }}
      >
        Kontakta oss <span aria-hidden="true">＋</span>
      </button>
      <dialog
        ref={dialog} id="contact-panel" className="contact-panel"
        aria-labelledby="contact-panel-title"
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
      >
        <div className="contact-panel-heading">
          <h2 id="contact-panel-title">Kontakta oss</h2>
          <button type="button" className="contact-close" onClick={close} autoFocus>Stäng <span aria-hidden="true">×</span></button>
        </div>
        <ContactForm />
        <section className="contact-details" aria-labelledby="contact-details-title">
          <h3 id="contact-details-title">Du kan också kontakta oss direkt</h3>
          <address>
            Tranhult 11<br />562 91 Månsarp
            <a href="tel:+46761354649">0761-35 46 49</a>
            <a href="mailto:skogsbyran.jonkoping@telia.com">skogsbyran.jonkoping@telia.com</a>
            <a href="mailto:magnustrana@gmail.com">magnustrana@gmail.com</a>
          </address>
        </section>
      </dialog>
    </aside>
  );
}
