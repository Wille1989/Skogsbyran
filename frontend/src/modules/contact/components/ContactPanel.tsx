import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { ContactForm } from './ContactForm';
import './ContactPanel.css';

export type ContactPanelHandle = { open: () => void };

export function ContactPanel({ ref }: { ref?: Ref<ContactPanelHandle> }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const returnFocus = useRef<HTMLElement | null>(null);

  function openPanel() {
    returnFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : trigger.current;
    dialog.current?.showModal();
    setOpen(true);
  }

  useImperativeHandle(ref, () => ({ open: openPanel }));

  function close() {
    dialog.current?.close();
  }

  return (
    <aside className="sticky-contact" aria-label="Kontakt">
      <button
        ref={trigger} type="button" className="contact-trigger"
        aria-expanded={open} aria-controls="contact-panel" aria-haspopup="dialog"
        onClick={openPanel}
      >
        Kontakta oss <span aria-hidden="true">＋</span>
      </button>
      <dialog
        ref={dialog} id="contact-panel" className="contact-panel"
        aria-labelledby="contact-panel-title"
        onClose={() => { setOpen(false); returnFocus.current?.focus(); }}
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
