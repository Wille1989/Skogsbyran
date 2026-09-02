import { ImageViewer } from "./ImageViewer";
import { type ImageFile } from "../data/types";

type ImagesProps = {
      propertyId: string;
      images: ImageFile[];
      propertyTitle: string;
      canEdit: boolean;
};

export function Images({
      propertyId,
      images,
      propertyTitle,
      canEdit,
      }: ImagesProps) 
      {
            if (images.length === 0) return null;

      return (
            <section className="property-images">
                  <ImageViewer
                        propertyId={propertyId}
                        images={images}
                        propertyTitle={propertyTitle}
                        canEdit={canEdit}
                  />
            </section>
      );
}