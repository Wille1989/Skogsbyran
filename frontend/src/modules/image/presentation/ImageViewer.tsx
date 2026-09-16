import {
      useEffect,
      useId,
      useRef,
      useState,
} from "react";
import { createPortal } from "react-dom";
import { calculateImageIndex } from "../data/calculateIndex";
import { ImageEditDialog } from "./ImageEditDialog";
import type { ImageFile } from "../data/types";
import { IconPhoto } from "@tabler/icons-react";
import { recordEvent } from "@/modules/analytics/data/api";

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
                  <div
                        className="property-lightbox-overlay"
                        onClick={closeLightbox}
                        role="presentation"
                  >
                        <div
                              className="property-lightbox-dialog"
                              ref={lightboxRef}
                              onClick={(event) =>
                                    event.stopPropagation()
                              }
                              role="dialog"
                              aria-modal="true"
                              aria-labelledby={dialogTitleId}
                              tabIndex={-1}
                        >
                              <button
                                    ref={closeButtonRef}
                                    type="button"
                                    className="property-lightbox-close"
                                    onClick={closeLightbox}
                                    aria-label="Stäng bildvyn"
                              >
                                    ×
                              </button>

                              <h2
                                    id={dialogTitleId}
                                    className="sr-only"
                              >
                                    Bildgalleri för {propertyTitle}
                              </h2>

                              <div className="property-lightbox-stage">
                                    {images.length > 1 && (
                                          <button
                                                type="button"
                                                className="property-lightbox-nav"
                                                onClick={() =>
                                                      navigate(-1)
                                                }
                                                aria-label="Visa föregående bild"
                                          >
                                                {"<"}
                                          </button>
                                    )}

                                    <div className="property-lightbox-frame">
                                          <img
                                                className="property-lightbox-image"
                                                src={
                                                      activeImage.urls
                                                            .large
                                                }
                                                alt={
                                                      activeImage.details
                                                            .altText ||
                                                      propertyTitle
                                                }
                                                decoding="async"
                                          />

                                          {canEdit && (
                                                <button
                                                      type="button"
                                                      className="image-action image-edit"
                                                      onClick={() =>
                                                            setEditingImage(
                                                                  activeImage
                                                            )
                                                      }
                                                      aria-label="Redigera bild"
                                                >
                                                      E
                                                </button>
                                          )}
                                    </div>

                                    {images.length > 1 && (
                                          <button
                                                type="button"
                                                className="property-lightbox-nav"
                                                onClick={() =>
                                                      navigate(1)
                                                }
                                                aria-label="Visa nästa bild"
                                          >
                                                {">"}
                                          </button>
                                    )}
                              </div>

                              <div className="property-viewer-summary">
                                    <div className="property-image-caption">
                                          <span>
                                                {activeImage.details
                                                      .caption ||
                                                      "Ingen bildbeskrivning"}
                                          </span>
                                    </div>

                                    <span className="property-viewer-counter">
                                          {safeActiveIndex + 1} /{" "}
                                          {images.length}
                                    </span>
                              </div>

                              {images.length > 1 && (
                                    <div className="property-viewer-thumbnails">
                                          {images.map(
                                                (image, index) => (
                                                      <button
                                                            key={
                                                                  image.imageId
                                                            }
                                                            type="button"
                                                            className={`property-viewer-thumb ${index ===
                                                                        safeActiveIndex
                                                                        ? "is-active"
                                                                        : ""
                                                                  }`}
                                                            onClick={() =>
                                                                  selectImage(
                                                                        index
                                                                  )
                                                            }
                                                            aria-pressed={index === safeActiveIndex} aria-label={`Visa bild ${index + 1
                                                                  }`}
                                                      >
                                                            <img
                                                                  src={
                                                                        image
                                                                              .urls
                                                                              .thumbnail
                                                                  }
                                                                  alt={
                                                                        image
                                                                              .details
                                                                              .altText ||
                                                                        `${propertyTitle} bild ${index +
                                                                        1
                                                                        }`
                                                                  }
                                                                  loading="lazy"
                                                                  decoding="async"
                                                            />
                                                      </button>
                                                )
                                          )}
                                    </div>
                              )}
                        </div>
                  </div>,
                  document.body
            )
            : null;

      return (
            <>
                  <section className="property-viewer-shell">
                        <button
                              type="button"
                              className="property-viewer-preview"
                              onClick={() =>
                                    openLightbox(safeActiveIndex)
                              }
                              aria-label="Öppna bildgalleri"
                        >
                              <img
                                    className="property-viewer-preview-image"
                                    src={activeImage.urls.large}
                                    alt={
                                          activeImage.details.altText ||
                                          propertyTitle
                                    }
                                    decoding="async"
                              />

                              <span className="property-viewer-preview-label">
                                    <IconPhoto size={19} aria-hidden="true" /> Visa alla bilder
                              </span>
                        </button>

                        {images.length > 1 && (
                              <div className="property-viewer-thumbnails">
                                    {images.map((image, index) => (
                                          <button
                                                key={image.imageId}
                                                type="button"
                                                className={`property-viewer-thumb ${index ===
                                                            safeActiveIndex
                                                            ? "is-active"
                                                            : ""
                                                      }`}
                                                onClick={() =>
                                                      selectImage(index)
                                                }
                                                aria-pressed={index === safeActiveIndex}
                                                aria-label={`Visa bild ${index + 1
                                                      }`}
                                          >
                                                <img
                                                      src={
                                                            image.urls
                                                                  .thumbnail
                                                      }
                                                      alt={
                                                            image.details
                                                                  .altText ||
                                                            `${propertyTitle} bild ${index + 1
                                                            }`
                                                      }
                                                      loading="lazy"
                                                      decoding="async"
                                                />
                                          </button>
                                    ))}
                              </div>
                        )}
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
