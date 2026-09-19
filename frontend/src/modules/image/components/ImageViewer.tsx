import "./ImageViewer.css";
import {
      useEffect,
      useId,
      useRef,
      useState,
} from "react";
import { createPortal } from "react-dom";
import { calculateImageIndex } from "../helpers/calculateIndex";
import { ImageEditDialog } from "./ImageEditDialog";
import type { ImageFile } from "../types/types";
import { IconArrowsMaximize, IconChevronLeft, IconChevronRight, IconX, IconCheck, IconPencil } from "@tabler/icons-react";
import { recordEvent } from "@/modules/analytics/api/api";

type ImageViewerProps = {
      propertyId: string;
      images: ImageFile[];
      propertyTitle: string;
      canEdit: boolean;
};

export function ImageViewer({
      propertyId,
      images,
      propertyTitle,
      canEdit,
}: ImageViewerProps) {
      const dialogTitleId = useId();

      const [activeIndex, setActiveIndex] = useState(0);
      const [isLightboxOpen, setIsLightboxOpen] = useState(false);
      const [editingImage, setEditingImage] = useState<ImageFile | null>(null);
      const closeButtonRef =useRef<HTMLButtonElement | null>(null);
      const lightboxRef = useRef<HTMLDivElement | null>(null);
      const thumbnailListRef = useRef<HTMLDivElement | null>(null);
      const previousFocusRef = useRef<HTMLElement | null>(null);
      const safeActiveIndex = images.length > 0 ? Math.min(activeIndex, images.length - 1) : 0;
      const activeImage = images[safeActiveIndex] ?? null;

      useEffect(() => {
            if (activeIndex !== safeActiveIndex) {
                  setActiveIndex(safeActiveIndex);
            }
      }, [activeIndex, safeActiveIndex]);

      useEffect(() => {
            if (isLightboxOpen) {
                  previousFocusRef.current =
                        document.activeElement instanceof HTMLElement
                              ? document.activeElement
                              : null;

                  closeButtonRef.current?.focus();

                  return;
            }

            previousFocusRef.current?.focus();
      }, [isLightboxOpen]);

      useEffect(() => {
            if (!isLightboxOpen) {
                  return;
            }

            const previousOverflow = document.body.style.overflow;
            document.body.style.overflow = "hidden";

            const handleKeyDown = (
                  event: KeyboardEvent
            ): void => {
                  if (editingImage) return;
                  if (event.key === "Tab") {
                        const buttons = lightboxRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
                        const first = buttons?.[0];
                        const last = buttons?.[buttons.length - 1];
                        if (event.shiftKey && document.activeElement === first) {
                              event.preventDefault();
                              last?.focus();
                        } else if (!event.shiftKey && document.activeElement === last) {
                              event.preventDefault();
                              first?.focus();
                        }
                  }
                  
                  if (event.key === "Escape") {
                        setIsLightboxOpen(false);
                        return;
                  }

                  if (event.key === "ArrowLeft") {
                        event.preventDefault();
                        setActiveIndex((currentIndex) =>
                              calculateImageIndex(
                                    currentIndex,
                                    -1,
                                    images.length
                              )
                        );

                        return;
                  }

                  if (event.key === "ArrowRight") {
                        event.preventDefault();
                        setActiveIndex((currentIndex) =>
                              calculateImageIndex(
                                    currentIndex,
                                    1,
                                    images.length
                              )
                        );
                  }
            };

            window.addEventListener(
                  "keydown",
                  handleKeyDown
            );

            return () => {
                  document.body.style.overflow =
                        previousOverflow;

                  window.removeEventListener(
                        "keydown",
                        handleKeyDown
                  );
            };
      }, [
            editingImage,
            images.length,
            isLightboxOpen,
      ]);

      useEffect(() => {
            if (!editingImage) {
                  return;
            }

            const imageStillExists = images.some(
                  (image) =>
                        image.imageId === editingImage.imageId
            );

            if (!imageStillExists) {
                  setEditingImage(null);
            }
      }, [editingImage, images]);

      useEffect(() => {
            if (!isLightboxOpen) return;
            thumbnailListRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')
                  ?.scrollIntoView({ block: "nearest", inline: "nearest" });
      }, [isLightboxOpen, safeActiveIndex]);

      if (!activeImage) {
            return null;
      }

      const selectImage = (index: number): void => {
            setActiveIndex(index);
      };

      const openLightbox = (index: number): void => {
            const image = images[index];
            if (image) recordEvent({ event_type: "image_click", property_id: propertyId, image_id: image.imageId });
            setActiveIndex(index);
            setIsLightboxOpen(true);
      };

      const closeLightbox = (): void => {
            setEditingImage(null);
            setIsLightboxOpen(false);
      };

      const navigate = (step: number): void => {
            setActiveIndex((currentIndex) =>
                  calculateImageIndex(
                        currentIndex,
                        step,
                        images.length
                  )
            );
      };

      const lightbox = isLightboxOpen
            ? createPortal(
                  <div className="property-gallery-overlay" onClick={closeLightbox} role="presentation">
                        <div className="property-gallery-dialog" ref={lightboxRef}
                              onClick={event => event.stopPropagation()} role="dialog" aria-modal="true"
                              aria-labelledby={dialogTitleId} tabIndex={-1}>
                              <header className="property-gallery-header">
                                    <h2 id={dialogTitleId}>Fastighetsbilder</h2>
                                    <span className="property-gallery-counter" aria-live="polite" aria-atomic="true">{safeActiveIndex + 1} / {images.length}</span>
                                    <button ref={closeButtonRef} type="button" className="property-gallery-close"
                                          onClick={closeLightbox} aria-label="Stäng bildvyn">
                                          <IconX size={24} aria-hidden="true" />
                                    </button>
                              </header>
                              <div className="property-gallery-body">
                                    <div className="property-gallery-thumbnails" ref={thumbnailListRef} role="group" aria-label="Välj bild">
                                          {images.map((image, index) => (
                                                <button key={image.imageId} type="button" className="property-gallery-thumb"
                                                      onClick={() => selectImage(index)} aria-pressed={index === safeActiveIndex}
                                                      aria-label={'Visa bild ' + (index + 1)}>
                                                      <img src={image.urls.thumbnail} alt="" loading="lazy" decoding="async" />
                                                      {index === safeActiveIndex && <span className="property-gallery-selected"><IconCheck size={14} aria-hidden="true" /></span>}
                                                </button>
                                          ))}
                                    </div>
                                    <div className="property-gallery-main">
                                          <div className="property-gallery-frame">
                                                <img className="property-gallery-image" src={activeImage.urls.large}
                                                      alt={activeImage.details.altText || propertyTitle} decoding="async" />
                                                {images.length > 1 && <>
                                                      <button type="button" className="property-gallery-nav property-gallery-previous"
                                                            onClick={() => navigate(-1)} aria-label="Visa föregående bild">
                                                            <IconChevronLeft size={28} aria-hidden="true" />
                                                      </button>
                                                      <button type="button" className="property-gallery-nav property-gallery-next"
                                                            onClick={() => navigate(1)} aria-label="Visa nästa bild">
                                                            <IconChevronRight size={28} aria-hidden="true" />
                                                      </button>
                                                </>}
                                                {canEdit && <button type="button" className="property-gallery-edit"
                                                      onClick={() => setEditingImage(activeImage)} aria-label="Redigera bild">
                                                      <IconPencil size={20} aria-hidden="true" />
                                                </button>}
                                          </div>
                                          {activeImage.details.caption.trim() && <p className="property-gallery-caption">{activeImage.details.caption}</p>}
                                    </div>
                              </div>
                        </div>
                  </div>, document.body,
            ) : null;

      return (
            <>
                  <section className="property-mosaic" aria-label="Bilder på fastigheten" data-count={Math.min(images.length, 8)}>
                        <button type="button" className="property-mosaic-main" onClick={() => openLightbox(0)} aria-label="Öppna bildgalleri">
                              <img src={images[0].urls.large} alt={images[0].details.altText || propertyTitle} decoding="async" />
                              <span className="property-mosaic-expand"><IconArrowsMaximize size={22} aria-hidden="true" /></span>
                        </button>
                        {images.length > 1 && <div className="property-mosaic-previews">
                              {images.slice(1, 8).map((image, index) => (
                                    <button key={image.imageId} type="button" onClick={() => openLightbox(index + 1)} aria-label={index === 6 && images.length > 8 ? 'Visa alla ' + images.length + ' bilder' : 'Visa bild ' + (index + 2)}>
                                          <img src={image.urls.medium} alt={image.details.altText || propertyTitle + ' bild ' + (index + 2)} loading="lazy" decoding="async" />
                                          {index === 6 && images.length > 8 && <span className="property-mosaic-more"><strong>+{images.length - 7}</strong><span>Visa alla bilder</span></span>}
                                    </button>
                              ))}
                        </div>}
                        <button type="button" className="property-mosaic-all" onClick={() => openLightbox(0)}>Visa alla bilder ({images.length})</button>
                  </section>

                  {lightbox}

                  {editingImage && (
                        <ImageEditDialog
                              propertyId={propertyId}
                              image={editingImage}
                              onClose={() =>
                                    setEditingImage(null)
                              }
                        />
                  )}
            </>
      );
}
