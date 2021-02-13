"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKML = void 0;
const unist_builder_1 = __importDefault(require("unist-builder"));
const xastscript_1 = __importDefault(require("xastscript"));
const xast_util_to_xml_1 = __importDefault(require("xast-util-to-xml"));
function toKML(featureCollection) {
    return xast_util_to_xml_1.default(unist_builder_1.default("root", [
        xastscript_1.default("kml", { xmlns: "http://www.opengis.net/kml/2.2" }, xastscript_1.default("Document", featureCollection.features.map((feature) => convertFeature(feature)))),
    ]));
}
exports.toKML = toKML;
function convertFeature(feature) {
    return xastscript_1.default("Placemark", [
        ...propertiesToTags(feature.properties),
        convertGeometry(feature.geometry),
    ]);
}
function coord1(coordinates) {
    return xastscript_1.default("coordinates", [unist_builder_1.default("text", coordinates.join(", "))]);
}
function coord2(coordinates) {
    return xastscript_1.default("coordinates", [
        unist_builder_1.default("text", coordinates.map((pair) => pair.join(", ")).join("\n")),
    ]);
}
function propertiesToTags(properties) {
    if (!properties)
        return [];
    const { name, description, ...otherProperties } = properties;
    return [
        name && xastscript_1.default("name", [unist_builder_1.default("text", name)]),
        description && xastscript_1.default("description", [unist_builder_1.default("text", description)]),
        xastscript_1.default("ExtendedData", Object.entries(otherProperties).map(([name, value]) => xastscript_1.default("Data", { name: name }, [xastscript_1.default("value", [unist_builder_1.default("text", value)])]))),
    ].filter(Boolean);
}
const linearRing = (ring) => xastscript_1.default("LinearRing", [coord2(ring)]);
function convertGeometry(geometry) {
    switch (geometry.type) {
        case "Point":
            return xastscript_1.default("Point", [coord1(geometry.coordinates)]);
        case "MultiPoint":
            return xastscript_1.default("MultiGeometry", geometry.coordinates.map((coordinates) => convertGeometry({
                type: "Point",
                coordinates,
            })));
        case "LineString":
            return xastscript_1.default("LineString", [coord2(geometry.coordinates)]);
        case "MultiLineString":
            return xastscript_1.default("MultiGeometry", geometry.coordinates.map((coordinates) => convertGeometry({
                type: "LineString",
                coordinates,
            })));
        case "Polygon":
            const [outerBoundary, ...innerRings] = geometry.coordinates;
            return xastscript_1.default("Polygon", [
                xastscript_1.default("outerBoundaryIs", [linearRing(outerBoundary)]),
                ...innerRings.map((innerRing) => xastscript_1.default("innerBoundaryIs", [linearRing(innerRing)])),
            ]);
        case "MultiPolygon":
            return xastscript_1.default("MultiGeometry", geometry.coordinates.map((coordinates) => convertGeometry({
                type: "Polygon",
                coordinates,
            })));
        case "GeometryCollection":
            return xastscript_1.default("MultiGeometry", geometry.geometries.map((geometry) => convertGeometry(geometry)));
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
