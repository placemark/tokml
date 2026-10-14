import type { Folder, Root } from "@tmcw/togeojson";
import type { Feature, FeatureCollection, Geometry, Position } from "geojson";
import { u } from "unist-builder";
import type { Element } from "xast";
import { toXml } from "xast-util-to-xml";
import { x } from "xastscript";

type F = Feature<Geometry | null>;

const BR = u("text", "\n");
const TAB = u("text", "  ");

type HasAltitude = [boolean];
type Literal = typeof BR;

function altitudeMode(hasAltitude: HasAltitude) {
	if (hasAltitude[0]) return x("altitudeMode", [u("text", "absolute")]);
	return null;
}

/**
 * Convert nested folder structure to KML. This expects
 * input that follows the same patterns as [toGeoJSON](https://github.com/placemark/togeojson)'s
 * kmlWithFolders method: a tree of folders and features,
 * starting with a root element.
 */
export function foldersToKML(root: Root): string {
	return toXml(
		u("root", [
			x(
				"kml",
				{ xmlns: "http://www.opengis.net/kml/2.2" },
				x(
					"Document",
					root.children.flatMap((child) => convertChild(child)),
				),
			),
		]),
	);
}

/**
 * Convert a GeoJSON FeatureCollection to a string of
 * KML data.
 */
export function toKML(
	featureCollection: FeatureCollection<Geometry | null>,
): string {
	return toXml(
		u("root", [
			x(
				"kml",
				{ xmlns: "http://www.opengis.net/kml/2.2" },
				x(
					"Document",
					featureCollection.features.flatMap((feature) =>
						convertFeature(feature),
					),
				),
			),
		]),
	);
}

function convertChild(child: F | Folder) {
	switch (child.type) {
		case "Feature":
			return convertFeature(child);
		case "folder":
			return convertFolder(child);
	}
}

function convertFolder(folder: Folder): Array<Literal | Element> {
	const id = ["string", "number"].includes(typeof folder.meta.id)
		? {
				id: String(folder.meta.id),
			}
		: {};
	return [
		BR,
		x("Folder", id, [
			BR,
			...folderMeta(folder.meta),
			BR,
			TAB,
			...folder.children.flatMap((child) => convertChild(child)),
		]),
	];
}

const META_PROPERTIES = [
	"address",
	"description",
	"name",
	"open",
	"visibility",
	"phoneNumber",
] as const;

function folderMeta(meta: Folder["meta"]): Element[] {
	return META_PROPERTIES.filter((p) => meta[p] !== undefined).map((p) => {
		return x(p, [u("text", String(meta[p]))]);
	});
}

function convertFeature(feature: F) {
	const { id } = feature;
	const idMember = ["string", "number"].includes(typeof id)
		? {
				id: id,
			}
		: {};
	return [
		BR,
		x("Placemark", idMember, [
			BR,
			...propertiesToTags(feature.properties),
			BR,
			TAB,
			...(feature.geometry ? [convertGeometry(feature.geometry)] : []),
		]),
	];
}

function join(position: Position, hasAltitude: HasAltitude): string {
	const has = position.length > 2;
	if (has) hasAltitude[0] = true;
	return has
		? `${position[0]},${position[1]},${position[2]}`
		: `${position[0]},${position[1]}`;
}

function coord1(coordinates: Position, hasAltitude: HasAltitude): Element {
	return x("coordinates", [u("text", join(coordinates, hasAltitude))]);
}

function coord2(coordinates: Position[], hasAltitude: HasAltitude): Element {
	return x("coordinates", [
		u(
			"text",
			coordinates.map((coordinate) => join(coordinate, hasAltitude)).join("\n"),
		),
	]);
}

function valueToString(value: any): string {
	switch (typeof value) {
		case "string": {
			return value;
		}
		case "boolean":
		case "number": {
			return String(value);
		}
		case "object": {
			try {
				return JSON.stringify(value);
			} catch (_e) {
				return "";
			}
		}
	}
	return "";
}

function maybeCData(value: any) {
	if (
		value &&
		typeof value === "object" &&
		"@type" in value &&
		value["@type"] === "html" &&
		"value" in value &&
		typeof value.value === "string"
	) {
		return u("cdata", value.value);
	}

	return valueToString(value);
}

function propertiesToTags(properties: Feature["properties"]): Element[] {
	if (!properties) return [];
	const { name, description, visibility, ...otherProperties } = properties;

	return [
		name && x("name", [u("text", valueToString(name))]),
		description && x("description", [u("text", maybeCData(description))]),
		visibility !== undefined &&
			x("visibility", [u("text", visibility ? "1" : "0")]),
		x(
			"ExtendedData",
			Object.entries(otherProperties).flatMap(([name, value]) => [
				BR,
				TAB,
				x("Data", { name: name }, [
					x("value", [
						u(
							"text",
							typeof value === "string" ? value : JSON.stringify(value),
						),
					]),
				]),
			]),
		),
	].filter(Boolean);
}

const linearRing = (ring: Position[], hasAltitude: HasAltitude): Element =>
	x("LinearRing", [coord2(ring, hasAltitude)]);

function convertMultiPoint(geometry: GeoJSON.MultiPoint): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "Point",
				coordinates,
			}),
		]),
	);
}

function convertMultiLineString(geometry: GeoJSON.MultiLineString): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "LineString",
				coordinates,
			}),
		]),
	);
}

function convertMultiPolygon(geometry: GeoJSON.MultiPolygon): Element {
	return x(
		"MultiGeometry",
		geometry.coordinates.flatMap((coordinates) => [
			BR,
			convertGeometry({
				type: "Polygon",
				coordinates,
			}),
		]),
	);
}

function convertPolygon(geometry: GeoJSON.Polygon): Element {
	const [outerBoundary, ...innerRings] = geometry.coordinates;
	const hasAltitude: HasAltitude = [false];

	const rings = [
		x("outerBoundaryIs", [BR, TAB, linearRing(outerBoundary, hasAltitude)]),
		...innerRings.flatMap((innerRing) => [
			BR,
			x("innerBoundaryIs", [BR, TAB, linearRing(innerRing, hasAltitude)]),
		]),
	];

	return x("Polygon", [BR, altitudeMode(hasAltitude), ...rings]);
}

function convertGeometry(geometry: Geometry): Element {
	switch (geometry.type) {
		case "Point": {
			const hasAltitude: HasAltitude = [false];
			const coord = coord1(geometry.coordinates, hasAltitude);
			return x("Point", [altitudeMode(hasAltitude), coord]);
		}
		case "LineString": {
			const hasAltitude: HasAltitude = [false];
			const coord = coord2(geometry.coordinates, hasAltitude);
			return x("LineString", [altitudeMode(hasAltitude), coord]);
		}
		case "Polygon":
			return convertPolygon(geometry);
		case "MultiPoint":
			return convertMultiPoint(geometry);
		case "MultiLineString":
			return convertMultiLineString(geometry);
		case "MultiPolygon":
			return convertMultiPolygon(geometry);
		case "GeometryCollection":
			return x(
				"MultiGeometry",
				geometry.geometries.flatMap((geometry) => [
					BR,
					convertGeometry(geometry),
				]),
			);
	}
}
