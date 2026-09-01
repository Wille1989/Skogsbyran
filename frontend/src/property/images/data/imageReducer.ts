import  {
    type ImageFile,
    type NewImageFile,
} from "./types";

export type EditableImage = ImageFile | NewImageFile;

export type ImageAction =
      | {
            type: "INITIALIZE";
            images: ImageFile[];
      }
      | {
            type: "ADD";
            images: NewImageFile[];
      }
      | {
            type: "REMOVE";
            index: number;
      }
      | {
            type: "REORDER";
            from: number;
            to: number;
      }
      | {
            type: "SET_PRIMARY";
            index: number;
      }
      | {
            type: "CLEAR";
      };

function normalizeImages(images: EditableImage[]): EditableImage[] {
      if (images.length === 0) {
            return [];
      }

      const primaryIndex = images.findIndex(
            (image) => image.isPrimary
      );

      const selectedPrimaryIndex = primaryIndex >= 0 ? primaryIndex : 0;

      return images.map((image, index) => ({
            ...image,
            position: index,
            isPrimary: index === selectedPrimaryIndex,
      }));
}

export function imageReducer(state: EditableImage[], action: ImageAction): EditableImage[] {
      switch (action.type) {
            case "INITIALIZE":
                  return normalizeImages(action.images);

            case "ADD":
                  return normalizeImages
                  ([
                  ...state,
                  ...action.images,
                  ]);

            case "REMOVE":
                  return normalizeImages
                  (
                        state.filter
                        (
                              (_, index) => index !== action.index
                        )
                  );

            case "REORDER": 
            {
                  if 
                  (
                        action.from < 0 ||
                        action.to < 0 ||
                        action.from >= state.length ||
                        action.to >= state.length ||
                        action.from === action.to
                  ) 
                  {
                        return state;
                  }

                  const images = [...state];
                  const [movedImage] = images.splice(action.from, 1);

                  images.splice(action.to, 0, movedImage);

                  return normalizeImages(images);
            }

            case "SET_PRIMARY":
                  return state.map((image, index) => 
                  ({
                        ...image,
                        isPrimary: index === action.index,
                  }));

            case "CLEAR":
                  return [];

            default:
                  return state;
      }
}