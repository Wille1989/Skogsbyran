import { type ReactNode, useEffect } from "react";

type PropertyAreaModalProps = {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
}

export function PropertyAreaMapModal({
    isOpen,
    title,
    onClose,
    children
}: PropertyAreaModalProps) {
    useEffect(() => {
        if(!isOpen) {
            return;
        }

        function handleKeydown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                onClose();
            }
        }

        document.addEventListener("keydown", handleKeydown);

        return () => {
            document.removeEventListener("keydown", handleKeydown);
        };
    }, [isOpen, onClose]);

    if(!isOpen) {
        return null;
    }

      return (
    <div className="property-area-map-modal-backdrop" onClick={onClose}>
      <div
        className="property-area-map-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="property-area-map-modal-header">
          <h2>{title}</h2>

          <button type="button" onClick={onClose}>
            Stäng
          </button>
        </div>

        <div className="property-area-map-modal-content">{children}</div>
      </div>
    </div>
  );
}