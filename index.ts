import u from "unist-builder";
import x from "xastscript";
import type { Element } from "xast";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import toXml from "xast-util-to-xml";

export function toKML(featureCollection: FeatureCollection) {
  return toXml(
    u("root", [
      x(
        "kml",
        { xmlns: "http://www.opengis.net/kml/2.2" },
        x(
          "Document",
          featureCollection.features.map((feature) => convertFeature(feature))
        )
      ),
    ])
  );
}

function convertFeature(feature: Feature) {
  return x("Placemark", [
    ...propertiesToTags(feature.properties),
    convertGeometry(feature.geometry),
  ]);
}

function coord1(coordinates: Position) {
  return x("coordinates", [u("text", coordinates.join(", "))]);
}

function coord2(coordinates: Position[]) {
  return x("coordinates", [
    u("text", coordinates.map((pair) => pair.join(", ")).join("\n")),
  ]);
}

function propertiesToTags(properties: Feature["properties"]): Element[] {
  if (!properties) return [];
  const { name, description, ...otherProperties } = properties;
  return [
    name && x("name", [u("text", name)]),
    description && x("description", [u("text", description)]),
    x(
      "ExtendedData",
      Object.entries(otherProperties).map(([name, value]) =>
        x("Data", { name: name }, [x("value", [u("text", value)])])
      )
    ),
  ].filter(Boolean);
}

const linearRing = (ring: Position[]) => x("LinearRing", [coord2(ring)]);

function convertGeometry(geometry: Geometry): Element {
  switch (geometry.type) {
    case "Point":
      return x("Point", [coord1(geometry.coordinates)]);
    case "MultiPoint":
      return x(
        "MultiGeometry",
        geometry.coordinates.map((coordinates) =>
          convertGeometry({
            type: "Point",
            coordinates,
          })
        )
      );

    case "LineString":
      return x("LineString", [coord2(geometry.coordinates)]);
    case "MultiLineString":
      return x(
        "MultiGeometry",
        geometry.coordinates.map((coordinates) =>
          convertGeometry({
            type: "LineString",
            coordinates,
          })
        )
      );

    case "Polygon":
      const [outerBoundary, ...innerRings] = geometry.coordinates;
      return x("Polygon", [
        x("outerBoundaryIs", [linearRing(outerBoundary)]),
        ...innerRings.map((innerRing) =>
          x("innerBoundaryIs", [linearRing(innerRing)])
        ),
      ]);
    case "MultiPolygon":
      return x(
        "MultiGeometry",
        geometry.coordinates.map((coordinates) =>
          convertGeometry({
            type: "Polygon",
            coordinates,
          })
        )
      );

    case "GeometryCollection":
      return x(
        "MultiGeometry",
        geometry.geometries.map((geometry) => convertGeometry(geometry))
      );
  }
}

// export function hexToKmlColor(
//   hexColor: string,
//   opacity: number
// ): string | undefined {
//   if (opacity < 0.0 || opacity > 1.0) {
//     throw new Error("Invalid opacity value, outside of 0-1 range");
//   }
//
//   hexColor = hexColor.replace("#", "").toLowerCase();
//
//   if (hexColor.length === 3) {
//     hexColor =
//       hexColor[0] +
//       hexColor[0] +
//       hexColor[1] +
//       hexColor[1] +
//       hexColor[2] +
//       hexColor[2];
//   } else if (hexColor.length !== 6) {
//     return undefined;
//   }
//
//   const r = hexColor.substring(0, 2);
//   const g = hexColor.substring(2, 4);
//   const b = hexColor.substring(4, 6);
//
//   let o = Math.floor(opacity * 255)
//     .toString(16)
//     .padStart(2, "0");
//
//   return o + b + g + r;
// }
