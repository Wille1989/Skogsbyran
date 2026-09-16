import type { Coordinates } from "./types";
import type { PropertyLocationPayload } from "../../types";

export type MapFilter = "all" | "area" | "poi";
export type MapData = {
  polygons: Coordinates[][];
  marker: Coordinates | null;
  pois: PropertyLocationPayload["pois"];
};

// Presentation only: never mutate the saved data or the form draft.
export function filterMapData(data: MapData, filter: MapFilter): MapData {
  return {
    polygons: filter === "poi" ? [] : data.polygons,
    marker: filter === "area" ? null : data.marker,
    pois: filter === "area" ? [] : data.pois,
  };
}
