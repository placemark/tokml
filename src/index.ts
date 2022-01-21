import { u } from "unist-builder";
import { x } from "xastscript";
import type { Element } from "xast";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { toXml } from "xast-util-to-xml";

/**
 * Convert a GeoJSON FeatureCollection to a string of
 * KML data.
 */
export function toKML(featureCollection: FeatureCollection<Geometry | null>) {
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

function convertFeature(feature: Feature<Geometry | null>) {
  return x("Placemark", [
    ...propertiesToTags(feature.properties),
    ...(feature.geometry ? [convertGeometry(feature.geometry)] : []),
  ]);
}

function join(position: Position) {
  return `${position[0]}, ${position[1]}`;
}

function coord1(coordinates: Position) {
  return x("coordinates", [u("text", join(coordinates))]);
}

function coord2(coordinates: Position[]) {
  return x("coordinates", [u("text", coordinates.map(join).join("\n"))]);
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
        x("Data", { name: name }, [
          x("value", [
            u(
              "text",
              typeof value === "string" ? value : JSON.stringify(value)
            ),
          ]),
        ])
      )
    ),
  ].filter(Boolean);
}

const linearRing = (ring: Position[]) => x("LinearRing", [coord2(ring)]);

function convertMultiPoint(geometry: GeoJSON.MultiPoint) {
  return x(
    "MultiGeometry",
    geometry.coordinates.map((coordinates) =>
      convertGeometry({
        type: "Point",
        coordinates,
      })
    )
  );
}
function convertMultiLineString(geometry: GeoJSON.MultiLineString) {
  return x(
    "MultiGeometry",
    geometry.coordinates.map((coordinates) =>
      convertGeometry({
        type: "LineString",
        coordinates,
      })
    )
  );
}

function convertMultiPolygon(geometry: GeoJSON.MultiPolygon) {
  return x(
    "MultiGeometry",
    geometry.coordinates.map((coordinates) =>
      convertGeometry({
        type: "Polygon",
        coordinates,
      })
    )
  );
}

function convertPolygon(geometry: GeoJSON.Polygon) {
  const [outerBoundary, ...innerRings] = geometry.coordinates;
  return x("Polygon", [
    x("outerBoundaryIs", [linearRing(outerBoundary)]),
    ...innerRings.map((innerRing) =>
      x("innerBoundaryIs", [linearRing(innerRing)])
    ),
  ]);
}

function convertGeometry(geometry: Geometry): Element {
  switch (geometry.type) {
    case "Point":
      return x("Point", [coord1(geometry.coordinates)]);
    case "MultiPoint":
      return convertMultiPoint(geometry);
    case "LineString":
      return x("LineString", [coord2(geometry.coordinates)]);
    case "MultiLineString":
      return convertMultiLineString(geometry);
    case "Polygon":
      return convertPolygon(geometry);
    case "MultiPolygon":
      return convertMultiPolygon(geometry);
    case "GeometryCollection":
      return x(
        "MultiGeometry",
        geometry.geometries.map((geometry) => convertGeometry(geometry))
      );
  }
}
